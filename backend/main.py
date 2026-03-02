from io import BytesIO
from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Tuple
import uvicorn
import sys
import os

# Add local directory to path so relative imports resolve correctly
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pdf_processor import extract_text_from_pdf
from ai_engine import analyze_gaps, generate_cv, quick_analyze_cv, GapAnalysisItem, QuickAnalysisResponse, PROVIDER_CONFIG
from schemas.cv import CVData
from exporters import export_docx, export_pdf

app = FastAPI(title="SmartCV API", version="2.0.0")

# ============================================================
# ======================= CORS ===============================
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
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
            detail=f"Invalid provider '{provider}'. Valid options: {list(PROVIDER_CONFIG.keys())}"
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
            user_answers=[{"question": a.question, "answer": a.answer} for a in request.user_answers],
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
# ====================== RUN SERVER ==========================
# ============================================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)