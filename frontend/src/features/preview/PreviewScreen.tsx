import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export function PreviewScreen() {
    const { generatedCV, setStage, reset } = useAppStore();
    const cvRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);

    if (!generatedCV) {
        return (
            <div className="text-center p-10">
                <p>No CV generated yet.</p>
                <Button onClick={() => setStage('UPLOAD')} className="mt-4">Start Over</Button>
            </div>
        );
    }

    const handleExport = async () => {
        if (!cvRef.current) return;
        setIsExporting(true);

        const element = cvRef.current;

        const opt = {
            margin: [10, 10, 10, 10] as [number, number, number, number], // top, left, bottom, right in mm
            filename: 'optimized_cv.pdf',
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: {
                scale: 2,
                useCORS: true,
                scrollY: 0,
                windowWidth: 794, // A4 width in px at 96dpi
            },
            jsPDF: {
                unit: 'mm',
                format: 'a4',
                orientation: 'portrait' as const,
            },
            // Tell html2pdf where it's allowed to break pages
            pagebreak: {
                mode: ['avoid-all', 'css', 'legacy'],
                before: '.page-break-before',
                after: '.page-break-after',
                avoid: [
                    'h1', 'h2', 'h3', 'h4',
                    'li',
                    'p',
                    '.avoid-break',
                ],
            },
        };

        try {
            // @ts-ignore
            const html2pdf = (await import('html2pdf.js')).default;
            await html2pdf().set(opt).from(element).save();
        } catch (e) {
            console.error("PDF Export failed", e);
            alert("Failed to export PDF. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            {/*
                Inject global styles for the CV content so html2pdf picks them up.
                These rules prevent elements from being sliced across page boundaries.
            */}
            <style>{`
                .cv-content h1,
                .cv-content h2,
                .cv-content h3,
                .cv-content h4 {
                    page-break-after: avoid;
                    break-after: avoid;
                }

                .cv-content p,
                .cv-content li,
                .cv-content ul,
                .cv-content ol {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }

                /* Keep a heading together with the content that follows it */
                .cv-content h2 + *,
                .cv-content h3 + * {
                    page-break-before: avoid;
                    break-before: avoid;
                }

                /* Prevent orphaned list items */
                .cv-content ul,
                .cv-content ol {
                    page-break-before: avoid;
                    break-before: avoid;
                }

                /* Each top-level section stays as intact as possible */
                .cv-content > section,
                .cv-content > div {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-6 pb-20">
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <h2 className="text-2xl font-bold">Your Optimized CV</h2>
                        <p className="text-sm text-zinc-500">Ready for download.</p>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={reset}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Start New
                        </Button>
                        <Button onClick={handleExport} disabled={isExporting}>
                            <Download className="w-4 h-4 mr-2" />
                            {isExporting ? 'Exporting...' : 'Download PDF'}
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Optimization Report Sidebar */}
                    <div className="lg:col-span-1 space-y-4">
                        <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-900">
                            <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Optimization Report</h3>
                            <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                                {generatedCV.optimization_report}
                            </p>
                        </Card>
                    </div>

                    {/* CV Preview Area */}
                    <div className="lg:col-span-2">
                        <div className="border border-zinc-200 shadow-lg rounded-sm overflow-hidden bg-white">
                            <div className="w-full overflow-x-auto">
                                <div
                                    ref={cvRef}
                                    /*
                                     * cv-content   → targets our page-break CSS rules above
                                     * prose         → ReactMarkdown styling
                                     *
                                     * Width is fixed to A4 (210mm ≈ 794px at 96dpi) so the
                                     * html2canvas snapshot matches the paper width exactly.
                                     * Padding of 20mm on each side leaves 170mm of text width,
                                     * matching a standard A4 document margin.
                                     */
                                    className="cv-content bg-white text-zinc-900 prose prose-sm prose-zinc max-w-none print:shadow-none"
                                    style={{
                                        fontFamily: 'Inter, sans-serif',
                                        width: '794px',          // A4 at 96 dpi
                                        padding: '20mm 20mm',    // standard document margins
                                        boxSizing: 'border-box',
                                        margin: '0 auto',
                                    }}
                                >
                                    <ReactMarkdown>
                                        {generatedCV.markdown_cv}
                                    </ReactMarkdown>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
