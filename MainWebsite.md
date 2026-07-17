# MainWebsite.md — The HealingSathi Web App

**One product, three doors.** iPhone app, Android app, and now a full working
website — the same account, the same feed, the same chats, the same everything.
Like Facebook: `facebook.com` isn't a brochure, it IS Facebook. This document is
the complete architecture + design for `HealingSathiWebApp` — read it, approve it,
and building starts.

> **Not the marketing site.** `HealingSathiWebsite/` (the existing Next.js
> brochure with the waitlist form) stays exactly what it is — the front door at
> `healingsathi.com`. This document describes a NEW project: the logged-in
> product, living at **`app.healingsathi.com`**, in a new folder
> **`HealingSathiWebApp/`**. The marketing site's "Open HealingSathi" button will
> simply link to it. (Same split Facebook uses: about.facebook.com vs
> facebook.com.)

---

## 1. The big picture

```mermaid
flowchart LR
    subgraph Clients
      A[📱 React Native app\niOS + Android]
      W[💻 HealingSathiWebApp\nNext.js at app.healingsathi.com]
    end
    subgraph One backend - already built
      B[Express REST API\nHealingSathiBackend]
      S[Socket.io\nchat + calls + notifications]
      DB[(MongoDB Atlas)]
    end
    M[🌐 HealingSathiWebsite\nmarketing at healingsathi.com] -->|"Open the app" link| W
    A -->|same JWT, same endpoints| B
    W -->|same JWT, same endpoints| B
    A <-->|same events| S
    W <-->|same events| S
    B --> DB
```

**The single most important fact:** the backend is already done. Every feature
the app has works through `HealingSathiBackend`'s REST API + Socket.io, and the
web app talks to the **exact same server with the exact same calls**. There is no
"web backend" to build. Sign in on your phone, post from your laptop, get the
comment notification back on your phone — it's one database, so sync is automatic.

**What actually has to be built:** one thing — a browser frontend. That's this doc.

---

## 2. Where it lives & the stack

