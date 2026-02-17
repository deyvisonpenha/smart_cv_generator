from typing import List, Optional
from pydantic import BaseModel, Field
from openai import OpenAI, APIConnectionError
import os
import json

# --- Pydantic Models for Structured Output ---

class GapAnalysisItem(BaseModel):
    id: int
    question: str
    context: str = Field(description="Why I am asking this")

class GapAnalysisResponse(BaseModel):
    items: List[GapAnalysisItem]

class CVGenerationResponse(BaseModel):
    markdown_cv: str
    optimization_report: str = Field(description="What was improved")

# --- AI Engine Logic ---

def get_openai_client(api_key: Optional[str] = None) -> OpenAI:
    """
    Returns an OpenAI client configured based on environment and available keys.
    Priority:
    1. If api_key argument is provided -> Use OpenAI (Production or Dev).
    2. If no key and ENV=production -> Error.
    3. If no key and ENV=development (default) -> Use local Ollama.
    """
    env = os.getenv("ENV", "development")

    # 1. Priority: Passed API Key
    if api_key:
        return OpenAI(api_key=api_key)

    # 2. Production Restriction
    if env == "production":
        raise RuntimeError("API Key is required in production (via Header).")

    # 3. Development Fallback: Ollama
    return OpenAI(
        api_key="ollama",
        base_url="http://localhost:11434/v1",
    )

def get_model_name(client: OpenAI) -> str:
    """
    Determines the model to use based on the client configuration.
    """
    # If base_url points to localhost (Ollama), use a local model
    if "localhost" in str(client.base_url):
        return "llama3:8b"
    
    # Otherwise (OpenAI), use GPT-4o
    return "gpt-4o-2024-08-06"

def analyze_gaps(cv_text: str, job_description: str, api_key: Optional[str] = None) -> List[GapAnalysisItem]:
    """
    Analyzes the gap between the CV and the Job Description.
    Returns a list of questions to ask the user.
    """
    client = get_openai_client(api_key)
    model = get_model_name(client)
    
    prompt = f"""
    You are an expert Technical Recruiter.

    Return ONLY valid JSON in this format:
    {{
      "items": [
        {{
          "id": 1,
          "question": "...",
          "context": "..."
        }}
      ]
    }}

    Compare the following CV against the Job Description.
    Identify missing hard skills, soft skills, or experiences that are required by the job but not explicitly stated in the CV. That is important that we can track the correct experience with the question, for example, if is identified that the candidate don't have the experience with a specific technology, we can ask the candidate to clarify if they have experience with a similar technology and what company they worked with.
    
    Job Description:
    {job_description}
    
    CV Text:
    {cv_text}
    """

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are a helpful assistant assisting with resume optimization."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            response_format={"type": "json_object"},
        )
    except APIConnectionError as e:
        base_url = client.base_url
        if "localhost" in str(base_url):
            raise ConnectionError(f"Could not connect to Ollama at {base_url}. Please ensure Ollama is running (`ollama serve`). Original error: {str(e)}")
        raise ConnectionError(f"Could not connect to AI Provider. Check your API key and network connection. Original error: {str(e)}")
    
    raw_output = completion.choices[0].message.content
    
    # Handle potential markdown code blocks or conversational text
    raw_output = extract_json_content(raw_output)

    try:
        parsed = GapAnalysisResponse.model_validate_json(raw_output)
    except Exception as e:
        raise ValueError(f"Failed to parse AI response: {str(e)}. Raw output: {raw_output}")
    
    return parsed.items

def generate_cv(cv_text: str, job_description: str, user_answers: List[dict], api_key: Optional[str] = None) -> CVGenerationResponse:
    """
    Generates an optimized CV based on original CV, JD, and user answers to gap analysis questions.
    """
    client = get_openai_client(api_key)
    model = get_model_name(client)
    
    answers_text = "\n".join([f"Q: {ans['question']}\nA: {ans['answer']}" for ans in user_answers])
    
    prompt = f"""
    You are an expert Resume Writer.
    
    Return ONLY valid JSON in this format:
    {{
      "markdown_cv": "...",
      "optimization_report": "..."
    }}

    Rewrite the following CV to better match the Job Description, incorporating the new information provided by the user's answers.
    
    Job Description:
    {job_description}
    
    Original CV:
    {cv_text}
    
    User Answers to Missing Skills/Gaps:
    {answers_text}
    
    Requirements:
    1. Do NOT invent information. Only use facts from the CV and User Answers.
    2. Use professional Markdown formatting.
    3. Use action verbs and quantify impact where possible.
    4. Provide a brief report on what was optimized.
    """

    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert resume writer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0,
        )
    except APIConnectionError as e:
        base_url = client.base_url
        if "localhost" in str(base_url):
            raise ConnectionError(f"Could not connect to Ollama at {base_url}. Please ensure Ollama is running (`ollama serve`). Original error: {str(e)}")
        raise ConnectionError(f"Could not connect to AI Provider. Check your API key and network connection. Original error: {str(e)}")
    
    raw_output = completion.choices[0].message.content

    # Handle potential markdown code blocks or conversational text
    raw_output = extract_json_content(raw_output)

    try:
        parsed = CVGenerationResponse.model_validate_json(raw_output)
    except Exception as e:
        raise ValueError(f"Failed to parse AI response: {str(e)}. Raw output: {raw_output}")
    

    return parsed

def extract_json_content(text: str) -> str:
    """
    Robustly extracts a JSON object from text, handling markdown blocks and preambles.
    Criteria:
    1. If markdown block exists, take content inside.
    2. Find first '{' and last '}' to isolate JSON object.
    3. Return valid JSON string or original text if not found.
    """
    text = text.strip()
    
    if "```json" in text:
        text = text.split("```json")[1].split("```")[0].strip()
    elif "```" in text:
        text = text.split("```")[1].split("```")[0].strip()
        
    start_idx = text.find('{')
    end_idx = text.rfind('}')
    
    if start_idx != -1 and end_idx != -1 and end_idx > start_idx:
        return text[start_idx : end_idx + 1]
    
    return text
