'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useVault } from '@/hooks/useVault';
import { ApiClient } from '@/lib/api/client';
import { VaultSettings } from '@/features/vault/VaultSettings';
import { UploadScreen } from '@/features/cv-upload/UploadScreen';
import { InterviewScreen } from '@/features/interview/InterviewScreen';
import { PreviewScreen } from '@/features/preview/PreviewScreen';
import { AppStage } from '@/types';

const STEPS: { stage: AppStage[]; label: string }[] = [
    { stage: ['UPLOAD', 'ANALYZING'], label: 'Upload' },
    { stage: ['INTERVIEW', 'GENERATING'], label: 'Interview' },
    { stage: ['READY'], label: 'Your CV' },
];

function StepIndicator({ stage }: { stage: AppStage }) {
    const current = STEPS.findIndex(s => s.stage.includes(stage));
    return (
        <div className="flex items-center gap-2">
            {STEPS.map((step, i) => {
                const done = i < current;
                const active = i === current;
                return (
                    <div key={step.label} className="flex items-center gap-2">
                        {i > 0 && (
                            <div className={`h-px w-8 transition-all duration-500 ${done ? 'bg-indigo-500' : 'bg-white/10'}`} />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div className={`w-2 h-2 rounded-full transition-all duration-500 ${active ? 'bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)]' :
                                done ? 'bg-indigo-600' :
                                    'bg-white/15'
                                }`} />
                            <span className={`text-xs font-medium transition-colors duration-300 ${active ? 'text-white' : done ? 'text-indigo-400' : 'text-white/30'
                                }`}>
                                {step.label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default function Home() {
    const {
        stage,
        setStage,
        error,
        setError,
        cvText,
        jobDescription,
        setGaps
    } = useAppStore();

    const { getKey, isLocked } = useVault();

    useEffect(() => {
        const runAnalysis = async () => {
            if (stage === 'ANALYZING') {
                try {
                    const apiKey = getKey();
                    if (!apiKey) console.warn("Analyzing without API Key — falling back to Local LLM (Ollama)");
                    const gaps = await ApiClient.analyzeGaps(cvText, jobDescription, apiKey);
                    setGaps(gaps);
                    setStage('INTERVIEW');
                } catch (e: any) {
                    setError(e.message || 'Failed to analyze gaps.');
                    setStage('UPLOAD');
                }
            }
        };
        runAnalysis();
    }, [stage, cvText, jobDescription, getKey, isLocked, setStage, setGaps, setError]);

    const renderStage = () => {
        switch (stage) {
            case 'UPLOAD':
                return <UploadScreen />;
            case 'ANALYZING':
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-10 animate-slide-up">
                        {/* Orb */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-40 h-40 rounded-full bg-indigo-600/20 blur-3xl animate-pulse" />
                            <div className="absolute w-28 h-28 rounded-full bg-violet-600/15 blur-2xl animate-float" />
                            <div className="relative w-20 h-20 rounded-2xl glass-strong flex items-center justify-center shadow-2xl">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-500 animate-spin [animation-duration:1.5s]" />
                            </div>
                            {/* pulse rings */}
                            <div className="absolute inset-0 rounded-full border border-indigo-500/30 animate-ping [animation-duration:2s]" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold gradient-text">Analyzing your profile</h2>
                            <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                                Our AI is scanning for gaps between your CV and the role requirements&hellip;
                            </p>
                        </div>
                    </div>
                );
            case 'GENERATING':
                return (
                    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 animate-slide-up">
                        <div className="relative w-20 h-20 rounded-2xl glass-strong flex items-center justify-center">
                            <div className="absolute w-32 h-32 rounded-full bg-violet-600/20 blur-3xl animate-pulse" />
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 animate-spin [animation-duration:1.5s]" />
                        </div>
                        <div className="text-center space-y-2">
                            <h2 className="text-2xl font-bold gradient-text">Crafting your CV</h2>
                            <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                                Strategically repositioning your experience for this role&hellip;
                            </p>
                        </div>
                    </div>
                );
            case 'INTERVIEW':
                return <InterviewScreen />;
            case 'READY':
                return <PreviewScreen />;
            default:
                return <UploadScreen />;
        }
    };

    return (
        <main className="min-h-screen">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 z-50 h-16 glass border-b border-white/5">
                <div className="max-w-5xl mx-auto px-6 sm:px-10 h-full flex items-center justify-between">
                    {/* Logo */}
                    <div className="flex items-center gap-3 group cursor-default select-none">
                        <div className="relative w-8 h-8">
                            <div className="absolute inset-0 rounded-lg bg-indigo-600 rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                            <div className="absolute inset-0 rounded-lg bg-violet-500 -rotate-3 opacity-80 group-hover:-rotate-6 transition-transform duration-300" />
                            <div className="relative flex items-center justify-center h-full">
                                <div className="w-2.5 h-2.5 bg-white rounded-sm" />
                            </div>
                        </div>
                        <span className="font-bold text-lg text-white tracking-tight">SmartCV</span>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Step indicator (hidden on mobile) */}
                        {stage !== 'UPLOAD' && (
                            <div className="hidden sm:flex">
                                <StepIndicator stage={stage} />
                            </div>
                        )}

                        {/* Error banner */}
                        {error && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-full border border-red-500/20">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                                <span className="text-xs font-medium text-red-400 max-w-[200px] truncate">{error}</span>
                            </div>
                        )}

                        <VaultSettings />
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-6 sm:px-10 pt-28 pb-16 min-h-screen">
                {renderStage()}
            </div>

            {/* Footer */}
            <footer className="border-t border-white/5 py-6">
                <div className="max-w-5xl mx-auto px-6 sm:px-10 flex items-center justify-center gap-2 text-xs text-white/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400/60" />
                    <span>Stateless &amp; private — your data never leaves your session</span>
                </div>
            </footer>
        </main>
    );
}
