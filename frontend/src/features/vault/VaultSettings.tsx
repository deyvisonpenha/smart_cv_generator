import { useState, useRef, useEffect } from 'react';
import { useVault } from '@/hooks/useVault';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Key, Trash2, ShieldCheck, ShieldAlert, X } from 'lucide-react';
import { cn } from '@/components/ui/card';

export function VaultSettings() {
    const { isLocked, hasVault, saveKey, unlockVault, clearVault, error } = useVault();
    const [password, setPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [isSetupMode, setIsSetupMode] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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
        // Keep open specifically to show success state briefly or close? 
        // Let's close for better UX
        setIsOpen(false);
    };

    const handleSave = async () => {
        if (!password || !apiKey) return;
        await saveKey(apiKey, password);
        setPassword('');
        setApiKey('');
        setIsSetupMode(false);
        setIsOpen(false);
    };

    // Badge Trigger Component
    const VaultBadge = () => {
        if (!hasVault) {
            return (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-300"
                >
                    <div className="w-2 h-2 rounded-full bg-zinc-400 group-hover:bg-zinc-500" />
                    <span>Setup Vault</span>
                </button>
            );
        }

        if (isLocked) {
            return (
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 text-xs font-medium text-amber-700 dark:text-amber-500 hover:bg-amber-100 dark:hover:bg-amber-900/30 transition-all border border-amber-200/50 hover:border-amber-300/50"
                >
                    <Lock className="w-3 h-3" />
                    <span>Locked</span>
                </button>
            );
        }

        return (
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="group flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-xs font-medium text-emerald-700 dark:text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-200/50 hover:border-emerald-300/50"
            >
                <ShieldCheck className="w-3 h-3" />
                <span>Secure</span>
            </button>
        );
    };

    return (
        <div className="relative z-50" ref={containerRef}>
            <VaultBadge />

            {/* Dropdown / Popover Content */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-3 w-80 animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <Card className="p-4 shadow-xl border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                                {hasVault ? (isLocked ? <Lock className="w-4 h-4 text-amber-500" /> : <Unlock className="w-4 h-4 text-emerald-500" />) : <Key className="w-4 h-4 text-zinc-500" />}
                                {hasVault ? (isLocked ? 'Vault Locked' : 'Vault Active') : 'Setup Vault'}
                            </h3>
                            {/* <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setIsOpen(false)}>
                            <X className="w-3 h-3" />
                        </Button> */}
                        </div>

                        {/* Content Logic */}
                        {!hasVault || isSetupMode ? (
                            <div className="space-y-3">
                                {/* Setup Form */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">API Key</label>
                                    <Input
                                        className="h-8 text-sm"
                                        type="password"
                                        placeholder="sk-..."
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Master Password</label>
                                    <Input
                                        className="h-8 text-sm"
                                        type="password"
                                        placeholder="Strong password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                    />
                                </div>
                                <div className="pt-2 flex gap-2">
                                    <Button size="sm" onClick={handleSave} className="w-full h-8">Encrypt & Save</Button>
                                    {hasVault && <Button size="sm" variant="ghost" onClick={() => setIsSetupMode(false)} className="h-8">Cancel</Button>}
                                </div>
                            </div>
                        ) : isLocked ? (
                            <div className="space-y-3">
                                {/* Unlock Form */}
                                <p className="text-xs text-zinc-500 leading-relaxed">
                                    Enter your master password to unlock the Open AI key for this session.
                                </p>
                                <Input
                                    className="h-9"
                                    type="password"
                                    placeholder="Master password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                                />
                                {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
                                <div className="pt-1 flex gap-2">
                                    <Button size="sm" onClick={handleUnlock} className="w-full">Unlock Vault</Button>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-9 w-9 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                        onClick={clearVault}
                                        title="Reset Vault (Clears Key)"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {/* Unlocked State */}
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-lg border border-emerald-100 dark:border-emerald-900/20">
                                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium flex gap-2 items-center">
                                        <ShieldCheck className="w-3 h-3" />
                                        Session Secure
                                    </p>
                                    <p className="text-[10px] text-emerald-600/80 dark:text-emerald-500/80 mt-1">
                                        Your key is decrypted in memory.
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <Button size="sm" variant="outline" onClick={() => window.location.reload()} className="h-8 text-xs">Lock Vault</Button>
                                    <Button size="sm" variant="ghost" onClick={clearVault} className="h-8 text-xs text-red-500 hover:text-red-600 hover:bg-red-50">Reset Key</Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </div>
    );
}
