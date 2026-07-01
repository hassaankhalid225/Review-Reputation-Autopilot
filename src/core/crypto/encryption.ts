/**
 * AES-256-GCM encryption for secrets at rest (Google OAuth refresh tokens).
 * Uses Web Crypto (edge-compatible). The key comes from TOKEN_ENCRYPTION_KEY
 * (32 bytes, hex or base64). Output format: base64(iv).base64(ciphertext+tag).
 */
import "server-only";
import { getServerConfig } from "@/core/config/env";

function decodeKey(raw: string): Uint8Array {
  // Accept 64-char hex or base64 of a 32-byte key.
  if (/^[0-9a-fA-F]{64}$/.test(raw)) {
    const bytes = new Uint8Array(32);
    for (let i = 0; i < 32; i++) bytes[i] = parseInt(raw.slice(i * 2, i * 2 + 2), 16);
    return bytes;
  }
  return Uint8Array.from(atob(raw), (c) => c.charCodeAt(0));
}

async function getKey(): Promise<CryptoKey> {
  const { TOKEN_ENCRYPTION_KEY } = getServerConfig();
  if (!TOKEN_ENCRYPTION_KEY) throw new Error("TOKEN_ENCRYPTION_KEY is required to encrypt OAuth tokens.");
  const keyBytes = decodeKey(TOKEN_ENCRYPTION_KEY);
  if (keyBytes.byteLength !== 32) throw new Error("TOKEN_ENCRYPTION_KEY must be 32 bytes.");
  return crypto.subtle.importKey("raw", keyBytes as BufferSource, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

const b64 = (b: ArrayBuffer | Uint8Array) =>
  btoa(String.fromCharCode(...new Uint8Array(b instanceof Uint8Array ? b.buffer : b)));
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function encryptSecret(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plaintext));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const key = await getKey();
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) throw new Error("Malformed encrypted payload.");
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: fromB64(ivB64) }, key, fromB64(ctB64));
  return new TextDecoder().decode(pt);
}
