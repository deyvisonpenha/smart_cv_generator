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
    You are an expert senior technical recruiter conducting a targeted gap analysis.

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

    Compare the CV against the Job Description and identify gaps — skills, experiences, or signals that the
    JD requires but the CV does not clearly demonstrate.

    For each gap, write ONE targeted question designed to extract RICH, SPECIFIC context from the candidate
    so that the answer can later be used to write a detailed, concrete CV bullet point.

    Each question MUST ask for:
    - The specific technology, methodology, or skill in question
    - The company or project context where it was applied
    - The candidate's level of ownership / scope of impact
    - Quantified results or measurable outcomes if applicable

    BAD question example: "Do you have experience with Kubernetes?"
    GOOD question example: "Have you worked with Kubernetes in a production environment? If so, describe the infrastructure scale (number of nodes/services), your level of ownership (did you configure, maintain, or just consume it?), what company this was at, and any reliability or performance improvements you achieved."

    Generate between 4 and 7 questions. Focus only on gaps that materially affect the candidate's alignment
    with the role — do not ask about things already clearly demonstrated in the CV.

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
    
    answers_text = "\n".join([
        f"--- ANSWER {i+1} ---\nQ: {ans['question']}\nA: {ans['answer']}\n"
        for i, ans in enumerate(user_answers)
    ])
    
    prompt = f"""
You are a senior technical recruiter and resume strategist with experience across multiple domains
(Backend, Frontend, AI/ML, Data, DevOps, Product Engineering, Infrastructure, Startup roles).

Your task is to produce an optimized CV that maximally aligns the candidate with the Job Description
by strategically integrating their original experience WITH the new context they provided in the Q&A answers.

Return ONLY valid JSON in this format:
{{
  "markdown_cv": "...",
  "optimization_report": "..."
}}

========================
STEP 1 — ROLE DIAGNOSIS
========================

Internally analyze the Job Description and identify:
- The primary role type (Backend, AI Engineer, Full-Stack, Data, DevOps, etc.)
- The top 8 most critical hard requirements
- The top 5 soft signals (ownership, autonomy, scale, collaboration, etc.)
- Seniority level expectations
- What a technical hiring manager scans for in the first 30 seconds

Do NOT output this analysis. Use it to guide every rewriting decision.

========================
INPUT DATA
========================

Job Description:
{job_description}

Original CV:
{cv_text}

Candidate Q&A — Answers to Gap Analysis Questions:
{answers_text}

========================
STEP 2 — MANDATORY ANSWER PROCESSING (do this before writing a single bullet)
========================
Before generating the CV, go through EACH answer above and:
1. Extract every concrete fact: technology names, project names, team sizes, metrics, timelines, outcomes.
2. Map each fact to the most relevant role or bullet in the original CV.
3. Mark that bullet as MUST EXPAND — it cannot be shorter than the original after your changes.

Only after completing this mapping should you begin writing the optimized CV.
If an answer is vague or empty ("N/A", "I don't know", "Not applicable"), skip it.
If an answer contains ANY concrete detail, that detail MUST appear in the final CV.

========================
CRITICAL: HOW TO USE THE CANDIDATE ANSWERS
========================

The Q&A answers above are the MOST IMPORTANT input for this task.

For each answer that contains new information (a technology used, a project detail, a metric, a responsibility):

1. FIND the most relevant existing bullet point in the original CV, OR identify the right role/section to add it to.
2. EXPAND that bullet point by weaving in the specific details from the answer:
   - Company or project name mentioned
   - Technology or methodology mentioned
   - Scale, scope, or team size mentioned
   - Measurable results or outcomes mentioned
3. If no existing bullet covers it, CREATE a new bullet point in the appropriate role.
4. The expanded bullet must read as a natural, professional achievement statement — not a copy-paste of the answer.
5. NEVER truncate or shorten existing bullets that contain valuable information.
   Adding detail is always better than removing it.

Example of a BAD transformation (shortening):
  Original: "Designed and deployed a microservices-based payment processing system handling 50k transactions/day using Node.js and Kafka"
  Answer: "I also used Redis for caching"
  BAD result: "Built payment systems with caching"
  GOOD result: "Designed and deployed a microservices-based payment processing system handling 50k transactions/day using Node.js, Kafka, and Redis for session and response caching, reducing average API latency by ~40%"

========================
STRICT RULES
========================

1. Do NOT invent technologies, metrics, responsibilities, or experience not supported by the CV or answers.
2. You may reframe, reorganize, and reprioritize existing experience.
3. Do NOT remove detail — only add or restructure.
4. If a required skill is missing and the candidate did not mention it in answers, do NOT imply proficiency.
5. Preserve factual integrity at all times.

========================
STRATEGIC OPTIMIZATION RULES
========================

You MUST:
• Rewrite the SUMMARY to clearly position the candidate for the inferred role type.
• Lead each role's bullets with the achievements most relevant to the JD.
• Use domain-specific vocabulary aligned with the role type.
• Demonstrate impact (scale, reliability, performance, revenue, automation) wherever facts support it.
• Highlight ownership and production experience.

Role-type adaptation:
- Backend → services, APIs, data modeling, throughput, infrastructure
- AI/ML → modeling, experimentation, evaluation, deployment, data pipelines
- Frontend → UI architecture, performance, design systems, accessibility
- DevOps → infrastructure, CI/CD, reliability, observability, SLOs
- Product/Startup → cross-functional ownership, shipping velocity, business impact

========================
BULLET DEPTH REQUIREMENTS
========================

Every bullet point MUST contain:
• The technical action or decision made
• The system, product, or business context
• Technologies used (when relevant)
• Outcome or impact (quantified when facts support it)

Bullets should be 1–3 lines — substantive, not telegraphic.
Each role section should have 3–6 bullets after enrichment with user answers.

Avoid:
- "Led backend development"
- "Improved system performance"
- "Worked on APIs"

Aim for:
- "Architected a REST API gateway in FastAPI serving 200k daily requests, adding rate limiting and JWT-based auth to enforce tenant isolation across 15 enterprise clients"

========================
OPTIMIZATION REPORT
========================

In the optimization_report field, output a concise Markdown-formatted summary covering:
- Role type inferred
- Which answers were used and how they changed the CV
- Which sections were expanded vs. de-emphasized
- Any gaps that could not be addressed due to missing information
- Overall positioning shift vs. the original CV

========================
FINAL SELF-CHECK (apply before outputting)
========================
Before returning your response, verify:
- [ ] Every bullet in the output is AT LEAST as long as the corresponding original bullet.
- [ ] Every concrete fact from the Q&A answers appears somewhere in the CV.
- [ ] No bullet is a generic rephrasing of a more specific original (e.g. "Built APIs" replacing a detailed original).
- [ ] The summary names the role type and 2–3 specific strengths aligned to the JD.

If any check fails, rewrite the offending bullet before outputting.
"""


    try:
        completion = client.chat.completions.create(
            model=model,
            messages=[
                {"role": "system", "content": "You are an expert resume writer."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,        # it can construct richer, more natural professional language
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
