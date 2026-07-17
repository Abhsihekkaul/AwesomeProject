# pendingTask.md — Live task tracker

_Last updated: 2026-07-12, second cycle (Phase 5 — community & moderation — and
Phase 6 — live-testing fixes — both done). Previous cycle (live-wiring, 2026-07-11):
see `FinalCheckpoint.md` (kept intact) and `HealingSathiBackend/checkpoint.md`._

Legend: `[x]` done · `[~]` in progress · `[ ]` pending

---

## Phase 1 — Auth & Settings hardening

### 1. Forgot password (frontend + backend) — DONE
- [x] Backend: `PasswordReset` model (hashed 6-digit code, 10-min expiry, 5-attempt cap, TTL cleanup)
- [x] Backend: `POST /auth/forgot-password` (never reveals if the email exists; dev builds return `devCode` until an email service is wired)
- [x] Backend: `POST /auth/reset-password` (verifies code, sets new password, revokes ALL sessions)
- [x] App: `ForgotPasswordScreen` (email → code → new password), linked from Auth screen's "Forgot password?"

### 2. Settings — every Account row is real — DONE
- [x] Edit profile → `EditProfileScreen` (name, avatar color, conditions) via `PATCH /auth/me`
- [x] Change email → `ChangeEmailScreen` + `POST /auth/change-email` (password-confirmed, 409 on taken email)
- [x] Change password → `ChangePasswordScreen` + `POST /auth/change-password` (current password required; other devices signed out, this one survives)
- [x] Blocked users → `BlockedUsersScreen` + `GET /users/blocked`, `POST /users/:id/block|unblock` — enforced in chat, search and sathi requests
- [x] Language → `LanguageScreen` (persisted on-device via AsyncStorage; i18n boots from it later)
- [x] Settings rows show real data (signed-in email) and gate on auth where needed

### 3. Auth correctness ("big-tech" auth behavior) — DONE
- [x] Duplicate signup: backend already 409'd on existing email; added race-proof E11000
      handling at the DB level. Error message reaches the UI (verified in smoke test).
      NOTE: the earlier "signed up twice with the same id" almost certainly happened
      while the old "Try the Demo" button silently jumped to ProfileSetup — it looked
      like a successful signup but created no account. Fixed (below).
