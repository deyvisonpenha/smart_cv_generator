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
You are a senior technical recruiter and resume strategist specializing in ATS optimization and hiring manager engagement across multiple domains (Backend, Frontend, AI/ML, Data, DevOps, Product Engineering, Infrastructure, Startup roles).

Your task is to produce an optimized CV that passes ATS keyword screening AND compels a hiring manager to take action, by integrating the candidate's original experience WITH the new context from the Q&A answers.

Return ONLY valid JSON in this format:
{{
  "markdown_cv": "...",
  "optimization_report": "..."
}}

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
STEP 1 — INTERNAL ANALYSIS (do NOT output any of this)
========================

Before writing a single word, perform these four internal analyses:

A) ROLE DIAGNOSIS
- Infer the primary role type (Backend, AI Engineer, Full-Stack, Data, DevOps, etc.)
- Determine seniority level expected
- Identify what a technical hiring manager scans for in the first 30 seconds

B) ATS KEYWORD EXTRACTION
Extract from the Job Description and build an internal checklist of:
- TIER 1 (must appear): The exact job title, 6–8 must-have hard skills (exact strings as written in the JD — e.g. "Kubernetes" not "K8s", "RESTful APIs" not "REST", "PostgreSQL" not "Postgres" unless the JD uses the short form)
- TIER 2 (should appear): Methodologies, frameworks, platforms (e.g. "CI/CD", "agile", "microservices", "Terraform")
- TIER 3 (nice to have): Soft skills framed as competencies (e.g. "cross-functional collaboration", "stakeholder communication")
You will use this checklist in the FINAL SELF-CHECK to verify keyword coverage.

C) ANSWER FACT EXTRACTION
Go through EACH Q&A answer and extract:
- Every concrete technology, tool, framework, or platform name
- Every project, company, or team reference
- Every metric, scale, or outcome (numbers, percentages, user counts, uptime, latency, etc.)
- Every ownership signal (led, owned, designed, architected, maintained, etc.)
Map each extracted fact to the most relevant role or bullet in the original CV. Mark that bullet as MUST EXPAND.
If an answer is empty, "N/A", or contains no concrete detail, skip it.
If an answer contains ANY concrete detail, that detail MUST appear in the final CV.

D) GAP AUDIT
List which TIER 1 keywords from the JD are NOT currently present in the CV and CANNOT be added from the Q&A answers. These must be noted in the optimization_report as unaddressable gaps — do NOT invent or imply proficiency.

========================
STEP 2 — ATS KEYWORD INTEGRATION (mandatory before writing bullets)
========================

For every TIER 1 and TIER 2 keyword that the candidate legitimately has experience with (supported by CV or Q&A answers):

1. Ensure it appears in the CV body using the EXACT string form from the JD.
   - If the JD says "Kubernetes", write "Kubernetes" — not "k8s" or "container orchestration".
   - If the JD says "TypeScript", write "TypeScript" — not just "JavaScript".
   - You MAY include the abbreviation in parentheses after the full form if both forms are useful.

2. The SUMMARY/PROFILE section must function as an ATS keyword magnet:
   - It must contain the target job title (or closest equivalent the candidate qualifies for).
   - It must naturally embed at least 5 TIER 1 keywords in 3–5 sentences.
   - It must convey seniority, domain ownership, and a measurable strength signal.

3. The SKILLS section must be updated to:
   - List all TIER 1 and TIER 2 keywords the candidate has experience with, using exact JD terminology.
   - Reorder or group skills so JD-aligned skills appear first.
   - Remove or demote skills that are not relevant to this role (move to a secondary group if needed).

========================
STEP 3 — WORK EXPERIENCE REWRITE (apply to EVERY role, not just recent ones)
========================

You MUST touch every role section. This is not optional.

For each role:

1. REORDER bullets so the most JD-relevant achievements come first.

