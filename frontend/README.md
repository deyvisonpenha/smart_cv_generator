# SmartCV — Frontend

Next.js 15 frontend for SmartCV. A premium, dark-themed SaaS UI for AI-powered CV optimization.

---

## ✨ Features

- **AI Gap Analysis** — Scans your CV against a job description to surface missing skills and evidence.
- **Interactive Interview** — A chat interface that asks targeted questions to enrich your CV with concrete achievements.
- **Multi-Provider AI** — Supports OpenAI, Google Gemini, and local Ollama. Provider is selected per session.
- **Secure Key Vault** — API keys are AES-GCM encrypted with your master password and stored only in `localStorage`. They are never sent to the server in plain text.
- **ATS-Safe PDF Export** — Downloads are generated server-side via WeasyPrint, producing real vector-text PDFs (fully readable by ATS systems).
- **Modern SaaS UI** — Glassmorphism, dark mode, micro-animations, built with Tailwind CSS v4.

---

## 🛠 Tech Stack

| Layer | Tool |
|---|---|
| Framework | [Next.js 15](https://nextjs.org/) (App Router) |
| UI library | React 19 + [Lucide React](https://lucide.dev/) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) |
| State management | [Zustand](https://zustand-demo.pmnd.rs/) |
| Markdown rendering | [react-markdown](https://github.com/remarkjs/react-markdown) |
| Encryption | Browser Web Crypto API (`SubtleCrypto`) |
| PDF export | **Backend-side via WeasyPrint** (no client-side PDF lib needed) |

> **Note**: `html2pdf.js` was removed. PDF generation is now fully handled by the backend, which produces ATS-friendly vector PDFs. The frontend simply downloads the binary response.

---

## 🚀 Getting Started

### Prerequisites

- Node.js **18+**
- The [backend service](../backend/README.md) running on `http://localhost:8000`

### Installation

```bash
npm install
```

### Development server

```bash
npm run dev
# → http://localhost:3000
```

---

## 🤖 Configuring an AI Provider

Open the app and click the **Security Vault** icon in the header. You can configure:

| Provider | What you need |
|---|---|
| **OpenAI** | An `sk-…` API key from [platform.openai.com](https://platform.openai.com) |
| **Google Gemini** | An API key from [Google AI Studio](https://aistudio.google.com) |
| **Ollama (local)** | Ollama running locally with `ollama serve` — no key required |

> API keys are encrypted in your browser with AES-GCM. The backend receives them only via `X-Model-API-Key` header during active requests and never stores them.

---

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router — pages and global layout
│   ├── layout.tsx
│   └── page.tsx            # Main orchestrator (stage machine: UPLOAD → ANALYSIS → INTERVIEW → PREVIEW)
├── features/               # Feature-scoped components
│   ├── upload/             # UploadScreen — CV drag & drop + job description input
│   ├── interview/          # InterviewScreen — AI Q&A chat interface
│   ├── preview/            # PreviewScreen — CV review + PDF download
│   └── vault/              # VaultSettings — encrypted API key management
├── store/                  # Zustand state stores
│   ├── useAppStore.ts      # Global app state (stage, CV data, gaps)
│   └── useVaultStore.ts    # Per-provider encrypted key vault
├── lib/
│   └── api/
│       └── client.ts       # ApiClient — typed wrappers for all backend endpoints
├── hooks/                  # Custom React hooks
└── types/
    └── index.ts            # Shared TypeScript interfaces
```

---

## 🔒 Security Model

| Concern | Implementation |
|---|---|
| Key storage | AES-GCM 256-bit, browser `localStorage` only |
| Key derivation | PBKDF2-SHA256 (100 000 iterations) from master password |
| Key transmission | Header `X-Model-API-Key` — HTTPS only in production |
| Server-side storage | None — backend is fully stateless |
| CV data | Never persisted — processed in-memory per request |

---

## 🧩 PDF Export Flow

```
User clicks "Download PDF"
    ↓
ApiClient.exportPdf(markdownCv)          // POST /export-pdf
    ↓
Backend: Markdown → HTML → WeasyPrint → PDF bytes
    ↓
Frontend: Blob URL → <a download> click → file saved
```

The PDF contains **real selectable text** — not a rasterised image — making it fully readable by ATS scanners, search engines, and screen readers.
