# 17-07-26 Updates — Chat notifications + "My Feed" label fix

The five tasks added to `pendingTask.md` on 16/07/26, all completed. This doc explains
what changed, where, and how it works — same style as the `12-07-26Updates/` pack.

---

## What you can see in the app now

1. **Message popup anywhere** — when someone messages you, a banner slides down from
   the top of whatever screen you're on: their avatar, name, and the message preview.
   Tap it to jump into the chat; ✕ or wait ~4.5s to dismiss. It never pops for the
   conversation you're currently reading.
2. **Turn it off** — Settings → Notifications → **Chat messages**. Off = no popups and
   no Notifications-page entries. Unread counts still tick (like a muted chat on
   WhatsApp), so nothing silently disappears.
3. **Unread badge on the Chats tab** — a red count pill on the tab-bar icon (and a
   per-conversation count in the Chats list). Opening a chat zeroes its counter
   instantly, on the server and on the badge.
4. **Messages on the Notifications page** — "New message from {name}" entries under
   the existing Chats filter. Many messages from one conversation collapse into a
   single fresh entry (no flooding). Tapping the entry opens the conversation;
   reading the chat marks the entry read.
5. **Feed posts no longer say "My Feed"** — a post to your personal feed shows just
   the author and time. Only real groups get "{Group} • 2h ago" and "in {Group}".

## Backend changes (`HealingSathiBackend/`)

### Models (`src/models/index.ts`)
- `Conversation.unreadCounts` — a `{ userId → count }` map. Every message `$inc`s the
  counter of everyone but the sender (atomic — two parallel sends can never lose a
  count). Reset to 0 by the read endpoint.
- `Notification.chatId` — message notifications remember their conversation, which is
  both the tap-through target and the key for collapsing repeats.
- `User.notifyOnMessages` (default `true`) — the chat-notifications toggle, stored on
  the account so it follows the user across devices.

### Routes
- `GET /chats` (`src/routes/chats.ts`) now returns `unread` per conversation.
- **New** `POST /chats/:id/read` — zeroes the caller's unread counter for that chat
  and marks its unread message notifications read. Membership-checked (404 on
  foreign chats, same as every other chat route).
