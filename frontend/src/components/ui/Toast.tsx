'use client';
import { useEffect, useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ToastProps {
    message: string;
    onClose: () => void;
    duration?: number;
}

export function Toast({ message, onClose, duration = 5000 }: ToastProps) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            handleClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(onClose, 300); // Wait for animation
    };

    return (
        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4 pointer-events-none`}>
            <div
                className={`
                    pointer-events-auto
                    flex items-center gap-3 p-4 rounded-2xl
                    bg-[#1a0a0a]/90 backdrop-blur-xl border border-red-500/20 shadow-2xl shadow-red-500/10
                    animate-slide-down
                    ${isExiting ? 'animate-slide-up-out' : ''}
                `}
            >
                <div className="w-8 h-8 rounded-xl bg-red-500/20 flex items-center justify-center shrink-0">
                    <AlertCircle className="w-5 h-5 text-red-400" />
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white/90 leading-tight">
                        {message}
                    </p>
                </div>

                <button
                    onClick={handleClose}
                    className="p-1 rounded-lg hover:bg-white/5 text-white/20 hover:text-white transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}
