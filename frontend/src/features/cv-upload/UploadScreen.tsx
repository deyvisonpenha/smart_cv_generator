import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useVault } from '@/hooks/useVault';
import { cn } from '@/components/ui/card';

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
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    }, []);

    const onDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const onDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleStartAnalysis = async () => {
        if (!fileName) {
            setError("Please upload a CV first.");
            return;
        }
        if (!localJobDescription.trim()) {
            setError("Please enter a job description.");
            return;
        }

        setJobDescription(localJobDescription);

        try {
            setStage("ANALYZING");
        } catch (e) {
            setError("Failed to start analysis.");
            setStage("UPLOAD");
        }
    };

    return (
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">

            <div className="text-center space-y-3">
                <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Optimize your CV
                </h1>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto leading-relaxed">
                    Upload your resume and the job description to get AI-powered insights and tailoring.
                </p>
            </div>

            <div className="grid gap-8">
                {/* CV Upload Area */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Resume / CV</label>
                        {fileName && <span className="text-xs text-green-600 font-medium flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Ready</span>}
                    </div>

                    <div
                        className={cn(
                            "relative group cursor-pointer transition-all duration-300 ease-out",
                            "border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center gap-4",
                            "bg-white dark:bg-zinc-900/50",
                            isDragging
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10 scale-[1.01] shadow-xl shadow-blue-500/10"
                                : "border-zinc-200 dark:border-zinc-800 hover:border-blue-400 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 hover:shadow-md"
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
                            "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-sm",
                            isDragging ? "bg-blue-100 text-blue-600" : "bg-zinc-100 text-zinc-500 group-hover:bg-white group-hover:text-blue-600 group-hover:shadow-md dark:bg-zinc-800 dark:text-zinc-400"
                        )}>
                            {isExtracting ? (
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                            ) : fileName ? (
                                <FileText className="w-8 h-8" />
                            ) : (
                                <UploadCloud className="w-8 h-8" />
                            )}
                        </div>

                        <div className="space-y-1">
                            {isExtracting ? (
                                <div className="space-y-1">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100">Extracting content...</p>
                                    <p className="text-xs text-zinc-500">Please wait while we parse your PDF.</p>
                                </div>
                            ) : fileName ? (
                                <div className="space-y-1">
                                    <p className="font-semibold text-zinc-900 dark:text-zinc-100 break-all">{fileName}</p>
                                    <p className="text-xs text-zinc-400 group-hover:text-blue-500 transition-colors">Click to replace</p>
                                </div>
                            ) : (
                                <>
                                    <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                        <span className="text-blue-600 font-semibold group-hover:underline">Click to upload</span> or drag and drop
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                        PDF only (max 10MB)
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Job Description Area */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label htmlFor="jd" className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                            Job Description
                        </label>
                        <span className="text-xs text-zinc-400">Paste the key requirements</span>
                    </div>

                    <div className="relative group">
                        <textarea
                            id="jd"
                            className="flex min-h-[200px] w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm ring-offset-white placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-600 dark:focus-visible:ring-blue-800 transition-all shadow-sm group-hover:shadow-md resize-none"
                            placeholder="Paste the job description here (responsibilities, requirements, etc.)..."
                            value={localJobDescription}
                            onChange={(e) => setLocalJobDescription(e.target.value)}
                        />
                        <div className="absolute bottom-3 right-3 pointer-events-none opacity-0 group-focus-within:opacity-100 transition-opacity">
                            <span className="text-[10px] text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-800 shadow-sm">
                                {localJobDescription.length} chars
                            </span>
                        </div>
                    </div>
                </div>

                <Button
                    size="lg"
                    className="w-full h-12 text-base shadow-lg shadow-blue-900/5 hover:shadow-blue-900/10 transition-all active:scale-[0.99]"
                    disabled={!fileName || !localJobDescription.trim() || isExtracting}
                    onClick={handleStartAnalysis}
                >
                    Start Analysis
                    <ArrowRight className="w-4 h-4 ml-2 opacity-50" />
                </Button>
            </div>
        </div>
    );
}
