# FinalCheckpoint — HealingSathi launch state

_Last updated: 2026-07-12 (auth-hardening + social-feed session — see §0). Task-level
detail lives in `HealingSathiBackend/checkpoint.md` and `pendingTask.md`; this file is
the product-level picture + the moderation-system plan._

---

## 0. Checkpoint 2026-07-12 — Auth & settings hardening, social feed, consultant applications

Everything below is **additive** to the 2026-07-11 state (§1 onward, kept intact).

**Auth (big-tech behavior):** forgot-password (hashed 6-digit code, 10-min expiry,
attempt-capped, all sessions revoked on reset), change password (other devices signed
out, calling device survives), change email (password-confirmed), race-proof duplicate
signup (DB-level E11000 → 409), timing-safe sign-in. Sign-in/sign-up tabs no longer
share form state, and "Try the Demo" goes straight to signed-out MainTabs per the demo
contract (it used to jump into ProfileSetup — the likely source of the "signed up twice"
confusion).

**Settings:** every Account row is a real screen now — Edit profile, Change email,
Change password, Blocked users (block/unblock enforced in chat + search + sathi
requests), Language (persisted on-device).

**Social feed (Phase 2):** the feed is formed by the graph — my posts + my sathis'
posts + my groups' posts. `GET /users/search` powers live people search with relation
status; "+ Add Sathi" and "open chat with a sathi" work from Search. `useLiveOrDemo`
now refetches on screen focus (fixes: create a post → it's visible on Home/Profile
immediately) and the Home feed adds pull-to-refresh + silent 20s polling.

**Consultants:** "Join as a consultant →" opens a real application form;
`ConsultantApplication` lands in a review queue (same approval pattern planned for
moderation Phase A).

**Verification:** backend smoke test extended 42 → **69/69** ✓ · backend typecheck ✓ ·
app tsc 0 errors ✓ · Jest ✓ · ESLint 0 errors ✓. README written. Re-run
`npm run seed` after restoring Atlas access (demo ↔ Alex are now sathis in the seed).

### Same-day addendum (live-testing round)

- **Seed is no longer destructive**: only `@healingsathi.dev` demo users + demo content
  are wiped on re-seed. (Root cause of "can't find Sarab in search": the old seed had
  deleted every real tester account. Search itself was verified working over live HTTP.)
- **Email delivery**: Nodemailer + Gmail SMTP (`SMTP_*` env; `.env.example` documents the
  App-Password setup). Without SMTP, codes log to the console and dev builds get `devCode`.
- **Passwordless sign-in**: "Or email me a sign-in code" → `EmailCodeScreen`; backend
  `LoginCode` model + request/verify endpoints (hashed, 10-min, attempt-capped, single-use).
- **Google Sign-In**: complete code path (native button → id token → `/auth/google`
  verify → find-or-create). Dormant until OAuth client IDs are pasted —
  **`GoogleSignInSetup.md`** walks through the 10-minute console setup. Apple deferred.
- **New Post composer overhaul**: gallery image attach (compressed base64 MVP; videos
  say "coming soon"), multi-destination "Share to" chips (My Feed + joined groups; the
  backend validates membership and fans out one post per destination), author identity,
  image preview, char counter. iOS photo-library permission added; new pods installed
  (`RNGoogleSignin`, `react-native-image-picker`) — **a native rebuild is required**
  (`npm run ios` / `npm run android`), Metro reload is not enough.