- [x] Sign-in/sign-up state bleed fixed: each tab owns its own form state; errors clear on tab switch
- [x] Timing-safe sign-in (dummy bcrypt compare when the account doesn't exist)
- [x] Password minimum (8 chars) enforced client-side on signup/reset/change too
- [x] "Try the Demo" honors the demo contract: straight to signed-out MainTabs (dummy data), no fake account path

## Phase 2 — Social graph & live feed

### 4. People search & connections — DONE
- [x] Backend: `GET /users/search?q=` (name regex / exact email, excludes self + blocked-either-way, returns relation: none|pending|sathi)
- [x] SearchScreen live: debounced people search, live groups + consultants when signed in
- [x] "+ Add Sathi" sends a real request (optimistic, rolls back on failure); tapping a Sathi opens/creates the 1:1 chat

### 5. Real-time feed — DONE (includes the reported "post doesn't show up" anomaly)
- [x] `useLiveOrDemo` refetches on screen focus → a new post is visible the moment you're
      back on Home/Profile (this was the reported anomaly: screens only fetched on mount)
- [x] Home feed: pull-to-refresh + silent 20s polling while focused
- [x] Feed scoping: my posts + my sathis' posts + posts in my groups (the graph forms the feed)
- [x] Honest empty state on a fresh account's feed with a "Find people" button
- [x] Seed updated: demo ↔ Alex are sathis, so the demo account's feed shows a friend's posts

### 6. "Join as a consultant" (become a doctor) — DONE
- [x] Backend: `ConsultantApplication` model + `POST/GET /consultants/apply`
      (one per user; rejected → may resubmit; pending/approved → 409)
- [x] App: `BecomeConsultantScreen` (specialty, credentials, license, experience, bio,
      languages) wired from Psychological Help's "Join as a consultant →"; shows review
      status once submitted

## Phase 3 — Verification & docs — DONE
- [x] Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors (pre-existing style warnings only)
- [x] Backend: typecheck clean · smoke test extended 42 → **69/69 checks** (search,
      blocking, feed scoping, forgot/reset/change password, change email, applications)
- [x] README written; this tracker updated; checkpoint appended to `FinalCheckpoint.md`

---

## Phase 4 — Sign-in options (added 2026-07-12, after live testing)

### 7. Root-cause: "can't find Sarab in search"
- [x] Diagnosed live: search endpoint works — the Sarab account no longer exists in the
      DB. `npm run seed` wiped ALL users, including real test signups.
- [x] Seed preserves real accounts now (only wipes `@healingsathi.dev` demo users + demo content)
- [ ] User action: sign Sarab up again after this fix

### 8. Real email delivery + email-code sign-in — DONE (code); SMTP env = user action
- [x] Mailer util (Nodemailer; Gmail SMTP via `SMTP_*` env vars; console + devCode fallback in dev)
- [x] `LoginCode` model + `POST /auth/email-code/request` + `POST /auth/email-code/verify`
      (hashed codes, 10-min expiry, 5-attempt cap, single-use)
- [x] Forgot-password codes go through the same mailer
- [x] AuthScreen "Or email me a sign-in code" → `EmailCodeScreen` (email → code → signed in)
- [ ] USER ACTION: put Gmail App Password creds in `HealingSathiBackend/.env`
      (`SMTP_HOST/PORT/USER/PASS/FROM` — template in `.env.example`) so codes hit real inboxes

### 9. Google Sign-In (Apple deferred deliberately) — DONE (code); client IDs = user action
- [x] Backend: `POST /auth/google { idToken }` verified via google-auth-library
      (find-or-create account; 501 until `GOOGLE_CLIENT_IDS` is set)
- [x] App: `@react-native-google-signin/google-signin` installed (pods too, with the
      modular-headers Podfile fix) and wired to the Google button; lazy-loaded so the
      app never crashes while unconfigured
- [ ] USER ACTION: create OAuth client IDs and paste them in — full walkthrough in
      **`GoogleSignInSetup.md`** (repo root), then rebuild the app (`npm run ios`)

### 10. New Post screen overhaul — DONE
- [x] Gallery image picker (compressed to ≤1280px, base64 data-URI; PostCard already
      renders it). Videos: honest "coming soon with cloud storage" note
- [x] Multi-destination posting: "Share to" chips for My Feed + every joined group;
      backend `groupIds[]` validates membership and creates one post per destination
- [x] Composer polish: real author name/avatar, destination summary in the header,
      image preview with remove, character counter, sign-in-aware Post button
- [x] iOS `NSPhotoLibraryUsageDescription` added; smoke test now 77/77

### 11. Real-time chat via Socket.io — DONE
- [x] Socket.io attached to the API server (same port), JWT handshake auth — invalid
      tokens never connect; `chat:join` re-verifies conversation membership
- [x] Messages still SEND over REST (validation/rate limits in one place); everyone in
      the room RECEIVES `message:new` instantly; other participant's devices get a
      `chat:updated` nudge
- [x] ChatRoomScreen: socket receive with dedupe + own-message skip; 15s polling stays
      as fallback (dropped socket = slightly delayed, never broken)
- [x] ChatsScreen: 15s silent poll keeps last-message previews fresh
- [x] Smoke test proves it end-to-end (bad-token rejection + instant delivery): **79/79**
- NOTE: socket.io-client is pure JS — an app reload is enough, no native rebuild

## Still open (user actions / next cycle)
- [ ] Re-add your IP in Atlas → Network Access, re-run `npm run seed` (seed now includes
      the demo↔Alex sathi link), then test the golden path on a device
- [ ] Commit everything to git
- [ ] Real email delivery for reset codes (SES/Resend) — until then the code is returned
      in dev builds and printed in the server console
- [ ] Moderation Phase A (superuser approvals) — plan in `FinalCheckpoint.md` §3; consultant
      applications now feed the same review queue concept
- [ ] Socket.io realtime chat; media upload; push notifications (roadmap §4)

## Checkpoint (2026-07-11, unchanged)
The app remains a complete end-to-end working application (see `FinalCheckpoint.md`):
all screens live-wired, demo-mode contract in place.





## Phase 5 — Community & moderation (added + completed 2026-07-12, second cycle)

### 12. Chat attachments (photos) + uniform iconography — DONE
- [x] Backend: `Message` model carries `image` (base64 data-URI, same transport as posts);
      `POST /chats/:id/messages` accepts text, a photo, or both (empty messages 400);
      chat-list preview shows "📷 Photo"; socket fan-out includes the image
- [x] App: attachment sheet actually works — **Camera** (take a photo, sends immediately),
      **Photos** (gallery), Video/File say honestly when they arrive (cloud storage)
- [x] Iconography unified: the sheet now uses the platform's tinted icon assets
      (same Upload/Video icons as the post composer) instead of emoji glyphs;
      a matching tintable `camera.png` was generated and added to `imagePath`
- [x] Camera also added to the post composer toolbar (Image · Camera · Video);
      `NSCameraUsageDescription` added to Info.plist → **rebuild required: `npm run ios`**
- [x] Image pipeline extracted to `src/utils/pickImage.ts` (one compression policy app-wide)

### 13. Root-cause: "posted to a group but it never shows there" — DONE
- [x] Diagnosed: GroupDetailsScreen rendered only dummy data — it never fetched the
      group's live posts (the post WAS in the DB; the feed proved it)
- [x] GroupDetails live-wired: Posts tab = `GET /posts?groupId=` (refetch on focus +
      20s poll), Members tab = new `GET /groups/:id/members` (real "+ Add Sathi",
      hides the button on yourself), About = real description, real member count,
      moderator and Joined pill from the directory
- [x] "+ Post" FAB inside a group preselects that group as the destination
- [x] Honest empty state on a group with no posts yet

### 14. Superuser moderation (Moderation Phase A) — DONE
- [x] `role: member|admin` on User (granted only via seed/DB — no self-serve path);
      role travels in every auth payload
- [x] Admin API: `GET /admin/reviews` + approve/reject for group proposals and
      consultant applications. Approve group → goes live, proposer becomes first
      member + gets a notification. Approve consultant → public Consultant profile
      created + applicant notified. Rejections notify with an optional reason;
      rejected applicants may resubmit
- [x] App: `AdminReviewScreen` (Settings → ADMIN → Review queue, rendered only for
      admins; backend enforces 403 regardless) with confirm dialogs and double-tap guards
- [x] Seed: `admin@healingsathi.dev / password123` → **re-run `npm run seed`**

### 15. Threaded comment replies — DONE
- [x] Backend already stored `parentId`; now validates the parent exists and returns
      the created comment (id + timestamp) for accurate optimistic UI
- [x] `useComments` hook: fetches the flat thread, rebuilds the tree, optimistic
      insert at any depth, live/demo aware — shared by CommentsSheet and PostDetails
- [x] Reply on every comment: tap Reply → "Replying to {name}" banner → posts under
      that comment. Works in the comments sheet (Home/Profile/Group) and PostDetails
- [x] Reddit-style thread ergonomics (reported live: deep replies walked off-screen):
      indentation caps after 3 levels, deep branches auto-collapse behind
      "View N replies" / "Hide replies" — a fresh reply never hides itself
- [x] Bottom sheets respect the device safe area (reported live: the comment
      composer sat inside the home-indicator bar): Comments, Share and the chat
      attachment sheet all pad from the live inset — correct on every screen type

### 16. Concurrent engagement — likes work like a real platform — DONE
- [x] Post reactions are concurrency-safe on the server (pull-then-add atomic ops —
      two devices tapping at once can never double-count) and every response returns
      the authoritative counts; PostCard reconciles instantly and picks up OTHER
      people's reactions through feed polling
- [x] Likes on comments: ♥ Support on every comment in the thread (backend toggle +
      counts + `supportedByMe`, optimistic UI at any depth)
- [x] Smoke test fires two users' reactions in PARALLEL and proves exactly-once counting

### 17. Public user profiles ("tap a person → see who they are") — DONE
- [x] Backend: `GET /users/:id/profile` — name, conditions, **member since**, sathi
      count, relation (none/pending/sathi/self), their 20 latest posts AND the posts
      they've supported ("Liked" tab). Blocked-either-way answers 404
- [x] `UserProfileScreen`: strictly read-only (view posts/likes, nothing editable) with
      two actions: **Message** (opens/creates the 1:1 chat) and **+ Add Sathi**
- [x] Tap-through everywhere: post author avatar/name (feed, groups, profile, details),
      comment authors in threads, group member rows, people in search, the chat
      room header, and Sathi-request cards in Notifications (before or after
      accepting) all open the profile
- [x] Becoming sathis adds the conversation to BOTH chat lists immediately
      ("You're now sathis — say hi 👋") + acceptance notification to the requester

### 18. Feed & home honesty for real accounts — DONE
- [x] Home quick counts (Groups/My Posts/Friends) are the user's REAL numbers when
      signed in (fresh account = honest 0s); the dummy 25/30-style numbers now only
      exist in signed-out "Try the Demo" mode
- [x] The "My Friends" / "My Groups" directory (Home quick actions) is live too:
      real sathis (row → their profile, chat icon → the conversation) and real
      joined groups (row → live GroupDetails), with honest empty states — the
      25-item dummy lists remain demo-mode only
- [x] Condition-based feed discovery, like any social platform: besides your own +
      sathis' + joined-group posts, the feed surfaces posts in groups matching YOUR
      conditions (joined or not) and public posts from people who share a condition —
      a new account with conditions set sees its community from minute one

### 19. Verification & docs — DONE
- [x] Backend: typecheck clean · smoke test extended 79 → **110/110 checks**
      (photo messages, group members, threaded replies + bad-parent rejection,
      admin queue both flows, parallel-reaction exactly-once, comment likes,
      public profiles, sathi→chat, condition-based feed discovery)
- [x] Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors on changed files
- [x] **`currentArchitecture handling capabilities.md`** written (repo root):
      honest capacity numbers (~500–1,000-user MVP; base64 media is the #1 ceiling)
      and a phased optimization roadmap (cloud media storage first)

## Phase 6 — Live-testing fixes (2026-07-12, reported one by one while testing) — ALL DONE

### 20. Notifications → tap a Sathi request opens their profile — DONE
- [x] Reported: accepting a request then tapping the name/avatar went nowhere.
      Cause: the request card was a plain View AND the screen dropped `fromUserId`
      that the backend already sent. The whole card (before or after accepting) now
      opens the requester's public profile; Accept/Decline keep their own taps

### 21. "My Friends" / "My Groups" directory showed demo data while signed in — DONE
- [x] Reported: Friends button showed the 25 dummy profiles instead of "empty or my
      own friends". Cause: DirectoryScreen was the last screen still hardcoded to
      dummy arrays. Now live: real sathis (row → profile, chat icon → conversation)
      and real joined groups (row → live GroupDetails), honest empty states,
      dummy lists remain demo-mode only

### 22. Comment sheet input sat inside the bottom bar — DONE (both platforms)
- [x] Reported: the composer sat under the home-indicator area. Cause: all three
      bottom sheets (Comments / Share / chat attachments) used FIXED bottom padding.
      All now pad from the device's live safe-area inset (`useSafeAreaInsets`)
- [x] iOS follow-up (Android was fixed, iOS wasn't): iOS `KeyboardAvoidingView`
      behavior="padding" OVERWRITES the style's paddingBottom (0 with the keyboard
      closed), silently erasing the inset. Fix: the safe-area clearance is a spacer
      inside the sheet that collapses (via keyboardWillShow/Hide) while typing, so
      the input hugs the keyboard when open and clears the gesture bar when closed

### 23. Share sheet shares to YOUR people, like any social platform — DONE
- [x] Reported: the share button showed 5 dummy friends. Now: top 5 = your most
      recent conversations (falls back to your sathis; conversation created on
      first send) — tapping one drops the post into that chat as a real message
      ("Sharing {author}'s post: "{title}" + link") with a per-person "Sent ✓"
- [x] "See all in Chats..." row → deep-links to the Chats tab (MainTabNavigator now
      accepts `navigate("MainTabs", { tab: "Chats" })`) to pick anyone else
- [x] Native "Share via other apps..." kept; demo mode keeps the dummy five
- [x] Follow-up (reported: recipient got a dead link): in-app shares now travel as a
      STRUCTURED post reference (`sharedPostId` on the message) — the recipient sees
      a mini post card (author · group, title, snippet, image) in the bubble and
      tapping it opens the full post; sharing an already-deleted post is rejected
      up front (404); chat preview says "📄 Shared a post". Smoke: **114/114**
- [x] Card UI polish + complete images: the shared card is a real mini PostCard
      (avatar header, full-width image, title/snippet, ♥/💬 counts footer, View
      post →). New `AutoHeightImage` keeps every photo's true proportions (no
      square cropping) in chat bubbles, shared cards AND PostDetails; tapping a
      chat photo opens a fullscreen viewer (tap to close)
- NOTE videos: not renderable yet anywhere — the app has no video upload (blocked
      on cloud media storage, roadmap Phase A). Composer/attachment sheets say so
      honestly; once storage lands, shared videos get a player the same way

### 24. Multi-photo posts + Instagram-style carousel (max 10) — DONE
- [x] Backend: `images[]` on Post (cap 10 — over-limit 400s with a clear message),
      legacy `image` still accepted and surfaces as a one-photo carousel; JSON body
      limit raised 10→25mb for multi-photo payloads. Smoke: 117/117
- [x] Composer: multi-select gallery picker (up to the remaining slots), camera adds
      one at a time, thumbnail strip with per-photo ✕, "Photos 3/10" counter,
      hard stop + explanation at 10
- [x] `ImageCarousel` (feed cards + PostDetails): swipe left/right through photos,
      position dots + "2/7" counter; a single photo skips the pager and renders at
      full proportions. Videos still blocked on cloud storage (roadmap Phase A)

### 25. Profile photo (DP) upload — DONE
- [x] Profile hero avatar has a camera badge → Take photo / Choose from library /
      Remove photo → saved via `PATCH /auth/me { avatarUrl }` (base64, same MVP
      transport; null clears back to initials)
- [x] `UserAvatar` renders a `uri` everywhere it's passed — profile hero, Home top
      bar, post composer author row, call screen; initials remain the fallback

### 26. Audio/video calling — self-hosted WebRTC, no third-party service — DONE (code)
- [x] Signaling on OUR Socket.io server (`call:invite/answer/ice/decline/end`
      relayed between user rooms) — contact-checked on every event (only people who
      share a conversation can ring each other; 60s cached check), offline peer →
      instant "unavailable" back to the caller
- [x] Media is pure peer-to-peer WebRTC (react-native-webrtc): audio + video,
      Google STUN for address discovery — no Twilio/Agora/anything
- [x] `CallProvider` engine: full state machine (idle → outgoing/incoming → active),
      ICE queueing until the remote description lands, busy → auto-decline second
      caller, dead-connection auto-teardown, ringtone on incoming
      (react-native-incall-manager: earpiece/speaker routing, proximity sensor)
- [x] `CallOverlay` rendered above the entire app — you can be rung on any screen:
      incoming accept/decline, remote video full-screen, local preview PiP,
      controls: mute · speaker · camera flip · video on/off · end, live call timer
- [x] Chat header phone/video buttons start real calls (demo chats explain instead)
- [x] Permissions: iOS mic + camera strings; Android CAMERA / RECORD_AUDIO /
      MODIFY_AUDIO_SETTINGS / BLUETOOTH_CONNECT. Pods installed ✓ — native modules
      are lazy-loaded so the app runs fine even before the rebuild
- [ ] USER ACTION: **rebuild the app** (`npm run ios` / `npm run android`) to load
      the native WebRTC modules, then test a call between two signed-in devices
- [ ] INFRA (next cycle): self-hosted **coturn** TURN server for symmetric-NAT
      networks (STUN covers same-wifi and most home/mobile NATs); add its
      credentials to `ICE_SERVERS` in `src/context/CallContext.tsx`

### 27b. `12-07-26Updates/` handover docs — DONE
- [x] Five-file review pack for the week of code analysis: 1-appArchitecture ·
      2-completedTasks · 3-pendingWork (backend/frontend leftovers explained) ·
      4-launchDeployAndScale (deploy steps, capacity numbers, scaling ladder) ·
      5-endToEndTech (whole codebase in simple language + reading order)

### 27. Marketing plan + pitch deck (CMO deliverable) — DONE
- [x] **`marketing.md`** (repo root): full ground-to-scale GTM for India → US → Canada —
      positioning ("companion layer" / sathi story), 9 beachhead conditions, per-market
      playbooks (WhatsApp-graduation for IN, earned-community for NA, wait-times wedge
      for CA), 5 launch phases w/ mermaid timeline, channel priority table, growth
      flywheel (maps to shipped product loops), WSI north-star metric + 12-mo targets,
      3 budget tiers, trust-as-marketing, risks w/ pre-committed responses
- [x] **`marketing/pitch-deck.md`**: 15-slide investor deck with speaker notes
      (placeholders marked for team bios + ask amount; est. figures flagged for
      sourcing before investor use)
- [x] **`marketing/pitch-deck.html`**: presentable visual deck (brand #7453C8,
      light/dark), published privately: https://claude.ai/code/artifact/40cf36c4-5fac-4463-b878-b297ac2c2e72

## Still open (user actions / next cycle)
- [ ] **Rebuild the app once** (`npm run ios` — new native modules: WebRTC +
      in-call audio, plus the camera/mic permissions) and re-run `npm run seed`
      (admin account)
- [ ] Cloud media storage (S3/R2/Cloudinary) — unblocks videos/files in chat and posts,
      and is the #1 item in the architecture doc
- [ ] Push notifications (FCM/APNs) → also lets feed polling relax (roadmap Phase B)
- [ ] Feed/messages cursor pagination + the missing Mongo indexes (roadmap Phase A)
- [ ] Moderation Phase B: content reports → same admin review queue
- [ ] Suggested next: comment reactions ("Support" button in threads is still visual-only),
      admin push/email alerts when something enters the review queue
- [ ] **Shimmer loading states in the APP** (requested 17/07/26, already live on the
      web): skeleton cards w/ light sweep on feed/chats/groups/profile while data
      loads — mirror `HealingSathiWebApp/src/components/ui/Skeleton.tsx`
- [ ] **Chat photo viewer: add a DOWNLOAD/save button in the APP** (reported
      17/07/26; the web viewer now has back + ⬇ download). The app's fullscreen
      viewer (ChatRoomScreen) only closes on tap — saving to the camera roll needs
      `@react-native-camera-roll/camera-roll` + a native rebuild
- [ ] Commit everything to git
- [ ] SMTP creds in `HealingSathiBackend/.env` (Phase 4 §8) and Google OAuth client ids
      (`GoogleSignInSetup.md`) remain outstanding user actions

## Checkpoint (2026-07-12, end of second cycle)
The app remains a complete end-to-end working application. New since the last
checkpoint: photo sharing in chat (camera + gallery) with uniform iconography,
group pages show their real posts/members, a superuser review queue moderates
new groups and consultants, comments are a true threaded conversation (replies,
likes, capped indentation, collapsible branches), reactions are concurrency-safe
with authoritative counts, every avatar/name opens a read-only public profile
(member-since, their posts, liked posts, Message/Add Sathi), new sathis land in
the chat list instantly, home counts are honest per-account, and the feed
discovers condition-matched groups and people. Backend smoke: 110/110. 



## Phase 7 — Chat notifications & feed-label fix (requested 16/07/26, completed 17/07/26) — ALL DONE
_Full technical write-up: **`17-07-26Updates.md`** (repo root)._

### 28. In-app popup when someone messages you — DONE
- [x] `ChatMessageBanner` slides down from the top on ANY screen (it lives above the
      navigator, same pattern as the call overlay): sender's avatar + name + message
      preview, tap → jumps straight into that conversation, ✕ or 4.5s auto-dismiss
- [x] Powered by the existing `chat:updated` socket event, now enriched with
      `fromUserId`/`fromName` (older clients that only read `last`/`time` still work)
- [x] Never pops for the conversation you're currently reading (`ChatRoomScreen`
      reports itself as the active chat while focused)
