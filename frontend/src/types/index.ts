// Legacy types (kept for non-CV usage)
export interface GapAnalysisItem {
    question: string;
    reasoning: string;
}

export interface UserAnswer {
    question: string;
    answer: string;
}

export type AppStage = 'UPLOAD' | 'ANALYZING' | 'INTERVIEW' | 'GENERATING' | 'READY';

// Re-export the structured CV types so existing imports work
export * from './cv';
