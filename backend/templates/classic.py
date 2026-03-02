from .base import CVTemplate

CLASSIC = CVTemplate(
    id="classic",
    name="Classic Professional",
    date_format="MM/YYYY",
    present_word="Present",   # overridden per language in __init__.py
    bullet_format=(
        "Start each bullet with a strong past-tense action verb (e.g. 'Led', 'Built', 'Reduced'). "
        "Include context, ownership level, and a measurable outcome. "
        "Minimum 20 words per bullet. No period at the end. Never start a bullet with '•' or '-'."
    ),
    skills_format=(
        "Comma-separated keywords or short keyword groups only. "
        "No full sentences. No hyphens. No bullets."
    ),
    job_title_format=(
        "Use the exact job title as it appears in the original CV. "
        "Do not abbreviate or invent new titles."
    ),
    company_format=(
        "Use the full official company name. No abbreviations unless the original CV uses them."
    ),
    example={
        "job_title": "Senior Backend Engineer",
        "company": "Acme Corp",
        "location": "São Paulo, Brazil",
        "start_date": "03/2021",
        "end_date": "Present",
        "bullets": [
            {
                "text": (
                    "Led the migration of a monolithic e-commerce platform to microservices "
                    "on AWS EKS, reducing p99 latency by 42% and enabling independent scaling "
                    "of five critical services."
                )
            },
            {
                "text": (
                    "Designed and implemented a real-time inventory sync pipeline using Kafka "
                    "and Python, processing over 2 million events per day with less than 200 ms "
                    "end-to-end latency."
                )
            },
            {
                "text": (
                    "Mentored a team of four junior engineers through bi-weekly code reviews and "
                    "pair programming sessions, resulting in a 30% reduction in production incidents "
                    "over two quarters."
                )
            },
        ],
    },
)
