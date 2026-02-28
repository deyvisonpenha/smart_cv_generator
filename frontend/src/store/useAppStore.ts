import { create } from 'zustand';
import { AppStage, GapAnalysisItem, UserAnswer, CVGenerationResponse } from '@/types';

interface AppState {
    stage: AppStage;
    cvText: string;
    jobDescription: string;
    gaps: GapAnalysisItem[];
    userAnswers: UserAnswer[];
    generatedCV: CVGenerationResponse | null;
    language: string;
    error: string | null;

    // Actions
    setStage: (stage: AppStage) => void;
    setCVText: (text: string) => void;
    setJobDescription: (jd: string) => void;
    setGaps: (gaps: GapAnalysisItem[]) => void;
    addUserAnswer: (answer: UserAnswer) => void;
    setGeneratedCV: (result: CVGenerationResponse) => void;
    setLanguage: (lang: string) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useAppStore = create<AppState>((set) => ({
    stage: 'UPLOAD',
    cvText: '',
    jobDescription: '',
    gaps: [],
    userAnswers: [],
    generatedCV: null,
    language: 'pt-br',
    error: null,

    setStage: (stage) => set({ stage }),
    setCVText: (text) => set({ cvText: text }),
    setJobDescription: (jd) => set({ jobDescription: jd }),
    setGaps: (gaps) => set({ gaps }),
    addUserAnswer: (answer) =>
        set((state) => ({ userAnswers: [...state.userAnswers, answer] })),
    setGeneratedCV: (result) => set({ generatedCV: result }),
    setLanguage: (language) => set({ language }),
    setError: (error) => set({ error }),
    reset: () =>
        set({
            stage: 'UPLOAD',
            cvText: '',
            jobDescription: '',
            gaps: [],
            userAnswers: [],
            generatedCV: null,
            language: 'en',
            error: null,
        }),
}));
