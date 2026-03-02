import html as html_lib
from typing import List

from weasyprint import HTML as WeasyprintHTML

from schemas.cv import CVData, ContactInfo, ExperienceEntry, EducationEntry

# ─── CSS ─────────────────────────────────────────────────────────────────────

_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

@page {
    size: A4;
    margin: 15mm 18mm 14mm 18mm;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.5;
    color: #1a1a1a;
    background: #fff;
}

/* ── Header ── */
.cv-header {
    text-align: center;
    margin-bottom: 14pt;
    border-bottom: 1.5pt solid #e0e0e0;
    padding-bottom: 10pt;
}
.cv-header h1 {
    font-size: 22pt;
    font-weight: 700;
    letter-spacing: -0.5pt;
    margin-bottom: 3pt;
}
.cv-header .title {
    font-size: 11pt;
    color: #555;
    margin-bottom: 5pt;
}
.cv-header .contact-line {
    font-size: 9pt;
    color: #666;
}
.cv-header .contact-line span + span::before {
    content: "  ·  ";
    color: #bbb;
}

/* ── Section headings ── */
.section-title {
    font-size: 8.5pt;
    font-weight: 700;
    letter-spacing: 0.8pt;
    text-transform: uppercase;
    color: #555;
    border-bottom: 1pt solid #ddd;
    padding-bottom: 2pt;
    margin-top: 12pt;
    margin-bottom: 6pt;
}

/* ── Summary ── */
.summary p { margin-bottom: 0; }

/* ── Skills ── */
.skills p { color: #333; }

/* ── Experience ── */
.experience-entry { margin-bottom: 8pt; }
.exp-title-line { display: flex; justify-content: space-between; align-items: baseline; }
.exp-title { font-weight: 700; font-size: 10.5pt; }
.exp-dates { font-size: 9pt; color: #888; white-space: nowrap; }
.exp-company { font-size: 10pt; color: #555; margin-bottom: 3pt; }
ul.bullets { margin: 3pt 0 0 14pt; padding: 0; }
ul.bullets li { margin-bottom: 2pt; font-size: 10pt; }

/* ── Education ── */
.education-entry { margin-bottom: 5pt; }
.edu-title-line { display: flex; justify-content: space-between; }
.edu-degree { font-weight: 600; font-size: 10pt; }
.edu-dates { font-size: 9pt; color: #888; }
.edu-institution { font-size: 9.5pt; color: #555; }
"""


# ─── HTML builders ───────────────────────────────────────────────────────────

def _e(text: str) -> str:
    """HTML-escape a string."""
    return html_lib.escape(str(text or ""))


def _render_contact(contact: ContactInfo) -> str:
    parts = []
    if contact.location:
        parts.append(f"<span>{_e(contact.location)}</span>")
    if contact.phone:
        parts.append(f"<span>{_e(contact.phone)}</span>")
    if contact.email:
        parts.append(f"<span><a href='mailto:{_e(contact.email)}'>{_e(contact.email)}</a></span>")
    if contact.linkedin:
        parts.append(f"<span>{_e(contact.linkedin)}</span>")
    if contact.portfolio:
        parts.append(f"<span>{_e(contact.portfolio)}</span>")

    contact_line = "".join(parts) if parts else ""

    title_html = f'<div class="title">{_e(contact.title)}</div>' if contact.title else ""
    return f"""
<div class="cv-header">
  <h1>{_e(contact.name)}</h1>
  {title_html}
  <div class="contact-line">{contact_line}</div>
</div>
"""


def _render_experience(experience: List[ExperienceEntry]) -> str:
    entries = []
    for exp in experience:
        company_loc = _e(exp.company)
        if exp.location:
            company_loc += f", {_e(exp.location)}"

        bullets_html = "".join(f"<li>{_e(b.text)}</li>" for b in exp.bullets)

        entries.append(f"""
<div class="experience-entry">
  <div class="exp-title-line">
    <span class="exp-title">{_e(exp.job_title)}</span>
    <span class="exp-dates">{_e(exp.start_date)} – {_e(exp.end_date)}</span>
  </div>
  <div class="exp-company">{company_loc}</div>
  <ul class="bullets">{bullets_html}</ul>
</div>
""")
    return "\n".join(entries)


def _render_education(education: List[EducationEntry]) -> str:
    entries = []
    for edu in education:
        entries.append(f"""
<div class="education-entry">
  <div class="edu-title-line">
    <span class="edu-degree">{_e(edu.degree)}</span>
    <span class="edu-dates">{_e(edu.start_date)} – {_e(edu.end_date)}</span>
  </div>
  <div class="edu-institution">{_e(edu.institution)}</div>
</div>
""")
    return "\n".join(entries)


def render_to_html(cv: CVData, template_id: str = "classic", language: str = "en") -> str:
    skills_text = ", ".join(_e(s) for s in cv.skills)

    return f"""<!DOCTYPE html>
<html lang="{_e(language)}">
<head>
  <meta charset="utf-8">
  <style>{_CSS}</style>
</head>
<body>

{_render_contact(cv.contact)}

<div class="section-title">Professional Summary</div>
<div class="summary"><p>{_e(cv.summary)}</p></div>

<div class="section-title">Key Skills</div>
<div class="skills"><p>{skills_text}</p></div>

<div class="section-title">Professional Experience</div>
{_render_experience(cv.experience)}

<div class="section-title">Education</div>
{_render_education(cv.education)}

</body>
</html>"""


# ─── Public API ──────────────────────────────────────────────────────────────

def export_pdf(cv: CVData, template_id: str = "classic", language: str = "en") -> bytes:
    """Convert a CVData object to an ATS-friendly PDF with real vector text."""
    html_string = render_to_html(cv, template_id, language)
    return WeasyprintHTML(string=html_string).write_pdf()
