# 5 · End-to-End Tech — the whole codebase in simple language

_This is your reading companion for the week. It explains every layer the way a teammate would over coffee: what each file is for, how data actually moves, and the handful of patterns that repeat everywhere. Read it top to bottom once, then keep it open beside the code._

---

## Part 1 — The 60-second mental model

There are two programs:

1. **The app** (repo root, React Native) — everything the user touches. It never talks to the database directly. It only ever does two things: send HTTPS requests to the backend, and listen on a websocket for live events.
2. **The backend** (`HealingSathiBackend/`, Node + Express) — one process that answers those requests, checks permissions, and reads/writes MongoDB. The same process also runs Socket.io for live events (new chat messages, call signaling).

And one rule that shapes the entire frontend: **signed out = fake data, signed in = real data.** The "Try the Demo" button shows built-in dummy content so the app always demos perfectly offline. The moment you sign in, every screen fetches only from the backend, and a brand-new account honestly shows empty states. One hook (`useLiveOrDemo`) enforces this — you'll see it in almost every screen.

---

## Part 2 — Follow one feature end to end

The best way to understand the codebase is to trace **"user posts a photo to a group, a friend sees it and replies."** Every layer participates:

1. **Compose** — `src/features/groups/CreatePostScreen.tsx`. The user picks photos (`src/utils/pickImage.ts` opens the gallery/camera and returns each photo as a compressed **base64 string** — literally the image encoded as text, our stand-in for cloud storage). Destination chips let them pick "My Feed" and/or groups.
2. **Send** — the screen calls `resourcesApi.createPost(...)` (`src/api/resourcesApi.ts`). That's a thin wrapper around `src/api/http.ts`, an axios instance that automatically attaches the login token to every request (and silently refreshes it if expired).
3. **Receive** — the request hits the backend. `app.ts` runs it through security middleware (helmet, rate limiter), then hands it to `routes/posts.ts` → the `POST /` handler. `middleware/auth.ts` has already verified the token and put `req.userId` on the request.
4. **Validate** — every string passes through `utils/validate.ts` (`cleanString` etc. — nothing unbounded or non-string ever reaches the database). The handler checks the user is actually a **member** of each target group, caps photos at 10, then creates one Post document per destination.
5. **Store** — `models/index.ts` defines the Post schema (all 14 schemas live in that one file on purpose — the whole data model is one read). Comments live *inside* the post document; photos are the base64 strings in `images[]`.
6. **Shape** — the handler returns the post through `shapePost(...)`, which converts a raw DB document into exactly what the app's `PostCard` component wants (`supportCount`, `supportedByMe`, `images`, author name…). Every posts-related endpoint reuses this one shaper, so the app sees one consistent post format everywhere.
7. **Friend sees it** — the friend's HomeScreen uses `useLiveOrDemo(resourcesApi.getFeed, ...)`, which refetches when the screen gains focus and silently re-polls every 20s. The feed query in `routes/posts.ts` builds their feed from: their own posts + their sathis' posts + their groups' posts + **condition-matched discovery** (posts in groups matching their conditions, and public posts from people who share a condition).
8. **Render** — `src/components/ui/PostCard.tsx` renders it: `ImageCarousel` for the photos (swipe, dots, "2/7"), tap the author → their public profile, heart → `react()` which flips the UI instantly and then reconciles with the server's authoritative count.
9. **Reply** — tapping the comment icon opens `CommentsSheet`, powered by `src/hooks/useComments.ts`: it fetches the flat comment list, rebuilds the reply tree (each comment stores its parent's id), inserts new replies optimistically, and syncs likes the same instant-then-reconcile way.

If you understand that trace, you understand 80% of the codebase — chat, profiles, groups, and bookings all follow the identical shape: *screen → resourcesApi → route handler → validate → model → shaper → back to a screen that renders optimistically and reconciles.*

---

## Part 3 — Backend, file by file (`HealingSathiBackend/src`)

| File | In one sentence |
|---|---|
| `server.ts` | Boot: connect Mongo (fails fast with a helpful Atlas-whitelist message), start Express, attach Socket.io, shut down gracefully on deploy signals. |
| `app.ts` | The assembly line every request rides: security headers → CORS → JSON parsing (25mb, because photos travel as text) → request log → rate limits (strict on `/auth`) → all the routers → 404 → one central error handler. |
| `config/env.ts` | Reads `.env` once, exports typed config. |
| `middleware/auth.ts` | `requireAuth`: checks the `Bearer` token, sets `req.userId`. Nearly every router starts with it. |
| `middleware/error.ts` | Converts thrown `HttpError`s into clean JSON errors; hides stack traces. |
| `utils/asyncHandler.ts` | Wraps async handlers so a thrown error lands in the error middleware instead of crashing the process; also defines `HttpError(status, message)`. |
| `utils/validate.ts` | `cleanString` / `cleanOptionalString` / `cleanStringArray` / `cleanEmail` — every user-supplied string is trimmed, type-checked, and length-capped here. |
| `utils/jwt.ts` | Signs/verifies the two token types (15-min access, long-lived refresh). |
| `utils/mailer.ts` | Nodemailer; sends the 6-digit codes when SMTP creds exist, console-logs them otherwise. |
| `models/index.ts` | **All 14 Mongoose schemas.** Read this file first — it is the data model. |
| `routes/auth.ts` | Sign up/in (timing-safe), token refresh w/ rotation, me (read + edit incl. profile photo), forgot/reset password, passwordless email codes, Google sign-in, change email/password. |
| `routes/posts.ts` | Feed (graph + condition discovery), multi-photo multi-destination create, single post + comment thread, threaded comments, atomic reactions (posts and comments), saves. `shapePost` lives here. |
| `routes/groups.ts` | Directory, join/leave toggle, member list, group proposals. |
| `routes/chats.ts` | Conversations, messages (text / photo / shared-post card), and the realtime fan-out after each send. |
| `routes/sathi.ts` | Friend requests (send → accept/decline; accept links both users AND creates their conversation + notification). |
| `routes/users.ts` | People search (regex, blocklist-aware), block/unblock, and the read-only public profile. |
| `routes/admin.ts` | The superuser review queue (role `admin` only): approve/reject group proposals and consultant applications. |
| `routes/misc.ts` | Notifications, consultants + bookings, consultant applications, health tips. |
| `realtime.ts` | Socket.io: JWT handshake, `user:{id}` and `chat:{id}` rooms, chat events, and the WebRTC call-signaling relay (contact-checked on every event). |
| `seed.ts` | Demo world: demo/Alex/Maya users (sathis pre-linked), admin account, groups, posts, chat, consultants, tips. Never wipes real accounts. |
| `smokeTest.ts` | **The executable spec**: boots the real server on an in-memory Mongo and drives 117 checks over real HTTP + sockets. When you wonder "how is X supposed to behave?", search this file. |

**Backend patterns worth internalizing**
- *Shapers* (`shapePost`, `publicUser`, per-route mappers): DB documents never leak raw to the app; each endpoint returns exactly the screen-ready shape.
- *Atomic toggles*: reactions use "try `$pull`; if nothing was removed, `$addToSet`" — two devices tapping simultaneously can never double-count, and the response always carries the true counts.
- *404 over 403 for privacy*: foreign conversations and blocked users return "not found," so nobody can confirm they were blocked or enumerate ids.
- *TTL indexes*: refresh tokens and one-time codes delete themselves; no cleanup jobs.

---

## Part 4 — Frontend, folder by folder (`src/`)

### `api/` — the only place the network exists
- `config.ts`: `BASE_URL` / `SOCKET_URL` (change these to point at a deployed backend).
- `http.ts`: the axios instance — attaches the access token, auto-refreshes on 401 once, exposes `apiErrorMessage(err)` for human-readable alerts.
- `tokenStorage.ts`: AsyncStorage wrapper for the token pair.
- `authApi.ts` / `resourcesApi.ts`: one function per endpoint; screens import these, never axios.
- `chatSocket.ts`: per-chat-room socket (receive-only messages); `appSocket.ts`: the app-wide socket that stays connected for incoming calls.

### `context/` — app-wide state (everything else is local screen state)
- `AuthContext.tsx`: the session. Restores it on launch, exposes `user`, `isAuthenticated`, all sign-in flavors, `updateUser`. **`isAuthenticated` is the switch that flips the entire app between demo and live.**
- `CallContext.tsx`: the WebRTC engine — a state machine (idle → outgoing/incoming → active) holding the peer connection, streams, mute/speaker/camera controls, and all signaling socket listeners. Native modules are loaded only if actually linked into the binary, so an un-rebuilt app never crashes.
- `SavedPostsContext.tsx`: local saves (demo continuity) alongside server saves.
- `theme/ThemeContext.tsx`: system/light/dark; every screen builds styles via `makeStyles(colors)`.

### `hooks/` — the two workhorses
- `useLiveOrDemo(fetcher, demoData, emptyData?, pollMs?)`: THE pattern. Demo data signed out; live fetch signed in; refetch on focus; optional silent polling; `setData` for optimistic updates. If a screen shows wrong-mode data, the bug is that it isn't using this hook.
- `useComments(postId, demoThread)`: flat comments → reply tree, optimistic add/like at any depth, server reconcile.

### `components/ui/` — shared building blocks
`PostCard` (the feed unit: carousel, reactions, author-tap, menu) · `ImageCarousel` + `AutoHeightImage` (all photo rendering) · `CommentsSheet` (threaded comments bottom-sheet w/ collapse) · `ShareSheet` (top-5 people, sends the post as a card) · `UserAvatar` (photo or initials) · `DirectoryScreen` (My Friends/Groups) · buttons, inputs, chips, `ScreenWrapper` (safe-area + theme background).

### `features/` — one folder per product area
`auth` (sign in/up, forgot password, email code) · `home` (feed) · `groups` (directory, group page, composer, proposals) · `posts` (post details) · `chat` (list + room: photos, shared cards, call buttons) · `call` (the full-screen call overlay) · `profile` (own profile + settings + public profiles) · `search` · `notifications` (incl. sathi requests) · `admin` (review queue) · `consultants`/`help` (directory, booking, applications) · `settings` (account screens) · `tips`, `diary`, `onboarding`, `profileSetup`.

### `navigation/`
`AppNavigator.tsx`: the stack — every screen + its typed params (`RootStackParamList` is the map of "what data each screen expects"). `MainTabNavigator.tsx`: the floating pill tab bar (custom PagerView, frosted glass on iOS), supports `navigate("MainTabs", { tab: "Chats" })`.

---

## Part 5 — The realtime & calling layer, simply

**Chat:** sending is a normal REST POST (so validation and rate limiting stay in one place). After saving, the server *pushes* the message over Socket.io to everyone in that conversation's room — that's why the other person sees it instantly. If the socket drops, the 15s poll still delivers it: degraded, never broken.

**Calls:** think of the server as a switchboard operator who only passes notes. Phone A creates a WebRTC "offer" (a description of how to reach it), sends it via socket; the server checks A and B actually know each other, then drops it in B's room. B answers; both sides exchange ICE candidates (possible network paths) the same way. Once they agree, **audio/video flows directly phone-to-phone** — the server never sees or carries media. STUN (a free address-lookup service) makes this work across most networks; the rare hostile networks need a TURN relay we'd self-host later.

---

## Part 6 — Glossary (terms you'll meet in the code)

| Term | Meaning here |
|---|---|
| **sathi** | An accepted friend (Hindi: companion). `User.sathis` is the friend list. |
| **demo mode** | Signed-out state: built-in dummy data, no network needed. |
| **live** | Signed-in state: backend data only. |
| **shaper** | Backend function converting a DB doc into the app-ready JSON shape. |
| **optimistic update** | UI changes immediately; the server response then corrects it if needed. |
| **base64 data-URI** | An image encoded as a text string (`data:image/jpeg;base64,...`) — our interim media storage. |
| **access / refresh token** | Short-lived proof of login / long-lived, revocable, single-use token to get a new access token. |
| **room** (sockets) | A named channel; emitting to `user:123` reaches all of that user's connected devices. |
| **offer / answer / ICE** | The WebRTC handshake: each side describes itself, then they trade possible network routes until one connects. |
| **superuser / review queue** | `role: "admin"` users approving group proposals & consultant applications at `/api/admin`. |
| **WSI** | Weekly Supportive Interactions — the north-star metric (see marketing.md). |

---

## Part 7 — Suggested reading order for your week

1. `HealingSathiBackend/src/models/index.ts` — the data model (30 min, everything else assumes it).
2. `HealingSathiBackend/src/smokeTest.ts` — behavior as executable checks; skim all 117.
3. `src/hooks/useLiveOrDemo.ts` + `src/context/AuthContext.tsx` — the demo/live spine.
4. Trace Part 2 of this doc with the files open.
5. `src/api/http.ts` → `routes/auth.ts` — the token lifecycle.
6. `realtime.ts` + `src/context/CallContext.tsx` — the realtime layer.
7. Then wander `features/` screen by screen; each is ~1 pattern repeated.
