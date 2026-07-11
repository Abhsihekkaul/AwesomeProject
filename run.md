# Running HealingSathi — frontend + backend together

Three terminals, in this order. (One-time setup first.)

---

## 0. One-time setup

```bash
# 1) MongoDB (macOS, Homebrew) — skip if you already run Mongo or use Atlas
brew tap mongodb/brew
brew install mongodb-community

# 2) Backend deps
cd HealingSathiBackend
npm install
cp .env.example .env        # optional — dev defaults work without it

# 3) Frontend deps (repo root)
cd ..
npm install
cd ios && pod install && cd ..   # iOS native modules
```

> **Using MongoDB Atlas instead of local Mongo?** Put your connection string in
> `HealingSathiBackend/.env` as `MONGODB_URI=mongodb+srv://...` and skip step 1.

---

## 1. Terminal A — MongoDB

```bash
brew services start mongodb-community   # runs in the background; do this once per boot
```

## 2. Terminal B — Backend API

```bash
cd HealingSathiBackend
npm run seed    # first time only: demo user + content
npm run dev     # → ✓ HealingSathi API listening on http://localhost:4000
```

Confirm it's alive: `curl http://localhost:4000/health`

## 3. Terminal C — the app

```bash
npm run ios       # or: npm run android
```

Sign in with the seeded demo account:

| Email | Password |
|---|---|
| `patient@healingsathi.dev` | `password123` |

---

## Demo mode (no backend needed)

Showing the app to people without running anything? Just launch the app and tap
**“Try the Demo”** on the auth screen — every screen runs on built-in local data.
Real sign-in/sign-up requires the backend + Mongo to be up.

## What's live vs. local right now

- **Live against the backend:** sign up, sign in, session restore, sign out.
- **Local (dummy data) by design:** feeds, groups, chats, notifications, bookings, tips —
  so demos never break. Every endpoint is already written and typed in
  `src/api/resourcesApi.ts`; flipping a screen to live data is a ~4-line `useEffect`
  (example at the top of that file). Endpoint reference:
  `HealingSathiBackend/ARCHITECTURE.md`.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Backend prints “Could not connect to MongoDB” | `brew services start mongodb-community` (or check your Atlas URI in `.env`) |
| App says “Can't reach the server” on sign-in | Backend not running → Terminal B; on Android emulator the app auto-uses `10.0.2.2` |
| “Invalid email or password” for the demo user | Run `npm run seed` in HealingSathiBackend |
| iOS build errors about missing modules | `cd ios && pod install`, then rebuild |
| Deploying for launch | See `HealingSathiBackend/DeployeBackend.md` |
