'use client';
import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ApiClient } from '@/lib/api/client';
import { UploadCloud, FileText, Loader2, ArrowRight, Sparkles } from 'lucide-react';
import { useVault } from '@/hooks/useVault';

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}

export function UploadScreen() {
    const { setStage, setCVText, setJobDescription, setError } = useAppStore();
    const { getKey } = useVault();
    const [isDragging, setIsDragging] = useState(false);
    const [isExtracting, setIsExtracting] = useState(false);
    const [fileName, setFileName] = useState<string | null>(null);
    const [localJobDescription, setLocalJobDescription] = useState('');

    const handleFile = async (file: File) => {
        if (file.type !== 'application/pdf') {
            setError('Please upload a PDF file.');
            return;
        }
        try {
            setError(null);
            setIsExtracting(true);
            setFileName(file.name);
            const { text } = await ApiClient.extractText(file);
            setCVText(text);
            setIsExtracting(false);
        } catch (e: any) {
            setError(e.message || 'Failed to extract text from PDF.');
            setIsExtracting(false);
            setFileName(null);
        }
    };

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files?.[0]) handleFile(e.dataTransfer.files[0]);
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleStartAnalysis = () => {
        if (!fileName) { setError('Please upload a CV first.'); return; }
        if (!localJobDescription.trim()) { setError('Please enter a job description.'); return; }
        setJobDescription(localJobDescription);
        setStage('ANALYZING');
    };

    const canSubmit = !!fileName && !!localJobDescription.trim() && !isExtracting;

    return (
        <div className="max-w-2xl mx-auto animate-slide-up">
            {/* Hero */}
            <div className="text-center mb-12 space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 glass rounded-full text-xs font-medium text-indigo-300 mb-4">
                    <Sparkles className="w-3 h-3" />
                    AI-powered CV optimization
                </div>
                <h1 className="text-5xl font-extrabold leading-tight tracking-tight">
                    <span className="text-white">Land your </span>
                    <span className="gradient-text">dream role</span>
                </h1>
                <p className="text-base text-white/50 max-w-md mx-auto leading-relaxed">
                    Upload your CV, paste the job description, and our AI will identify gaps, ask smart questions, and generate a tailored resume.
                </p>
            </div>

            <div className="space-y-5">
                {/* CV Upload */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-white/80">Resume / CV</label>
                        {fileName && (
                            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Extracted
                            </span>
                        )}
                    </div>

                    <div
                        className={cn(
                            'relative group cursor-pointer rounded-2xl p-10 flex flex-col items-center gap-4 text-center transition-all duration-300',
                            'glass border-2 border-dashed',
                            isDragging
                                ? 'border-indigo-500 bg-indigo-500/10 glow-accent scale-[1.01]'
                                : fileName
                                    ? 'border-emerald-500/40 bg-emerald-500/5 hover:border-emerald-400/60'
                                    : 'border-white/10 hover:border-indigo-500/50 hover:bg-indigo-500/5'
                        )}
                        onDrop={onDrop}
                        onDragOver={onDragOver}
                        onDragLeave={onDragLeave}
                        onClick={() => document.getElementById('file-upload')?.click()}
                    >
                        <input
                            id="file-upload"
                            type="file"
                            className="hidden"
                            accept=".pdf"
                            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                        />

                        <div className={cn(
                            'w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300',
                            isDragging ? 'bg-indigo-500/20 text-indigo-300'
                                : fileName ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-white/5 text-white/40 group-hover:bg-indigo-500/15 group-hover:text-indigo-300'
                        )}>
                            {isExtracting ? (
                                <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
                            ) : fileName ? (
                                <FileText className="w-7 h-7" />
                            ) : (
                                <UploadCloud className="w-7 h-7" />
                            )}
                        </div>

                        <div className="space-y-1">
                            {isExtracting ? (
                                <>
                                    <p className="font-semibold text-white">Extracting content…</p>
                                    <p className="text-sm text-white/40">Reading your PDF</p>
                                </>
                            ) : fileName ? (
                                <>
                                    <p className="font-semibold text-white truncate max-w-xs">{fileName}</p>
                                    <p className="text-sm text-white/40 group-hover:text-indigo-400 transition-colors">
                                        Click to replace
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="font-medium text-white">
                                        <span className="text-indigo-400 group-hover:text-indigo-300 transition-colors">Click to upload</span> or drag &amp; drop
                                    </p>
                                    <p className="text-sm text-white/30">PDF only · max 10 MB</p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Description */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <label htmlFor="jd" className="text-sm font-semibold text-white/80">Job Description</label>
                        <span className={cn(
                            'text-xs transition-colors',
                            localJobDescription.length > 0 ? 'text-indigo-400' : 'text-white/20'
                        )}>
                            {localJobDescription.length} chars
                        </span>
                    </div>

                    <div className="relative">
                        <textarea
                            id="jd"
                            rows={7}
                            className={cn(
                                'w-full rounded-2xl glass px-4 py-3 text-sm text-white placeholder:text-white/25 resize-none',
                                'outline-none transition-all duration-300',
                                'focus:border-indigo-500/60 focus:bg-indigo-500/5 focus:shadow-[0_0_0_3px_rgba(99,102,241,0.15)]',
                                'border',
                                localJobDescription.length > 0 ? 'border-indigo-500/30' : 'border-white/8'
                            )}
                            placeholder="Paste the job description here — responsibilities, requirements, preferred skills…"
                            value={localJobDescription}
                            onChange={(e) => setLocalJobDescription(e.target.value)}
                        />
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={handleStartAnalysis}
                    disabled={!canSubmit}
                    className={cn(
                        'w-full h-14 rounded-2xl font-semibold text-base flex items-center justify-center gap-2 transition-all duration-200',
                        canSubmit
                            ? 'btn-primary text-white cursor-pointer'
                            : 'bg-white/5 text-white/20 border border-white/8 cursor-not-allowed'
                    )}
                >
                    {isExtracting ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Reading PDF…
                        </>
                    ) : (
                        <>
                            Start Analysis
                            <ArrowRight className="w-4 h-4" />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
