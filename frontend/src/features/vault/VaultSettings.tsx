import { useState } from 'react';
import { useVault } from '@/hooks/useVault';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, Key, Trash2 } from 'lucide-react';

export function VaultSettings() {
    const { isLocked, hasVault, saveKey, unlockVault, clearVault, error } = useVault();
    const [password, setPassword] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [isSetupMode, setIsSetupMode] = useState(false);

    const handleUnlock = async () => {
        await unlockVault(password);
        setPassword('');
    };

    const handleSave = async () => {
        if (!password || !apiKey) return;
        await saveKey(apiKey, password);
        setPassword('');
        setApiKey('');
        setIsSetupMode(false);
    };

    if (!hasVault && !isSetupMode) {
        return (
            <Card className="p-6 max-w-md mx-auto text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center">
                    <Key className="w-6 h-6 text-zinc-500" />
                </div>
                <h2 className="text-xl font-semibold">Secure API Key Vault</h2>
                <p className="text-sm text-zinc-500">
                    Your API key is required for production mode. It will be encrypted with a master password and stored locally.
                    We never see your key.
                </p>
                <Button onClick={() => setIsSetupMode(true)}>Setup Vault</Button>
            </Card>
        );
    }

    if (isSetupMode) {
        return (
            <Card className="p-6 max-w-md mx-auto space-y-4">
                <h2 className="text-xl font-semibold">Setup New Vault</h2>
                <div className="space-y-2">
                    <label className="text-sm font-medium">OpenAI API Key</label>
                    <Input
                        type="password"
                        placeholder="sk-..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Master Password</label>
                    <Input
                        type="password"
                        placeholder="Strong password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <Button onClick={handleSave} className="w-full">Encrypt & Save</Button>
                    <Button variant="ghost" onClick={() => setIsSetupMode(false)}>Cancel</Button>
                </div>
            </Card>
        )
    }

    if (isLocked) {
        return (
            <Card className="p-6 max-w-md mx-auto space-y-4">
                <div className="flex items-center gap-2 text-amber-600">
                    <Lock className="w-5 h-5" />
                    <h2 className="font-semibold">Vault Locked</h2>
                </div>
                <p className="text-sm text-zinc-500">Enter your master password to unlock the API key for this session.</p>
                <Input
                    type="password"
                    placeholder="Master password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                />
                {error && <p className="text-xs text-red-500">{error}</p>}
                <div className="flex gap-2">
                    <Button onClick={handleUnlock} className="w-full">Unlock</Button>
                    <Button variant="destructive" size="icon" onClick={clearVault} title="Reset Vault"><Trash2 className="w-4 h-4" /></Button>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 max-w-md mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-green-600">
                <Unlock className="w-5 h-5" />
                <div>
                    <h3 className="font-medium">Vault Unlocked</h3>
                    <p className="text-xs text-zinc-500">Key is ready for use in memory.</p>
                </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>Lock</Button>
        </Card>
    );
}
