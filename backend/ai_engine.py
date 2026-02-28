import os
from typing import List, Optional
from pydantic import BaseModel
from openai import AsyncOpenAI
from agents import (
    Agent,
    Runner,
    set_default_openai_client,
    set_tracing_disabled,
)
from agents.exceptions import InputGuardrailTripwireTriggered

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
# MODELS
# ============================================================
class ContactInfo(BaseModel):
    name: str
    title: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None

class GapAnalysisItem(BaseModel):
    question: str
    reasoning: str

class GapAnalysisResponse(BaseModel):
    gaps: List[GapAnalysisItem]

class CVGenerationResponse(BaseModel):
    markdown_cv: str

class StructureCheckOutput(BaseModel):
    valid: bool
    missing_sections: List[str]
    reasoning: str

class IntegrityCheckOutput(BaseModel):
    valid: bool
    invented_terms: List[str]
    reasoning: str


# ============================================================
# HEADER EXTRACTOR (LLM-based)
# ============================================================
async def extract_contact_info(cv_text: str) -> ContactInfo:
    """Extract contact details from the top of the CV using a dedicated LLM agent."""

    extractor = Agent(
        name="Contact Extractor",
        instructions="""
You are a CV parser. Extract only the contact information from the CV text provided.

Field rules:
- name: the candidate's full name only — no title, no role, no extra words
- title: the professional title or role (e.g. "Senior Full-Stack Engineer") — separate from name
- email: email address if present, otherwise null
- phone: phone number if present, otherwise null
- location: city and country if present, otherwise null
- linkedin: the linkedin.com/in/username path only (no https://, no www), otherwise null
- portfolio: personal website or portfolio domain (NOT LinkedIn), otherwise null

Do not invent or guess any values. Return null for fields not found.
""",
        output_type=ContactInfo,
    )

    # Only send the first ~600 chars — contact info is always at the top
    result = await Runner.run(extractor, f"CV:\n{cv_text[:600]}")
    return result.final_output


def build_markdown_header(contact: ContactInfo) -> str:
    """Build a clean pure-markdown header block from extracted contact info."""
    lines = []

    lines.append(f"# {contact.name}")

    if contact.title:
        lines.append(f"### {contact.title}")

    lines.append("")

    contact_parts = []
    if contact.location:
        contact_parts.append(f"📍 {contact.location}")
    if contact.phone:
        contact_parts.append(f"📞 {contact.phone}")
    if contact.email:
        contact_parts.append(f"✉️ [{contact.email}](mailto:{contact.email})")
    if contact.linkedin:
        contact_parts.append(f"🔗 [LinkedIn](https://{contact.linkedin})")
    if contact.portfolio:
        contact_parts.append(f"🌐 [{contact.portfolio}](https://{contact.portfolio})")

    if contact_parts:
        lines.append(" | ".join(contact_parts))

    lines.append("")

    return "\n".join(lines)


# ============================================================
# CLIENT FACTORY
# ============================================================
def get_client(api_key: Optional[str] = None) -> AsyncOpenAI:
    env = os.getenv("ENV", "development")
    print(f"[DEBUG] ENV: {env}, api_key provided: {bool(api_key)}")

    if api_key:
        return AsyncOpenAI(api_key=api_key)

    if env == "production":
        raise RuntimeError("API Key is required in production (via Header).")

    return AsyncOpenAI(
        api_key="ollama",
        base_url="http://localhost:11434/v1",
    )


