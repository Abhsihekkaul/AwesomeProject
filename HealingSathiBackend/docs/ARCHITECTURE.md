# Architecture

## Layout


```
src/
  server.ts              boots Fastify, waits for .ready(), attaches Socket.io, listens
  app.ts                 builds the Fastify instance, registers CORS + Mercurius, error formatting
  config/env.ts          zod-validated environment variables (fails fast on missing/invalid config)
  lib/prisma.ts          singleton PrismaClient
  lib/auth.ts            JWT sign/verify (access + refresh), argon2 password hash/verify
  middleware/authenticate.ts   extracts a userId from a Bearer token (or null)
  graphql/
    schema/*.ts           SDL per domain, as `/* GraphQL */` template strings (root.ts defines
                           the base `type Query`/`type Mutation`; every other file `extend`s them)
    resolvers/*.ts         resolver maps per domain, merged in graphql/index.ts
    context.ts             per-request context: { prisma, userId }
    mergeResolvers.ts       shallow-merges each domain's Query/Mutation/Type resolver objects
    index.ts                concatenates all schema strings + merges all resolvers
  modules/<domain>/service.ts   business logic, called by both GraphQL resolvers and Socket.io
                                handlers — resolvers stay thin, services own the Prisma queries
  sockets/
    index.ts               Socket.io server: JWT handshake auth, room joins, message events
    realtime.ts             `emitToUser` / `emitToConversation` helpers, usable from any module
                            (e.g. modules/notifications/service.ts calls emitToUser)
prisma/
  schema.prisma            all models
  seed.ts                   conditions catalog + demo users/group/healer/conversation
```

**Why services are separate from resolvers:** chat messages can arrive over Socket.io *or*
the `sendMessage` GraphQL mutation (offline-safe fallback), and both need identical
persistence + validation logic. Keeping that logic in `modules/chat/service.ts` means neither
path duplicates it.

## Data model, by domain

- **Users** — `User`, `Condition` (catalog + implicit many-to-many), `RefreshToken`.
- **Groups/Posts/Comments** — `Group`, `GroupMembership`, `GroupProposal` (the
  "request a new group" flow), `Post`, `PostReaction` (two independent reaction types —
  Support/Helpful, not a single generic "like"), `ShareEvent`, `Comment` (self-referencing
  `parentId` for Reddit-style nesting), `CommentVote`.
- **Chat** — `Conversation`, `ConversationParticipant` (tracks `lastReadAt`, which is how
  unread counts are derived — no per-message read receipts), `Message`.
- **Booking** — `HealerProfile` (1:1 with `User`), `Review`, `AvailabilityRule` (a weekly
  recurring rule: day-of-week + start/end time + session length), `Slot` (a materialized,
  individually-bookable time range generated from a rule), `Booking` (claims exactly one
  `Slot` — enforced by a unique constraint on `Booking.slotId`).
- **Notifications** — `Notification` with a `deepLinkType`/`deepLinkId` pair so the client can
  navigate directly to the source (post, conversation, booking) on tap.

## Design decisions worth knowing

**One `User` model, no separate doctor signup.** `src/requirements.md` in the RN app raised
this as an open question ("do we need a separate sign-in for doctors?"). This backend answers
it the Instagram way: everyone signs up the same way, and `becomeHealer` is a follow-on
mutation that attaches a `HealerProfile` (gated by an admin-set `verified` flag before the
healer appears in public listings).

**Threaded comments are lazy/paginated, not a materialized path.** `Comment.replies(first,
after)` is a field resolver that queries children of that specific comment on demand. This
matches the RN app's `CommentsSheet` component, which already renders replies recursively —
the backend just serves the shape the UI expects. A full materialized-path or nested-set model
would only be worth the complexity at a much larger comment-volume scale.

**Booking is fully custom, not built on Cal.com.** This was an explicit choice (see
`LATER_WORKFLOW/Booking.md` in the RN app, which raised Cal.com as an option) in favor of
keeping everything in one Postgres schema with no second service to run. The tradeoff: no
external-calendar sync, no automatic video-call link generation, no timezone-conversion engine
— see "Follow-up work" below.

**Reaction/comment/share counts are denormalized onto `Post`**, updated inside the same
Prisma transaction that creates the reaction/comment/share row. This keeps feed reads cheap
(no `COUNT()` fan-out per post) at the cost of needing every write path to remember to update
the counter — all of them live in `modules/posts/service.ts` and
`modules/comments/service.ts`, not scattered across resolvers.

**No DataLoader / batching yet.** Nested GraphQL fields (e.g. `Post.author`, `Comment.author`)
use simple one-off Prisma queries with a "use preloaded data if present, else fetch by id"
fallback (see `User.conditions` in `graphql/resolvers/users.ts` for the pattern). This is fine
at demo/MVP scale; a query hitting N posts by N different authors will issue N extra queries.
If/when this matters, introduce `dataloader` in the context builder.

## Real-time design

Socket.io is mounted on the *same* HTTP server Fastify listens on (see `server.ts`), not a
separate port. Auth happens once, at handshake time, via the token passed in
`socket.handshake.auth.token` (verified the same way as GraphQL's `Authorization: Bearer`
header). Every connected socket auto-joins a `user:{id}` room for personal notification
delivery; it must explicitly `conversation:join` a `conversation:{id}` room to receive that
thread's messages.

Flow for a chat message: client emits `message:send` → `modules/chat/service.ts` persists it
via Prisma → the server broadcasts `message:new` to the conversation room → the server also
calls `modules/notifications/service.ts#notifyUser` for every *other* participant, which both
writes a `Notification` row and emits `notification:new` to that user's personal room. The
same `notifyUser` call is reused by the booking flow (new-booking notifications to the
healer) — it's the one place that couples "persist" and "push" so nothing forgets to do both.

## Follow-up work

Explicitly out of scope for this pass (flagged here rather than left as a silent gap):

- **Google / Apple sign-in** — `signInWithGoogle`/`signInWithApple` mutations exist in the
  schema and throw `NotImplementedError` pointing at `modules/auth/service.ts`. Needs real
  `GOOGLE_CLIENT_ID`/`APPLE_CLIENT_ID` values and server-side id-token verification.
- **Payments + video-call links for bookings** — a `Booking` today is just a confirmed
  calendar claim. Stripe (or similar) for payment and Zoom/Meet link generation on
  confirmation are the natural next additions, and don't require reshaping the schema.
- **Push notifications to native devices** — Socket.io only delivers to currently-connected
  clients. A backgrounded phone needs APNs/FCM, which isn't wired up.
- **DataLoader/batching** — see above.
- **Connecting the RN app to this API** — every screen in the mobile app still renders local
  dummy arrays. Wiring them up (Apollo/urql client, replacing `dummyPost.ts` etc.) is a
  separate, sizeable follow-up.
