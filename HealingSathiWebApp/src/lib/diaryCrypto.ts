/**
 * E2EE Healing Diary crypto — WebCrypto edition (the app's twin is
 * src/utils/diaryCrypto.ts on @noble, same wire format so the SAME account
 * unlocks on phone and laptop with the same passphrase).
 *
 * Scheme: key = PBKDF2-SHA256(passphrase, salt, 100k) → AES-256-GCM per
 * entry with a fresh random 12-byte IV. The server stores {ciphertext, iv}
 * as base64 and can never read a page. Passphrase verification is local:
 * decrypt the stored key-check sentinel and compare.
 */

const ITERATIONS = 100_000;
const SENTINEL = "healingsathi-diary-v1";

const te = new TextEncoder();
const td = new TextDecoder();

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  return btoa(bin);
};
const fromB64 = (b64: string) => Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

export const makeSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)));

export async function deriveDiaryKey(passphrase: string, saltB64: string): Promise<CryptoKey> {
  const material = await crypto.subtle.importKey("raw", te.encode(passphrase), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: fromB64(saltB64) as BufferSource, iterations: ITERATIONS, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(key: CryptoKey, plaintext: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    te.encode(plaintext),
  );
  return { ciphertext: toB64(ciphertext), iv: toB64(iv) };
}

export async function decryptText(key: CryptoKey, ciphertextB64: string, ivB64: string) {
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: fromB64(ivB64) as BufferSource },
    key,
    fromB64(ciphertextB64) as BufferSource,
  );
  return td.decode(plain);
}

/** The key-check blob stored at setup — proves a passphrase without the server knowing it. */
export const makeKeyCheck = (key: CryptoKey) => encryptText(key, SENTINEL);

export async function verifyKey(key: CryptoKey, checkCiphertext: string, checkIv: string) {
  try {
    return (await decryptText(key, checkCiphertext, checkIv)) === SENTINEL;
  } catch {
    return false;
  }
}