# ============================================================
# AGENT FACTORY
# ============================================================
def build_agents(language_code: str = "en"):
    language_name = SUPPORTED_LANGUAGES.get(language_code, "English")

    gap_agent = Agent(
        name="Gap Analyzer",
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

    cv_agent = Agent(
        name="CV Strategist",
        instructions=f"""
You are an expert CV writer. Rewrite the CV using the original CV, the job description, and the candidate's clarification answers.

LANGUAGE RULE: Write ALL content — including every section heading — entirely in {language_name}. No exceptions. Do not mix languages.

STRICT OUTPUT RULES:
1. Do NOT include a name, title, email, phone, location, LinkedIn, or portfolio — the header is handled separately.
2. Start your output DIRECTLY with the summary section heading.
3. The CV body must contain exactly 4 sections in this order:
   - A "Professional Summary" equivalent heading in {language_name}
   - A "Key Skills" equivalent heading in {language_name}
   - A "Professional Experience" equivalent heading in {language_name}
   - An "Education" equivalent heading in {language_name}
   Use ### for all section headings.
4. No other sections are allowed.
5. Preserve ALL factual data — never invent technologies, metrics, companies, or roles.
6. Naturally reinforce terminology from the job description where it truthfully applies.
7. Experience section format — each job entry MUST follow this structure exactly:
   **Job Title — Company, Location**
   MM/YYYY - MM/YYYY (or "Present")
   - First bullet: responsibility or achievement with at least 28 words describing context and impact.
   - Second bullet: responsibility or achievement with at least 28 words describing context and impact.
   - Third bullet: responsibility or achievement with at least 28 words describing context and impact.
   NEVER write experience as a prose paragraph. ALWAYS use markdown "- " bullet points under each job.
8. Skills section must use short keyword groups only — no full sentences.
9. Education section: degree name, institution, and dates only. No impact statements.
""",
        output_type=CVGenerationResponse,
    )

    structure_guard = Agent(
        name="Structure Validator",
        instructions=f"""
Validate that the markdown CV body contains exactly 4 sections:
1. A professional summary section (heading varies by language: {language_name})
2. A key skills section
3. A professional experience section
4. An education section

No extra sections allowed.
Return valid=True only if all four sections are present and no extra sections exist.
""",
        output_type=StructureCheckOutput,
    )

    integrity_guard = Agent(
        name="Integrity Validator",
        instructions="""
Compare the original CV and the generated CV body.
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
        instructions=f"""
Fix only the listed violations. Preserve all factual information from the original CV.
Maintain the same language ({language_name}) and section structure throughout.
Return only the corrected markdown body — do not include a header block.
""",
        output_type=CVGenerationResponse,
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
) -> List[GapAnalysisItem]:
    client = get_client(api_key)
    set_default_openai_client(client)

    gap_agent, _, _, _, _ = build_agents(language)

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
    max_retries: int = 2,
) -> CVGenerationResponse:
    client = get_client(api_key)
    set_default_openai_client(client)

    _, cv_agent, _, _, corrector = build_agents(language)

    # Extract contact info via LLM and build clean markdown header
    contact = await extract_contact_info(cv_text)
    header_block = build_markdown_header(contact)

    answers_text = "\n".join(
        [f"Q: {a['question']}\nA: {a['answer']}" for a in user_answers]
    )

    input_text = (
        f"Original CV:\n{cv_text}\n\n"
        f"Job Description:\n{job_description}\n\n"
        f"Candidate Clarifications:\n{answers_text}"
    )

    last_body = ""
    attempt = 0
    while attempt <= max_retries:
        try:
            result = await Runner.run(cv_agent, input_text)
            last_body = result.final_output.markdown_cv
            # Prepend clean header to LLM-generated body
            final_markdown = header_block + last_body
            return CVGenerationResponse(markdown_cv=final_markdown)
        except InputGuardrailTripwireTriggered as e:
            attempt += 1
            if attempt > max_retries:
                break
            correction = await Runner.run(
                corrector,
                (
                    f"Generated CV body:\n{last_body}\n\n"
                    f"Violations to fix:\n{str(e)}\n\n"
                    f"Original CV:\n{cv_text}"
                ),
            )
            last_body = correction.final_output.markdown_cv
            input_text = (
                f"Previous version (correct the violations):\n{last_body}\n\n"
                f"Original CV:\n{cv_text}\n\n"
                f"Job Description:\n{job_description}\n\n"
                f"Candidate Clarifications:\n{answers_text}"
            )

    raise Exception("CV generation failed after maximum retries.")