'use client';
import { useState, useCallback } from 'react';
import { X, UploadCloud, FileText, Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import { extractText, quickAnalyze } from '@/services/api';
import { useVault } from '@/hooks/useVault';
import { useAppStore } from '@/store/useAppStore';
import { QuickAnalysisResponse } from '@/types';

interface QuickAnalysisModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function QuickAnalysisModal({ isOpen, onClose }: QuickAnalysisModalProps) {
    const { language, provider, setError } = useAppStore();
    const { getKey } = useVault();

    const [cvText, setCvText] = useState('');
    const [jdText, setJdText] = useState('');
    const [isExtracting, setIsExtracting] = useState(false);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [result, setResult] = useState<QuickAnalysisResponse | null>(null);

    const handleFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        try {
            setIsExtracting(true);
            setFileName(file.name);
            const { text } = await extractText(file);
            setCvText(text);
        } catch (e: any) {
            setError(e.message || 'Failed to extract text.');
            setFileName(null);
        } finally {
            setIsExtracting(false);
        }
    };

    const handleAnalyze = async () => {
        if (!cvText || !jdText) return;
        setIsAnalyzing(true);
        try {
            const apiKey = getKey(provider);
            const res = await quickAnalyze(cvText, jdText, apiKey, provider, language);
            setResult(res);
        } catch (e: any) {
            setError(e.message || 'Analysis failed.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#050508]/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-indigo-400" />
                        </div>
                        <h2 className="text-lg font-bold text-white tracking-tight">Quick Analysis</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/5 rounded-full text-white/40 hover:text-white transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {!result ? (
                        <>
                            {/* Inputs */}
                            <div className="space-y-4">
                                {/* CV Upload */}
                                <div
                                    className={`relative group rounded-2xl p-6 border-2 border-dashed transition-all duration-300 ${fileName ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 hover:border-indigo-500/40 bg-white/[0.02]'
                                        }`}
                                    onClick={() => !isExtracting && document.getElementById('quick-cv-upload')?.click()}
                                >
                                    <input
                                        id="quick-cv-upload"
                                        type="file"
                                        className="hidden"
                                        accept=".pdf"
                                        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                                    />
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${fileName ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/40 group-hover:text-indigo-400'
                                            }`}>
                                            {isExtracting ? <Loader2 className="w-6 h-6 animate-spin" /> : fileName ? <FileText className="w-6 h-6" /> : <UploadCloud className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-white truncate">
                                                {isExtracting ? 'Extracting text...' : fileName || 'Upload Resume (PDF)'}
                                            </p>
                                            <p className="text-xs text-white/30">
                                                {fileName ? 'CV ready for analysis' : 'Drag & drop or click to browse'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* JD Textarea */}
                                <textarea
                                    className="w-full h-32 rounded-2xl bg-white/[0.02] border border-white/10 p-4 text-sm text-white placeholder:text-white/20 focus:border-indigo-500/50 outline-none transition-all resize-none"
                                    placeholder="Paste job description here..."
                                    value={jdText}
                                    onChange={(e) => setJdText(e.target.value)}
                                />
                            </div>

                            <button
                                onClick={handleAnalyze}
                                disabled={!cvText || !jdText || isAnalyzing}
                                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white font-bold text-sm transition-all shadow-[0_0_20px_rgba(79,70,229,0.2)] flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Analyzing Compatibility
                                    </>
                                ) : (
                                    'Analyze Now'
                                )}
                            </button>
                        </>
                    ) : (
                        /* Result View */
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Top Score */}
                            <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-6 flex flex-col items-center text-center space-y-3">
                                <div className="text-xs font-bold uppercase tracking-widest text-white/40">Compatibility Score</div>
                                <div className="relative">
                                    <div className="text-5xl font-black gradient-text">
                                        {result.match_score}%
                                    </div>
                                    <div className="absolute -inset-4 bg-indigo-500/20 blur-2xl rounded-full -z-10" />
                                </div>
                                <p className="text-sm text-white/60 max-w-sm">
                                    {result.short_report}
                                </p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-emerald-400/80">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        Strengths
                                    </div>
                                    <ul className="space-y-2">
                                        {result.key_strengths.map((s, i) => (
                                            <li key={i} className="text-xs text-white/50 bg-emerald-500/5 border border-emerald-500/10 rounded-lg px-3 py-2">
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Gaps */}
                                <div className="space-y-3">
                                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-amber-400/80">
                                        <AlertCircle className="w-3.5 h-3.5" />
                                        Missing
                                    </div>
                                    <ul className="space-y-2">
                                        {result.missing_requirements.map((m, i) => (
                                            <li key={i} className="text-xs text-white/50 bg-amber-500/5 border border-amber-500/10 rounded-lg px-3 py-2">
                                                {m}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            <button
                                onClick={() => setResult(null)}
                                className="w-full py-3 text-xs font-bold text-white/30 hover:text-white transition-colors"
                            >
                                Compare another CV
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