- [x] New `ChatNotificationsProvider` owns the app-wide socket listener; navigation
      from outside the NavigationContainer goes through a new `navigationRef`

### 29. Chat-notifications OFF toggle — DONE
- [x] Settings → Notifications → **"Chat messages"** — the first fully REAL toggle
      in that section (the others remain visual placeholders)
- [x] Saved on the account (`notifyOnMessages` on User, via `PATCH /auth/me`) AND
      mirrored on-device (AsyncStorage) so it boots instantly and follows the user
      across devices
- [x] Off = no popup banners and the backend stops writing Notifications-page
      entries; unread counters still tick (works like a muted chat — the badge
      stays honest)

### 30. Unread count badge on the Chats tab — DONE
- [x] Server-side per-participant `unreadCounts` on Conversation ($inc on every
      message to everyone but the sender — atomic, parallel-send safe); new
      `POST /chats/:id/read` zeroes yours when you open the chat
- [x] Red count pill on the Chats tab icon (99+ cap), fed by the provider's total;
      updates live on every socket event and clears the moment you read the chat
- [x] Per-conversation count pill in the Chats list too (replaces the old
      boolean dot; the demo list keeps its dummy counts in demo mode)

### 31. Message notifications on the Notifications page — DONE
- [x] Every message writes a `type: "Chats"` notification ("New message from {name}"
      + preview) — repeated messages from the same conversation COLLAPSE into one
      fresh unread entry, so a chatty sathi can't flood the page
