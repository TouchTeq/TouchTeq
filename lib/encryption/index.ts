/**
 * AES-256-GCM encryption/decryption utilities for API key storage.
 * All operations are server-side only — never expose decrypted keys to the browser.
 */

const ENCRYPTION_KEY_ENV = 'ENCRYPTION_KEY';
const ALGORITHM = 'AES-GCM';
const KEY_USAGE: KeyUsage[] = ['encrypt', 'decrypt'];

function getEncryptionKeyHex(): string {
  const key = process.env[ENCRYPTION_KEY_ENV];
  if (!key) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} environment variable is not set. ` +
        'Generate a 64-character hex string and add it to your environment.'
    );
  }
  if (!/^[0-9a-f]{64}$/i.test(key)) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} must be a 64-character hex string (32 bytes). ` +
        'Generate one with: openssl rand -hex 32'
    );
  }
  return key;
}

function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function getKey(): Promise<CryptoKey> {
  const keyHex = getEncryptionKeyHex();
  const keyBytes = hexToUint8Array(keyHex);
  return crypto.subtle.importKey('raw', keyBytes as any, ALGORITHM, false, KEY_USAGE);
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * Returns { encryptedHex, ivHex } — both must be stored to decrypt later.
 */
export async function encryptValue(plaintext: string): Promise<{ encryptedHex: string; ivHex: string }> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
  const encoder = new TextEncoder();
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv: iv as any },
    key,
    encoder.encode(plaintext)
  );

  return {
    encryptedHex: uint8ArrayToHex(new Uint8Array(encryptedBuffer)),
    ivHex: uint8ArrayToHex(iv),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted hex string back to plaintext.
 */
export async function decryptValue(encryptedHex: string, ivHex: string): Promise<string> {
  const key = await getKey();
  const iv = hexToUint8Array(ivHex);
  const encrypted = hexToUint8Array(encryptedHex);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv: iv as any },
    key,
    encrypted as any
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
