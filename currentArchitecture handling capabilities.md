# Current Architecture — Handling Capabilities & Scaling Plan

_Written 2026-07-12. Re-evaluate after cloud media storage lands (it changes every number below)._

## 1. What the architecture is today

```
React Native app ──REST (axios) + polling──▶ Node/Express (single process)
        │                                        │
        └────Socket.io (receive-only chat)───────┤
                                                 ▼
                                          MongoDB Atlas (Mongoose)
```

- **One Node process** serves REST + Socket.io on the same port (Render/Railway-style single dyno).
- **JWT auth** (15-min access + revocable refresh tokens in Mongo).
- **Freshness model:** refetch-on-focus everywhere, plus silent polling — home feed every 20s, chat room every 15s, chat list every 15s. Chat receive is realtime via socket; everything else is polling.
- **Media:** images travel and live as **base64 data-URIs inside Mongo documents** (posts + chat messages), capped ~6MB before encoding, 10MB JSON body limit.
- **Comments are embedded** in the post document (flat array with `parentId` threading).
- **Rate limiting is in-process memory** (express-rate-limit): 300 req/min global, 30/15-min auth.

## 2. Honest capacity estimate (as deployed today)

Assume a small host (0.5–1 vCPU, 512MB–1GB RAM) + Atlas **M0 free tier** (512MB storage, ~100 ops/sec sustained, 500 connections).

| Dimension | Comfortable | Breaking point | What breaks first |
|---|---|---|---|
| Registered users | ~1,000–2,000 | ~5,000 | Nothing directly — accounts are cheap (~2KB each) |
| Daily actives | ~150–300 | ~500–800 | Atlas M0 op/sec ceiling from polling |
| Concurrent app-open users | ~50–150 | ~300 | Feed query fan-out (3 queries + populate per poll) |
| Concurrent socket connections | ~2,000–5,000 | ~10,000 | Node FD/memory limits, single process |
| Photo posts/messages | **~150–400 total** | 512MB storage | **Base64 images in Mongo — this is the #1 limiter** |
| Requests/sec (API) | ~100–300 | ~500–1,000 | Single Node process CPU (JSON parse of 10MB bodies hurts) |

**The math that matters:**

- **Polling load:** an open app fires ~6–8 requests/min. 300 concurrent open apps ≈ 30–40 req/sec sustained — fine for Node, but each feed request now runs `User.findById` + `Group.find` + condition-discovery lookups (regex group match + same-condition peers) + `Post.find($or…$in)` + two populates: ~5–6 Mongo ops per poll. On M0 that's ~150–200 Mongo ops/sec → **you saturate the free tier's op budget at roughly 250–300 concurrent open apps.** (The condition regexes and `users.conditions` lookup are unindexed today — add `users {conditions:1}` and consider caching the group-id list per user for a few minutes when this becomes hot.)
- **Storage:** one compressed photo ≈ 300–800KB → **base64 inflates it ×1.33** → a 500KB photo costs ~670KB of document. M0's 512MB fills after roughly **400–700 photos** (posts + chat photos + their copies per multi-destination post). This arrives *long* before user-count limits do.
- **Bandwidth:** the group/feed endpoints return full documents **including the base64 image of every post** — 50 posts with photos ≈ a 20–30MB JSON response worst-case. On mobile data this is the first thing a user *feels*.

**Bottom line: today's build is a solid 500–1,000-user MVP (couple hundred daily actives), and the ceiling is media storage/bandwidth — not compute, not user count.**

## 3. What breaks, in order, as you grow

1. **Base64 media** (storage + response size + JSON parse CPU) — breaks at hundreds of photos.
2. **Atlas M0 op/sec** under polling — breaks at ~300 concurrent open apps.
3. **Unpaginated feed** (`limit 50`, no cursor) + **regex user search** (collection scan, no index) — degrades linearly with data size.
4. **Embedded comments** — a viral post with thousands of comments bloats every feed read of that post (16MB document hard cap ≈ ~10k comments before Mongo refuses writes).
5. **Single process** — one crash = whole API + all sockets down; in-memory rate limits reset on restart and double-count behind a load balancer.
6. **Missing indexes** — posts have only `createdAt`; feed filters on `author`/`group` without compound indexes.

## 4. Optimization roadmap (highest leverage first)

### Phase A — before ~1k users (do these next)
1. **Cloud media storage (S3 / Cloudflare R2 / Cloudinary).** Upload from the app → store a URL in Mongo. Kills the storage ceiling, shrinks responses ~50×, enables videos and a CDN. *Single biggest win; everything else is secondary.*
2. **Indexes:** `posts {group:1, createdAt:-1}`, `posts {author:1, createdAt:-1}`, `messages {conversation:1, createdAt:1}` (partially exists), and a case-insensitive index or Atlas Search on `users.name`.
3. **Cursor pagination** on feed (`?before=<createdAt>`) and messages, with `select("-image")`-style projections for list views once images are URLs.

### Phase B — ~1k → 10k users
4. **Atlas M10** (dedicated) — predictable ops/sec, backups.
5. **Replace feed polling with a socket nudge** (`feed:updated` on the existing user room) → clients refetch only when something actually changed. Cuts steady-state load ~80%.
6. **Push notifications (FCM/APNs)** — closes the app-closed gap and reduces the *need* for aggressive freshness.
7. **Comments → own collection** past ~100/post (keep a `commentCount` on the post).

### Phase C — 10k+ users / multi-instance
8. **Redis**: shared rate-limit store + Socket.io adapter → run 2+ Node instances behind a load balancer (the app is otherwise stateless — JWTs make this easy).
9. **Read caching** for the group directory / consultants / tips (they change rarely).
10. **Observability**: pino structured logs, `/metrics`, error tracking (Sentry) — you can't scale what you can't see.

## 5. What's already right (don't rebuild these)

- Stateless JWT auth → horizontal scaling is a config change, not a rewrite.
- Send-over-REST / receive-over-socket chat keeps validation and rate limiting in one place and degrades gracefully.
- Refetch-on-focus + silent polling gives correct UX today and coexists with the Phase B socket-nudge upgrade.
- Mongoose models centralized in one file; adding indexes is a one-line change per model.
- The demo/live split (`useLiveOrDemo`) means load testing never risks demo UX.
