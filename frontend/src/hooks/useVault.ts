import { useState, useCallback, useEffect } from 'react';
import { encryptSecret, decryptSecret, EncryptedData } from '@/lib/crypto';

const STORAGE_KEY = 'smartcv_vault';

interface UseVaultResult {
    isLocked: boolean;
    hasVault: boolean;
    saveKey: (apiKey: string, password: string) => Promise<void>;
    unlockVault: (password: string) => Promise<boolean>;
    getKey: () => string | null;
    clearVault: () => void;
    lockVault: () => void;
    error: string | null;
}

// Global in-memory cache for the decrypted key.
// This ensures the key is reset on page refresh.
let memoryKey: string | null = null;
let memoryExpiration: number | null = null;
const CACHE_DURATION_MS = 1000 * 60 * 30; // 30 minutes

export function useVault(): UseVaultResult {
    const [isLocked, setIsLocked] = useState<boolean>(true);
    const [hasVault, setHasVault] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Check if vault exists in storage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        setHasVault(!!stored);

        // Check if key is already in memory and valid
        if (memoryKey && memoryExpiration && Date.now() < memoryExpiration) {
            setIsLocked(false);
        } else {
            // Clear expired or missing key
            memoryKey = null;
            memoryExpiration = null;
            setIsLocked(true);
        }
    }, []);

    const saveKey = useCallback(async (apiKey: string, password: string) => {
        try {
            setError(null);
            const encrypted = await encryptSecret(apiKey, password);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(encrypted));

            // Update memory immediately
            memoryKey = apiKey;
            memoryExpiration = Date.now() + CACHE_DURATION_MS;

            setHasVault(true);
            setIsLocked(false);
        } catch (e: any) {
            setError('Failed to encrypt and save key.');
            console.error(e);
        }
    }, []);

    const unlockVault = useCallback(async (password: string): Promise<boolean> => {
        try {
            setError(null);
            const stored = localStorage.getItem(STORAGE_KEY);
            if (!stored) {
                setError('No vault found.');
                return false;
            }

            const encryptedData: EncryptedData = JSON.parse(stored);
            const decryptedKey = await decryptSecret(encryptedData, password);

            // Verify decrypted key looks reasonable (optional, simplified check)
            if (!decryptedKey) {
                throw new Error("Decrypted empty key");
            }

            memoryKey = decryptedKey;
            memoryExpiration = Date.now() + CACHE_DURATION_MS;
            setIsLocked(false);
            return true;
        } catch (e: any) {
            setError('Incorrect password.');
            memoryKey = null;
            setIsLocked(true);
            return false;
        }
    }, []);

    const getKey = useCallback(() => {
        if (isLocked) return null;
        return memoryKey;
    }, [isLocked]);

    const clearVault = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        memoryKey = null;
        memoryExpiration = null;
        setHasVault(false);
        setIsLocked(true);
        setError(null);
    }, []);

    const lockVault = useCallback(() => {
        memoryKey = null;
        memoryExpiration = null;
        setIsLocked(true);
    }, []);

    return {
        isLocked,
        hasVault,
        saveKey,
        unlockVault,
        getKey,
        clearVault,
        lockVault,
        error,
    };
}
