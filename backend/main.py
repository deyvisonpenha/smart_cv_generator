from fastapi import FastAPI, UploadFile, File, HTTPException, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import sys
import os

# Add local directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pdf_processor import extract_text_from_pdf
from ai_engine import analyze_gaps, generate_cv, GapAnalysisItem, CVGenerationResponse

app = FastAPI(title="SmartCV-Adjuster API", version="1.0.0")

# ============================================================
# ======================= CORS ===============================
# ============================================================

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# ================= API KEY DEPENDENCY =======================
# ============================================================

async def get_api_key(x_model_api_key: Optional[str] = Header(None)):
    return x_model_api_key


# ============================================================
# ================= REQUEST MODELS ===========================
# ============================================================

class AnalyzeGapsRequest(BaseModel):
    cv_text: str
    job_description: str
    language: Optional[str] = "en"


class UserAnswer(BaseModel):
    question: str
    answer: str


class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    user_answers: List[UserAnswer]
    language: Optional[str] = "en"


# ============================================================
# ====================== ENDPOINTS ===========================
# ============================================================

@app.post("/extract-text")
async def extract_text_endpoint(
    file: UploadFile = File(...)
):
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
    api_key: Optional[str] = Depends(get_api_key)
):
    try:
        gaps = await analyze_gaps(
            cv_text=request.cv_text,
            job_description=request.job_description,
            api_key=api_key,          # ← correto
            language=request.language,
        )
        return gaps
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/generate-cv", response_model=CVGenerationResponse)
async def generate_cv_endpoint(
    request: GenerateCVRequest,
    api_key: Optional[str] = Depends(get_api_key)
):
    try:
        result = await generate_cv(
            cv_text=request.cv_text,
            job_description=request.job_description,
            user_answers=[{"question": a.question, "answer": a.answer} for a in request.user_answers],
            api_key=api_key,          # ← correto
            language=request.language,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# ====================== RUN SERVER ==========================
# ============================================================

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)