'use client';
import { createPortal } from 'react-dom';
import { Info, Lock, ArrowRight, X } from 'lucide-react';
import { useEffect, useState } from 'react';

interface LocalLLMWarningProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue: () => void;
    onUnlock: () => void;
}

export function LocalLLMWarning({ isOpen, onClose, onContinue, onUnlock }: LocalLLMWarningProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isOpen, onClose]);

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '1rem',
            }}
        >
            {/* Backdrop */}
            <div
                onClick={onClose}
                style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(8, 8, 12, 0.96)',
                    backdropFilter: 'blur(8px)',
                    WebkitBackdropFilter: 'blur(8px)',
                }}
            />

            {/* Panel */}
            <div
                style={{
                    position: 'relative',
                    width: '100%',
                    maxWidth: '440px',
                    background: '#0f0f17',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '24px',
                    boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
                    overflow: 'hidden',
                }}
                className="animate-in fade-in zoom-in duration-200"
            >
                {/* Header */}
                <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{
                            width: '44px',
                            height: '44px',
                            borderRadius: '12px',
                            background: 'rgba(99, 102, 241, 0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                        }}>
                            <Info className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600, color: '#fff' }}>Local LLM Active</h2>
                            <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
                                Your Vault is currently locked.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '4px' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.2)'}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px 28px' }}>
                    <div style={{
                        background: '#1a1a24',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: '16px',
                        padding: '16px',
                        marginBottom: '24px'
                    }}>
                        <p style={{ margin: 0, fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            Without your API key, we will use a <strong>local AI model (Ollama)</strong>.
                        </p>
                        <p style={{ margin: '12px 0 0', fontSize: '14px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.6 }}>
                            This keeps your data private but is <strong>significantly slower</strong> and may be less precise than cloud models.
                        </p>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <button
                            onClick={onUnlock}
                            className="btn-primary"
                            style={{
                                height: '48px',
                                borderRadius: '14px',
                                border: 'none',
                                color: '#fff',
                                fontSize: '14px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                        >
                            <Lock size={16} />
                            Unlock Vault for Speed
                        </button>
                        <button
                            onClick={onContinue}
                            style={{
                                height: '48px',
                                borderRadius: '14px',
                                border: '1px solid rgba(255,255,255,0.08)',
                                background: 'rgba(255,255,255,0.02)',
                                color: 'rgba(255,255,255,0.6)',
                                fontSize: '14px',
                                fontWeight: 500,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '8px'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                e.currentTarget.style.color = '#fff';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                            }}
                        >
                            Continue with Local LLM
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
}
