import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, Bot, User, CheckCircle2 } from 'lucide-react';
import { ApiClient } from '@/lib/api/client';
import { useVault } from '@/hooks/useVault';

export function InterviewScreen() {
    const { gaps, addUserAnswer, userAnswers, setGeneratedCV, setStage, setError, cvText, jobDescription } = useAppStore();
    const { getKey } = useVault();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [userAnswers, currentQuestionIndex]);

    const currentGap = gaps[currentQuestionIndex];
    const isFinished = currentQuestionIndex >= gaps.length;

    const handleSendAnswer = () => {
        if (!currentAnswer.trim()) return;

        addUserAnswer({
            question: currentGap.question,
            answer: currentAnswer
        });

        setCurrentAnswer('');
        setCurrentQuestionIndex(prev => prev + 1);
    };

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            const apiKey = getKey();
            const result = await ApiClient.generateCV(cvText, jobDescription, userAnswers, apiKey);
            setGeneratedCV(result);
            setStage("READY");
        } catch (e: any) {
            setError(e.message || "Failed to generate CV.");
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto h-[600px] flex flex-col">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Gap Analysis Interview</h2>
                <p className="text-zinc-500">Help the AI understand your missing skills to optimize your CV.</p>
            </div>

            <Card className="flex-1 flex flex-col overflow-hidden bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-sm">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6" ref={scrollRef}>
                    {/* History */}
                    {userAnswers.map((ans, i) => (
                        <div key={i} className="space-y-4">
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                    <Bot className="w-5 h-5" />
                                </div>
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700 max-w-[85%]">
                                    <p className="text-sm">{gaps[i].question}</p>
                                </div>
                            </div>
                            <div className="flex gap-3 flex-row-reverse">
                                <div className="w-8 h-8 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center shrink-0">
                                    <User className="w-5 h-5" />
                                </div>
                                <div className="bg-zinc-900 text-zinc-50 dark:bg-zinc-50 dark:text-zinc-900 p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[85%]">
                                    <p className="text-sm">{ans.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Current Question */}
                    {!isFinished && (
                        <div className="flex gap-3 animate-in fade-in slide-in-from-left-4 duration-300">
                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div className="space-y-2 max-w-[85%]">
                                <div className="bg-white dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-none shadow-sm border border-zinc-100 dark:border-zinc-700">
                                    <p className="text-sm font-medium">{currentGap.question}</p>
                                </div>
                                <p className="text-xs text-zinc-500 ml-2 italic">Context: {currentGap.context}</p>
                            </div>
                        </div>
                    )}

                    {/* Finished State */}
                    {isFinished && (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 animate-in zoom-in-95 duration-500">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="w-8 h-8" />
                            </div>
                            <h3 className="text-lg font-medium">Interview Complete!</h3>
                            <p className="text-sm text-zinc-500 text-center max-w-xs">
                                We have everything we need to generate your optimized CV.
                            </p>
                        </div>
                    )}
                </div>

                {/* Input Area */}
                <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
                    {!isFinished ? (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Type your answer..."
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
                                autoFocus
                            />
                            <Button
                                size="icon"
                                onClick={handleSendAnswer}
                                disabled={!currentAnswer.trim()}
                            >
                                <Send className="w-4 h-4" />
                            </Button>
                        </div>
                    ) : (
                        <Button
                            size="lg"
                            className="w-full"
                            onClick={handleGenerate}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Generating Optimized CV...
                                </>
                            ) : (
                                "Generate CV"
                            )}
                        </Button>
                    )}
                </div>
            </Card>

            <div className="text-center mt-4">
                <p className="text-xs text-zinc-400">
                    {currentQuestionIndex} of {gaps.length} questions answered
                </p>
            </div>
        </div>
    );
}
