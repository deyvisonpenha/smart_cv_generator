import { GapAnalysisItem, UserAnswer, CVData, QuickAnalysisResponse } from '@/types';

const API_BASE = 'http://localhost:8000';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function authHeaders(apiKey: string | null, provider: string): HeadersInit {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };
    if (apiKey && provider !== 'ollama') {
        headers['x-model-api-key'] = apiKey;
    }
    headers['x-model-provider'] = provider;
    return headers;
}

async function jsonPost<T>(url: string, body: unknown, headers?: HeadersInit): Promise<T> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `Request failed: ${res.status}`);
    }
    return res.json() as Promise<T>;
}

export async function extractText(file: File): Promise<{ text: string }> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/extract-text`, {
        method: 'POST',
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `Text extraction failed: ${res.status}`);
    }
    return res.json();
}

async function binaryPost(url: string, body: unknown, filename: string): Promise<void> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: res.statusText }));
        throw new Error(err.detail ?? `Request failed: ${res.status}`);
    }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(objUrl);
}


// ─── Public API ──────────────────────────────────────────────────────────────

export async function analyzeGaps(
    cvText: string,
    jobDescription: string,
    apiKey: string | null,
    language: string,
    provider: string,
): Promise<GapAnalysisItem[]> {
    return jsonPost<GapAnalysisItem[]>(
        `${API_BASE}/analyze-gaps`,
        { cv_text: cvText, job_description: jobDescription, language },
        authHeaders(apiKey, provider),
    );
}

export async function generateCV(
    cvText: string,
    jobDescription: string,
    userAnswers: UserAnswer[],
    apiKey: string | null,
    language: string,
    provider: string,
    templateId: string = 'classic',
): Promise<CVData> {
    return jsonPost<CVData>(
        `${API_BASE}/generate-cv`,
        {
            cv_text: cvText,
            job_description: jobDescription,
            user_answers: userAnswers,
            language,
            template_id: templateId,
        },
        authHeaders(apiKey, provider),
    );
}

export async function exportPdf(
    cvData: CVData,
    language: string = 'en',
    templateId: string = 'classic',
): Promise<void> {
    return binaryPost(
        `${API_BASE}/export-pdf`,
        { cv_data: cvData, language, template_id: templateId },
        'optimized_cv.pdf',
    );
}

export async function exportDocx(
    cvData: CVData,
    language: string = 'en',
    templateId: string = 'classic',
): Promise<void> {
    return binaryPost(
        `${API_BASE}/export-docx`,
        { cv_data: cvData, language, template_id: templateId },
        'optimized_cv.docx',
    );
}
export async function quickAnalyze(
    cvText: string,
    jobDescription: string,
    apiKey: string | null,
    provider: string,
    language: string,
): Promise<QuickAnalysisResponse> {
    const headers = {
        'x-model-provider': provider,
    } as any;
    if (apiKey) headers['x-model-api-key'] = apiKey;

    return jsonPost<QuickAnalysisResponse>(
        `${API_BASE}/quick-analyze`,
        { cv_text: cvText, job_description: jobDescription, language },
        headers,
    );
}
