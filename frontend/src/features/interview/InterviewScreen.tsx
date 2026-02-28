'use client';
import { useState, useRef, useEffect } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { Loader2, Send, Sparkles } from 'lucide-react';
import { ApiClient } from '@/lib/api/client';
import { useVault } from '@/hooks/useVault';

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}

function TypingIndicator() {
    return (
        <div className="flex gap-3 animate-slide-left">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="glass rounded-2xl rounded-tl-none px-4 py-3 flex gap-1.5 items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 dot-1" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 dot-2" />
                <span className="w-1.5 h-1.5 rounded-full bg-white/50 dot-3" />
            </div>
        </div>
    );
}

export function InterviewScreen() {
    const { gaps, addUserAnswer, userAnswers, setGeneratedCV, setStage, setError, cvText, jobDescription, language } = useAppStore();
    const { getKey } = useVault();

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [showTyping, setShowTyping] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
        }
    }, [userAnswers, currentQuestionIndex, showTyping]);

    const currentGap = gaps[currentQuestionIndex];
    const isFinished = currentQuestionIndex >= gaps.length;
    const progress = Math.round((currentQuestionIndex / gaps.length) * 100);

    const handleSendAnswer = () => {
        if (!currentAnswer.trim() || isFinished) return;

        addUserAnswer({ question: currentGap.question, answer: currentAnswer });
        setCurrentAnswer('');

        // Show typing indicator briefly before next question
        setShowTyping(true);
        setTimeout(() => {
            setShowTyping(false);
            setCurrentQuestionIndex(prev => prev + 1);
        }, 900);
    };

    const handleGenerate = async () => {
        try {
            setIsGenerating(true);
            const apiKey = getKey();
            if (!apiKey) console.warn("Generating without API Key — falling back to Local LLM (Ollama)");
            const result = await ApiClient.generateCV(
                cvText,
                jobDescription,
                userAnswers,
                apiKey,
                language
            );
            setGeneratedCV(result);
            setStage('READY');
        } catch (e: any) {
            setError(e.message || 'Failed to generate CV.');
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto flex flex-col gap-4 animate-slide-up">
            {/* Header */}
            <div className="text-center space-y-1">
                <h2 className="text-2xl font-bold text-white">Gap Analysis Interview</h2>
                <p className="text-sm text-white/40">Answer honestly — the AI will use your responses to position your CV strategically.</p>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-white/30">
                    <span>{currentQuestionIndex} of {gaps.length} answered</span>
                    <span>{progress}%</span>
                </div>
                <div className="h-1 rounded-full bg-white/8 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-700 ease-out"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Chat window */}
            <div className="glass rounded-2xl overflow-hidden flex flex-col" style={{ height: '480px' }}>
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-5">
                    {/* History */}
                    {userAnswers.map((ans, i) => (
                        <div key={i} className="space-y-3">
                            {/* AI question */}
                            <div className="flex gap-3 animate-slide-left">
                                <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="glass rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                                    <p className="text-sm text-white/80">{gaps[i].question}</p>
                                </div>
                            </div>
                            {/* User answer */}
                            <div className="flex gap-3 flex-row-reverse animate-slide-right">
                                <div className="w-8 h-8 rounded-full bg-white/8 border border-white/10 flex items-center justify-center shrink-0 text-xs font-bold text-white/50">
                                    You
                                </div>
                                <div className="bg-indigo-600/80 rounded-2xl rounded-tr-none px-4 py-3 max-w-[85%]">
                                    <p className="text-sm text-white">{ans.answer}</p>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {showTyping && <TypingIndicator />}

                    {/* Current question */}
                    {!isFinished && !showTyping && (
                        <div className="flex gap-3 animate-slide-left">
                            <div className="relative w-8 h-8 shrink-0">
                                <div className="absolute inset-0 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-indigo-400" />
                                </div>
                                <div className="absolute inset-0 rounded-full border border-indigo-400/30 animate-ping [animation-duration:2s]" />
                            </div>
                            <div className="space-y-1.5 max-w-[85%]">
                                <div className="glass rounded-2xl rounded-tl-none px-4 py-3">
                                    <p className="text-sm font-medium text-white">{currentGap.question}</p>
                                </div>
                                <p className="text-[11px] text-white/25 ml-2 italic">{currentGap.reasoning}</p>
                            </div>
                        </div>
                    )}

                    {/* Finished */}
                    {isFinished && !showTyping && (
                        <div className="flex flex-col items-center gap-3 py-6 animate-slide-up">
                            <div className="w-14 h-14 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                                <span className="text-2xl">✓</span>
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-white">All questions answered!</p>
                                <p className="text-sm text-white/40">Ready to generate your optimized CV.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Input bar */}
                <div className="border-t border-white/5 p-4 bg-white/2">
                    {!isFinished ? (
                        <div className="flex gap-2">
                            <input
                                type="text"
                                className="flex-1 glass rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/25 outline-none border border-white/8 focus:border-indigo-500/40 focus:bg-indigo-500/5 transition-all"
                                placeholder="Type your answer…"
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSendAnswer()}
                                autoFocus
                                disabled={showTyping}
                            />
                            <button
                                className={cn(
                                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shrink-0',
                                    currentAnswer.trim() && !showTyping
                                        ? 'btn-primary text-white'
                                        : 'bg-white/5 text-white/20 cursor-not-allowed'
                                )}
                                onClick={handleSendAnswer}
                                disabled={!currentAnswer.trim() || showTyping}
                            >
                                <Send className="w-4 h-4" />
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating}
                            className="w-full h-12 rounded-xl btn-primary text-white font-semibold text-sm flex items-center justify-center gap-2"
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Crafting your CV…
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-4 h-4" />
                                    Generate Optimized CV
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