- Verification after all of the above: smoke **77/77** ✓ · both typechecks ✓ · Jest ✓.
- **Realtime chat shipped** (was roadmap item #2): Socket.io on the API server with JWT
  handshake auth; send stays REST, receive is instant via `message:new` room fan-out;
  ChatRoom + Chats keep 15s polling as fallback. Smoke now **79/79** ✓ (includes
  socket auth-rejection and live-delivery checks). `src/realtime.ts` (backend),
  `src/api/chatSocket.ts` (app).

---

## 1. Where the product stands

**The app is a complete end-to-end working application.**

| Layer | State |
|---|---|
| React Native app (iOS/Android) | All screens built & polished (glass tab bar, gradient chat bubbles, gestures, dark mode) |
| Backend (Express + Mongoose + JWT) | Complete, hardened, smoke-tested 42/42 — `HealingSathiBackend/test.md` |
| Database | MongoDB Atlas, connected via `.env`, seeded with demo content |
| Auth | Live: signup / signin / session restore / refresh rotation / signout |
| **Every content screen** | **Live-wired**: feed, chats (+ new search bar), chat room send, notifications, Sathi requests accept/decline, groups + join, create post, request group, profile (my posts + saved), consultants, booking, health tips |
| Reactions & saves | Optimistic UI, synced to the API when signed in |

### The demo-mode contract (implemented, `src/hooks/useLiveOrDemo.ts`)
- **Signed OUT ("Try the Demo")** → the app always shows its built-in dummy data.
  Zero backend needed. Safe to hand to anyone, anywhere.
- **Signed IN** → only real backend data. A fresh account sees honest empty states —
  a brand-new app feel, never fake content. Demo account
  (`patient@healingsathi.dev` / `password123`) sees the seeded community.

## 2. What stands between you and launch (all user actions)

1. **Atlas IP whitelist** — the only current blocker for local live testing: your IP changed
   since seeding; Atlas → Network Access → *Add Current IP* (server now prints this hint).
2. **Deploy the backend** — `HealingSathiBackend/DeployeBackend.md` (Render recommended);
   set real secrets; then point `src/api/config.ts` at the HTTPS URL and rebuild the app.
3. **Commit everything to git** (nothing is committed yet — do this first).
4. Smoke the golden path on a device: sign in as demo → feed → open chat → send → book →
   save a post → sign out → "Try the Demo" still shows dummy data.

## 3. Moderation system — build plan (superuser approvals)

Goal: nothing user-created becomes public without a superuser's decision, starting with
group creation (already flowing into the DB as `status: "proposed"`).

### Phase A — roles & gates (backend, ~half a day)
1. `User.role: "user" | "superuser"` (default "user"); add `role` to JWT payload + `/auth/me`.
2. `requireSuperuser` middleware (after `requireAuth`, 403 otherwise).
3. Admin endpoints under `/api/admin/*` (all superuser-gated):
   - `GET  /api/admin/proposals` — pending group proposals (already in the Group collection)
   - `POST /api/admin/proposals/:id/approve` → status "active", clean display name,
     notify + auto-join the proposer
   - `POST /api/admin/proposals/:id/reject` → status "rejected" + notification with reason
4. Seed one superuser (`admin@healingsathi.dev`) in `src/seed.ts`.
5. Extend the smoke test: proposal → non-superuser gets 403 → superuser approves →
   group is live → proposer notified.

### Phase B — reports queue (next)
- `Report` model (`targetType: post|comment|user`, targetId, reporter, reason, status).
- `POST /api/reports` wired to the existing "Report Post" menu item.
- `GET /api/admin/reports` + `resolve` (dismiss / remove content / warn user).

### Phase C — moderation surface (last)
- Fastest: a tiny web dashboard (Next.js/plain React) hitting `/api/admin/*` — desks beat
  phones for review work. Alternative: hidden "Moderation" section in the app's Settings,
  visible only when `me.role === "superuser"`.
- Later: audit log (every admin action recorded), rate-limit alerts, keyword flagging.

## 4. Post-launch roadmap (priority order)
1. Moderation Phase A → B → C (above)
2. Realtime chat via Socket.io (REST polling today)
3. Media upload (Cloudinary/S3 presigned) — post images + chat attachments
4. Push notifications (FCM/APNs)
5. Consultant availability calendar; forgot-password + social auth
6. Store submission prep (icons, splash, signing, privacy policy URL)

## 5. Verification snapshot
- Backend: typecheck ✅ · smoke test 42/42 ✅ · prod build ✅ · live on Atlas ✅ (health +
  JWT signin verified over HTTP before the IP-whitelist rotation)
- Frontend: tsc ✅ 0 errors · Jest ✅ · ESLint ✅ (style warnings only)
- Docs current: run.md · ARCHITECTURE.md · DeployeBackend.md · test.md · checkpoint.md ·
  pendingTask.md (superseded by this file) · README.md
