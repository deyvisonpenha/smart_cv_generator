import { useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw, ArrowLeft } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
// html2pdf.js will be imported dynamically to avoid SSR issues

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

        // Configuration for html2pdf
        // Optimized for A4 paper
        const opt = {
            margin: [10, 10, 10, 10], // top, left, bottom, right in mm
            filename: 'optimized_cv.pdf',
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true, logging: false },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
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

                    <div className="text-xs text-zinc-400 px-2">
                        <p>Tip: You can edit the markdown below manually if needed before exporting? (Future feature)</p>
                    </div>
                </div>

                {/* CV Preview Area (A4 Aspect Ratio approx) */}
                <div className="lg:col-span-2">
                    <div className="border border-zinc-200 shadow-lg rounded-sm overflow-hidden bg-white">
                        {/* Aspect Ratio Container for A4 */}
                        <div className="w-full overflow-x-auto">
                            <div
                                ref={cvRef}
                                className="bg-white text-zinc-900 p-[20mm] min-h-[297mm] w-full max-w-[210mm] mx-auto prose prose-sm prose-zinc max-w-none print:shadow-none"
                                style={{
                                    fontFamily: 'Inter, sans-serif' // Should match imported font
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
    );
}
