# SmartCV 🚀

**SmartCV** is an open-source AI-powered tool that helps you tailor your CV to specific job descriptions. It identifies skill gaps, asks targeted questions to fill them, and generates a professionally optimized, **ATS-compatible CV** — exported as a real vector-text PDF (not a screenshot).

---

## ✨ How it Works

1. **Analyze** — Upload your CV (PDF) and paste the job description you're targeting.
2. **Diagnose** — The AI engine identifies gaps between your profile and the role requirements.
3. **Interview** — The system asks 4–6 strategic questions based on those gaps.
4. **Optimize** — Using your original CV and answers, AI rewrites and repositions your CV in Markdown.
5. **Export** — Download a polished, **ATS-friendly PDF** with real, selectable text generated server-side via WeasyPrint.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 & Lucide Icons
- **State Management**: Zustand
- **Security**: Client-side AES-GCM encryption for API keys (Web Crypto API)

### Backend
- **Framework**: FastAPI (Python)
- **AI Integration**: OpenAI, Google Gemini, or local [Ollama](https://ollama.com/)
- **PDF Parsing**: PyMuPDF (`fitz`)
- **PDF Generation**: WeasyPrint (server-side, vector text — ATS-safe)
- **Validation**: Pydantic v2

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 18+ | For the frontend |
| Python | 3.11+ | For the backend |
| Homebrew | Any | macOS only — needed for WeasyPrint system libs |

> **Linux users**: install the equivalent system packages instead of Homebrew (see [backend README](./backend/README.md)).

---

### 1. Clone the repository

```bash
git clone https://github.com/deyvisonpenha/smart_cv_generator.git
cd smart_cv_generator
```

---

### 2. Set up the Backend

#### macOS — install system dependencies (required for WeasyPrint)

```bash
brew install pango libffi glib cairo
```

> These are native C libraries that WeasyPrint uses to render HTML → PDF. Without them the backend will fail to start.

#### Install Python dependencies

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Start the server

```bash
uvicorn main:app --reload
# → http://localhost:8000
```

---

### 3. Set up the Frontend

```bash
cd ../frontend
npm install
npm run dev
# → http://localhost:3000
```

---

### 4. Choose an AI Provider

When the app opens, configure your provider in the **Security Vault**:

| Provider | What you need |
|---|---|
| **OpenAI** | An `sk-…` API key |
| **Google Gemini** | A Gemini API key from [Google AI Studio](https://aistudio.google.com) |
| **Ollama (local)** | Ollama running locally (`ollama serve`) |

For Ollama, pull a model first:

```bash
ollama pull llama3.2
```

---

## 🛡 Security & Privacy

- **Stateless Backend** — We never store your CV or personal data.
- **Encrypted Vault** — API keys are AES-GCM encrypted with your master password and stored only in your browser's `localStorage`. They are never persisted on the server.

---

## 🤝 Contributing

Open-source and open to contributions. Feel free to open issues, submit PRs, or suggest features!

---

## 📄 License

MIT — use and adapt freely.


---
Agora, execute os comandos de inicialização:

Abra o terminal na raiz do projeto (smart_cv_generator) e rode:

# 1. Construir e subir o banco e o Redis (fundações)
docker-compose up -d db redis

# 2. Criar e migrar o banco de dados no Rails
docker-compose run api rails db:create db:migrate

# 3. Gerar os seus Models (conforme discutimos)
docker-compose run api rails generate devise User
docker-compose run api rails generate model CV user:references original_text:text optimized_data:jsonb language:string slug:string:index
docker-compose run api rails generate model JobDescription user:references title:string content:text company_name:string
docker-compose run api rails generate model Optimization user:references cv:references status:string match_score:integer report:text
docker-compose run api rails generate model Interaction user:references question:text answer:text category:string

# 4. Rodar as migrações finais
docker-compose run api rails db:migrate

# 5. Subir o sistema completo
docker-compose up
