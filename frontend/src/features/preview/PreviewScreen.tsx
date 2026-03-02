'use client';
import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Download, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { ApiClient } from '@/lib/api/client';

export function PreviewScreen() {
    const { generatedCV, setStage, reset } = useAppStore();
    const [isExporting, setIsExporting] = useState(false);
    const [reportOpen, setReportOpen] = useState(true);

    if (!generatedCV) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 animate-slide-up">
                <p className="text-white/40">No CV generated yet.</p>
                <button
                    onClick={() => setStage('UPLOAD')}
                    className="btn-primary text-white px-6 py-2.5 rounded-xl text-sm font-medium"
                >
                    Start Over
                </button>
            </div>
        );
    }

    const handleExport = async () => {
        setIsExporting(true);
        try {
            await ApiClient.exportPdf(generatedCV.markdown_cv, 'optimized_cv.pdf');
        } catch (e) {
            console.error('PDF Export failed', e);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/* CV preview spacing styles */}
            <style>{`
                .cv-content h1, .cv-content h2, .cv-content h3, .cv-content h4 {
                    page-break-after: avoid;
                    break-after: avoid;
                    margin-top: 1em;
                    margin-bottom: 0.3em;
                }
                .cv-content h1:first-child {
                    margin-top: 0;
                }
                .cv-content p {
                    margin-top: 0.3em;
                    margin-bottom: 0.3em;
                }
                .cv-content li {
                    margin-top: 0.15em;
                    margin-bottom: 0.15em;
                }
                .cv-content ul, .cv-content ol {
                    margin-top: 0.3em;
                    margin-bottom: 0.5em;
                }
                .cv-content.prose {
                    line-height: 1.5;
                    font-size: 0.82rem;
                }
                .cv-content.prose h1 { font-size: 1.5rem; }
                .cv-content.prose h3 { font-size: 0.95rem; }
                .cv-content ul,
                .cv-content.prose ul {
                    list-style-type: disc;
                    padding-left: 1.2em;
                    margin-left: 0;
                }
                .cv-content ul > li,
                .cv-content.prose ul > li {
                    padding-left: 0.3em;
                    display: list-item;
                }
                .cv-content ul > li::marker,
                .cv-content.prose ul > li::marker {
                    font-size: 1em;
                    line-height: 1.5;
                }
            `}</style>

            <div className="max-w-5xl mx-auto space-y-6 animate-slide-up">
                {/* Sticky action bar */}
                <div className="sticky top-20 z-20 glass rounded-2xl px-5 py-3 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">Your Optimized CV</h2>
                        <p className="text-xs text-white/30">AI-tailored for this role</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={reset}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/50 border border-white/8 hover:text-white hover:border-white/20 transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            New
                        </button>
                        <button
                            onClick={handleExport}
                            disabled={isExporting}
                            className="btn-primary text-white flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {isExporting ? 'Generating…' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Optimization Report */}
                    <div className="lg:col-span-1">
                        <div className="glass rounded-2xl overflow-hidden">
                            <button
                                className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors"
                                onClick={() => setReportOpen(v => !v)}
                            >
                                <div className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                    <span className="text-sm font-semibold text-white">Optimization Report</span>
                                </div>
                                {reportOpen ? (
                                    <ChevronUp className="w-4 h-4 text-white/30" />
                                ) : (
                                    <ChevronDown className="w-4 h-4 text-white/30" />
                                )}
                            </button>
                            {reportOpen && (
                                <div className="px-5 py-4 text-sm text-white/60 leading-relaxed prose prose-sm prose-invert max-w-none [&_strong]:text-indigo-300 [&_h3]:text-white/80 [&_h3]:text-sm">
                                    <ReactMarkdown>{generatedCV.optimization_report}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CV Preview */}
                    <div className="lg:col-span-2">
                        <div className="rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/8 lg:w-[750px]">
                            {/* Document header bar */}
                            <div className="bg-white/5 border-b border-white/8 px-5 py-2 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                                <span className="ml-2 text-xs text-white/20">optimized_cv.pdf</span>
                            </div>
                            <div className="overflow-x-auto bg-white min-w-96">
                                <div
                                    className="cv-content bg-white text-zinc-900 prose prose-sm prose-zinc max-w-none"
                                    style={{
                                        fontFamily: 'Inter, sans-serif',
                                        width: '794px',
                                        padding: '10mm 18mm',
                                        boxSizing: 'border-box',
                                        margin: '0 auto',
                                    }}
                                >
                                    <ReactMarkdown>{generatedCV.markdown_cv}</ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}