- [x] Notification carries its `chatId`: tapping the card opens the conversation;
      opening the chat marks its notification read (and "Mark all read" still works)
- [x] Respects the Phase-29 toggle server-side; shows under the existing "Chats"
      filter tab

### 32. "My Feed" no longer masquerades as a group — DONE
- [x] Reported: feed posts showed "My Feed • 2h ago" as if My Feed were a group.
      Cause: backend `shapePost` defaulted `circle` to "My Feed" when `group` was null
- [x] Personal-feed posts now ship an EMPTY `circle`; PostCard/PostDetails show just
      the timestamp, and "in {group}" (header + shared-post cards in chat) renders
      only for real groups. The composer's "My Feed" destination chip is untouched —
      that's a posting destination, not a group label

### 33. Verification
- [x] Backend: typecheck clean · smoke test extended 117 → **129/129** (unread
      counters inc/zero, sender stays 0, notification created + collapsed +
      read-synced, toggle suppresses entries while unread still counts,
      `chat:updated` popup payload carries the sender's name)
- [x] Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors (pre-existing style
      warnings only)
- [ ] Suggested next: push notifications (FCM/APNs) so message popups also work
      with the app closed — the in-app plumbing (per-user rooms, unread counters,
      preference flag) is already in place for it

---

## Backlog — whole-app analysis (added 17/07/26)
_Everything below was found by walking the actual code (routes, screens, no-op
buttons), not guessed. Grouped by how much it blocks a public launch._

### A. Launch / app-store blockers
- [x] **Delete account is a no-op** — DONE 17/07/26, see Phase 8 below
- [ ] **Report Post is a no-op** (`PostCard.showPostMenu`) — Moderation Phase B:
      `POST /posts/:id/report` feeding the existing admin review queue; both stores
      require a working report path for user-generated content
- [ ] **Apple Sign-In** — deliberately deferred earlier, but the App Store REQUIRES it
      the moment Google Sign-In ships. Same find-or-create pattern as `/auth/google`
- [ ] **Terms of service / Privacy policy / Community guidelines** — all three About
      rows are "coming soon" alerts; stores ask for real URLs (the Next.js site can
      host them)
- [ ] **Push notifications (FCM/APNs)** — everything in Phase 7 is in-app only; with
      the app closed nothing arrives. Also lets the 15–20s polls relax (roadmap B)
- [ ] **Cloud media storage (S3/R2/Cloudinary)** — base64-in-Mongo is the #1 capacity
      ceiling (architecture doc); unblocks video/file sharing in chat + posts and
      shrinks the 25mb JSON limit back down

### B. Honesty gaps — UI that promises what the backend doesn't do
- [x] **No edit/delete for user content anywhere** — DONE 17/07/26 for posts +
      comments (edit post, delete post, delete comment w/ cascade), see Phase 8
      item 37. Still open: delete/edit own chat MESSAGES ("delete for me/everyone")
- [ ] **Settings toggles are visual-only except "Chat messages"** — Public profile,
      Show my conditions, Anonymous posts, Usage analytics, Research participation,
      Group activity / Replies / New matches / Consultant updates all reset on
      restart and change nothing. Either persist them (the `notifyOnMessages`
      pattern generalizes: flags on User honored server-side) or cut them
- [ ] **Chat header fakes presence** — every conversation says "Online ·
      Fibromyalgia" hardcoded. Real presence is cheap now (socket user-rooms already
      exist: room size > 0 = online) — or drop the line until then
