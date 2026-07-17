# HealingSathi

A React Native community app for people living with chronic illness — support groups,
a social feed formed by your connections ("Sathis"), 1:1 chats, verified consultants,
and doctor-reviewed health tips. Ships with its own Express + MongoDB backend in
`HealingSathiBackend/`.

## Quick start

```bash
# 1. Backend (terminal 1) — needs MongoDB (local or Atlas via HealingSathiBackend/.env)
cd HealingSathiBackend
npm install
npm run seed        # demo account + community content (idempotent)
npm run dev         # http://localhost:4000

# 2. App (terminal 2)
npm install
npm start           # Metro
npm run ios         # or: npm run android
```

Demo login: `patient@healingsathi.dev` / `password123`.
Full run instructions (simulators, Atlas, troubleshooting): **run.md**.

## The demo-mode contract

- **Signed out ("Try the Demo")** — the app renders built-in dummy data on every screen.
  No backend needed; safe to demo anywhere.
- **Signed in** — only real backend data. A fresh account sees honest empty states.
  Implemented in one place: `src/hooks/useLiveOrDemo.ts` (also handles refetch-on-focus
  and optional polling, so new content appears without restarting screens).

## Features

| Area | What works |
|---|---|
| Auth | Sign up / sign in (JWT + rotating refresh tokens), forgot password (emailed code), change email & password, session restore, per-device sign-out |
| Feed | Formed by your social graph: your posts + your Sathis' posts + your groups. Pull-to-refresh + 20s polling |
| People | Search users, send Sathi requests, accept/decline, block/unblock (enforced across chat, search and requests) |
| Groups | Directory, join/leave, group feeds, propose a new group (moderated) |
| Chats | 1:1 conversations (REST polling; sockets on the roadmap) |
| Consultants | Directory, profiles, booking; "Join as a consultant" application flow (medical-team review) |
| Settings | Edit profile, change email/password, blocked users, language, light/dark/system theme |
| Health tips | Doctor-published tips filtered by condition |

## Repository layout

```
src/                    React Native app (features/, components/ui/, api/, hooks/, theme/)
HealingSathiBackend/    Express + Mongoose + JWT API (see its ARCHITECTURE.md)
pendingTask.md          Live task tracker for the current work cycle
FinalCheckpoint.md      Product-level checkpoint + launch/moderation plan
```

## Verification

- App: `npx tsc --noEmit` · `npx jest` · `npx eslint src`
- Backend: `npm run typecheck` · `npm run test:smoke` (69 end-to-end checks over real
  HTTP against an in-memory MongoDB — no mocks)

## Docs

- `run.md` — how to run everything locally
- `HealingSathiBackend/ARCHITECTURE.md` — API + data model reference
- `HealingSathiBackend/DeployeBackend.md` — deployment guide (Render recommended)
- `FinalCheckpoint.md` — current product state and roadmap
