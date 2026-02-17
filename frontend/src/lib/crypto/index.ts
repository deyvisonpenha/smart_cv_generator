/**
 * Cryptographic utilities using Web Crypto API (AES-GCM + PBKDF2)
 */

export interface EncryptedData {
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  salt: string; // Base64 encoded
}

const ALGORITHM = 'AES-GCM';
const KDF_ALGORITHM = 'PBKDF2';
const HASH = 'SHA-256';
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ITERATIONS = 100000;

// Convert ArrayBuffer to Base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

// Convert Base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const binary_string = window.atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes;
}

// Derive a key from a password and salt
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: KDF_ALGORITHM },
    false,
    ['deriveKey']
  );

  return window.crypto.subtle.deriveKey(
    {
      name: KDF_ALGORITHM,
      salt: salt,
      iterations: ITERATIONS,
      hash: HASH,
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export async function encryptSecret(secret: string, password: string): Promise<EncryptedData> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));

  const key = await deriveKey(password, salt);
  const ciphertext = await window.crypto.subtle.encrypt(
    {
      name: ALGORITHM,
      iv: iv,
    },
    key,
    enc.encode(secret)
  );

  return {
    ciphertext: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv.buffer),
    salt: arrayBufferToBase64(salt.buffer),
  };
}

export async function decryptSecret(encryptedData: EncryptedData, password: string): Promise<string> {
  const salt = base64ToUint8Array(encryptedData.salt);
  const iv = base64ToUint8Array(encryptedData.iv);
  const ciphertext = base64ToUint8Array(encryptedData.ciphertext);

  const key = await deriveKey(password, salt);

  try {
    const decrypted = await window.crypto.subtle.decrypt(
      {
        name: ALGORITHM,
        iv: iv,
      },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    throw new Error('Decryption failed. Incorrect password or corrupted data.');
  }
}
