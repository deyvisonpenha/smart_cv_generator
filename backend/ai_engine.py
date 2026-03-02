import json
import os
from typing import List, Optional

from openai import AsyncOpenAI
from agents import (
    Agent,
    Runner,
    set_default_openai_client,
    set_tracing_disabled,
    set_default_openai_api,
)
from agents.exceptions import InputGuardrailTripwireTriggered
from pydantic import BaseModel

from schemas.cv import CVData, ContactInfo
from templates import get_template

# ============================================================
# Disable tracing if no ENV api key
# ============================================================
if not os.getenv("OPENAI_API_KEY"):
    set_tracing_disabled(True)

# ============================================================
# SUPPORTED LANGUAGES
# ============================================================
SUPPORTED_LANGUAGES = {
    "en": "English",
    "pt-br": "Brazilian Portuguese",
    "es": "Spanish",
    "de": "German",
    "fr": "French",
}

# ============================================================
# PROVIDER CONFIG
# ============================================================
PROVIDER_CONFIG = {
    "openai": {
        "base_url": None,
        "default_model": "gpt-4o",
    },
    "gemini": {
        "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
        "default_model": "gemini-2.5-flash",
    },
    "ollama": {
        "base_url": "http://localhost:11434/v1",
        "default_model": "gemma:2b",
    },
}

# Ensure agents library uses standard chat completions (Gemini/Ollama compat)
set_default_openai_api("chat_completions")

# ============================================================
# INTERNAL MODELS (used only inside ai_engine)
# ============================================================
class QuickAnalysisResponse(BaseModel):
    match_score: int
    short_report: str
    key_strengths: List[str]
    missing_requirements: List[str]


class GapAnalysisItem(BaseModel):
    question: str
    reasoning: str


class GapAnalysisResponse(BaseModel):
    gaps: List[GapAnalysisItem]


class StructureCheckOutput(BaseModel):
    valid: bool
    missing_sections: List[str]
    reasoning: str


class IntegrityCheckOutput(BaseModel):
    valid: bool
    invented_terms: List[str]
    reasoning: str


# ============================================================
# CLIENT FACTORY
# ============================================================
def get_client(api_key: Optional[str] = None, provider: str = "openai") -> AsyncOpenAI:
    env = os.getenv("ENV", "development")
    print(f"[DEBUG] ENV: {env}, provider: {provider}, api_key provided: {bool(api_key)}")

    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["openai"])

    if api_key:
        return AsyncOpenAI(api_key=api_key, base_url=config["base_url"])

    if env == "production":
        raise RuntimeError("API Key is required in production (via Header).")

    # Fallback dev: Ollama
    ollama_config = PROVIDER_CONFIG["ollama"]
    return AsyncOpenAI(
        api_key="ollama",
        base_url=ollama_config["base_url"],
    )


# ============================================================
# AGENT FACTORY
# ============================================================
def build_agents(language_code: str = "en", model: str = "gpt-4o", template=None):
    language_name = SUPPORTED_LANGUAGES.get(language_code, "English")

    gap_agent = Agent(
        name="Gap Analyzer",
        model=model,
        instructions=f"""
You are a CV gap analyzer. Compare the CV and job description.
Generate 4–7 clarification questions to fill gaps between the candidate profile and the job requirements.

Each question must target:
- A specific technology or methodology mentioned in the job description
- The project context where the candidate used it (or something similar)
- The candidate's level of ownership (led, contributed, assisted)
- A measurable outcome or improvement achieved

Also check if the CV is missing any contact information (email, phone, location, LinkedIn, portfolio).
If any contact fields are missing, include a question asking the candidate to provide them.

LANGUAGE RULE: Write ALL questions and reasoning in {language_name}. No exceptions.
""",
        output_type=GapAnalysisResponse,
    )

    # Build CV agent instructions with template rules + few-shot example
    if template is None:
        from templates import get_template as _get_template
        template = _get_template("classic", language_code)

    example_json = json.dumps(template.example, indent=2, ensure_ascii=False)

    cv_agent = Agent(
        name="CV Strategist",
        model=model,
        instructions=f"""
You are an expert CV writer. Rewrite the CV using the original CV, the job description, and the candidate's clarification answers.
Return the result as a structured JSON object matching the CVData schema exactly.

LANGUAGE RULE: Write ALL content — including every section heading, summary, and bullets — entirely in {language_name}. No exceptions. Do not mix languages.

FORMATTING RULES:
- Dates: {template.date_format}
- Current job end date: "{template.present_word}"
- Bullets: {template.bullet_format}
- Skills: Group skills logically into 3-5 categories (e.g. "Frontend", "Backend", "Tools", "Cloud"). 
  For each group, list relevant technologies as items. 
  Ensure categories and items are entirely in {language_name}.
- job_title field: {template.job_title_format}
- company field: {template.company_format}
- match_score: An integer between 0 and 100 representing how well the candidate aligns with the job after optimization.

AI WRITING STYLE:
- Avoid "I", "my", or first-person pronouns.
- Be punchy, professional, and result-oriented.
- Focus on how the candidate's skills specifically solve the problems mentioned in the Job Description.
EXAMPLE of a correctly formatted ExperienceEntry:
{example_json}

STRICT RULES:
1. Extract the candidate's full name, title, email, phone, location, LinkedIn, and portfolio into the `contact` field.
   - name: full name only
   - title: professional title/role
   - linkedin: the linkedin.com/in/username path only (no https://)
   - portfolio: personal website domain (NOT LinkedIn)
   - Use null for any field not found in the original CV
2. Write a concise professional summary (3–5 sentences) in the `summary` field.
3. `skills`: flat list of keyword strings only. No sentences. No bullets.
4. `experience`: list of ExperienceEntry objects. Never write bullets as prose paragraphs.
5. `education`: degree, institution, start_date, end_date only. No impact statements.
6. `optimization_report`: 3–5 sentence summary in {language_name} of what was changed and why.
7. Preserve ALL factual data — never invent technologies, metrics, companies, or roles.
8. Naturally reinforce terminology from the job description where it truthfully applies.
""",
        output_type=CVData,
    )

    structure_guard = Agent(
        name="Structure Validator",
        model=model,
        instructions=f"""
Validate that the CVData object contains all required fields:
- contact.name is non-empty
- summary is non-empty
- skills is a non-empty list
- experience is a non-empty list, each entry has job_title, company, start_date, end_date, and at least one bullet
- education is a non-empty list, each entry has degree and institution
- optimization_report is non-empty

Language: {language_name}
Return valid=True only if all criteria are met.
""",
        output_type=StructureCheckOutput,
    )

    integrity_guard = Agent(
        name="Integrity Validator",
        model=model,
        instructions="""
Compare the original CV and the generated CVData.
Verify that:
- No technologies or tools were invented
- No metrics or percentages were fabricated
- No experience entries or companies were removed
- No job titles or roles were changed

Return valid=True only if the generated CV faithfully and accurately represents the original.
""",
        output_type=IntegrityCheckOutput,
    )

    corrector = Agent(
        name="Corrector",
        model=model,
        instructions=f"""
Fix only the listed violations. Preserve all factual information from the original CV.
Maintain the same language ({language_name}) and return a corrected CVData object.
""",
        output_type=CVData,
    )

    return gap_agent, cv_agent, structure_guard, integrity_guard, corrector


