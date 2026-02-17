from fastapi import FastAPI, UploadFile, File, HTTPException, status, Header, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import sys
import os

# Add local directory to path to allow imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from pdf_processor import extract_text_from_pdf
from ai_engine import analyze_gaps, generate_cv, GapAnalysisItem, CVGenerationResponse

app = FastAPI(title="SmartCV-Adjuster API", version="1.0.0")

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    # Add other origins as needed
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Dependency: API Key Retrieval (Optional) ---
async def get_api_key(x_model_api_key: Optional[str] = Header(None)):
    """
    Retrieves the X-Model-API-Key header if present.
    """
    return x_model_api_key

# --- Pydantic Models for Requests ---

class AnalyzeGapsRequest(BaseModel):
    cv_text: str
    job_description: str

class UserAnswer(BaseModel):
    question: str
    answer: str

class GenerateCVRequest(BaseModel):
    cv_text: str
    job_description: str
    user_answers: List[dict] # Accepting generic dicts to be flexible, but could be UserAnswer model

# --- Endpoints ---

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
        # Pass the optional API key to the engine
        gaps = analyze_gaps(request.cv_text, request.job_description, api_key)
        return gaps
    except RuntimeError as e:
        # Handle the specific cleanup where API key might be missing in production
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/generate-cv", response_model=CVGenerationResponse)
async def generate_cv_endpoint(
    request: GenerateCVRequest,
    api_key: Optional[str] = Depends(get_api_key)
):
    try:
        # Pass the optional API key to the engine
        result = generate_cv(
            request.cv_text, 
            request.job_description, 
            request.user_answers,
            api_key
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
