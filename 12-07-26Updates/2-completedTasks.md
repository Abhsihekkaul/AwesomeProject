# 2 · Everything Already Done (chronological)

_Condensed from `pendingTask.md` (the live tracker — keep using that one going forward). Every item below is implemented **and** covered by the backend smoke test where applicable (117/117 green) plus frontend `tsc` / Jest / ESLint._

## Cycle 1 — Live-wiring (2026-07-11)
- Entire app converted from dummy-data-only to **live backend everywhere**, with the demo contract: signed out = dummy data, signed in = real data only (`useLiveOrDemo`).
- Express + Mongoose backend built from scratch: auth, posts, groups, chats, sathi graph, consultants/bookings, notifications, tips.

## Cycle 2, Phase 1 — Auth & Settings hardening
- Forgot password (hashed 6-digit codes, expiry, attempt caps) — full app flow.
- Every Settings account row real: edit profile, change email, change password (other devices signed out), blocked users (enforced in chat/search/requests), language screen.
- Auth correctness: race-proof duplicate signup, per-tab form state, timing-safe sign-in, honest demo button.

## Phase 2 — Social graph & feed
- People search with relation state (+ Add Sathi, request/accept/decline flows).
- Feed = own + sathis' + joined-groups' posts; focus-refetch + 20s polling; honest empty states.

## Phase 3–4 — Sign-in options & composer
- Email-code (passwordless) sign-in + real mailer (SMTP-ready); Google Sign-In (client-ids pending); seed preserves real accounts.
- Post composer: gallery image, multi-destination posting (feed + any joined groups), polish; smoke 77/77 at the time.
- Real-time chat receive via Socket.io (send stays REST); 79/79.

## Phase 5 — Community & moderation (2026-07-12)
- **Chat attachments:** photos in chat (camera + gallery), uniform tinted iconography, generated `camera.png`.
- **Group pages live:** the "posted to a group but can't see it" bug — GroupDetails now shows real posts/members/about; FAB preselects the group.
- **Superuser moderation:** `role: admin`, `/api/admin` review queue (group proposals + consultant applications, approve/reject with notifications), AdminReviewScreen behind Settings; seeded `admin@healingsathi.dev / password123`.
- **True threaded comments:** replies at any depth, likes on comments, Reddit-style capped indentation + collapsible branches ("View N replies").
- **Concurrent engagement:** atomic pull-then-add reactions (parallel taps can never double-count — proven in the smoke test with simultaneous requests), authoritative counts reconciling optimistic UI.
- **Public profiles:** member-since, their posts, liked posts, relation; Message + Add Sathi; tap-through from every avatar/name in the app (feed, comments, members, search, chat header, notifications).
- **Sathi-accept auto-creates the chat** ("You're now sathis — say hi 👋") + acceptance notification.
- **Feed like a real platform:** condition-based discovery (posts from condition-matched groups and same-condition people), honest per-account home counts.
- Docs: `currentArchitecture handling capabilities.md` capacity analysis.

## Phase 6 — Live-testing fixes (2026-07-12, as reported)
- Notification request cards → tap opens requester's profile.
- "My Friends"/"My Groups" directory live-wired (was the last dummy screen).
- Bottom sheets respect safe area on every device; iOS-specific KeyboardAvoidingView padding bug fixed (spacer that collapses while typing).
- **Share = real sharing:** top-5 recent chats/sathis, tap sends the post **as a structured card** (mini PostCard in the bubble → opens the full post), not a dead link; "See all in Chats" deep-link; per-person "Sent ✓".
- Shared-card UI polish; `AutoHeightImage` (photos keep true proportions everywhere); fullscreen photo viewer in chat.

## §24–27 — The latest wave
- **Multi-photo posts:** up to 10 photos, Instagram-style swipeable `ImageCarousel` (dots + "2/7"), thumbnail management in the composer, backend cap enforced. 117/117.
- **Profile photo (DP):** camera-badge on the profile avatar → take/choose/remove; shows everywhere avatars appear.
- **WebRTC audio/video calling — self-hosted:** signaling on our own Socket.io (contact-checked per event), P2P media, full call engine (CallContext state machine, ICE queueing, busy handling), CallOverlay above the whole app (accept/decline, PiP, mute/speaker/flip/video-toggle, timer), permissions both platforms, native modules lazy-loaded (won't crash an un-rebuilt binary — includes the iOS NativeModules guard fix).
- **Marketing:** `marketing.md` GTM plan (IN/US/CA), `marketing/pitch-deck.md` + published visual deck.
