import { GapAnalysisItem, CVGenerationResponse, UserAnswer } from '../../types';

const API_BASE_URL = 'http://localhost:8000';

export class ApiClient {
    private static async request<T>(
        endpoint: string,
        method: string,
        body?: any,
        apiKey?: string | null,
        provider?: string | null,
        isFormData: boolean = false
    ): Promise<T> {
        const headers: Record<string, string> = {};

        if (apiKey && provider !== 'ollama') {
            headers['X-Model-API-Key'] = apiKey;
        }

        if (provider) {
            headers['X-Model-Provider'] = provider;
        }

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        console.log("PROVIDER:", provider);
        console.log("HEADERS:", headers);

        const config: RequestInit = {
            method,
            headers,
            body: isFormData ? body : JSON.stringify(body)
        };

        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `API request failed: ${response.statusText}`);
        }

        return response.json();
    }

    static async extractText(file: File): Promise<{ text: string }> {
        const formData = new FormData();
        formData.append('file', file);
        return this.request<{ text: string }>('/extract-text', 'POST', formData, null, null, true);
    }

    static async analyzeGaps(cvText: string, jobDescription: string, apiKey: string | null, language: string, provider: string): Promise<GapAnalysisItem[]> {
        return this.request<GapAnalysisItem[]>('/analyze-gaps', 'POST', {
            cv_text: cvText,
            job_description: jobDescription,
            language
        }, apiKey, provider);
    }

    static async generateCV(cvText: string, jobDescription: string, userAnswers: UserAnswer[], apiKey: string | null, language: string, provider: string): Promise<CVGenerationResponse> {
        return this.request<CVGenerationResponse>('/generate-cv', 'POST', {
            cv_text: cvText,
            job_description: jobDescription,
            user_answers: userAnswers,
            language
        }, apiKey, provider);
    }

    /**
     * Export a Markdown CV to an ATS-friendly, vector-text PDF via WeasyPrint.
     * The backend converts markdown → HTML → PDF and streams the binary back.
     * This method triggers a browser download automatically.
     */
    static async exportPdf(markdownCv: string, filename: string = 'optimized_cv.pdf'): Promise<void> {
        const response = await fetch(`${API_BASE_URL}/export-pdf`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown_cv: markdownCv, filename }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || `PDF export failed: ${response.statusText}`);
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}
