# SmartCV

**SmartCV** is an open-source, AI-powered platform that tailors your CV to any job description. It identifies skill gaps, asks targeted questions to fill them, and generates a professionally optimized, **ATS-compatible PDF** — exported as real vector text (not a screenshot), fully readable by applicant tracking systems.

[![Run on Replit](https://replit.com/badge/github/deyvisonpenha/smart_cv_generator)](https://replit.com/github/deyvisonpenha/smart_cv_generator)

---

![SmartCV Dashboard](./homepage.png)

---

## How It Works

| Step | What happens |
|------|-------------|
| **1. Upload** | Provide your current CV (PDF) and paste the target job description |
| **2. Diagnose** | The AI engine maps your profile against the role requirements and identifies gaps |
| **3. Interview** | The system asks 4–6 strategic follow-up questions to surface missing context |
| **4. Optimize** | Your CV is rewritten in Markdown, repositioned to match the role |
| **5. Export** | Download a polished, ATS-friendly PDF rendered server-side via WeasyPrint |

---

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌──────────────────┐
│  Next.js    │────▶│  Rails API   │────▶│  FastAPI Engine  │
│  Frontend   │     │  (core-api)  │     │  (AI + PDF)      │
│  :3001      │     │  :3000       │     │  :8000           │
└─────────────┘     └──────┬───────┘     └──────────────────┘
                           │
                  ┌────────┴────────┐
                  │                 │
             ┌────▼────┐     ┌──────▼──────┐
             │Postgres │     │    Redis    │
             │+pgvector│     │  + Sidekiq  │
             └─────────┘     └─────────────┘
```

## Tech Stack

### Frontend
| | |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 + Lucide Icons |
| State | Zustand |
| Security | Client-side AES-GCM encryption for API keys (Web Crypto API) |

### Core API
| | |
|---|---|
| Framework | Ruby on Rails 8 (API mode) |
| Auth | Devise + JWT |
| Background Jobs | Sidekiq |
| Database | PostgreSQL 15 + pgvector (semantic search) |
| Cache / Queue | Redis |

### AI Engine
| | |
|---|---|
| Framework | FastAPI (Python 3.11+) |
| AI Providers | OpenAI, Google Gemini, or local Ollama |
| PDF Parsing | PyMuPDF (`fitz`) |
| PDF Generation | WeasyPrint — server-side vector text, ATS-safe |
| Validation | Pydantic v2 |

---

## Quick Start (Docker)

The recommended way to run SmartCV locally is with Docker Compose. All services — database, cache, API, AI engine, and frontend — start with a single command.

### 1. Clone the repository

```bash
git clone https://github.com/deyvisonpenha/smart_cv_generator.git
cd smart_cv_generator
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the required values:

| Variable | Description |
|---|---|
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `REDIS_PASSWORD` | Redis password |
| `SECRET_KEY_BASE` | Rails secret — generate with `openssl rand -hex 64` |
| `OPENAI_API_KEY` | Your OpenAI API key (`sk-…`) |

All other values can stay as-is for local development.

### 3. Start all services

```bash
docker compose up --build
```

The first run builds all images and automatically runs database migrations before the API starts.

| Service | URL |
|---|---|
| Frontend | http://localhost:3001 |
| Rails API | http://localhost:3000 |
| AI Engine | http://localhost:8000 |

---

## Manual Setup (without Docker)

<details>
<summary>Expand for native installation instructions</summary>

### Prerequisites

| Tool | Version |
|---|---|
| Node.js | 18+ |
| Ruby | 3.2+ |
| Python | 3.11+ |
| PostgreSQL | 15+ with pgvector extension |
| Redis | 7+ |

### Backend — AI Engine

```bash
# macOS: install WeasyPrint system dependencies
brew install pango libffi glib cairo

cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt

uvicorn main:app --reload
# → http://localhost:8000
```

### Backend — Rails API

```bash
cd core-api
bundle install

# Set environment variables (or create a .env file)
export DATABASE_URL=postgres://postgres:password@localhost:5432/smart_cv_dev
export REDIS_URL=redis://:password@localhost:6379/1
export SECRET_KEY_BASE=$(openssl rand -hex 64)

rails db:create db:migrate
rails server
# → http://localhost:3000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3001
```

</details>

---

## Security & Privacy

- **Stateless AI Engine** — your CV content and personal data are never persisted in the AI service.
- **Encrypted Vault** — API keys are AES-GCM encrypted with your master password and stored only in your browser's `localStorage`. They are never sent to or stored on the server.
- **JWT Authentication** — all API endpoints are protected with short-lived JWT tokens.

---

## Contributing

Contributions are welcome. Feel free to open an issue, submit a pull request, or suggest a feature.

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

---

## License

[MIT](./LICENSE) — free to use, modify, and distribute.
