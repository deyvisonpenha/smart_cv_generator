'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useVault } from '@/hooks/useVault';
import { useAppStore } from '@/store/useAppStore';
import { Key, Trash2, ShieldCheck, X } from 'lucide-react';

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}

const inputClass = [
    'w-full rounded-xl px-4 py-3 text-sm text-white placeholder:text-white/25 outline-none',
    'bg-[#1a1a24] border border-white/10 focus:border-indigo-500/60 focus:bg-indigo-500/5 transition-all duration-200',
].join(' ');

export function VaultSettings() {
    const { isReady, hasVault, saveKey, clearVault, error, init, isSettingsOpen, setSettingsOpen } = useVault();
    const { provider, setProvider } = useAppStore();
    const [apiKey, setApiKey] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => { init(provider); }, [init, provider]);
    useEffect(() => { setMounted(true); }, []);

    // Close on Escape
    useEffect(() => {
        if (!isSettingsOpen) return;
        const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [isSettingsOpen]);

    const open = () => setSettingsOpen(true);
    const close = () => { setSettingsOpen(false); setApiKey(''); };

    const handleSave = async () => {
        if (provider !== 'ollama' && !apiKey) return;
        const keyToSave = provider === 'ollama' ? 'ollama-placeholder' : apiKey;
        await saveKey(keyToSave, provider);
        setApiKey('');
        close();
    };

    const handleClear = () => clearVault(provider);

    // ── Badge trigger ───────────────────────────────────────────
    const badge = (provider === 'ollama') ? (
        <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-400">
            <ShieldCheck className="w-3 h-3" />
            Local Model
        </button>
    ) : isReady ? (
        <button
            onClick={open}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 hover:bg-emerald-500/15 transition-all"
        >
            <ShieldCheck className="w-3 h-3" />
            Active
        </button>
    ) : (
        <button
            onClick={open}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/50 hover:text-white hover:border-white/20 transition-all"
        >
            <Key className="w-3 h-3" />
            Setup Vault
        </button>
    );

    const providerOptions = [
        { id: 'openai', label: 'OpenAI', placeholder: 'sk-...' },
        { id: 'gemini', label: 'Gemini', placeholder: 'AIza...' },
        { id: 'ollama', label: 'Local (Ollama)', placeholder: '' },
    ];

    const activeOption = providerOptions.find(o => o.id === provider) || providerOptions[0];

    // ── Modal (portal) ──────────────────────────────────────────
    const modal = isSettingsOpen && mounted && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            {/* Backdrop */}
            <div
                onClick={close}
                style={{ position: 'absolute', inset: 0, background: 'rgba(8, 8, 12, 0.96)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            />

            {/* Panel */}
            <div style={{ position: 'relative', width: '100%', maxWidth: '460px', background: '#0f0f17', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px', boxShadow: '0 25px 60px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)', overflow: 'hidden' }}>

                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', isReady ? 'bg-emerald-500/15' : 'bg-indigo-500/15')}>
                            {isReady
                                ? <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                : <Key className="w-5 h-5 text-indigo-400" />
                            }
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#fff' }}>
                                {isReady ? 'API Key Active' : 'Setup API Key'}
                            </h2>
                            <p style={{ margin: '2px 0 0', fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                                {isReady
                                    ? `Your ${activeOption.label} key is saved and ready`
                                    : 'Your key is encrypted and stored locally in your browser'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={close}
                        style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.06)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.3)'; (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '20px 24px 24px' }}>
                    {isReady ? (
                        /* ── Active state ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '16px', borderRadius: '12px', background: 'rgba(16,185,129,0.07)', border: '1px solid rgba(16,185,129,0.18)' }}>
                                <ShieldCheck size={16} style={{ color: '#34d399', marginTop: 2, flexShrink: 0 }} />
                                <div>
                                    <p style={{ margin: 0, fontSize: '13px', fontWeight: 500, color: '#34d399' }}>Ready</p>
                                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: 'rgba(52,211,153,0.55)', lineHeight: 1.5 }}>
                                        Your {activeOption.label} key is active and persists across sessions.
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClear}
                                style={{ height: '44px', borderRadius: '12px', border: '1px solid rgba(239,68,68,0.2)', background: 'transparent', color: 'rgba(239,68,68,0.6)', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,0.08)'; (e.currentTarget as HTMLButtonElement).style.color = '#f87171'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = 'rgba(239,68,68,0.6)'; }}
                            >
                                <Trash2 size={15} />
                                Remove Key
                            </button>
                        </div>
                    ) : (
                        /* ── Setup state ── */
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {/* Provider Selector */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Model Provider</label>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '4px', background: '#1a1a24', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    {providerOptions.map(opt => (
                                        <button
                                            key={opt.id}
                                            onClick={() => setProvider(opt.id)}
                                            style={{
                                                padding: '8px 4px',
                                                borderRadius: '8px',
                                                fontSize: '11px',
                                                fontWeight: 500,
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                background: provider === opt.id ? 'rgba(99,102,241,0.15)' : 'transparent',
                                                color: provider === opt.id ? '#818cf8' : 'rgba(255,255,255,0.4)',
                                                border: '1px solid',
                                                borderColor: provider === opt.id ? 'rgba(99,102,241,0.3)' : 'transparent',
                                            }}
                                        >
                                            {opt.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {provider !== 'ollama' && (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <label style={{ fontSize: '11px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                                        {activeOption.label} API Key
                                    </label>
                                    <input
                                        className={inputClass}
                                        type="password"
                                        placeholder={activeOption.placeholder}
                                        value={apiKey}
                                        onChange={e => setApiKey(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSave()}
                                        autoFocus
                                    />
                                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.2)', lineHeight: 1.5, margin: 0 }}>
                                        Encrypted with AES-GCM and stored only in your browser. Never sent to our servers.
                                    </p>
                                </div>
                            )}

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', flexShrink: 0 }} />
                                    <p style={{ margin: 0, fontSize: '12px', color: '#f87171' }}>{error}</p>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={provider !== 'ollama' && !apiKey}
                                className="btn-primary"
                                style={{ height: '44px', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: (provider !== 'ollama' && !apiKey) ? 'not-allowed' : 'pointer', opacity: (provider !== 'ollama' && !apiKey) ? 0.4 : 1 }}
                            >
                                {provider === 'ollama' ? 'Save Settings' : 'Save API Key'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );

    return (
        <>
            {badge}
            {modal}
        </>
    );
}
