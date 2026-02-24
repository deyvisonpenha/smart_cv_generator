# SmartCV — AI-Powered Resume Optimizer

SmartCV is a premium, modern web application designed to strategically optimize resumes for specific job descriptions. It uses advanced AI gap analysis and an interactive interview process to enrich your CV with concrete professional achievements.

## ✨ Key Features

- **AI Gap Analysis**: Scans your CV against a job description to identify missing skills and experiences.
- **Interactive Q&A**: A dynamic chat interface that asks targeted questions to extract missing context.
- **Secure Key Vault**: AES-GCM encrypted local storage for your OpenAI API keys. Your data never leaves your browser.
- **Local LLM Fallback**: Seamless integration with Ollama for private, local AI processing when the vault is locked.
- **Premium Export**: High-fidelity PDF generation with a clean, professional layout.
- **Modern SaaS UI**: A sleek, dark-themed interface built with Tailwind v4 and glassmorphism.

## 🚀 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Component Library**: React 19 + [Lucide React](https://lucide.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) (modern CSS-first configuration)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **PDF Engine**: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js/)
- **Encryption**: Browser Web Crypto API (SubtleCrypto)

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ 
- Backend service running (FastAPI + OpenAI/Ollama)

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📁 Project Structure

- `/src/app`: Next.js App Router pages and global layout.
- `/src/features`: Modular feature-based organization (Upload, Interview, Preview, Vault).
- `/src/store`: Zustand state management stores.
- `/src/lib/api`: API client for backend communication.
- `/src/hooks`: Custom React hooks.
- `/src/types`: TypeScript interfaces and types.

## 🔒 Security

SmartCV prioritizes your privacy. Your API keys are encrypted at rest using your master password and a 256-bit PBKDF2 derived key. All transformations happen in your session, and we do not store your data on our servers.
