import { create } from 'zustand';
import { encryptSecret, decryptSecret, EncryptedData } from '@/lib/crypto';

interface VaultState {
    isReady: boolean;
    hasVault: boolean;
    isSettingsOpen: boolean;
    error: string | null;

    init: (provider: string) => Promise<void>;
    saveKey: (apiKey: string, provider: string) => Promise<void>;
    getKey: (provider: string) => string | null;
    clearVault: (provider: string) => void;
    setSettingsOpen: (open: boolean) => void;
}

const getStorageKey = (provider: string) => `smartcv_vault_${provider}`;
const getVaultSecret = () =>
    process.env.NEXT_PUBLIC_VAULT_SECRET || 'smartcv-fallback-secret';

let memoryKeys: Record<string, string | null> = {};

export const useVaultStore = create<VaultState>((set) => ({
    isReady: false,
    hasVault: false,
    isSettingsOpen: false,
    error: null,

    init: async (provider: string) => {
        if (typeof window === 'undefined') return;
        const stored = localStorage.getItem(getStorageKey(provider));
        if (!stored) {
            set({ hasVault: false, isReady: false });
            return;
        }
        try {
            const encryptedData: EncryptedData = JSON.parse(stored);
            const key = await decryptSecret(encryptedData, getVaultSecret());
            memoryKeys[provider] = key;
            set({ hasVault: true, isReady: true });
        } catch {
            set({ hasVault: true, isReady: false });
        }
    },

    saveKey: async (apiKey: string, provider: string) => {
        try {
            set({ error: null });
            const encrypted = await encryptSecret(apiKey, getVaultSecret());
            localStorage.setItem(getStorageKey(provider), JSON.stringify(encrypted));
            memoryKeys[provider] = apiKey;
            set({ hasVault: true, isReady: true });
        } catch {
            set({ error: 'Failed to save key.' });
        }
    },

    getKey: (provider: string) => memoryKeys[provider] || null,

    clearVault: (provider: string) => {
        localStorage.removeItem(getStorageKey(provider));
        memoryKeys[provider] = null;
        set({ hasVault: false, isReady: false, error: null });
    },

    setSettingsOpen: (open) => set({ isSettingsOpen: open }),
}));