- [ ] **Support rows dead** — Help center / Contact us / Report a problem are
      placeholders; even a mailto + FAQ page beats an alert
- [ ] **"Today" day-pill in ChatRoom is hardcoded** — real date separators once
      threads span days (they already can)

### C. Product depth (next feature cycles)
- [ ] **Notify on post interactions** — someone comments on / supports your post,
      replies to your comment → nothing happens today. Same collapse-per-source
      pattern as message notifications; respect per-type toggles from (B)
- [ ] **Comment "Support" count on PostDetails vs sheet parity check** + comment
      reactions listed as visual-only in the old backlog — verify and finish
- [ ] **Typing indicator + real read receipts** — sockets are in place; ✓✓ is
      currently decorative (sent ≠ read)
- [ ] **Post search** — Search covers people/groups/consultants but not post content
- [ ] **Booking flow depth** — consultant availability is static strings; needs real
      slot inventory, cancel/reschedule (Booking model already has status), and
      eventually payments
- [ ] **i18n** — LanguageScreen persists a choice that changes nothing; wire
      i18n boot (react-i18next) once strings are extracted
- [ ] **Healing Diary cloud backup (opt-in)** — deliberately device-only today;
      losing the phone loses the diary. Needs an encrypted opt-in sync
- [ ] **Group leave/mute + group chat** — groups have posts/members only
- [ ] **Video in posts/chat + call history entries in the chat thread**
      ("Missed call · 12:31") — both blocked on / adjacent to media storage

