'use client';
import { useState } from 'react';
import { Download, FileText, RefreshCw, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { exportPdf, exportDocx } from '@/services/api';
import { CVHeader } from '@/components/cv/CVHeader';
import { CVSummary } from '@/components/cv/CVSummary';
import { CVSkills } from '@/components/cv/CVSkills';
import { CVExperience } from '@/components/cv/CVExperience';
import { CVEducation } from '@/components/cv/CVEducation';
import { SECTION_TITLES } from '@/constants/translations';

export function PreviewScreen() {
    const { generatedCV, setStage, reset, language } = useAppStore();
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [isExportingDocx, setIsExportingDocx] = useState(false);
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

    const titles = SECTION_TITLES[language] || SECTION_TITLES['en'];

    const handleExportPdf = async () => {
        setIsExportingPdf(true);
        try {
            await exportPdf(generatedCV, language);
        } catch (e) {
            console.error('PDF export failed', e);
            alert('Failed to export PDF. Please try again.');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const handleExportDocx = async () => {
        setIsExportingDocx(true);
        try {
            await exportDocx(generatedCV, language);
        } catch (e) {
            console.error('DOCX export failed', e);
            alert('Failed to export DOCX. Please try again.');
        } finally {
            setIsExportingDocx(false);
        }
    };

    return (
        <>
            <div className="w-full space-y-6 animate-slide-up">
                {/* ... existing header ... */}
                <div className="sticky top-20 z-30 bg-[#0a0a0f]/90 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 flex items-center justify-between flex-wrap gap-3 shadow-2xl">
                    <div>
                        <h2 className="text-lg font-bold text-white">Your Optimized CV</h2>
                        <p className="text-xs text-white/30">Click any field to edit inline</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={reset}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white/50 border border-white/8 hover:text-white hover:border-white/20 transition-all"
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                            New
                        </button>
                        <button
                            onClick={handleExportDocx}
                            disabled={isExportingDocx}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/70 border border-white/10 hover:border-white/25 hover:text-white transition-all disabled:opacity-50"
                        >
                            <FileText className="w-3.5 h-3.5" />
                            {isExportingDocx ? 'Generating…' : 'Download DOCX'}
                        </button>
                        <button
                            onClick={handleExportPdf}
                            disabled={isExportingPdf}
                            className="btn-primary text-white flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-60"
                        >
                            <Download className="w-3.5 h-3.5" />
                            {isExportingPdf ? 'Generating…' : 'Download PDF'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Optimization Report */}
                    <div className="lg:col-span-4 xl:col-span-3">
                        <div className="glass rounded-2xl overflow-hidden sticky top-40">
                            <button
                                className="w-full flex items-center justify-between px-5 py-4 border-b border-white/5 hover:bg-white/3 transition-colors"
                                onClick={() => setReportOpen((v) => !v)}
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
                                <div className="px-5 py-6 space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto">
                                    {/* Match Score Display */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold uppercase tracking-wider text-white/50">Alignment Score</span>
                                            <span className={`text-xl font-black ${generatedCV.match_score > 80 ? 'text-emerald-400' : generatedCV.match_score > 60 ? 'text-yellow-400' : 'text-orange-400'}`}>
                                                {generatedCV.match_score || 100}%
                                            </span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full transition-all duration-1000 ease-out rounded-full ${generatedCV.match_score > 80 ? 'bg-emerald-500' : generatedCV.match_score > 60 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                                                style={{
                                                    width: `${generatedCV.match_score}%`,
                                                    boxShadow: `0 0 15px ${generatedCV.match_score > 80 ? 'rgba(16,185,129,0.3)' : generatedCV.match_score > 60 ? 'rgba(234,179,8,0.3)' : 'rgba(249,115,22,0.3)'}`
                                                }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-white/30 leading-tight">
                                            This score reflects how well your experience and skills map to the role after our strategic optimization.
                                        </p>
                                    </div>

                                    <div className="h-px bg-white/5" />

                                    {/* Detailed Report */}
                                    <div className="text-sm text-white/60 leading-relaxed whitespace-pre-wrap">
                                        {generatedCV.optimization_report}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CV Preview — editable */}
                    <div className="lg:col-span-8 xl:col-span-9 flex justify-center">
                        <div className="w-full max-w-[794px] rounded-2xl overflow-hidden shadow-2xl shadow-black/40 ring-1 ring-white/8 h-fit">
                            {/* Document tab bar */}
                            <div className="bg-white/5 border-b border-white/8 px-5 py-2 flex items-center gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
                                <span className="ml-2 text-xs text-white/20">optimized_cv.pdf</span>
                            </div>

                            {/* CV body — white paper feel */}
                            <div className="bg-white overflow-x-auto">
                                <div
                                    className="text-zinc-900 mx-auto w-full"
                                    style={{
                                        fontFamily: 'Inter, "Helvetica Neue", Helvetica, Arial, sans-serif',
                                        fontSize: 'min(10.5pt, 2.5vw)',
                                        lineHeight: 1.5,
                                        maxWidth: '794px',
                                        minHeight: 'min(1123px, 140vw)',
                                        padding: '5% 7%',
                                        boxSizing: 'border-box',
                                    }}
                                >
                                    <CVHeader contact={generatedCV.contact} />
                                    <div className="space-y-5 mt-5">
                                        <CVSummary summary={generatedCV.summary} title={titles.summary} />
                                        <CVSkills skills={generatedCV.skills} title={titles.skills} />
                                        <CVExperience experience={generatedCV.experience} title={titles.experience} />
                                        <CVEducation education={generatedCV.education} title={titles.education} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}