# API Reference

Single GraphQL endpoint: `POST /graphql` (GraphiQL explorer at `/graphiql` in development).
Authenticate by sending `Authorization: Bearer <accessToken>` on every request after signing
in. Real-time chat/notifications go over Socket.io — see the bottom of this doc.

All examples below use `curl`; swap in your own token where shown.

## Auth

```graphql
mutation SignUp {
  signUp(email: "jane@example.com", password: "hunter2", name: "Jane") {
    accessToken
    refreshToken
    user { id name email }
  }
}

mutation SignIn {
  signIn(email: "jane@example.com", password: "hunter2") {
    accessToken
    refreshToken
    user { id name }
  }
}

mutation Refresh {
  refreshAccessToken(refreshToken: "<refreshToken>") {
    accessToken
    refreshToken
  }
}
```

`signInWithGoogle(idToken)` / `signInWithApple(idToken)` are defined in the schema but throw
`NOT_IMPLEMENTED` until `GOOGLE_CLIENT_ID`/`APPLE_CLIENT_ID` are configured (see README).

```bash
curl http://localhost:4000/graphql -H 'Content-Type: application/json' -d \
  '{"query":"mutation { signIn(email:\"patient@healingsathi.dev\", password:\"password123\") { accessToken } }"}'
```

## Users

```graphql
query Me {
  me { id name email bio conditions { name category } }
}

query Catalog {
  conditions { id name category }
}

mutation UpdateMe {
  updateProfile(input: {
    bio: "Living with fibromyalgia, here to connect."
    conditionNames: ["Fibromyalgia", "Anxiety Disorder"]
    publicProfile: true
  }) {
    id bio publicProfile conditions { name }
  }
}
```

## Groups

```graphql
query Groups { groups(category: "Chronic Pain") { id name memberCount isJoined myRole } }
query OneGroup { group(id: "...") { name description members: memberCount } }
query Members { groupMembers(groupId: "...") { user { name } role } }

mutation Propose {
  proposeGroup(input: {
    conditionName: "POTS"
    briefDescription: "Postural orthostatic tachycardia syndrome"
    whyNeeded: "No dedicated space for this condition yet"
  }) { id status }
}

mutation Join { joinGroup(groupId: "...") { id isJoined memberCount } }
mutation Leave { leaveGroup(groupId: "...") { id isJoined } }
```

## Posts & threaded comments

```graphql
query Feed {
  feed(first: 20) {
    id body title tags contentWarning images
    supportCount helpfulCount commentCount shareCount myReactions
    author { name }
    group { name }
  }
}

query GroupFeed { group(id: "...") { posts(first: 20) { id body } } }

mutation Post {
  createPost(input: { groupId: "...", body: "How is everyone managing flare-ups?", tags: ["flares"] }) {
    id
  }
}

mutation React { reactToPost(postId: "...", type: Support) { supportCount myReactions } }
mutation Unreact { removeReaction(postId: "...", type: Support) { supportCount } }
mutation Share { sharePost(postId: "...") { shareCount } }
```

Threaded comments — `Post.comments` returns only root comments; each `Comment.replies` is a
lazily-resolved, paginated field, so deep threads don't cost anything until the client asks
for them:

```graphql
query Thread {
  post(id: "...") {
    comments(first: 10) {
      id text author { name } voteCount myVote replyCount
      replies(first: 5) {
        id text author { name } replyCount
        replies(first: 5) { id text author { name } }
      }
    }
  }
}

mutation Reply {
  createComment(postId: "...", parentId: "...", text: "Same here, journaling helps a lot.") { id depth }
}

mutation Vote {
  "value: 1 = upvote, -1 = downvote, 0 = remove your vote"
  voteComment(commentId: "...", value: 1) { voteCount myVote }
}
```

## Chat

Use GraphQL for history/inbox; use Socket.io for live delivery (below) — `sendMessage` the
mutation is a REST-safe fallback for the same write path.

```graphql
query Inbox { conversations { id unreadCount lastMessage { text createdAt } participants { name } } }
query History { messages(conversationId: "...", first: 30) { id text sender { name } createdAt } }

mutation Start { startConversation(userId: "...") { id } }
mutation Send { sendMessage(conversationId: "...", text: "Hey!") { id createdAt } }
mutation Read { markConversationRead(conversationId: "...") { unreadCount } }
```

## Consultants / Booking

```graphql
query Healers { healers(specialty: "CBT") { id title priceMin priceMax ratingAvg user { name } } }

query Dates {
  "date-picker row: [{ label: 'Mon\n10', available: true }, ...]"
  healerAvailableDates(healerId: "...", from: "2026-07-06T00:00:00.000Z", to: "2026-07-20T00:00:00.000Z") {
    label available date
  }
}

query Times {
  "time-picker row for one chosen day; slotId is what you book against"
  healerTimeSlots(healerId: "...", date: "2026-07-06T00:00:00.000Z") { slotId label available }
}

mutation BecomeHealer {
  becomeHealer(input: {
    title: "Clinical Psychologist", bio: "..."
    specialties: ["CBT"], languages: ["English"]
    sessionTypes: [Video, Chat], priceMin: 80, priceMax: 120
  }) { id verified }
}

mutation SetHours {
  setAvailabilityRules(rules: [
    { dayOfWeek: 1, startTime: "09:00", endTime: "13:00", sessionType: Video, slotMinutes: 60 }
  ]) { id }
}

mutation MakeBookable {
  "materializes bookable Slot rows from your AvailabilityRules; returns count created"
  generateSlots(fromDate: "2026-07-06T00:00:00.000Z", toDate: "2026-07-20T00:00:00.000Z")
}

mutation Book { createBooking(slotId: "...", notes: "First session") { id status sessionType } }
mutation Cancel { cancelBooking(bookingId: "...") { status cancelledAt } }
query Mine { myBookings { id status slot { startAt } healer { title } } }

mutation Review { writeReview(healerId: "...", stars: 5, text: "Really helped me.") { id } }
```

`createBooking` runs inside a transaction that atomically flips the `Slot` to `Booked` —
booking an already-booked slot returns a `CONFLICT` error rather than double-booking.

## Notifications

```graphql
query Inbox { notifications(first: 30) { id type title message read deepLinkType deepLinkId } }
query Count { unreadNotificationCount }
mutation Read { markNotificationRead(id: "...") { read } }
mutation ReadAll { markAllNotificationsRead }
```

## Error shape

Errors thrown from services (`UnauthorizedError`, `NotFoundError`, `ConflictError`,
`ForbiddenError`, `ValidationError`, `NotImplementedError`) surface with a matching
`extensions.code`:

```json
{
  "errors": [
    { "message": "Invalid email or password", "extensions": { "code": "UNAUTHORIZED" } }
  ]
}
```

## Real-time (Socket.io)

Connect with the access token in the handshake, not a header:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:4000", { auth: { token: accessToken } });
```

| Event (client → server) | Payload | Effect |
|---|---|---|
| `conversation:join` | `conversationId` | joins that conversation's room |
| `conversation:leave` | `conversationId` | leaves it |
| `message:send` | `{ conversationId, text, attachmentUrl? }` | persists + broadcasts `message:new`; ack `{ ok, error? }` |

| Event (server → client) | Payload | Delivered to |
|---|---|---|
| `message:new` | the created `Message` (with `sender`) | everyone in `conversation:{id}` |
| `notification:new` | the created `Notification` | the recipient's own `user:{id}` room, always joined on connect |
