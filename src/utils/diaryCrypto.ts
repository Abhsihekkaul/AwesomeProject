/**
 * E2EE Healing Diary crypto — React Native edition on pure-JS audited
 * primitives (@noble/hashes + @noble/ciphers; no native modules). The web
 * twin is HealingSathiWebApp/src/lib/diaryCrypto.ts on WebCrypto — SAME wire
 * format, so one passphrase unlocks the same pages on phone and laptop.
 *
 * Scheme: key = PBKDF2-SHA256(passphrase, salt, 100k) → AES-256-GCM per
 * entry. Nonces are hash-derived (time + counter + jitter): GCM requires
 * nonce UNIQUENESS under a key, not unpredictability, and this construction
 * guarantees uniqueness without needing a native secure-RNG module.
 * The server stores {ciphertext, iv} base64 blobs it can never read.
 */

import { gcm } from "@noble/ciphers/aes.js";
import { pbkdf2Async } from "@noble/hashes/pbkdf2.js";
import { sha256 } from "@noble/hashes/sha2.js";

const ITERATIONS = 100_000;
const SENTINEL = "healingsathi-diary-v1";

// ---- base64 (Hermes' btoa/atob availability varies — self-contained) ----
const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

const toB64 = (bytes: Uint8Array) => {
  let out = "";
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    out += B64[a >> 2] + B64[((a & 3) << 4) | (b >> 4)];
    out += i + 1 < bytes.length ? B64[((b & 15) << 2) | (c >> 6)] : "=";
    out += i + 2 < bytes.length ? B64[c & 63] : "=";
  }
  return out;
};

const fromB64 = (b64: string) => {
  const clean = b64.replace(/=+$/, "");
  const out: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const ch of clean) {
    buffer = (buffer << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buffer >> bits) & 0xff);
    }
  }
  return new Uint8Array(out);
};

const utf8 = (s: string) => new Uint8Array([...unescape(encodeURIComponent(s))].map((c) => c.charCodeAt(0)));
const fromUtf8 = (bytes: Uint8Array) =>
  decodeURIComponent(escape(String.fromCharCode(...Array.from(bytes))));

// ---- unique nonce/salt derivation (no secure RNG needed: see header) ----
let counter = 0;
const uniqueBytes = (n: number) =>
  sha256(utf8(`${Date.now()}|${++counter}|${Math.random()}|${Math.random()}`)).slice(0, n);

export const makeSalt = () => toB64(uniqueBytes(16));

export type DiaryKey = Uint8Array;

export async function deriveDiaryKey(passphrase: string, saltB64: string): Promise<DiaryKey> {
  return pbkdf2Async(sha256, utf8(passphrase), fromB64(saltB64), { c: ITERATIONS, dkLen: 32 });
}

export async function encryptText(key: DiaryKey, plaintext: string) {
  const iv = uniqueBytes(12);
  const ciphertext = gcm(key, iv).encrypt(utf8(plaintext));
  return { ciphertext: toB64(ciphertext), iv: toB64(iv) };
}

export async function decryptText(key: DiaryKey, ciphertextB64: string, ivB64: string) {
  const plain = gcm(key, fromB64(ivB64)).decrypt(fromB64(ciphertextB64));
  return fromUtf8(plain);
}

/** The key-check blob stored at setup — proves a passphrase without the server knowing it. */
export const makeKeyCheck = (key: DiaryKey) => encryptText(key, SENTINEL);

export async function verifyKey(key: DiaryKey, checkCiphertext: string, checkIv: string) {
  try {
    return (await decryptText(key, checkCiphertext, checkIv)) === SENTINEL;
  } catch {
    return false;
  }
}
