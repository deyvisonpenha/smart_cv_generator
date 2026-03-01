import { create } from 'zustand';
import { encryptSecret, decryptSecret, EncryptedData } from '@/lib/crypto';

interface VaultState {
    isLocked: boolean;
    hasVault: boolean;
    isSettingsOpen: boolean;
    error: string | null;

    // Actions
    init: (provider: string) => void;
    saveKey: (apiKey: string, password: string, provider: string) => Promise<void>;
    unlockVault: (password: string, provider: string) => Promise<boolean>;
    getKey: (provider: string) => string | null;
    clearVault: (provider: string) => void;
    lockVault: (provider: string) => void;
    setSettingsOpen: (open: boolean) => void;
}

const getStorageKey = (provider: string) => `smartcv_vault_${provider}`;
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes

// Secure memory storage per provider
let memoryKeys: Record<string, string | null> = {};
let memoryExpirations: Record<string, number | null> = {};

export const useVaultStore = create<VaultState>((set, get) => ({
    isLocked: true,
    hasVault: false,
    isSettingsOpen: false,
    error: null,

    init: (provider: string) => {
        if (typeof window !== 'undefined') {
            const hasVault = !!localStorage.getItem(getStorageKey(provider));
            const isLocked = !memoryKeys[provider];
            set({ hasVault, isLocked });
        }
    },

    saveKey: async (apiKey, password, provider) => {
        try {
            set({ error: null });
            const encrypted = await encryptSecret(apiKey, password);
            localStorage.setItem(getStorageKey(provider), JSON.stringify(encrypted));

            memoryKeys[provider] = apiKey;
            memoryExpirations[provider] = Date.now() + CACHE_DURATION_MS;

            set({ hasVault: true, isLocked: false });
        } catch (e) {
            console.error(e);
            set({ error: 'Failed to encrypt and save key.' });
        }
    },

    unlockVault: async (password, provider) => {
        try {
            set({ error: null });
            const stored = localStorage.getItem(getStorageKey(provider));
            if (!stored) {
                set({ error: 'No vault found for this provider.' });
                return false;
            }

            const encryptedData: EncryptedData = JSON.parse(stored);
            const decryptedKey = await decryptSecret(encryptedData, password);

            if (!decryptedKey) throw new Error("Decrypted empty key");

            memoryKeys[provider] = decryptedKey;
            memoryExpirations[provider] = Date.now() + CACHE_DURATION_MS;

            set({ isLocked: false, error: null });
            return true;
        } catch (e) {
            memoryKeys[provider] = null;
            set({ isLocked: true, error: 'Incorrect password.' });
            return false;
        }
    },

    getKey: (provider: string) => {
        if (memoryKeys[provider] && memoryExpirations[provider] && Date.now() > (memoryExpirations[provider] || 0)) {
            // Expired key safety check
            get().lockVault(provider);
            return null;
        }
        return memoryKeys[provider] || null;
    },

    lockVault: (provider: string) => {
        memoryKeys[provider] = null;
        memoryExpirations[provider] = null;
        set({ isLocked: true });
    },

    clearVault: (provider: string) => {
        localStorage.removeItem(getStorageKey(provider));
        memoryKeys[provider] = null;
        memoryExpirations[provider] = null;
        set({ hasVault: false, isLocked: true, error: null });
    },

    setSettingsOpen: (open) => set({ isSettingsOpen: open })
}));
