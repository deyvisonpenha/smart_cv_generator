# SmartCV-Adjuster Backend

FastAPI backend for **SmartCV-Adjuster**.

This service acts as a stateless intelligent proxy that:

* Extracts text from PDF resumes
* Performs AI-driven gap analysis between CV and Job Description
* Generates an optimized CV in Markdown
* Automatically switches between OpenAI (production) and local Ollama (development)

---

## 🚀 Core Features

### 🧠 Intelligent AI Provider Fallback

The backend supports two execution modes:

| Environment             | With API Key | Without API Key |
| ----------------------- | ------------ | --------------- |
| `development` (default) | OpenAI       | Local Ollama    |
| `production`            | OpenAI       | ❌ Error         |

Decision flow:

1. If `api_key` is explicitly provided → Use OpenAI
2. If `ENV=production` and no key → Raise error
3. Otherwise → Use local Ollama (`http://localhost:11434/v1`)

This enables:

* Secure production configuration
* No code changes between environments

---

### 🤖 Automatic Model Selection

Model selection is dynamic:

* **Ollama (localhost)** → `llama3:8b`
* **OpenAI** → `gpt-4o-2024-08-06`

This logic is implemented in `get_model_name()` and ensures the correct model is used depending on the provider.

Local development uses:

Llama 3 via Ollama

Production uses OpenAI GPT-4o.

---

### 📦 Structured Outputs with Pydantic

All AI responses are validated using strict Pydantic models:

* `GapAnalysisResponse`
* `CVGenerationResponse`

Gap analysis uses:

```python
response_format={"type": "json_object"}
```

This enforces valid JSON output, ensuring safe frontend integration.

Markdown code fences are defensively handled before parsing.

---

## 🛠 Tech Stack

* **Framework**: FastAPI
* **Language**: Python 3.9+
* **AI SDK**: OpenAI Python SDK (`openai`)
* **Local LLM Runtime**: Ollama
* **PDF Processing**: PyMuPDF (`fitz`)
* **Validation**: Pydantic v2

---

## 📋 Prerequisites

### For Local Development (Recommended)

Install:

Ollama

Then pull the model:

```bash
ollama pull llama3:8b
```

Start Ollama:

```bash
ollama serve
```

---

### For Production

* Valid OpenAI API Key
* `ENV=production`

---

## ⚙️ Installation

```bash
git clone <repository_url>
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

---

## ▶️ Running the Application

Start the development server:

```bash
uvicorn main:app --reload
```

API available at:

```
http://localhost:8000
```

Swagger UI:

```
http://localhost:8000/docs
```

---

## 🌍 Environment Configuration

### `ENV`

Controls provider behavior.

Possible values:

* `development` (default)
* `production`

Example:

```bash
export ENV=production
```

---

## 🔐 Authentication (Production Mode)

When `ENV=production`:

* An API Key must be provided via request header
* Otherwise, the system raises:

```
RuntimeError: API Key is required in production (via Header).
```

---

## 📡 API Endpoints

### 1️⃣ Extract Text

**POST** `/extract-text`

Uploads a PDF and returns extracted text.

Response:

```json
{
  "text": "Extracted text content..."
}
```

---

### 2️⃣ Analyze Gaps

**POST** `/analyze-gaps`

Request:

```json
{
  "cv_text": "...",
  "job_description": "..."
}
```

Response:

```json
[
  {
    "id": 1,
    "question": "...",
    "context": "..."
  }
]
```

Validated using `GapAnalysisResponse`.

---

### 3️⃣ Generate Optimized CV

**POST** `/generate-cv`

Request:

```json
{
  "cv_text": "...",
  "job_description": "...",
  "user_answers": [
    { "question": "...", "answer": "..." }
  ]
}
```

Response:

```json
{
  "markdown_cv": "# Candidate Name\n\n## Experience...",
  "optimization_report": "Summary of improvements made."
}
```

Validated using `CVGenerationResponse`.

---

## 🛡 Error Handling

### Ollama Not Running

If Ollama is not reachable:

```
Could not connect to Ollama at http://localhost:11434/v1.
Please ensure Ollama is running (`ollama serve`).
```

### OpenAI Connection Failure

```
Could not connect to AI Provider.
Check your API key and network connection.
```

---

## 🧩 Project Structure

```
backend/
├── main.py
├── ai_engine.py
├── pdf_processor.py
├── requirements.txt
└── README.md
```