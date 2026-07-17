// Mirrors the RN app's src/api/config.ts — same backend, same endpoints.
// Local dev: HealingSathiBackend on port 4000. Production values come from env
// (NEXT_PUBLIC_* vars are baked in at build time).

const API_HOST = process.env.NEXT_PUBLIC_API_HOST ?? "http://localhost:4000";

// REST base — every endpoint lives under /api (see HealingSathiBackend/ARCHITECTURE.md).
export const API_URL = `${API_HOST}/api`;

// Socket.io origin (live chat, calls, notification nudges) — same server, no /api prefix.
export const SOCKET_URL = API_HOST;

// Google Sign-In WEB OAuth client id (console.cloud.google.com → Credentials).
// Empty = the Google button explains what's missing instead of breaking.
// The same id must be in the backend's GOOGLE_CLIENT_IDS. See GoogleSignInSetup.md.
export const GOOGLE_WEB_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? "";
