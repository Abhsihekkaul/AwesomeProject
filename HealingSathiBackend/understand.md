# Understanding HealingSathiBackend

A quick orientation for anyone (including future-you) picking this project up, plus a
concrete list of what's left to do after this session's build. For setup commands see
`README.md`; for the full schema/module tour see `docs/ARCHITECTURE.md`; for every GraphQL
query/mutation with examples see `docs/API.md`. This file is the shorter "what is this and
what's next" version.

## What this is, in one paragraph

A single GraphQL API (Fastify + Mercurius) backed by PostgreSQL (via Prisma), plus a Socket.io
layer for real-time chat and live notifications. It's the backend for the HealingSathi React
Native app in the parent folder — a condition-based social app (groups, posts, Reddit-style
threaded comments) with 1:1 chat and consultant/healer booking. Built from scratch this
session; the RN app does **not** call it yet (see the frontend `understand.md` for that).

## The mental model you need

- **One endpoint, `/graphql`.** Everything — auth, posts, comments, chat history, booking — is
  a query or mutation on that one endpoint. There is no REST API.
- **Auth is a bearer JWT.** Sign in → get `accessToken` + `refreshToken` → send
  `Authorization: Bearer <accessToken>` on every subsequent request. Access tokens expire in
  15 minutes by default (`JWT_ACCESS_TTL` in `.env`); use `refreshAccessToken` to get a new
  pair without re-entering a password. Refresh tokens rotate — each use invalidates itself and
  issues a new one, so don't reuse an old refresh token.
- **Real-time is a separate connection.** GraphQL handles "load data" and "write data"; the
  Socket.io connection (same port, different protocol) handles "push data live" — chat
  messages and notifications. A client needs both: GraphQL for history on screen-load, sockets
  for live updates while the screen is open.
- **One `User`, not separate patient/doctor accounts.** Anyone can become a healer via
  `becomeHealer`; it just attaches a `HealerProfile` to their existing account (gated by a
  `verified` flag before they show up publicly — you'll need to flip that manually via
  `npm run prisma:studio` until an admin-approval flow exists).
- **Booking has two steps a healer must do before anyone can book them**: (1) set weekly hours
  via `setAvailabilityRules`, then (2) call `generateSlots(fromDate, toDate)` to actually
  materialize bookable `Slot` rows for a date range. Nothing is bookable until step 2 has run
  for the dates in question — this isn't automatic yet (see below).

## Try it yourself right now

```bash
npm run dev
# then, in another terminal:
curl http://localhost:4000/graphql -H 'Content-Type: application/json' -d \
  '{"query":"mutation { signIn(email:\"patient@healingsathi.dev\", password:\"password123\") { accessToken } }"}'
```
Or just open `http://localhost:4000/graphiql` in a browser after `npm run dev` — it's an
interactive query explorer with autocomplete against the live schema.

## What you need to do next

1. **Point the React Native app at this API.** Nothing calls this backend yet — see the root
   `understand.md` for the frontend-side task list.
2. **Set real secrets before deploying anywhere.** `.env.example` ships with placeholder
   `JWT_ACCESS_SECRET`/`JWT_REFRESH_SECRET` values — generate real random secrets
   (`openssl rand -hex 32`) for any environment beyond your own laptop.
3. **Provision a real PostgreSQL instance for staging/production.** Locally this session used
   a throwaway Docker container (`healingsathi-postgres`) — that's not durable. Pick a managed
   Postgres (Supabase, Neon, RDS, etc.) and point `DATABASE_URL` at it, then run
   `npm run prisma:deploy` (not `migrate dev`, which is for local development).
4. **Decide who runs `generateSlots` and how often.** Right now a healer has to manually call
   it to open up bookable time. A cron job (or a scheduled call the RN app makes on a healer's
   behalf) that rolls the bookable window forward daily is the natural next step.
5. **Implement Google/Apple sign-in for real.** `signInWithGoogle`/`signInWithApple` are
   stubbed to fail clearly (`NOT_IMPLEMENTED`) until you provide `GOOGLE_CLIENT_ID` /
   `APPLE_CLIENT_ID` and implement id-token verification in `src/modules/auth/service.ts`.
6. **Add payments + video-call links to the booking flow** once you've picked a provider
   (Stripe is the common default; Zoom/Google Meet APIs for the call link) — the `Booking`
   model has room for this without a schema change (see `docs/ARCHITECTURE.md`).
7. **Add push notifications for backgrounded devices.** Socket.io only reaches devices with an
   open connection; a phone with the app closed needs APNs/FCM, which isn't wired up.
8. **Consider DataLoader** if/when nested queries over large lists (e.g. a feed of 100 posts
   by 100 different authors) start showing up as slow — see the note in
   `docs/ARCHITECTURE.md`.
9. **Decide on hosting** for the Fastify process itself (Render/Fly.io/Railway/a VPS are all
   fine — it's a plain Node process, no special requirements beyond a Postgres connection
   string and the env vars in `.env.example`).