### D. Infra & scale (from the architecture doc, still true)
- [ ] Cursor pagination: feed, group posts, messages (hard 200-message cap today —
      long chats silently truncate), notifications (50)
- [ ] Missing Mongo indexes: `Post {group, createdAt}`, `Post {author, createdAt}`,
      `Notification {user, read}`, `Message {conversation, createdAt}`
- [ ] Self-hosted **coturn** TURN server → calls across symmetric NATs
      (`ICE_SERVERS` in `CallContext.tsx` has the slot ready)
- [ ] SMTP creds in `HealingSathiBackend/.env` + Google OAuth client ids
      (`GoogleSignInSetup.md`) — still the two outstanding USER ACTIONS
- [ ] Deploy hardening: process manager/restart policy, uptime monitoring, error
      tracking (Sentry), backup policy for Atlas

### E. Quality & tooling
- [ ] Frontend tests beyond the single snapshot (`__tests__/App.test.tsx` is the
      only one): hooks (`useLiveOrDemo`, `useComments`) and the new
      ChatNotifications engine are pure logic — easy wins
- [ ] CI (GitHub Actions): tsc + eslint + jest + backend smoke on every push
- [x] **Commit everything to git** — DONE 17/07/26: Phases 4–8 committed and pushed
      to the PRIVATE GitHub repo (`Abhsihekkaul/AwesomeProject`, origin/main)

