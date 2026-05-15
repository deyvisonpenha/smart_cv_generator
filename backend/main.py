import os
import sys
from io import BytesIO
from typing import List, Optional, Tuple

import uvicorn
from fastapi import Depends, FastAPI, File, Header, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Add local directory to path so relative imports resolve correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from ai_engine import (
    PROVIDER_CONFIG,
    GapAnalysisItem,
    QuickAnalysisResponse,
    analyze_gaps,
    generate_cv,
    quick_analyze_cv,
)
from exporters import export_docx, export_pdf
from pdf_processor import extract_text_from_pdf
from schemas.cv import CVData

app = FastAPI(title="SmartCV API", version="2.0.0")

# ============================================================
# ======================= CORS ===============================
# ============================================================

_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3001,http://127.0.0.1:3001")
_allowed_origins = [o.strip() for o in _raw_origins.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ================= API KEY DEPENDENCY =======================
# ============================================================


async def get_api_key(
    x_model_api_key: Optional[str] = Header(None),
    x_model_provider: Optional[str] = Header(None),
) -> Tuple[Optional[str], str]:
    provider = x_model_provider or "openai"
    if provider not in PROVIDER_CONFIG:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid provider '{provider}'. Valid options: {list(PROVIDER_CONFIG.keys())}",
        )
    return x_model_api_key, provider


# ============================================================
# ================= REQUEST MODELS ===========================
# ============================================================


class AnalyzeGapsRequest(BaseModel):
    cv_text: str
    job_description: str
    language: str = "en"


class QuickAnalysisRequest(BaseModel):
    cv_text: str
    job_description: str
    language: str = "pt-br"


class UserAnswer(BaseModel):
    question: str
    answer: str


class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    user_answers: List[UserAnswer]
    language: str = "en"
    template_id: str = "classic"


class ExportRequest(BaseModel):
    cv_data: CVData
    language: str = "en"
    template_id: str = "classic"


class EmbedRequest(BaseModel):
    text: str


# ============================================================
# ====================== ENDPOINTS ===========================
# ============================================================


@app.post("/extract-text")
async def extract_text_endpoint(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only .pdf files are supported")
    try:
        file_bytes = await file.read()
        text = extract_text_from_pdf(file_bytes)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/analyze-gaps", response_model=List[GapAnalysisItem])
async def analyze_gaps_endpoint(
    request: AnalyzeGapsRequest,
    api_auth: Tuple = Depends(get_api_key),
):
    api_key, provider = api_auth
    try:
        gaps = await analyze_gaps(
            cv_text=request.cv_text,
            job_description=request.job_description,
            api_key=api_key,
            language=request.language,
            provider=provider,
        )
        return gaps
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/quick-analyze", response_model=QuickAnalysisResponse)
async def quick_analyze_endpoint(
    request: QuickAnalysisRequest,
    api_auth: Tuple = Depends(get_api_key),
):
    api_key, provider = api_auth
    try:
        result = await quick_analyze_cv(
            cv_text=request.cv_text,
            job_description=request.job_description,
            api_key=api_key,
            language=request.language,
            provider=provider,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-cv", response_model=CVData)
async def generate_cv_endpoint(
    request: GenerateCVRequest,
    api_auth: Tuple = Depends(get_api_key),
):
    api_key, provider = api_auth
    try:
        result = await generate_cv(
            cv_text=request.cv_text,
            job_description=request.job_description,
            user_answers=[
                {"question": a.question, "answer": a.answer}
                for a in request.user_answers
            ],
            api_key=api_key,
            language=request.language,
            provider=provider,
            template_id=request.template_id,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/export-pdf")
async def export_pdf_endpoint(request: ExportRequest):
    """
    Convert CVData → HTML → WeasyPrint → ATS-friendly vector PDF.
    Returns a binary PDF file for download.
    """
    try:
        pdf_bytes = export_pdf(request.cv_data, request.template_id, request.language)
        return StreamingResponse(
            BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": 'attachment; filename="optimized_cv.pdf"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")


@app.post("/export-docx")
async def export_docx_endpoint(request: ExportRequest):
    """
    Convert CVData → python-docx → ATS-friendly .docx file.
    Returns a Word document for download.
    """
    try:
        docx_bytes = export_docx(request.cv_data, request.template_id, request.language)
        return StreamingResponse(
            BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": 'attachment; filename="optimized_cv.docx"'},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"DOCX generation failed: {str(e)}")


# ============================================================
# =================== HEALTH & INFO ==========================
# ============================================================


@app.post("/embed")
async def embed_endpoint(
    request: EmbedRequest,
    api_auth: Tuple = Depends(get_api_key),
):
    """
    Generate a 1536-dim embedding vector for semantic search.
    Uses OpenAI text-embedding-3-small.
    Returns {"embedding": null} when no API key is available so callers
    can degrade gracefully (semantic search simply returns no results).
    """
    api_key, provider = api_auth
    # Never fall back to the server env var — callers must supply their own key.
    # This prevents unauthenticated external requests from consuming server credits.
    if not api_key or provider != "openai":
        return {"embedding": None, "reason": "embedding_unavailable"}

    try:
        from openai import AsyncOpenAI as _OAI
        client = _OAI(api_key=api_key)
        response = await client.embeddings.create(
            model="text-embedding-3-small",
            input=request.text[:8000],
        )
        return {"embedding": response.data[0].embedding}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding failed: {str(e)}")


@app.get("/health")
async def health_check():
    """Health check endpoint for orchestrator"""
    return {"status": "ok", "service": "SmartCV AI Engine"}


@app.get("/api/info")
async def api_info():
    """Get API information"""
    return {
        "name": "SmartCV AI Engine",
        "version": "2.0.0",
        "endpoints": [
            "/extract-text",
            "/analyze-gaps",
            "/quick-analyze",
            "/generate-cv",
            "/export-pdf",
            "/export-docx",
            "/health",
            "/api/info",
        ],
    }


# ============================================================
# ====================== RUN SERVER ==========================
# ============================================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
