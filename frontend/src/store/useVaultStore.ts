import { create } from 'zustand';
import { encryptSecret, decryptSecret, EncryptedData } from '@/lib/crypto';

interface VaultState {
    isLocked: boolean;
    hasVault: boolean;
    isSettingsOpen: boolean;
    error: string | null;

    // Actions
    init: () => void;
    saveKey: (apiKey: string, password: string) => Promise<void>;
    unlockVault: (password: string) => Promise<boolean>;
    getKey: () => string | null;
    clearVault: () => void;
    lockVault: () => void;
    setSettingsOpen: (open: boolean) => void;
}

const STORAGE_KEY = 'smartcv_vault';
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes

// Secure memory storage (outside Zustand state to prevent exposure in devtools)
let memoryKey: string | null = null;
let memoryExpiration: number | null = null;

export const useVaultStore = create<VaultState>((set, get) => ({
    isLocked: true,
    hasVault: false,
    isSettingsOpen: false,
    error: null,

    init: () => {
        if (typeof window !== 'undefined') {
            const hasVault = !!localStorage.getItem(STORAGE_KEY);
            set({ hasVault });
        }
    },

    saveKey: async (apiKey, password) => {
        try {
            set({ error: null });
            const encrypted = await encryptSecret(apiKey, password);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));

            memoryKey = apiKey;
            memoryExpiration = Date.now() + CACHE_DURATION_MS;

            set({ hasVault: true, isLocked: false });
        } catch (e) {
            console.error(e);
            set({ error: 'Failed to encrypt and save key.' });
        }
    },

    unlockVault: async (password) => {
        try {
            set({ error: null });
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                set({ error: 'No vault found.' });
                return false;
            }

            const encryptedData: EncryptedData = JSON.parse(stored);
            const decryptedKey = await decryptSecret(encryptedData, password);

            if (!decryptedKey) throw new Error("Decrypted empty key");

            memoryKey = decryptedKey;
            memoryExpiration = Date.now() + CACHE_DURATION_MS;

            set({ isLocked: false, error: null });
            return true;
        } catch (e) {
            memoryKey = null;
            set({ isLocked: true, error: 'Incorrect password.' });
            return false;
        }
    },

    getKey: () => {
        const { isLocked } = get();
        if (isLocked) return null;
        if (memoryKey && memoryExpiration && Date.now() > memoryExpiration) {
            // Expired key safety check
            get().lockVault();
            return null;
        }
        return memoryKey;
    },

    lockVault: () => {
        memoryKey = null;
        memoryExpiration = null;
        set({ isLocked: true });
    },

    clearVault: () => {
        localStorage.removeItem(STORAGE_KEY);
        memoryKey = null;
        memoryExpiration = null;
        set({ hasVault: false, isLocked: true, error: null });
    },

    setSettingsOpen: (open) => set({ isSettingsOpen: open })
}));