---

## Phase 8 — Share picker + real account deletion (17/07/26, same day, second pass)

### 34. Share sheet: pick N people without leaving your screen — DONE
- [x] Reported: quick-send row was fine, but "See all in Chats..." DUMPED you into
      the Chats tab — you lost your place and could only share one-by-one
- [x] Now: "Choose people..." flips the same sheet into a picker — search across ALL
      your conversations + sathis (deduped; chat-less sathis get their conversation
      created on send), tap to multi-select (✓ circles, live "Share with N people"
      count), one **Share (N)** button sends the post card to everyone at once, and
      the sheet closes — you're exactly where you were
- [x] Partial-failure handling: successes go out, failures STAY selected with an
      explanation so one retry tap finishes the job
- [x] Quick row (top 5 recent chats) and native "Share via other apps..." unchanged;
      demo mode keeps the dummy five

### 35. Real account deletion (backlog A1) — DONE
- [x] Backend `DELETE /auth/me { password, reason, feedback? }`: password-confirmed
      (Google-created accounts set one via forgot-password first), then a FULL erase —
      own posts, their comments/reactions on others' posts, conversations + messages
      (both sides), sathi links + requests, group memberships + pending proposals,
      bookings, consultant applications, notifications, every session/refresh token,
      and dangling refs held by other users (savedPosts / sathis / blockedUsers)
