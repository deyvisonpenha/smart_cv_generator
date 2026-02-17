'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useVault } from '@/hooks/useVault';
import { ApiClient } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { VaultSettings } from '@/features/vault/VaultSettings';
import { UploadScreen } from '@/features/cv-upload/UploadScreen';
import { InterviewScreen } from '@/features/interview/InterviewScreen';
import { PreviewScreen } from '@/features/preview/PreviewScreen';
import { Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { AppStage } from '@/types';

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

    const { getKey } = useVault();

    // Orchestrator Effect for Gap Analysis
    useEffect(() => {
        const runAnalysis = async () => {
            if (stage === 'ANALYZING') {
                try {
                    const apiKey = getKey();
                    const gaps = await ApiClient.analyzeGaps(cvText, jobDescription, apiKey);
                    setGaps(gaps);
                    setStage('INTERVIEW');
                } catch (e: any) {
                    setError(e.message || "Failed to analyze gaps.");
                    setStage('UPLOAD');
                }
            }
        };

        runAnalysis();
    }, [stage, cvText, jobDescription, getKey, setStage, setGaps, setError]);

    const renderStage = () => {
        switch (stage) {
            case 'UPLOAD':
                return <UploadScreen />;
            case 'ANALYZING':
                return (
                    <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 animate-in fade-in zoom-in-95 duration-500">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-zinc-100 border-t-blue-600 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-xl">AI</span>
                            </div>
                        </div>
                        <h2 className="text-xl font-medium animate-pulse">Analyzing your profile...</h2>
                        <p className="text-zinc-500 max-w-md text-center">
                            We are comparing your experience against the job requirements to find optimization opportunities.
                        </p>
                    </div>
                );
            case 'INTERVIEW':
                return <InterviewScreen />;
            case 'GENERATING':
                // This state is actually handled inside InterviewScreen directly for better UX 
                // but kept here for architectural completeness if we move it out later.
                // For now, InterviewScreen handles the transition to READY.
                return null;
            case 'READY':
                return <PreviewScreen />;
            default:
                return <UploadScreen />;
        }
    };

    return (
        <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900">
            {/* Header */}
            <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="font-bold text-lg tracking-tight flex items-center gap-2">
                        <span className="w-6 h-6 rounded bg-zinc-900 dark:bg-zinc-100"></span>
                        SmartCV
                    </div>

                    <div className="flex items-center gap-4">
                        {error && (
                            <div className="text-xs text-red-500 font-medium px-3 py-1 bg-red-50 dark:bg-red-900/20 rounded-full animate-pulse">
                                {error}
                            </div>
                        )}
                        <VaultSettings />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
                {renderStage()}
            </div>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 mt-20 py-8 text-center text-sm text-zinc-400">
                <p>&copy; {new Date().getFullYear()} SmartCV Adjuster. Secure Client-Side Architecture.</p>
            </footer>
        </main>
    );
}
