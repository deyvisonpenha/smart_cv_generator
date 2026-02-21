'use client';
import { useState, useRef, useEffect } from 'react';
import { useVault } from '@/hooks/useVault';
import { Lock, Unlock, Key, Trash2, ShieldCheck } from 'lucide-react';

function cn(...classes: (string | undefined | false)[]) {
    return classes.filter(Boolean).join(' ');
}

const inputClass = cn(
    'w-full rounded-xl glass px-3.5 py-2.5 text-sm text-white placeholder:text-white/25 outline-none',
    'border border-white/8 focus:border-indigo-500/50 focus:bg-indigo-500/5 transition-all duration-200'
);

export function VaultSettings() {
    const { isLocked, hasVault, saveKey, unlockVault, clearVault, error, init } = useVault();
    const [password, setPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => { init(); }, [init]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setIsSetupMode(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleUnlock = async () => {
        await unlockVault(password);
        setPassword('');
        setIsOpen(false);
    };

    const handleSave = async () => {
        if (!password || !apiKey) return;
        await saveKey(apiKey, password);
        setPassword(''); setApiKey('');
        setIsSetupMode(false); setIsOpen(false);
    };

    // Badge
    const badge = !hasVault ? (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full glass border border-white/8 text-xs font-medium text-white/50 hover:text-white hover:border-white/20 transition-all"
        >
            <Key className="w-3 h-3" />
            Setup Vault
        </button>
    ) : isLocked ? (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-xs font-medium text-amber-400 hover:bg-amber-500/15 transition-all"
        >
            <Lock className="w-3 h-3" />
            Locked
        </button>
    ) : (
        <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400 hover:bg-emerald-500/15 transition-all"
        >
            <ShieldCheck className="w-3 h-3" />
            Secure
        </button>
    );

    return (
        <div className="relative z-50" ref={containerRef}>
            {badge}

            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-76 origin-top-right animate-in fade-in zoom-in-95 duration-200">
                    <div className="glass-strong rounded-2xl p-5 shadow-2xl shadow-black/50 w-72">
                        {/* Header */}
                        <div className="flex items-center gap-2 mb-4">
                            {hasVault
                                ? isLocked
                                    ? <Lock className="w-4 h-4 text-amber-400" />
                                    : <Unlock className="w-4 h-4 text-emerald-400" />
                                : <Key className="w-4 h-4 text-white/40" />
                            }
                            <h3 className="text-sm font-semibold text-white">
                                {hasVault ? (isLocked ? 'Vault Locked' : 'Vault Active') : 'Setup Vault'}
                            </h3>
                        </div>

                        {/* Forms */}
                        {!hasVault || isSetupMode ? (
                            <div className="space-y-3">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">OpenAI API Key</label>
                                    <input className={inputClass} type="password" placeholder="sk-..." value={apiKey} onChange={e => setApiKey(e.target.value)} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-medium text-white/30 uppercase tracking-wider">Master Password</label>
                                    <input className={inputClass} type="password" placeholder="Strong password" value={password} onChange={e => setPassword(e.target.value)} />
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button
                                        onClick={handleSave}
                                        disabled={!password || !apiKey}
                                        className="flex-1 h-9 rounded-xl btn-primary text-white text-sm font-medium disabled:opacity-40"
                                    >
                                        Encrypt &amp; Save
                                    </button>
                                    {hasVault && (
                                        <button onClick={() => setIsSetupMode(false)} className="px-3 h-9 rounded-xl text-sm text-white/40 hover:text-white border border-white/8 hover:border-white/20 transition-all">
                                            Cancel
                                        </button>
                                    )}
                                </div>
                            </div>
                        ) : isLocked ? (
                            <div className="space-y-3">
                                <p className="text-xs text-white/40 leading-relaxed">
                                    Enter your master password to unlock the API key for this session.
                                </p>
                                <input
                                    className={inputClass}
                                    type="password"
                                    placeholder="Master password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleUnlock()}
                                    autoFocus
                                />
                                {error && <p className="text-xs text-red-400 font-medium">{error}</p>}
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleUnlock}
                                        className="flex-1 h-9 rounded-xl btn-primary text-white text-sm font-medium"
                                    >
                                        Unlock
                                    </button>
                                    <button
                                        onClick={clearVault}
                                        title="Reset vault"
                                        className="w-9 h-9 rounded-xl border border-red-500/20 text-red-400/60 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 transition-all flex items-center justify-center"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="p-3 bg-emerald-500/8 rounded-xl border border-emerald-500/20 flex items-start gap-2">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-medium text-emerald-400">Session Secure</p>
                                        <p className="text-[11px] text-emerald-400/60 mt-0.5">Key is decrypted in memory only.</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="h-9 rounded-xl border border-white/8 text-xs text-white/50 hover:text-white hover:border-white/20 transition-all"
                                    >
                                        Lock Vault
                                    </button>
                                    <button
                                        onClick={clearVault}
                                        className="h-9 rounded-xl border border-red-500/15 text-xs text-red-400/60 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/8 transition-all"
                                    >
                                        Reset Key
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