- [x] Exit interview, as requested: `reason` is REQUIRED (preset chips: got the
      support I needed / couldn't find people like me / privacy / too many
      notifications / confusing or buggy / something else) + an optional "anything
      we could have done better?" text box — stored in a new anonymous
      `ExitFeedback` collection (reason, details, memberForDays; deliberately no
      link back to the deleted person) and written BEFORE the erase
- [x] App: Settings' "Delete my account" now opens a real `DeleteAccountScreen` —
      warning card spelling out exactly what disappears, reason chips, feedback box,
      password field, final "Delete forever?" dialog; on success the local session
      clears and the app resets to Onboarding. Demo mode explains there's no
      account to delete
- [x] Smoke test 129 → **137/137** (reason required 400, wrong password 401, erase
      ok, exit feedback stored, ghost sign-in 401, posts gone, comments pulled from
      other posts, conversation gone from the OTHER side too)
- [ ] Follow-up idea: surface `ExitFeedback` in the admin review screen so the team
      actually reads it (today it's queryable in Atlas)

### 36. Verification (this pass)
- [x] Backend: typecheck clean · smoke **137/137**
- [x] Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors (pre-existing style
      warnings only)

### 37. Edit & delete your own content (backlog B1) — DONE (third pass, 17/07/26)
- [x] Backend `PATCH /posts/:id` (title/content/contentWarning; author-only, 404 —
      not 403 — on foreign posts so ids can't be probed; photos + destination stay
      fixed by design), `DELETE /posts/:id` (author-only; also pulled from
      everyone's saved lists), `DELETE /posts/:id/comments/:commentId` (comment
      author OR post author moderating their own post; the whole reply branch
      cascades so no orphans surface)
- [x] App: your own posts' ⋯ menu grows **Edit Post** (new `EditPostScreen` —
      title + text, honest note about photos/destination) and **Delete Post**
      (confirm → card vanishes optimistically, rolls back on failure) — works on
      Home, Profile, Groups, everywhere PostCard renders
- [x] Comments: a red **Delete** action on your own comments in BOTH the comments
      sheet and PostDetails (confirm warns when replies will go too); optimistic
      tree removal via `useComments.removeComment`, server refresh reconciles
- [x] Smoke test 137 → **146/146** (foreign edit/delete 404, own edit persists,
      stranger comment-delete 403, author cascade-delete, post-author moderation,
      deleted post gone + wiped from saved lists)
- [x] Frontend: `tsc` 0 errors · Jest green · ESLint 0 errors on changed files

### 38. Git & GitHub — DONE (17/07/26)
- [x] Everything since Phase 4 committed; **private** GitHub repo created and pushed
      (see the commit history for the cycle-by-cycle breakdown)

---

## Phase 9 — THE WEB APP (initiated 17/07/26) — the next big thing
- [x] **`MainWebsite.md`** written (repo root): complete architecture + design for
      `HealingSathiWebApp/` — a full WORKING web app at app.healingsathi.com (like
      facebook.com, NOT the marketing brochure at `HealingSathiWebsite/`).
      Covers: stack (Next.js + Tailwind v4 + React Query + socket.io-client),
      token-for-token design system from the app, Facebook-shaped 3-column shell,
      two-pane Messenger chat, complete page map (every route → existing API —
      ZERO new endpoints needed), feature parity matrix w/ web upgrades (browser
      notifications, drag-drop photos, real share links, app↔web WebRTC calls),
      the 4 technical ports (http client / sockets / calls / image pipeline),
      security model, and a 5-phase build plan (W1 Foundation+Auth → W5 polish)
      each with definition-of-done + a phone↔laptop sync test checklist
- [ ] AWAITING GO: user approves `MainWebsite.md` → W1 starts
- [ ] Backend prep when W1 starts (env-only): add web origins to `CORS_ORIGIN`,
      web OAuth client id to `GOOGLE_CLIENT_IDS`
- [ ] User decisions: confirm `app.healingsathi.com` subdomain; Google web
      client id alongside the existing GoogleSignInSetup.md task  
