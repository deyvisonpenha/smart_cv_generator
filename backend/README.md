# SmartCV — Backend

FastAPI backend for SmartCV. A stateless, agentic AI service that analyses CVs, runs a strategic interview loop, and exports **ATS-friendly PDFs** with real vector text.

---

## 🚀 Core Features

| Feature | Detail |
|---|---|
| PDF text extraction | PyMuPDF (`fitz`) — reads uploaded CVs |
| Gap analysis | Multi-agent AI pipeline compares CV vs. job description |
| CV generation | AI rewrites, validates and self-corrects the CV in Markdown |
| **PDF export** | WeasyPrint renders Markdown → HTML → real vector PDF (ATS-safe) |
| Multi-provider AI | OpenAI, Google Gemini, or local Ollama — configurable per request |

---

## 🤖 Agentic Architecture

The AI engine (`ai_engine.py`) uses a five-agent pipeline built on [`openai-agents`](https://github.com/openai/openai-agents-python):

1. **Gap Analyzer** — identifies mismatches between CV and job description; generates clarification questions.
2. **CV Strategist** — rewrites the CV from scratch using the original data + user answers.
3. **Structure Validator** — checks that all required Markdown sections are present.
4. **Integrity Validator** — verifies no facts were invented or removed.
5. **Corrector** — automatically patches any violations before returning the result.

All outputs are strongly typed with **Pydantic v2**, so the API always returns validated structured data.

---

## 🛠 Tech Stack

| Component | Library/Tool |
|---|---|
| Web framework | FastAPI |
| AI SDK | `openai` Python SDK + `openai-agents` |
| PDF parsing | PyMuPDF (`pymupdf`) |
| PDF generation | WeasyPrint |
| HTML from Markdown | `markdown` (python-markdown) |
| Validation | Pydantic v2 |
| Server | Uvicorn |

---

## ⚠️ System Dependencies (Required)

WeasyPrint relies on native C libraries. **You must install them before running `pip install -r requirements.txt`** (or the import will fail at startup).

### macOS (Homebrew)

```bash
brew install pango libffi glib cairo
```

### Ubuntu / Debian

```bash
sudo apt-get install -y \
  libpango-1.0-0 \
  libpangoft2-1.0-0 \
  libcairo2 \
  libglib2.0-0 \
  libffi-dev \
  fonts-liberation
```

### Fedora / RHEL

```bash
sudo dnf install pango cairo glib2 libffi
```

> **Verification**: after installing, run:
> ```bash
> python -c "from weasyprint import HTML; print('OK')"
> ```
> If it prints `OK`, all system libs are correctly found.

---

## ⚙️ Installation

```bash
# 1. Install system dependencies (see above) FIRST

# 2. Create and activate virtualenv
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# 3. Install Python packages
pip install -r requirements.txt
```

---

## ▶️ Running the Server

```bash
uvicorn main:app --reload
```

| URL | Purpose |
|---|---|
| `http://localhost:8000` | API base |
| `http://localhost:8000/docs` | Swagger UI (interactive) |
| `http://localhost:8000/redoc` | ReDoc |

---

## 🌍 Environment Variables

| Variable | Default | Description |
|---|---|---|
| `ENV` | `development` | Set to `production` to require API keys |

```bash
# Production mode — API key required on every request
export ENV=production
```

---

## 🤖 AI Providers

Provider configuration lives in `PROVIDER_CONFIG` inside `ai_engine.py`:

| Provider | Base URL | Default Model |
|---|---|---|
| `openai` | *(default OpenAI)* | `gpt-4o` |
| `gemini` | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.5-flash` |
| `ollama` | `http://localhost:11434/v1` | `llama3.2` |

The provider is selected per request via the `X-Model-Provider` header.

### Using Ollama locally

```bash
# Install Ollama: https://ollama.com
ollama serve
ollama pull llama3.2
```

No API key needed when using Ollama.

---

## 📡 API Endpoints

### `POST /extract-text`

Upload a PDF and receive its plain text.

**Request**: multipart form — `file` (PDF)

**Response**:
```json
{ "text": "Extracted text content..." }
```

---

### `POST /analyze-gaps`

Run gap analysis between a CV and a job description.

**Headers**:
```
X-Model-API-Key: <your-key>     (not required for Ollama)
X-Model-Provider: openai | gemini | ollama
```

**Request body**:
```json
{
  "cv_text": "...",
  "job_description": "...",
  "language": "en"
}
```

**Response**:
```json
[
  { "id": 1, "question": "...", "context": "..." }
]
```

---

### `POST /generate-cv`

Generate an optimized CV from CV text, job description and user answers.

**Headers**: same as `/analyze-gaps`

**Request body**:
```json
{
  "cv_text": "...",
  "job_description": "...",
  "user_answers": [
    { "question": "...", "answer": "..." }
  ],
  "language": "en"
}
```

**Response**:
```json
{
  "markdown_cv": "# Name\n\n## Experience...",
  "optimization_report": "Summary of changes made."
}
```

---

### `POST /export-pdf`

Convert a Markdown CV to an **ATS-friendly, vector-text PDF** via WeasyPrint.

> This replaces the old `html2pdf.js` approach. The PDF produced contains real selectable text — not a rasterised screenshot — so it is fully readable by ATS systems.

**Request body**:
```json
{
  "markdown_cv": "# Name\n\n## Experience...",
  "filename": "optimized_cv.pdf"
}
```

**Response**: binary PDF file with `Content-Disposition: attachment`.

**Pipeline**:
```
Markdown → python-markdown → HTML + CSS → WeasyPrint → PDF bytes
```

---

## 🛡 Error Handling

| Scenario | Error |
|---|---|
| Ollama not running | `Could not connect to Ollama at http://localhost:11434/v1` |
| Invalid API key | `401` from the AI provider |
| `ENV=production` with no key | `RuntimeError: API Key is required in production` |
| WeasyPrint system libs missing | `OSError: cannot load library 'libgobject-2.0-0'` → install via Homebrew/apt |

---

## 🧩 Project Structure

```
backend/
├── main.py            # FastAPI app — routes and request/response models
├── ai_engine.py       # Multi-agent AI pipeline (gap analysis + CV generation)
├── pdf_processor.py   # PDF text extraction (PyMuPDF) + PDF generation (WeasyPrint)
├── requirements.txt   # Python dependencies
└── README.md
```