| Decision | Choice | Why |
|---|---|---|
| Folder | `HealingSathiWebApp/` at repo root | Sibling of `HealingSathiBackend/` and `HealingSathiWebsite/`; the repo root is the RN app so it can't live there |
| Domain | `app.healingsathi.com` | Marketing keeps `healingsathi.com`; clean cookie/origin separation |
| Framework | **Next.js (App Router) + TypeScript** | Same family as the marketing site (shared knowledge), file-based routing gives every post/profile/group a real URL |
| Rendering | Client-side data fetching behind auth (no SSR of private data) | The feed is personal and JWT-authed — SSR adds complexity for zero SEO gain (private content shouldn't be indexed anyway) |
| Styling | **Tailwind v4** + design tokens copied from the app | Marketing site already proved this setup; tokens below |
| Data fetching | **TanStack Query (React Query)** | Gives the web the same "refetch 
on focus + background polling" behavior `useLiveOrDemo` gives the app, plus caching and optimistic updates for free |
| API client | `axios` instance ported from `src/api/http.ts` | The interceptor logic (attach token → 401 → single-flight refresh → retry) is already written and battle-tested; it ports almost line-for-line |
| Realtime | `socket.io-client` | Identical events the app already uses (`message:new`, `chat:updated`, `call:*`) |
| Auth/session state | Small `AuthProvider` (React context), tokens in `localStorage` | Mirrors the app's `tokenStorage` + `AuthContext`; upgrade path to httpOnly cookies noted in §9 |
| Theme | `next-themes` (system / light / dark) | Same three-way toggle the app's Settings has |
| Deploy | Vercel (like the marketing site's plan) | One `git push` = deployed; free tier is fine to start |

**Backend changes needed: two lines of env, zero code.**
1. `CORS_ORIGIN=https://app.healingsathi.com,http://localhost:3000` — the
   allowlist already exists in `env.ts`, it just needs the web origins.
2. Add the Google **web** OAuth client id to `GOOGLE_CLIENT_IDS` (the endpoint
   already accepts a list).

---

## 3. Design system — it must FEEL like the app

The app already has a settled visual identity (single brand accent, calm
"healing" language, light/dark). The web copies it token-for-token so a user
switching between phone and laptop never feels a brand jump.

### Tokens (copied verbatim from `src/theme/colors.ts`)

| Token | Light | Dark | Used for |
|---|---|---|---|
| `--primary` | `#7453C8` | `#9A82E0` | Buttons, active states, links |
| `--primary-dark` | `#5A3DA0` | `#7453C8` | Gradients (own chat bubbles) |
| `--background` | `#F5F8FD` | `#13141A` | Page background |
| `--card` | `#FFFFFF` | `#1D1F29` | Cards, sheets, panels |
| `--text` | `#1F334D` | `#EEF1F8` | Primary text |
| `--muted` | `#6F87A6` | `#8D9BB5` | Secondary text, timestamps |
| `--border` | `#DDE5F2` | `#2B2E3A` | Hairline borders |
| `--light-purple` | `#EEE7FF` | `#2A2440` | Active tab pill, tints |
| `--light-blue` | `#EFF4FC` | `#1E2430` | Inputs, their-bubbles |
| `--success` / `--danger` | `#4FA57B` / `#E36A6A` | both | Sent ✓ / delete & unread badge |

Rules carried over from the marketing-site work (learned the hard way there):
- Class merging in shared components goes through **`cn()` (tailwind-merge)**,
  never raw string concat — otherwise variant classes silently beat overrides.
- Never use a theme-flipping token (like `--text`) as a background that must look
  identical in both themes — use a fixed token for that case.

### Component inventory — app → web

Every app component gets a web sibling with the same name, so the codebases rhyme:

| App (`src/components`, screens) | Web component | Notes |
|---|---|---|
| `PostCard` (+ ⋯ menu, reactions) | `<PostCard>` | Identical layout; hover states added; ⋯ menu becomes a dropdown |
| `ImageCarousel` | `<ImageCarousel>` | Arrows on hover + dots; swipe on touch |
| `CommentsSheet` / `CommentItem` | `<CommentThread>` | Not a bottom sheet on desktop — comments render inline under the post (Facebook-style); bottom sheet only on mobile web |
| `ShareSheet` (quick row + picker) | `<ShareDialog>` | Modal dialog; same top-5 + multi-select picker + "copy link" (links are REAL on web — see §6) |
| `UserAvatar` | `<UserAvatar>` | Initials fallback + photo, identical colors |
| `ChatMessageBanner` | `<Toast>` + browser `Notification` | Web can also notify when the tab is in the background — better than the app until push lands |
| `CallOverlay` | `<CallOverlay>` | Same UI; browser-native WebRTC (§7) |
| `AppToggle`, `SearchBar`, `PrimaryButton`, `TagChip` | same names | Straight ports |

---

## 4. Layout — the Facebook-shaped shell

### Desktop (≥1024px): three columns, fixed shell, only the middle scrolls

```
┌────────────────────────────────────────────────────────────────────────┐
│  🟣 HealingSathi     [ 🔍 Search people, groups... ]      💬(3) 🔔(2) 🧑 │  ← top bar
├──────────────┬──────────────────────────────────┬──────────────────────┤
│  LEFT NAV    │            CENTER                │      RIGHT RAIL      │
│              │                                  │                      │
│  🏠 Home     │  ┌────────────────────────────┐  │  My Sathis           │
│  👥 Groups   │  │ What's on your mind?  📷   │  │   ● Alex K.    💬    │
│  💬 Chats(3) │  └────────────────────────────┘  │   ● Maya H.    💬    │
│  🩺 Help     │  ┌────────────────────────────┐  │                      │
│  🧑 Profile  │  │ PostCard                   │  │  My Groups           │
│  ──────────  │  │  author · time             │  │   Fibromyalgia W.    │
│  📔 Diary    │  │  text + photo carousel     │  │   Type 2 Diabetes    │
│  💡 Tips     │  │  ♥ 12   🤝 4   💬 6   ↗    │  │                      │
│  ⚙ Settings  │  └────────────────────────────┘  │  Suggested for you   │
│              │  ┌─ PostCard ─────────────────┐  │   (condition-based   │
│              │  │  ...feed continues...      │  │    discovery)        │
└──────────────┴──────────────────────────────────┴──────────────────────┘
```

- Left nav = the app's 5 tabs + the screens the app tucks behind Home quick
  actions (Diary, Tips, Settings). Chats shows the same **unread count badge**
  the app's tab bar shows — same socket event drives both.
- Right rail = the app's "My Friends / My Groups" directory + condition-based
  suggestions, always visible (this is what big screens are FOR).
- Top bar = brand, global search (the app's SearchScreen, always one keystroke
  away — `/` focuses it), chat + notification bells with live badges, avatar menu.

### Chat (≥1024px): the two-pane Messenger layout — web's biggest win

```
┌──────────────────────┬─────────────────────────────────────────────────┐
│  Chats     [search]  │  Alex K.  · Online                    📞  🎥    │
│ ┌──────────────────┐ │ ─────────────────────────────────────────────── │
│ │● Alex K.      (2)│ │           ┌──────────────────────┐              │
│ │  📷 Photo · 2m   │ │           │ their message bubble │              │
│ ├──────────────────┤ │           └──────────────────────┘              │
│ │  Maya H.         │ │              ┌───────────────────────────┐      │
│ │  Finally found…  │ │              │ your gradient bubble    ✓✓│      │
│ ├──────────────────┤ │              └───────────────────────────┘      │
│ │  …               │ │                                                 │
│ └──────────────────┘ │  [ + ]  [ Write something supportive…  ] [ ➤ ] │
└──────────────────────┴─────────────────────────────────────────────────┘
```

Conversation list and the open thread side-by-side — no back-and-forth
navigation. The app's whole chat feature set carries over: photos, shared-post
mini cards (tappable → the post), unread zeroing on open, socket receive with
15s polling fallback, call buttons.

### Tablet (768–1023px): left nav collapses to icons, right rail hides.

### Mobile web (<768px): the app's own layout — bottom tab bar (Home, Groups,
Chats, Help, Profile), single column, bottom-sheet comments/share. Someone
opening a shared link on their phone browser gets an experience nearly identical
to the native app (plus a gentle "get the app" banner).

---

## 5. Complete page map

Every route, what it shows, and which existing API it calls. **No new endpoints
are needed for any row** (the two ⚠ rows reuse existing ones with notes).

| Route | What it is (app equivalent) | APIs used |
|---|---|---|
| `/` | Redirect: signed-in → `/feed`, else → `/login` | — |
| `/login`, `/signup` | AuthScreen (both tabs, own form state) | `POST /auth/signin`, `/auth/signup` |
| `/login/code` | EmailCodeScreen | `POST /auth/email-code/request`, `/verify` |
| `/login/forgot` | ForgotPasswordScreen | `POST /auth/forgot-password`, `/reset-password` |
| `/login` (Google button) | Google Sign-In | `POST /auth/google` (web id token via Google Identity Services) |
| `/feed` | HomeScreen: composer strip, live feed, pull-equivalent (auto refetch), honest empty state | `GET /posts`, `POST /posts/:id/react`, `/save` |
| `/post/[id]` | PostDetailsScreen — **now a real shareable URL** | `GET /posts/:id`, comments + reactions endpoints |
| `/post/[id]/edit` | EditPostScreen (own posts) | `PATCH /posts/:id` |
| `/compose` (modal over feed) | CreatePostScreen: multi-photo (≤10), destination chips (Feed + joined groups), content warning | `POST /posts` |
| `/groups` | GroupsScreen directory + "Request a group" | `GET /groups`, `POST /groups/:id/join`, `/groups/request` |
| `/groups/[id]` | GroupDetailsScreen: Posts / Members / About tabs, + Post FAB preselect | `GET /posts?groupId=`, `GET /groups/:id/members` |
| `/chats` | ChatsScreen (list pane; on desktop always visible) | `GET /chats`, `POST /chats/:id/read` |
| `/chats/[id]` | ChatRoomScreen (thread pane): text, photos, shared posts, calls | `GET/POST /chats/:id/messages`, socket `message:new` |
| `/help` | PsychologicalHelpScreen: consultant directory | `GET /consultants` |
| `/help/consultant/[id]` | ConsultantProfileScreen + reviews | `GET /consultants` ⚠ (no single-consultant endpoint; filter client-side like the app does) |
| `/help/book/[id]` | BookingScreen | `POST /bookings`, `GET /bookings` |
| `/help/apply` | BecomeConsultantScreen | `POST/GET /consultants/apply` |
| `/profile` | ProfileScreen: hero + avatar upload, My Posts / Saved tabs | `GET /posts?mine=1`, `/posts/saved`, `PATCH /auth/me` |
| `/user/[id]` | UserProfileScreen (read-only public profile, Message / + Add Sathi) | `GET /users/:id/profile`, `POST /chats` |
| `/search` | SearchScreen (also inline from the top bar) | `GET /users/search`, `/groups`, `/consultants` |
| `/notifications` | NotificationsScreen: tabs, sathi request cards, mark-all-read | `GET /notifications`, `/sathi/requests`, respond endpoints |
| `/tips` | HealthTipsScreen | `GET /tips` |
| `/diary` | HealingDiaryScreen ⚠ (app stores it on-device; web stores in `localStorage` the same way — private-by-design carries over; cloud sync stays a backlog item for BOTH) | — |
| `/settings` | SettingsScreen: account rows, theme, chat-notifications toggle, blocked users, language | `PATCH /auth/me`, `GET /users/blocked`, etc. |
| `/settings/delete-account` | DeleteAccountScreen: exit reasons + feedback + password | `DELETE /auth/me` |
| `/admin` | AdminReviewScreen (admins only; server enforces 403 anyway) | `GET /admin/reviews` + approve/reject |

---

## 6. Feature parity matrix — and where web is BETTER

| Feature | App | Web | Web upgrade |
|---|---|---|---|
| Feed (sathi + condition discovery) | ✅ | ✅ same API | Infinite-feeling scroll; refetch-on-focus via React Query |
| Posts: 10-photo carousel, reactions, save, edit/delete own | ✅ | ✅ | **Drag & drop photos** into the composer; paste-from-clipboard |
| Threaded comments + likes + delete cascade | ✅ | ✅ | Inline under the post on desktop (no sheet) |
| Share to N people (in-sheet picker) | ✅ | ✅ | **"Copy link" is finally real** — `app.healingsathi.com/post/[id]` replaces the fake `healingstream.app` URL (the app's ShareSheet should adopt this URL too once the site is live) |
| 1:1 chat: realtime, photos, shared-post cards, unread counts | ✅ | ✅ same sockets | **Two-pane Messenger layout**; Enter to send |
| Chat popup + tab badge + notifications page | ✅ | ✅ | **Browser Notifications** when the tab is backgrounded + unread count in the tab title (`(3) HealingSathi`) — web gets "push" before the app does |
| Audio/video calls (own WebRTC signaling) | ✅ | ✅ | Browsers have WebRTC natively (`getUserMedia` + `RTCPeerConnection`) — the SAME `call:*` socket events work unchanged; app↔web calls just work |
| Sathi graph, blocking, public profiles | ✅ | ✅ | Hover cards on names (mini profile preview) |
| Groups + request/approval flow | ✅ | ✅ | — |
| Consultants, booking, applications | ✅ | ✅ | — |
| Search (people/groups/consultants) | ✅ | ✅ | Always-visible top-bar search, `/` shortcut |
| Notifications page + sathi requests | ✅ | ✅ | — |
| Settings: theme, chat-notif toggle, blocked, email/password, delete account | ✅ | ✅ | — |
| Admin review queue | ✅ | ✅ | Comfier on a big screen — this is where admins will actually live |
| Health tips, diary | ✅ | ✅ | Diary gets real keyboard typing |
| Demo mode ("Try the demo" = dummy data, signed-in = real only) | ✅ | ✅ same contract | A visitor can feel the product before signing up — great for conversion from the marketing site |
| Google sign-in | ✅ (needs ids) | ✅ | Web client id goes in the same `GOOGLE_CLIENT_IDS` list |

Deliberately NOT on web (same as app, same reasons): video upload (blocked on
cloud media storage for both), push-to-closed-app (FCM/APNs — though web's
browser notifications cover the open-tab case today).

---

## 7. The four technical ports (the only "hard" parts)

1. **HTTP client** — port `src/api/http.ts` + `resourcesApi.ts` + `authApi.ts`
   nearly verbatim (they're plain axios/TS, nothing React-Native about them).
   `tokenStorage` swaps AsyncStorage for `localStorage`. One shared folder
   `HealingSathiWebApp/src/api/` that intentionally mirrors the app's file names.
2. **Realtime** — port `appSocket.ts`/`chatSocket.ts` as-is (socket.io-client is
   isomorphic). The web `ChatNotificationsProvider` is the same state machine as
   the app's, plus: update `document.title` with the unread count, and fire a
   browser `Notification` when `document.hidden`.
3. **Calls** — `CallContext`'s state machine (idle → outgoing/incoming → active,
   ICE queueing, busy auto-decline) ports logic-for-logic; only the imports
   change: `react-native-webrtc` → the browser's built-in `RTCPeerConnection`,
   `mediaDevices.getUserMedia`, `<video>` elements instead of `RTCView`. Same
   STUN config, same coturn upgrade path later.
4. **Image pipeline** — mirror `pickImage.ts`'s policy in the browser: file
   input / drag-drop → `<canvas>` resize to ≤1280px → JPEG data-URI. Same ≤10
   photos, same base64 transport, so the backend's 25mb limit math stays valid.

---

## 8. Project structure

```
HealingSathiWebApp/
├── src/
│   ├── app/                      # Next.js App Router pages (the page map above)
│   │   ├── (auth)/login, signup, ...      # public routes
│   │   ├── (main)/feed, chats, groups, ...# authed shell w/ left nav + right rail
│   │   └── layout.tsx, globals.css        # tokens live here
│   ├── api/                      # http.ts, authApi.ts, resourcesApi.ts,
│   │   │                         # appSocket.ts, chatSocket.ts, tokenStorage.ts
│   │   └── (mirrors the RN app's src/api file-for-file)
│   ├── components/               # PostCard, ImageCarousel, CommentThread, ...
│   ├── context/                  # AuthProvider, ChatNotificationsProvider, CallProvider
│   ├── hooks/                    # useLiveData (React Query wrapper = useLiveOrDemo's web twin)
│   └── lib/                      # cn.ts, timeAgo.ts, compressImage.ts
├── docs/ARCHITECTURE.md          # short version of this doc, kept current
└── run.md                        # local dev + deploy steps (like the marketing site's)
```

---

## 9. Security & auth notes (honest, like the rest of the project)

- **Tokens in `localStorage` for MVP** — exactly the trust model the app uses
  (AsyncStorage), same refresh-rotation, same server-side revocation. Known
  tradeoff: XSS on the site could read tokens. Mitigations now: React's default
  escaping (no `dangerouslySetInnerHTML` anywhere), strict CSP header, no
  third-party scripts. Upgrade path later (backlog): move refresh tokens into an
  httpOnly cookie via two tiny backend endpoints — nothing in this design blocks it.
- Route guard: the `(main)` layout checks the session and redirects to `/login`
  (with demo mode as the read-only escape hatch, same contract as the app).
- CORS: allowlist gets the web origins (already supported, env-only change).
- Rate limits: web traffic flows through the same limiter the app uses.
- Private content stays private: no SSR/SEO of feeds or profiles; only `/login`
  and demo mode are publicly reachable. Marketing SEO remains the brochure
  site's job.

---

## 10. Build plan — five phases, each independently shippable

Same discipline as the app cycles: every phase ends with typecheck clean, the
flow exercised against the real local backend, and `pendingTask.md` updated.

| Phase | Scope | Definition of done |
|---|---|---|
| **W1 — Foundation + Auth** | Scaffold, tokens/theme, api/ + socket ports, AuthProvider, login/signup/code/forgot/Google, shell layout (top bar + left nav + right rail), route guard, demo mode | Sign in with a real account on `localhost:3000`; shell renders in light + dark |
| **W2 — Feed & posts** | `/feed`, PostCard + carousel + reactions + save, composer (drag-drop ≤10 photos, destinations), `/post/[id]` w/ full comment threads, edit/delete own | Post from web with photos → appears on the phone; comment thread parity incl. delete cascade |
| **W3 — Chat & notifications** | Two-pane `/chats`, photos, shared-post cards, unread badges (nav + tab title), toast popup + browser Notification, `/notifications` page, chat-notifications toggle | Message phone↔web both directions live; badge zeroes on open on BOTH devices |
| **W4 — People & groups** | Search, `/user/[id]`, sathi requests, blocking, `/groups` + `/groups/[id]`, ShareDialog w/ picker + real copy-link | Full loop: find person on web → request → accept on phone → chat opens both sides |
| **W5 — The rest + polish** | Help/consultants/booking/apply, profile + avatar upload, settings (all real rows incl. delete account), admin queue, tips, diary, calls (app↔web call test), responsive/mobile-web pass, deploy to Vercel + domain | The §6 parity matrix is all ✅ against production backend; Lighthouse pass ≥90 accessibility |

**Sync test checklist (run at the end, phone + laptop side by side):**
post on phone → on web within one poll · like on web → count updates on phone ·
message web → phone popup + badge · open chat on phone → web badge zeroes ·
sathi request web → phone notification card · call web → phone rings (and the
reverse of each).

---

## 11. What I need from you (only 3 things, none block the start)

1. **Domain**: confirm `app.healingsathi.com` (a CNAME in GoDaddy when we deploy).
2. **Google web client id** — same Cloud Console project as
   `GoogleSignInSetup.md`, add an "OAuth Web application" id when you do that task.
3. **Go/no-go on this document.** Say "go" and W1 starts.

---

## 12. LIVE BUILD TRACKER — updated as the work happens

_Same convention as `pendingTask.md`: `[x]` done · `[~]` in progress · `[ ]` pending.
Every build session updates this section (and only this section), so the doc above
stays the stable blueprint while this is the heartbeat._

**Status: W1 + W2 + W3 DONE (2026-07-17). Build green (21 routes), lint 0 errors. NEXT: W4 — people & groups (search, profiles, sathi requests, groups, share dialog), then the W4.5 mobile-web pass.**

### W1 — Foundation + Auth
- [x] Scaffold `HealingSathiWebApp/` (Next.js 16 + TS + Tailwind v4; folder renamed from npm's lowercase requirement), tokens + light/dark (`@custom-variant dark`, next-themes class mode)
- [x] Port `src/api/*` — http.ts/authApi/resourcesApi/appSocket/chatSocket copied VERBATIM from the app (zero RN imports); web `config.ts` (NEXT_PUBLIC_API_HOST, default localhost:4000) + `tokenStorage` (localStorage, same async interface)
- [x] AuthProvider (port + `isDemo` flag in localStorage) + route guard in `(main)/layout.tsx` + demo-mode contract
- [x] Login / Signup / Email-code / Forgot-password pages (Google button explains until web client id exists)
- [x] App shell: TopBar (search→/search, bells, avatar menu w/ theme switch + sign out) + LeftNav (5 tabs + Diary/Tips/Settings, badge slot ready) + RightRail (honest W4 placeholders); stub pages for every nav destination
- [x] `npm run build` green: 18 routes, typecheck clean
- [x] DoD check: backend `db:connected`, login page renders, real sign-in round-trip from the web origin verified (token issued)
- [ ] Backend env: web origins in `CORS_ORIGIN` (dev allows all — prod-only task)
- NOTE: scaffold's `AGENTS.md` warns Next 16 has breaking changes — read `node_modules/next/dist/docs/` before unfamiliar APIs

### W1.5 — Design-consistency pass (user-requested mid-W2)
- [x] Brand lockup (`BrandMark`: gradient heart tile + gradient wordmark) replaces the plain-text splash; used on boot + auth screens
- [x] "Black & white mode": three-way ThemeToggle (light/dark/system) visible on the AUTH screens too, not just behind the avatar menu
- [x] `ConnectionArt` SVG — people bonded by arcs w/ hearts — at 8% opacity behind the login/signup card; card is translucent (bg-card/90 + blur) so it whispers through; theme-aware (currentColor)
- [x] App's COMPLETE typography adopted: TextStyles scale as `text-caption/step/body/subtitle/heading/title/hero` utilities + system font stack (the same faces the RN app renders)
- [x] App's ACTUAL icon assets: all 40 PNGs copied to `public/icons/`, tinted via CSS mask = RN `tintColor` (`Icon` component, inherits currentColor); emoji removed from LeftNav/TopBar

### W2 — Feed & posts — DONE
- [x] `/feed`: PostCard (identical layout/behavior to the app: optimistic reactions reconciled by authoritative counts, ⋯ menu w/ Edit/Delete on own posts), skeleton loading, demo banner, honest empty state w/ "Find people"
- [x] `ImageCarousel`: hover arrows + dots + n/N counter; 20s feed polling + refetch-on-focus (`useLiveData` = useLiveOrDemo's web twin, same demo contract)
- [x] Composer modal: file picker AND drag-drop, ≤10 photos, canvas compression to the app's exact policy (≤1280px JPEG data-URI), destination chips (My Feed + joined groups), content warning, char counter
- [x] `/post/[id]`: real shareable URL; full `CommentThread` (replies at any depth, ♥ support, delete-own w/ cascade warning, indent cap + collapse, "Replying to" banner) via the app's ported useComments hook
- [x] `/post/[id]/edit` (own posts; photos/destination fixed, same as the app)
- [x] Share: native `navigator.share` sheet, else copy-link ("Link copied ✓") — REAL post URLs
- [x] Build green (20 routes) · ESLint 0 errors
- [ ] DoD cross-device check (user): post from web w/ photos → see it on the phone

### W3 — Chat & notifications — DONE
- [x] Two-pane Messenger `/chats` + `/chats/[id]` (ChatsWorkspace): list w/ search +
      unread pills + 15s poll · thread w/ socket receive + 15s fallback, photo send
      (compressed), shared-post mini cards (tappable → the post), Enter-to-send,
      gradient own-bubbles, auto-scroll; call buttons explain W5 honestly
- [x] `ChatNotificationsProvider` (web port of the app's engine): unread total drives
      LeftNav badge + TopBar bell badge + the TAB TITLE "(N) HealingSathi"; open chat
      reports active (no self-toasts, auto-zero); account-level notifyOnMessages flag
- [x] In-page toast (click → the chat) + browser `Notification` when the tab is
      hidden (permission asked once; tagged per chat so repeats replace, not stack)
- [x] `/notifications`: filter tabs (All/Requests/Groups/Chats/System), sathi request
      cards w/ Accept/Decline, message notifications open their conversation,
      mark-all-read syncs the badge
- [x] **Shimmer loading everywhere** (user-requested): `Skeleton` + sweep animation —
      post-shaped skeletons on feed/post pages, chat-row skeletons in list + thread,
      notification skeletons. (Matching app-side shimmer tracked in pendingTask.md)
- [x] Build green (21 routes) · ESLint 0 errors · /chats + /notifications serve 200
- [ ] DoD cross-device check (user): phone↔web live messaging, badges zero on both

### W4.5 — Mobile-web compatibility pass (user-elevated from W5)
_Lots of people never download the app — the phone-browser experience must be
first-class, not an afterthought._
- [ ] Bottom tab bar on <768px (the app's 5 tabs), single-pane chat (list ↔ thread
      navigation), sheet-style modals for composer/share, ≥44px touch targets,
      safe-area insets, no horizontal scroll anywhere
- [ ] Test on a real phone browser against the LAN backend

### W4 — People & groups
- [ ] Top-bar + `/search` (people w/ relation status, groups, consultants)
- [ ] `/user/[id]` public profiles, sathi requests, blocking
- [ ] `/groups` + `/groups/[id]` (Posts/Members/About, join, request group)
- [ ] ShareDialog: quick row + multi-select picker + copy-link
- [ ] DoD check: find→request→accept→chat loop across web and phone

### W5 — The rest + polish + deploy
- [ ] Help: consultants, booking, become-a-consultant
- [ ] Profile (avatar upload) · Settings (all real rows incl. delete account) · Admin queue
- [ ] Tips · Diary (localStorage) · WebRTC calls (app↔web call verified)
- [ ] Mobile-web pass (bottom tabs, sheets) · accessibility ≥90 · deploy to Vercel + `app.healingsathi.com`
- [ ] Final phone↔laptop sync checklist from §10 — all green