2. REWRITE weak or vague bullets using JD vocabulary and the candidate's actual experience.
   A bullet is weak if it:
   - Uses generic verbs ("worked on", "helped with", "involved in", "responsible for")
   - Omits the technology stack
   - Has no outcome, metric, or scope signal
   - Could apply to any candidate in any company

3. EXPAND any bullet marked MUST EXPAND (from Step 1C) by weaving in the extracted Q&A facts:
   - Company or project name
   - Technology or methodology mentioned
   - Scale, scope, or team size
   - Measurable results or outcomes
   The expanded bullet MUST be longer and more specific than the original — never shorter.

4. CREATE new bullets for any Q&A facts that have no existing bullet to attach to.

5. NEVER remove a bullet that contains specific, factual detail. Only remove genuinely redundant or placeholder bullets.

TRANSFORMATION RULES:
- BAD verb: "worked on" → GOOD verb: "architected", "engineered", "owned", "led", "designed", "built", "optimized", "shipped"
- BAD scope: "improved performance" → GOOD scope: "reduced p99 API latency from 800ms to 120ms by introducing Redis caching and query indexing"
- BAD technology reference: "used cloud tools" → GOOD reference: "deployed on AWS using ECS, RDS (PostgreSQL), and CloudWatch for observability"

BULLET STRUCTURE (every bullet must contain all four):
  [Strong action verb] + [what was built/owned/changed] + [technology context] + [outcome or scale]

Example:
  "Architected a multi-tenant REST API gateway in FastAPI serving 200k daily requests, implementing JWT-based auth and per-tenant rate limiting to enforce isolation across 15 enterprise clients — reducing unauthorized access incidents to zero post-launch."

Bullets should be 1–3 lines. Each role must have 3–6 bullets after enrichment.

========================
STRICT INTEGRITY RULES
========================

1. Do NOT invent technologies, metrics, responsibilities, or experience not supported by the CV or answers.
2. Do NOT imply proficiency in a TIER 1 keyword if it is absent from both CV and Q&A answers.
3. Do NOT remove specific factual detail — only add or restructure.
4. You may reframe, reprioritize, and reorder existing experience freely.
5. Preserve factual integrity at all times — the candidate must be able to speak to every claim in an interview.

========================
OPTIMIZATION REPORT
========================

In the optimization_report field, output a concise Markdown-formatted summary covering:
- **Role type inferred** and seniority level
- **ATS keyword coverage**: which TIER 1 keywords were successfully embedded, and which could not be addressed (gap audit result)
- **Work experience changes**: which roles/bullets were expanded, rewritten, or reordered, and which Q&A answers drove each change
- **Summary and Skills section changes**
- **Overall positioning shift** vs. the original CV

========================
FINAL SELF-CHECK (apply before outputting — fix any failure before returning)
========================

Verify ALL of the following:

ATS checks:
- [ ] Every TIER 1 keyword the candidate has experience with appears at least once in the CV body using the exact JD string form.
- [ ] The Summary contains the target job title and at least 5 TIER 1 keywords naturally embedded.
- [ ] The Skills section has been updated to front-load JD-aligned skills using exact JD terminology.

Work experience checks:
- [ ] Every role section was touched (reordered, rewritten, or expanded — not left as-is).
- [ ] Every bullet marked MUST EXPAND is longer and more specific than the original.
- [ ] No bullet uses generic verbs ("responsible for", "worked on", "helped with", "involved in").
- [ ] No bullet is a generic rephrasing of a more specific original (e.g. "Built APIs" replacing a detailed original).
- [ ] Every concrete fact from the Q&A answers appears somewhere in the CV.

Quality checks:
- [ ] Every bullet contains: action verb + what + technology context + outcome/scale.
- [ ] No bullet could apply to any candidate at any company (it must be specific to this person's experience).
- [ ] The CV reads as written by the candidate, not assembled from a template.

If any check fails, rewrite the offending section before outputting.
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