# ============================================================
# ASYNC PUBLIC FUNCTIONS
# ============================================================
async def analyze_gaps(
    cv_text: str,
    job_description: str,
    api_key: Optional[str] = None,
    language: str = "en",
    provider: str = "openai",
) -> List[GapAnalysisItem]:
    client = get_client(api_key, provider)
    set_default_openai_client(client)

    model = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["openai"])["default_model"]
    gap_agent, _, _, _, _ = build_agents(language, model)

    input_text = (
        f"CV:\n{cv_text}\n\n"
        f"Job Description:\n{job_description}"
    )

    result = await Runner.run(gap_agent, input_text)
    return result.final_output.gaps


async def generate_cv(
    cv_text: str,
    job_description: str,
    user_answers: List[dict],
    api_key: Optional[str] = None,
    language: str = "en",
    provider: str = "openai",
    template_id: str = "classic",
    max_retries: int = 2,
) -> CVData:
    client = get_client(api_key, provider)
    set_default_openai_client(client)

    model = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["openai"])["default_model"]
    template = get_template(template_id, language)
    _, cv_agent, _, _, corrector = build_agents(language, model, template)

    answers_text = "\n".join(
        [f"Q: {a['question']}\nA: {a['answer']}" for a in user_answers]
    )

    input_text = (
        f"Original CV:\n{cv_text}\n\n"
        f"Job Description:\n{job_description}\n\n"
        f"Candidate Clarifications:\n{answers_text}"
    )

    last_output: Optional[CVData] = None
    attempt = 0
    while attempt <= max_retries:
        try:
            result = await Runner.run(cv_agent, input_text)
            return result.final_output  # type: CVData
        except InputGuardrailTripwireTriggered as e:
            attempt += 1
            if attempt > max_retries:
                break
            correction = await Runner.run(
                corrector,
                (
                    f"Generated CVData:\n{last_output}\n\n"
                    f"Violations to fix:\n{str(e)}\n\n"
                    f"Original CV:\n{cv_text}"
                ),
            )
            last_output = correction.final_output
            input_text = (
                f"Previous version (correct the violations):\n{last_output}\n\n"
                f"Original CV:\n{cv_text}\n\n"
                f"Job Description:\n{job_description}\n\n"
                f"Candidate Clarifications:\n{answers_text}"
            )

    raise Exception("CV generation failed after maximum retries.")
# ============================================================
# QUICK ANALYSIS
# ============================================================
async def quick_analyze_cv(
    cv_text: str,
    job_description: str,
    api_key: str,
    language: str = "pt-br",
    provider: str = "openai",
) -> QuickAnalysisResponse:
    """Analyze CV vs Job Description quickly without full rewrite."""
    client = get_client(api_key, provider)
    set_default_openai_client(client)
    
    config = PROVIDER_CONFIG.get(provider, PROVIDER_CONFIG["openai"])
    model = config["default_model"]
    
    language_name = SUPPORTED_LANGUAGES.get(language, "English")
    
    agent = Agent(
        name="Quick Analyst",
        model=model,
        instructions=f"""
        You are a hiring manager. Analyze if the CV matches the job description.
        Provide a match score (0-100), a short summary report, and two lists: key strengths and missing requirements.
        Output MUST be in {language_name}.
        """,
        output_type=QuickAnalysisResponse
    )
    
    input_text = f"CV Context:\n{cv_text}\n\nJob Description:\n{job_description}"
    result = await Runner.run(agent, input_text)
    return result.final_output
