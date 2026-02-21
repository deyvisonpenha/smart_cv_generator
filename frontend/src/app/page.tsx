'use client';
import { useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { useVault } from '@/hooks/useVault';
import { ApiClient } from '@/lib/api/client';
import { VaultSettings } from '@/features/vault/VaultSettings';
import { UploadScreen } from '@/features/cv-upload/UploadScreen';
import { InterviewScreen } from '@/features/interview/InterviewScreen';
import { PreviewScreen } from '@/features/preview/PreviewScreen';


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

    // Orchestrator Effect for Gap Analysis
    useEffect(() => {
        const runAnalysis = async () => {
            if (stage === 'ANALYZING') {
                try {
                    const apiKey = getKey();

                    if (!apiKey) {
                        if (isLocked) {
                            throw new Error("Vault is locked. Please unlock to proceed.");
                        } else {
                            throw new Error("API Key not found. Please setup your vault.");
                        }
                    }

                    console.log("Using API Key:", apiKey ? "***" : "null");
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
    }, [stage, cvText, jobDescription, getKey, isLocked, setStage, setGaps, setError]);

    const renderStage = () => {
        switch (stage) {
            case 'UPLOAD':
                return <UploadScreen />;
            case 'ANALYZING':
                return (
                    <div className="flex flex-col items-center justify-center h-[60vh] space-y-8 animate-in fade-in zoom-in-95 duration-700">

                        {/* Mesh Gradient / Ping Loader */}
                        <div className="relative flex items-center justify-center">
                            <div className="absolute w-32 h-32 bg-blue-500/30 rounded-full blur-2xl animate-pulse"></div>
                            <div className="absolute w-20 h-20 bg-indigo-500/20 rounded-full blur-xl animate-bounce duration-[3s]"></div>

                            <div className="relative w-16 h-16 bg-white dark:bg-zinc-900 rounded-2xl flex items-center justify-center shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
                                <div className="w-8 h-8 rounded bg-gradient-to-tr from-blue-600 to-indigo-600 animate-spin sticky"></div>
                            </div>
                        </div>

                        <div className="text-center space-y-2 max-w-md">
                            <h2 className="text-xl font-semibold bg-gradient-to-r from-zinc-900 to-zinc-500 dark:from-zinc-100 dark:to-zinc-500 bg-clip-text text-transparent">
                                Analyzing Profile
                            </h2>
                            <p className="text-sm text-zinc-500 leading-relaxed">
                                Our AI is checking your experience against the job requirements to find the best optimization strategy.
                            </p>
                        </div>
                    </div>
                );
            case 'INTERVIEW':
                return <InterviewScreen />;
            case 'GENERATING':
                return null;
            case 'READY':
                return <PreviewScreen />;
            default:
                return <UploadScreen />;
        }
    };

    return (
        <main className="min-h-screen bg-[#FDFDFD] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30">
            {/* Header */}
            <header className="fixed top-0 inset-x-0 h-16 border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md z-50">
                <div className="max-w-5xl mx-auto px-4 h-full flex items-center justify-between">
                    {/* Geometric Logo */}
                    <div className="flex items-center gap-3 group cursor-default">
                        <div className="relative w-8 h-8 flex items-center justify-center">
                            <div className="absolute inset-0 bg-zinc-900 dark:bg-zinc-100 rounded-lg rotate-3 group-hover:rotate-6 transition-transform"></div>
                            <div className="absolute inset-0 bg-blue-600 rounded-lg -rotate-3 opacity-90 group-hover:-rotate-6 transition-transform"></div>
                            <div className="relative w-3 h-3 bg-white rounded-sm"></div>
                        </div>
                        <span className="font-bold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
                            SmartCV
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        {error && (
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 rounded-full border border-red-100 dark:border-red-900/30">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                                <span className="text-xs font-medium text-red-600 dark:text-red-400">{error}</span>
                            </div>
                        )}
                        <VaultSettings />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="max-w-5xl mx-auto px-4 pt-28 pb-12 min-h-screen">
                {renderStage()}
            </div>

            {/* Footer */}
            <footer className="border-t border-zinc-200 dark:border-zinc-800 py-8">
                <div className="max-w-5xl mx-auto px-4 flex flex-col items-center justify-center gap-2 text-center text-sm text-zinc-400">
                    <p className="font-medium text-zinc-500">Secure Client-Side Architecture</p>
                    <p className="text-xs max-w-xs">
                        Your API keys and data are processed locally or via a stateless backend. No data is persisted on our servers.
                    </p>
                </div>
            </footer>
        </main>
    );
}

