# 4 · Launch, Deploy, Capacity & The Scaling Ladder

## A. Run everything locally (dev)

```bash
# 1. Backend  (needs Mongo reachable — Atlas IP whitelisted OR local mongod)
cd HealingSathiBackend
cp .env.example .env        # fill MONGODB_URI, JWT secrets; SMTP/Google optional
npm install
npm run seed                # demo + admin accounts, groups, posts
npm run dev                 # → http://localhost:4000  (health: /health)
npm run test:smoke          # 117 end-to-end checks on an in-memory Mongo (no .env needed)

# 2. App
cd ..
npm install
cd ios && pod install && cd .. 
npm run ios                 # or: npm run android
```
Point the app at your machine: `src/api/config.ts` (`BASE_URL` / `SOCKET_URL`) — a physical phone needs your Mac's LAN IP, not `localhost`.

**Logins after seed:** `patient@healingsathi.dev / password123` (demo user) · `admin@healingsathi.dev / password123` (Settings → ADMIN → Review queue).

## B. Deploy the backend (production)

The code is already deploy-ready: `trust proxy` set, `/health` reports DB state for platform health checks, graceful SIGTERM shutdown, CORS allowlist via env, rate limits per-IP.

**Recommended path — Render or Railway (simplest that works):**
1. Push the repo to GitHub; create a Web Service from `HealingSathiBackend/` (build `npm install && npm run build` if you add one, or run `npx tsx src/server.ts`; simplest: start command `npm run dev` swapped for `npx tsx src/server.ts`).
2. Environment variables: `MONGODB_URI` (Atlas — whitelist `0.0.0.0/0` or the platform's static IPs), `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (long random strings, never the dev defaults), `PORT` (platform-provided), `CORS_ORIGINS` (your website origin), optional `SMTP_*`, `GOOGLE_CLIENT_IDS`.
3. Health check path `/health`. **One instance only for now** — rate limits and Socket.io rooms are in-memory (Redis unlocks multi-instance; see ladder step 4).
4. Point the app's `config.ts` at `https://your-service.onrender.com` and rebuild.

**Websockets:** Render/Railway support them natively — no extra config; the app's socket uses the same host.

## C. Ship the app
- **iOS:** Xcode → Product → Archive → TestFlight (internal testers first). You already have the required permission strings (camera, mic, photos).
- **Android:** `cd android && ./gradlew bundleRelease` → Play Console internal testing track.
- Store-readiness blockers from file 3: account deletion (App Store requirement), privacy policy URL, crisis-resources interstitial (strongly advised for a health community).

## D. How many users can this handle? (honest numbers)

Full math lives in `currentArchitecture handling capabilities.md` (repo root). Summary, assuming one small dyno + Atlas M0 free tier:

| Dimension | Comfortable | First thing that breaks |
|---|---|---|
| Registered users | **~1,000–2,000** | nothing directly — accounts are tiny |
| Daily actives | ~150–300 | Atlas M0 ops/sec under polling (feed poll ≈5–6 Mongo ops) |
| Concurrent open apps | ~250–300 | same — polling load saturates free-tier op budget |
| Concurrent sockets | ~2,000–5,000 | single Node process limits |
| Photos stored | **a few hundred total** | ⚠️ base64-in-Mongo fills M0's 512MB — the real ceiling |
| Calls | limited by TURN-less NAT traversal, not server (media is P2P; signaling is trivial load) |

**Bottom line: a solid 500–1,000-user launch MVP.** The ceiling is media storage and polling, not user count or compute.

## E. The scaling ladder (do them in this order)

1. **Cloud media storage** (S3/R2/Cloudinary) — removes the storage ceiling, shrinks responses ~50×, unlocks video. Single biggest win; do it before any launch push.
2. **Indexes + cursor pagination** (file 3 §backend 2–3) — keeps Mongo cheap as data grows.
3. **Atlas M10** (~$60/mo) — dedicated ops/sec, backups. Now polling supports thousands of concurrent users.
4. **Socket "feed:updated" nudge instead of 20s polling** — clients refetch only when something changed; cuts steady-state load ~80%. Then push notifications (FCM/APNs) close the app-closed gap — and make calls ring properly.
5. **Redis** (rate-limit store + Socket.io adapter) → run 2+ Node instances behind a load balancer. The app is stateless (JWTs), so this is config, not rewrite. → **tens of thousands of users.**
6. **coturn TURN server** ($5–10/mo VPS) — call reliability on hostile NATs.
7. **Observability** — pino structured logs, Sentry, /metrics. You can't scale what you can't see.
8. **Comments to their own collection; read caching for directories** — the long-tail optimizations, needed past ~50k users.

Rough cost curve: $0 (today) → ~$70/mo (M10 + dyno + TURN, ~5k users) → ~$300–500/mo (multi-instance + Redis + media CDN, ~50k users).
