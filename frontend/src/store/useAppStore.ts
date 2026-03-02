import { create } from 'zustand';
import {
    AppStage,
    GapAnalysisItem,
    UserAnswer,
    CVData,
    ContactInfo,
    ExperienceEntry,
    BulletPoint,
    SkillGroup,
} from '@/types';

interface AppState {
    stage: AppStage;
    cvText: string;
    jobDescription: string;
    gaps: GapAnalysisItem[];
    userAnswers: UserAnswer[];
    generatedCV: CVData | null;
    language: string;
    provider: string;
    error: string | null;

    // Stage actions
    setStage: (stage: AppStage) => void;
    setCVText: (text: string) => void;
    setJobDescription: (jd: string) => void;
    setGaps: (gaps: GapAnalysisItem[]) => void;
    addUserAnswer: (answer: UserAnswer) => void;
    setGeneratedCV: (result: CVData) => void;
    setLanguage: (lang: string) => void;
    setProvider: (provider: string) => void;
    setError: (error: string | null) => void;
    reset: () => void;

    // Granular CV edit actions
    updateContact: (patch: Partial<ContactInfo>) => void;
    updateSummary: (summary: string) => void;
    updateSkills: (skills: SkillGroup[]) => void;
    updateExperience: (index: number, patch: Partial<ExperienceEntry>) => void;
    updateBullet: (expIndex: number, bulletIndex: number, text: string) => void;
    addBullet: (expIndex: number) => void;
    removeBullet: (expIndex: number, bulletIndex: number) => void;
}

export const useAppStore = create<AppState>((set) => ({
    stage: 'UPLOAD',
    cvText: '',
    jobDescription: '',
    gaps: [],
    userAnswers: [],
    generatedCV: null,
    language: 'pt-br',
    provider: 'openai',
    error: null,

    setStage: (stage) => set({ stage }),
    setCVText: (text) => set({ cvText: text }),
    setJobDescription: (jd) => set({ jobDescription: jd }),
    setGaps: (gaps) => set({ gaps }),
    addUserAnswer: (answer) =>
        set((state) => ({ userAnswers: [...state.userAnswers, answer] })),
    setGeneratedCV: (result) => set({ generatedCV: result }),
    setLanguage: (language) => set({ language }),
    setProvider: (provider) => set({ provider }),
    setError: (error) => set({ error }),
    reset: () =>
        set({
            stage: 'UPLOAD',
            cvText: '',
            jobDescription: '',
            gaps: [],
            userAnswers: [],
            generatedCV: null,
            language: 'pt-br',
            provider: 'openai',
            error: null,
        }),

    // ── Granular edit actions ────────────────────────────────────────────────

    updateContact: (patch) =>
        set((state) =>
            state.generatedCV
                ? { generatedCV: { ...state.generatedCV, contact: { ...state.generatedCV.contact, ...patch } } }
                : {}
        ),

    updateSummary: (summary) =>
        set((state) =>
            state.generatedCV ? { generatedCV: { ...state.generatedCV, summary } } : {}
        ),

    updateSkills: (skills) =>
        set((state) =>
            state.generatedCV ? { generatedCV: { ...state.generatedCV, skills } } : {}
        ),

    updateExperience: (index, patch) =>
        set((state) => {
            if (!state.generatedCV) return {};
            const experience = state.generatedCV.experience.map((exp, i) =>
                i === index ? { ...exp, ...patch } : exp
            );
            return { generatedCV: { ...state.generatedCV, experience } };
        }),

    updateBullet: (expIndex, bulletIndex, text) =>
        set((state) => {
            if (!state.generatedCV) return {};
            const experience = state.generatedCV.experience.map((exp, i) => {
                if (i !== expIndex) return exp;
                const bullets = exp.bullets.map((b, j) => (j === bulletIndex ? { text } : b));
                return { ...exp, bullets };
            });
            return { generatedCV: { ...state.generatedCV, experience } };
        }),

    addBullet: (expIndex) =>
        set((state) => {
            if (!state.generatedCV) return {};
            const experience = state.generatedCV.experience.map((exp, i) => {
                if (i !== expIndex) return exp;
                return { ...exp, bullets: [...exp.bullets, { text: '' }] };
            });
            return { generatedCV: { ...state.generatedCV, experience } };
        }),

    removeBullet: (expIndex, bulletIndex) =>
        set((state) => {
            if (!state.generatedCV) return {};
            const experience = state.generatedCV.experience.map((exp, i) => {
                if (i !== expIndex) return exp;
                const bullets = exp.bullets.filter((_, j) => j !== bulletIndex);
                return { ...exp, bullets };
            });
            return { generatedCV: { ...state.generatedCV, experience } };
        }),
}));