- `POST /chats/:id/messages` additionally:
  - `$inc`s the recipients' `unreadCounts`;
  - enriches the `chat:updated` socket event with `fromUserId` + `fromName`
    (this is the popup's payload; `last`/`time` are unchanged for old clients);
  - writes the Notifications-page entry — deletes the previous *unread* entry for the
    same conversation first, so each chat holds at most one fresh entry — and skips
    all of it when the recipient turned `notifyOnMessages` off.
- `PATCH /auth/me` accepts `notifyOnMessages: boolean`; the flag ships in every auth
  payload (`publicUser`).
- `GET /notifications` returns `chatId` so the app can open the conversation.
- `shapePost` (`src/routes/posts.ts`): `circle` is now `""` for personal-feed posts
  instead of `"My Feed"` — the label fix is one line at the source of truth.

### Smoke test (`npm run test:smoke`) — 117 → **129/129**
New checks: recipient unread 1 / sender 0 → second message → 2; notification created
with `chatId` and collapsed to one unread entry; read endpoint zeroes the counter and
read-syncs the notification; toggle off = no entry while unread still counts;
`chat:updated` carries the sender's name.

## Frontend changes

### New files
- `src/context/ChatNotificationsContext.tsx` — the engine. While signed in it listens
  for `chat:updated` on the shared app socket (same socket the call engine uses;
  `connectAppSocket` is idempotent), tracks the total unread count, owns the popup
  banner state and the on/off preference (AsyncStorage mirror + `PATCH /auth/me`).
  `ChatRoomScreen` registers the conversation it's showing, so its own messages are
  auto-marked read instead of popping.
- `src/components/ui/ChatMessageBanner.tsx` — the popup itself, rendered in `App.tsx`
  above the navigator (next to `CallOverlay`), spring-animated, theme-aware.
- `src/navigation/navigationRef.ts` — navigation handle for UI living outside the
  `NavigationContainer` (the banner navigates through it).

### Touched files
- `App.tsx` — `ChatNotificationsProvider` wraps the navigator; banner mounted.
- `src/navigation/AppNavigator.tsx` — `NavigationContainer` gets the `navigationRef`.
- `src/navigation/MainTabNavigator.tsx` — count pill on the Chats tab (99+ cap;
  0 = hidden; always 0 signed out).
- `src/features/chat/ChatsScreen.tsx` — real per-chat unread counts as a count pill
  (demo list keeps its dummy counts in demo mode).
- `src/features/chat/ChatRoomScreen.tsx` — on focus: reports itself active + marks the
  chat read (`useFocusEffect`, so stacked chat screens hand over correctly). Also the
  shared-post card only says "in {group}" when there is a group.
- `src/features/profile/SettingsScreen.tsx` — the "Chat messages" toggle (the first
  fully real switch in the Notifications section).
- `src/features/notifications/NotificationsScreen.tsx` + `NotificationCard.tsx` —
  message notifications are tappable and open their conversation.
- `src/components/ui/PostCard.tsx` / `src/features/posts/PostDetailsScreen.tsx` —
  empty `circle` renders as just the timestamp / no "in …" subtitle.
- `src/api/resourcesApi.ts` (`markChatRead`) · `src/api/authApi.ts`
  (`notifyOnMessages` in `ApiUser` + `updateMe`).

## Design notes / honest limits
- **In-app only for now.** Popups and badges work while the app is open (foreground).
  True OS-level push with the app closed needs FCM/APNs — roadmap Phase B; the
  per-user socket rooms, unread counters and preference flag are ready for it.
- The unread counter lives on the conversation document (O(1) reads, no message
  scans) — the same pattern big chat apps use at MVP scale.
- Collapsing message notifications (delete-unread-then-create) keeps the page useful
  and keeps ordering natural without fighting Mongoose's immutable `createdAt`.
- No rebuild needed: everything here is pure JS/TS — an app reload picks it up.

## Verification
- Backend: `npx tsc --noEmit` clean · smoke test **129/129**.
- Frontend: `npx tsc --noEmit` 0 errors · Jest green · ESLint 0 errors on changed
  files (only the repo's pre-existing style warnings).

---

# Second pass, same day — share picker + real account deletion

## 1. Share sheet: multi-select without losing your place

**The problem:** the quick-send row worked, but "See all in Chats..." navigated you
to the Chats tab — you lost the post you were looking at and could only share
one person at a time.

**Now (`src/components/ui/ShareSheet.tsx`):** the sheet has two modes.
- *Quick* (unchanged): top 5 most-recent conversations, tap = instant "Sent ✓",
  plus the native share row.
- *Picker*: "Choose people..." expands the same sheet — a search bar over ALL your
  conversations merged with all your sathis (deduped by person; a sathi without a
  chat gets one created on send), tap rows to select (✓ circles, header counts
  "Share with N people"), one **Share (N)** button fans the post card out to
  everyone in parallel, then the sheet closes and you're back where you were.
  If some sends fail, the successful ones are done and the failures stay selected
  with an alert, so a single retry finishes the job.

## 2. Real account deletion (backlog item A1)

**Backend** — new `DELETE /api/auth/me { password, reason, feedback? }` in
`src/routes/auth.ts`:
- Password check first (same pattern as change-email/change-password; Google-only
  accounts create a password via forgot-password).
- **Exit interview**: `reason` is required, `feedback` optional. Both are stored in
  a new anonymous `ExitFeedback` collection (`reason`, `details`, `memberForDays`)
  BEFORE the erase — deliberately not linked to the user, so the team can learn
  without keeping personal data.
- Then the erase: their posts (and other users' dangling `savedPosts` refs to
  them), their comments and reactions on everyone else's posts, all their
  conversations + messages (both sides — matches the Settings copy), sathi links
  and requests, group memberships and pending group proposals, bookings,
  consultant applications, notifications, and every refresh token/session.

**App** — Settings' "Delete my account" (previously a dead confirm dialog) now
opens `src/features/settings/DeleteAccountScreen.tsx`: a danger-bordered warning
card listing exactly what disappears, required reason chips ("I got the support I
needed", "Couldn't find people like me", "Privacy concerns", "Too many
notifications", "The app was confusing or buggy", "Something else"), an optional
"anything we could have done better?" box, the password field, and a final
"Delete forever?" dialog. On success the session clears and the app resets to
Onboarding. In demo mode the row explains there's no account to delete.

## Verification (second pass)
- Backend: typecheck clean · smoke test **137/137** (8 new checks: reason required,
  wrong password rejected, erase succeeds, exit feedback stored, ghost sign-in
  fails, posts gone, comments pulled from other posts, conversation vanishes for
  the other participant).
- Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors on changed files.

---

# Third pass, same day — edit & delete your own content (backlog B1)

Before this, the backend had **no** edit or delete route for user content at all.

**Backend (`src/routes/posts.ts`):**
- `PATCH /posts/:id { title?, content?, contentWarning? }` — author-only. The query
  filters by author, so someone else's post answers 404 (not 403) and post ids
  can't be probed for ownership. Photos and the posting destination are
  deliberately not editable (delete and repost).
- `DELETE /posts/:id` — author-only; the post is also `$pull`ed from every user's
  saved list so nothing dangles.
- `DELETE /posts/:id/comments/:commentId` — allowed for the comment's author OR
  the post's author (moderating their own post); anyone else gets 403. Comments
  are stored flat with `parentId`, so the route walks the tree and removes the
  whole branch — replies to a deleted comment never orphan.

**App:**
- `PostCard` ⋯ menu: on your own live posts it now shows **Edit Post** →
  `src/features/posts/EditPostScreen.tsx` (title + text; every feed refetches on
  focus so the change shows immediately) and **Delete Post** (confirm dialog →
  the card hides optimistically and rolls back if the server says no).
- Comment threads (both `CommentsSheet` and `PostDetailsScreen`): your own
  comments get a red **Delete** action; the confirm warns when replies will go
  with it. `useComments` gained `removeComment` — optimistic subtree removal,
  server refresh reconciles (and restores the thread if the delete was rejected).

**Verification (third pass):** backend typecheck clean · smoke **146/146**
(foreign edit 404, own edit persists, stranger comment-delete 403, reply cascade,
post-author moderation, foreign post-delete 404, deleted post gone + wiped from
saved lists) · frontend `tsc` 0 errors · Jest green · ESLint 0 errors on changed
files.
