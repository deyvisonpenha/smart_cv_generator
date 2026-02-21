# SmartCV 🚀

**SmartCV** is an open-source tool designed to help users tailor their CVs to specific job descriptions using the power of Large Language Models (LLMs). It intelligently identifies gaps in your experience, asks targeted questions to bridge those gaps, and generates a professionally optimized CV.

---

## ✨ How it Works

1.  **Analyze**: Upload your CV (PDF) and paste the Job Description you're targeting.
2.  **Diagnose**: Our AI engine performs a deep analysis to identify "gaps" between your current profile and the role requirements.
3.  **Interview**: The system asks 4-6 strategic questions based on the identified gaps to gather missing evidence of your skills.
4.  **Optimize**: Using your original CV and new answers, the AI generates a strategically repositioned CV in Markdown format.
5.  **Export**: Review your optimization report and download your new CV as a professionally formatted PDF.

---

## 🛠 Tech Stack

### Frontend
- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: Zustand
- **Security**: Client-side AES-GCM encryption for API keys (Web Crypto API)
- **PDF Export**: [html2pdf.js](https://github.com/eKoopmans/html2pdf.js)

### Backend
- **Framework**: [FastAPI](https://fastapi.tiangolo.com/)
- **Language**: Python 3.9+
- **AI Integration**: OpenAI (GPT-4o) with fallback to local [Ollama](https://ollama.com/)
- **Validation**: Pydantic v2
- **PDF Parsing**: PyMuPDF

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- (Optional) [Ollama](https://ollama.com/) for local AI execution

### Installation

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/deyvisonpenha/pdfGenerator.git
    cd pdfGenerator
    ```

2.  **Setup the Backend**:
    ```bash
    cd backend
    python -m venv venv
    source venv/bin/activate # Windows: venv\Scripts\activate
    pip install -r requirements.txt
    uvicorn main:app --reload
    ```

3.  **Setup the Frontend**:
    ```bash
    cd ../frontend
    npm install
    npm run dev
    ```

4.  **Access the app**: Open [http://localhost:3000](http://localhost:3000)

---

## 🛡 Security & Privacy
- **Stateless Backend**: We don't store your CVs or personal data on our servers.
- **Secure Vault**: Your OpenAI API keys are encrypted with a master password and stored only in your browser's `localStorage`. They are never sent to our backend in plain text (passed via secure headers only during active sessions).

---

## 🤝 Contributing
This is an open-source project. Feel free to open issues, submit PRs, or suggest new features!

---

## 📄 License
MIT License - feel free to use and adapt!
