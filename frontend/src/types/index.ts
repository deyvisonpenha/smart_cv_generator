export interface GapAnalysisItem {
    id: number;
    question: string;
    context: string;
}

export interface UserAnswer {
    question: string;
    answer: string;
}

export interface CVGenerationResponse {
    markdown_cv: string;
    optimization_report: string;
}

export type AppStage = 'UPLOAD' | 'ANALYZING' | 'INTERVIEW' | 'GENERATING' | 'READY';

export interface CVState {
    originalText: string;
    jobDescription: string;
    gaps: GapAnalysisItem[];
    userAnswers: UserAnswer[];
    generatedCV: CVGenerationResponse | null;
}
