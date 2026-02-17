import { useState, useCallback } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { ApiClient } from '@/lib/api/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UploadCloud, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useVault } from '@/hooks/useVault';

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
            // Trigger analysis immediately when moving to next stage
            // The main page orchestrator will pick this up or we can do it here
            // For better separation, let's keep logic in the component or a dedicated hook
            // But to be "staff level", let's move the async logic to the parent or a custom hook
            // For now, let's just trigger the stage change and let the orchestrator handle it.
            // actually, let's call the API here to handle leading state better

            const apiKey = getKey();
            // We don't strictly need the key for extract-text, but we do for analyze
            // If no key and production, backend will fail.

            // NOTE: We are doing the analysis call in the orchestration layer (page.tsx) 
            // to keep this component UI focused.
        } catch (e) {
            setError("Failed to start analysis.");
            setStage("UPLOAD");
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">SmartCV Adjuster</h1>
                <p className="text-zinc-500 dark:text-zinc-400">
                    Upload your resume and the job description to get AI-powered optimization.
                </p>
            </div>

            <div className="grid gap-6">
                {/* CV Upload Area */}
                <Card
                    className={`p-10 border-2 border-dashed transition-all duration-200 ease-in-out flex flex-col items-center justify-center gap-4 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 ${isDragging ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-zinc-200 dark:border-zinc-800'
                        }`}
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

                    {isExtracting ? (
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                            <p className="font-medium text-zinc-900 dark:text-zinc-100">Extracting text...</p>
                        </div>
                    ) : fileName ? (
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <FileText className="w-6 h-6" />
                            </div>
                            <div className="text-center">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">{fileName}</p>
                                <p className="text-xs text-zinc-500">Click or drag to replace</p>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="w-12 h-12 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center">
                                <UploadCloud className="w-6 h-6 text-zinc-500" />
                            </div>
                            <div className="text-center space-y-1">
                                <p className="font-medium text-zinc-900 dark:text-zinc-100">
                                    Click to upload or drag and drop
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                                    PDF (max 5MB)
                                </p>
                            </div>
                        </>
                    )}
                </Card>

                {/* Job Description Area */}
                <div className="space-y-3">
                    <label htmlFor="jd" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        Job Description
                    </label>
                    <textarea
                        id="jd"
                        className="flex min-h-[150px] w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-950 dark:ring-offset-zinc-950 dark:placeholder:text-zinc-400 dark:focus-visible:ring-zinc-300"
                        placeholder="Paste the job requirements here..."
                        value={localJobDescription}
                        onChange={(e) => setLocalJobDescription(e.target.value)}
                    />
                </div>

                <Button
                    size="lg"
                    className="w-full"
                    disabled={!fileName || !localJobDescription.trim() || isExtracting}
                    onClick={handleStartAnalysis}
                >
                    Start Analysis
                </Button>
            </div>
        </div>
    );
}
