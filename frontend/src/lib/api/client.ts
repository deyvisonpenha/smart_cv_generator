import { GapAnalysisItem, CVGenerationResponse, UserAnswer } from '../../types';

const API_BASE_URL = 'http://localhost:8000';

export class ApiClient {
    private static async request<T>(
        endpoint: string,
        method: string,
        body?: any,
        apiKey?: string | null,
        isFormData: boolean = false
    ): Promise<T> {
        const headers: HeadersInit = {};

        if (apiKey) {
            headers['X-Model-API-Key'] = apiKey;
        }

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        console.log("API KEY:", apiKey);
        console.log("HEADERS:", headers);

        const config: RequestInit = {
            method,
            headers,
            body: isFormData ? body : JSON.stringify(body),
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
        return this.request<{ text: string }>('/extract-text', 'POST', formData, null, true);
    }

    static async analyzeGaps(cvText: string, jobDescription: string, apiKey: string | null): Promise<GapAnalysisItem[]> {
        return this.request<GapAnalysisItem[]>('/analyze-gaps', 'POST', { cv_text: cvText, job_description: jobDescription }, apiKey);
    }

    static async generateCV(cvText: string, jobDescription: string, userAnswers: UserAnswer[], apiKey: string | null): Promise<CVGenerationResponse> {
        return this.request<CVGenerationResponse>('/generate-cv', 'POST', {
            cv_text: cvText,
            job_description: jobDescription,
            user_answers: userAnswers
        }, apiKey);
    }
}

