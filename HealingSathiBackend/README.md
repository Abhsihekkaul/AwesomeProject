# HealingSathiBackend

REST API for **HealingSathi** — a social + mental-health support app (condition-based
support groups, posts with reactions and threaded comments, 1:1 chat, Sathi friend requests,
consultant booking, notifications, and doctor-authored health tips).

**Stack:** Node 20+ · Express 4 · MongoDB (Mongoose 8) · JWT auth (access + rotating refresh
tokens, bcryptjs) · TypeScript via `tsx`.

The React Native app lives in the parent directory and talks to this service with axios
over plain JSON.

## Quick start

```bash
npm install
cp .env.example .env   # optional — dev defaults work
npm run seed           # demo user + content (needs MongoDB running)
npm run dev            # http://localhost:4000  (health check: /health)
```

Demo login: `patient@healingsathi.dev` / `password123`

## Documentation

| File | What's in it |
|---|---|
| [ARCHITECTURE.md](ARCHITECTURE.md) | Architecture, data model, full API reference, roadmap |
| [../run.md](../run.md) | Running frontend + backend together, troubleshooting |
| [DeployeBackend.md](DeployeBackend.md) | Top 3 deployment options + launch checklist |
| [test.md](test.md) | Backend test run & results |
| [checkpoint.md](checkpoint.md) | Session context for future Claude/AI work |

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run seed` | Seed demo data (idempotent) |
| `npm run test:smoke` | End-to-end smoke test against an in-memory MongoDB |
| `npm run typecheck` | TypeScript check |
| `npm run build` / `npm start` | Production build & run |
