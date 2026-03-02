import fitz  # PyMuPDF
import re
import markdown
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration


# ============================================================
# PDF TEXT EXTRACTION
# ============================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """
    Extracts text from a PDF file (bytes), removes excessive whitespace,
    and returns the cleaned text.
    """
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()

        # Clean text: remove excessive whitespace
        cleaned_text = re.sub(r'\s+', ' ', text).strip()
        return cleaned_text
    except Exception as e:
        raise ValueError(f"Error processing PDF: {str(e)}")


# ============================================================
# PDF GENERATION FROM MARKDOWN (ATS-friendly, vector text)
# ============================================================

_CV_CSS = """
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

/* ── Page Setup ──────────────────────────────────────────── */
@page {
    size: A4;
    margin: 18mm 20mm 16mm 20mm;
}

/* ── Base ────────────────────────────────────────────────── */
* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    font-family: 'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif;
    font-size: 10pt;
    line-height: 1.55;
    color: #1a1a1a;
    background: #ffffff;
}

/* ── Name (h1) ───────────────────────────────────────────── */
h1 {
    font-size: 22pt;
    font-weight: 700;
    color: #111111;
    letter-spacing: -0.5px;
    margin-bottom: 2pt;
    page-break-after: avoid;
}

/* ── Title / Subtitle (h3 directly after h1) ─────────────── */
h1 + h3 {
    font-size: 11pt;
    font-weight: 400;
    color: #4b5563;
    margin-bottom: 6pt;
}

/* ── Contact line (p after h1/h3) ───────────────────────── */
h1 ~ p:first-of-type,
h3 ~ p:first-of-type {
    font-size: 9pt;
    color: #4b5563;
    margin-bottom: 10pt;
}

/* ── Horizontal rule ─────────────────────────────────────── */
hr {
    border: none;
    border-top: 1.5px solid #e5e7eb;
    margin: 8pt 0;
}

/* ── Section headings (h2, h3) ───────────────────────────── */
h2 {
    font-size: 11pt;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: #111111;
    border-bottom: 1.5px solid #e5e7eb;
    padding-bottom: 2pt;
    margin-top: 12pt;
    margin-bottom: 5pt;
    page-break-after: avoid;
}

h3 {
    font-size: 10.5pt;
    font-weight: 600;
    color: #1f2937;
    margin-top: 8pt;
    margin-bottom: 2pt;
    page-break-after: avoid;
}

h4 {
    font-size: 10pt;
    font-weight: 500;
    color: #374151;
    margin-top: 6pt;
    margin-bottom: 2pt;
    page-break-after: avoid;
}

/* ── Paragraphs ──────────────────────────────────────────── */
p {
    margin-bottom: 4pt;
    orphans: 3;
    widows: 3;
}

/* ── Lists ───────────────────────────────────────────────── */
ul, ol {
    padding-left: 14pt;
    margin-bottom: 5pt;
}

li {
    margin-bottom: 2pt;
    page-break-inside: avoid;
}

/* ── Bold / Strong ───────────────────────────────────────── */
strong {
    font-weight: 600;
    color: #111111;
}

/* ── Links ───────────────────────────────────────────────── */
a {
    color: #2563eb;
    text-decoration: none;
}

/* ── Code (inline) ───────────────────────────────────────── */
code {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 9pt;
    background: #f3f4f6;
    padding: 1pt 3pt;
    border-radius: 2pt;
}

/* ── Page break helpers ──────────────────────────────────── */
h2, h3, h4, h5 {
    page-break-after: avoid;
}

p, li {
    page-break-inside: avoid;
}
"""


def markdown_to_pdf(markdown_text: str) -> bytes:
    """
    Convert a Markdown string to an ATS-friendly PDF (vector text, not rasterised image).
    Returns the PDF as raw bytes.

    Process:
        1. markdown  →  HTML  (python-markdown)
        2. HTML + CSS  →  PDF  (WeasyPrint)
    """
    # Step 1: Markdown → HTML body
    html_body = markdown.markdown(
        markdown_text,
        extensions=["extra", "sane_lists"],
    )

    # Step 2: Wrap in full HTML document with embedded CSS
    full_html = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Optimized CV</title>
    <style>{_CV_CSS}</style>
</head>
<body>
{html_body}
</body>
</html>"""

    # Step 3: HTML → PDF bytes via WeasyPrint
    font_config = FontConfiguration()
    pdf_bytes = HTML(string=full_html).write_pdf(
        font_config=font_config,
        presentational_hints=True,
    )

    return pdf_bytes
