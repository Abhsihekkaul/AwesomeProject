# 3 · What's Left To Do (backend + frontend, explained)

_Ordered by priority within each section. "Why it matters" tells you the user-visible consequence of leaving it undone._

## 🔴 Your actions (nothing works end-to-end until these)

| # | Action | How |
|---|---|---|
| 1 | **Atlas IP whitelist** | cloud.mongodb.com → Network Access → Add Current IP (this is why `npm run dev` exits — the server itself is fine). Or `0.0.0.0/0` while pre-launch, or install local MongoDB and point `MONGODB_URI` at `mongodb://localhost:27017/healingsathi` |
| 2 | **Re-run `npm run seed`** | Creates the admin account (`admin@healingsathi.dev / password123`) + demo↔Alex sathi link |
| 3 | **Rebuild the app once** (`npm run ios` / android) | Loads the new native modules (WebRTC, in-call audio) + camera/mic permissions. Until then call buttons politely decline |
| 4 | **SMTP creds** in `HealingSathiBackend/.env` | Template in `.env.example` — makes reset/sign-in codes hit real inboxes (dev builds return `devCode` meanwhile) |
| 5 | **Google OAuth client IDs** | Walkthrough: `GoogleSignInSetup.md` at repo root |
| 6 | **Commit to git** | Everything is still uncommitted working tree |

## 🟠 Backend — leftover engineering

1. **Cloud media storage (S3 / Cloudflare R2 / Cloudinary)** — _the #1 item._ All photos (posts, chats, avatars) are base64 strings inside MongoDB documents. Consequences: Atlas free tier fills after a few hundred photos, feed responses are megabytes, videos are impossible. Plan: presigned-URL upload from the app → store URLs → add `<video>` support everywhere images work today. Unblocks: videos in posts/chats, file sharing in chat.
2. **Feed & messages pagination** — feed is `limit 50`, messages `limit 200`, no cursors. Fine now; breaks UX and bandwidth as data grows. Add `?before=<createdAt>` cursor + infinite scroll in HomeScreen/ChatRoom.
3. **Missing Mongo indexes** — `posts {group, createdAt}`, `posts {author, createdAt}`, `users {conditions}` (the condition-discovery feed queries this unindexed), name index or Atlas Search for people search (currently regex collection scan).
4. **TURN server (coturn, self-hosted)** — STUN covers same-wifi and most home/mobile NATs; symmetric/corporate NATs need TURN for calls to connect. Credentials slot exists: `ICE_SERVERS` in `src/context/CallContext.tsx`.
5. **Push notifications (FCM/APNs)** — nothing reaches a closed app: no message alerts, and **incoming calls only ring while the app is open**. Real call UX needs VoIP push (iOS CallKit / Android ConnectionService) — the biggest missing piece of the calling feature.
6. **Moderation Phase B — content reports** — PostCard has "Report Post" in its menu but it's a no-op. Add `POST /posts/:id/report` → feed the same admin review queue. Also: crisis-keyword detection → country helpline interstitials (required before US launch per marketing plan §9).
7. **Account deletion endpoint** — Settings has "Delete Forever" UI with an empty handler. GDPR/App Store requirement: `DELETE /auth/me` cascading (posts, messages, requests…), or at minimum anonymization.
8. **Comments → own collection past ~100/post** — embedded comments bloat every feed read of a viral post; 16MB doc limit is the hard ceiling.
9. **Redis (rate limits + Socket.io adapter)** — needed only when you run 2+ server instances; in-memory versions break behind a load balancer.
10. **Group leave/member-count edge cases + group chat** — groups have no group-chat room; conversations are 1:1 only.

## 🟡 Frontend — leftover engineering

1. **Call polish after rebuild testing** — the engine is written but untested on physical devices (needs two phones): verify camera flip, speaker routing, reconnect behavior, and add busy/ringback tones + call log (missed-call entries in Notifications).
2. **Video player** — blocked on cloud storage; when it lands, add `react-native-video` rendering wherever `ImageCarousel`/chat images work.
3. **HealthTips tab in GroupDetails is still demo data** — wire to `GET /tips?condition=<group.tag>`.
4. **Comment "Support" in demo mode** — works live; demo tap has no persistence (fine, but know it).
5. **i18n** — LanguageScreen persists a choice but no translations exist. Hindi first (marketing plan differentiator). Wire `i18next` with the stored value.
6. **Search screen: groups/consultants filter by beachhead tags** — search works; category chips ("Mental Health", "Autoimmune") are visual-only.
7. **Profile hero chips are hardcoded** — show `user.conditions` (data exists; EditProfile already edits them).
8. **Deep links** — `healingstream.app/p/:id` share URLs don't open the app; add universal links once the domain is real.
9. **Error/offline states audit** — most screens fall back silently; a small "You're offline" banner pattern would help testers distinguish demo vs broken.
10. **Home "member since June 2025" hardcoded on ProfileScreen** — use `user.createdAt` (the public-profile endpoint already returns it for others; add it to `publicUser` for self).

## 🟢 Nice-to-haves queued behind the above
Typing indicators + read receipts (socket events exist as a pattern) · message deletion/editing · post editing · notification preferences (Settings toggles are visual) · consultant availability calendar (booking date/time are free strings) · analytics events (WSI north-star metric needs instrumentation — see marketing.md §7).
