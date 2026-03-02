from pydantic import BaseModel


class CVTemplate(BaseModel):
    id: str
    name: str
    date_format: str        # e.g. "MM/YYYY"
    present_word: str       # e.g. "Present" — overridden per language
    bullet_format: str      # e.g. "Start each bullet with a strong past-tense action verb"
    skills_format: str      # e.g. "Comma-separated keywords only, no sentences"
    job_title_format: str   # e.g. "Job Title — Company, Location"
    company_format: str     # e.g. "Company name only, no abbreviations"
    example: dict           # Few-shot ExperienceEntry for the AI prompt
