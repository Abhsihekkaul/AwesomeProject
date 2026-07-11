## Status update (this session)

Fixed: #2, #3, #4, #5, #6, #7, #14 (partial — auth only), #27, plus two new bugs found while
testing (PrimaryButton/SecondaryButton style bug, hardcoded colors breaking dark mode in 7
files). See ✅ markers below. Everything else in this file is still open. Full details of what
changed: `git log`, or ask.

# HealingSathi — Engineering Review (bugs.md)

CTO-level pass across both halves of the project: the React Native frontend (this repo root)
and the Fastify/GraphQL/Prisma backend (`HealingSathiBackend/`, currently **not yet added to
this repo's git history** — see #1 below). Grouped by severity. Each item has enough context
to act on it without re-deriving it from scratch.

---

## P0 — Blocks shipping / correctness & security risk

1. **Frontend and backend are not connected at all.**
   The backend is fully built (auth, groups, posts, comments, chat, booking, notifications) but
   nothing in `src/` calls it — no `fetch`/`axios`/`apollo`/`graphql-request`, no API client file,
   no `.env`, no `API_URL` constant anywhere in the frontend. Every screen still renders inline
   dummy data. `understand.md:52-63` (root) already names this as the #1 next task. This is the
   single biggest blocker to having a real product.

2. **`HealingSathiBackend/` isn't committed to git yet.**
   `git status` shows the whole backend directory as untracked. All backend work currently exists
   only on disk — it should be added and committed before more work builds on top of it.

3. **Chat authorization bypass over Socket.io.**
   `src/sockets/index.ts:35-37` — `conversation:join` lets any authenticated socket join
   `conversation:{id}` for *any* id, with no membership check. The GraphQL path enforces
   `assertParticipant` (`src/modules/chat/service.ts:11-17`), but the socket path doesn't. A user
   who guesses/learns a conversation id can silently receive live `message:new` events for a
   conversation they're not part of. This is a real privacy leak, and notably bad given this is a
   mental-health chat product.

4. **No rate limiting on auth endpoints.**
   `signIn`, `signUp`, `refreshAccessToken` have no throttling — `@fastify/rate-limit` isn't even
   a dependency. Wide open to brute-force / credential stuffing once this is public.

5. **No password strength validation.**
   `src/modules/auth/service.ts:52-64` — `signUp` accepts any non-empty string as a password. Zod
   is already a dependency (used only in `src/config/env.ts`) but isn't applied to any user input.

6. **Unbounded GraphQL pagination = DoS vector.**
   Every paginated field (`feed`, `Group.posts`, `comments`/`replies`, `messages`,
   `notifications`, `reviews` — see `src/graphql/schema/{posts,comments,chat,notifications,booking}.ts`)
   passes the client-supplied `first` straight into Prisma's `take` with no server-side cap
   (e.g. `src/modules/posts/service.ts:9-19`). A client can request `first: 1000000` and force a
   huge fetch. Needs a hard max clamp before this is exposed publicly.

7. **Release Android build signs with the debug keystore.**
   `android/app/build.gradle:100-106` — the `release` buildType points `signingConfig` at the
   checked-in `debug.keystore` with hardcoded `storePassword 'android'`. Any "release" APK built
   today is signed with a public, well-known key. Must be fixed before any real distribution.

---

## P1 — Should fix before real users / before scaling

8. **No tests anywhere, on either side.**
   Backend: zero `*.test.ts`/`*.spec.ts` files. Frontend: the only test is the RN template's
   default `__tests__/App.test.tsx` smoke test. Nothing covers auth, token rotation, booking-slot
   race conditions, cascading deletes, or reaction/comment counters — exactly the logic where a
   silent regression is expensive to discover late.

9. **No deployment pipeline.** No Dockerfile, no docker-compose, no `.github/workflows/` for the
   backend — confirmed via search, zero results. No lint/build/test gate runs on any change today.

10. **Health check isn't real.** `src/app.ts:32` returns a static `{ status: "ok" }` regardless of
    DB connectivity. Not usable as a production readiness probe.

11. **`npm audit`: 4 high-severity vulnerabilities in the backend**, via
    `mercurius → graphql-jit → fast-json-stringify → fast-uri` (path traversal / host confusion in
    `fast-uri <=3.1.1`). Fix requires bumping `mercurius` to 13.4.0+ (breaking change) — needs a
    deliberate upgrade, not `--force`.

12. **Cascading deletes with no soft-delete anywhere.** Every relation in `schema.prisma` uses
    `onDelete: Cascade`, including self-referencing `Comment.parentId`. Deleting a user or a
    parent comment recursively deletes other users' replies, reactions, and chat history. Fine
    to defer, but must be solved before a real "delete my account" flow ships.

13. **Group roles/moderation are modeled but not implemented.** `GroupRole`
    (Member/Moderator/Contributor/Admin) and `GroupProposalStatus`
    (Pending/Approved/Rejected) exist in the schema, but `joinGroup` always assigns `Member`
    (`src/modules/groups/service.ts:51`) and nothing ever transitions a proposal out of `Pending`.
    The moderation workflow implied by the data model doesn't exist yet.

14. **No shared state/cache layer on the frontend.** No Redux/Zustand/MobX — every screen owns
    its own `useState` and inline dummy array (`GroupsScreen.tsx:16`,
    `ConsultantProfileScreen.tsx:14,38,47`, similarly in `ChatsScreen`, `NotificationsScreen`,
    `SearchScreen`, `PsychologicalHelpScreen`). Once the API lands there's nowhere central for
    auth session, unread counts, socket connection state, or feed cache to live. Apollo Client's
    cache is a natural fit here (the backend is already GraphQL) — worth deciding this
    concurrently with wiring the network layer, not after.

15. **Custom tab bar bypasses React Navigation's tab primitives.**
    `MainTabNavigator.tsx:78-113` uses a manual `PagerView` + `Animated` bar instead of
    `createBottomTabNavigator`. All 5 tab screens mount simultaneously (no lazy mounting), and
    deep linking / back-button-per-tab / `useFocusEffect` per tab all need manual reimplementation
    that React Navigation would otherwise give for free.

16. **No error boundary or crash reporting.** `App.tsx:6-10` is just `ThemeProvider` →
    `AppNavigator`. No `componentDidCatch`/ErrorBoundary, no Sentry/Crashlytics/Bugsnag. A single
    unhandled render error currently takes down the whole app with no telemetry in production.

17. **N+1 queries acknowledged but unresolved.** No DataLoader/batching
    (`docs/ARCHITECTURE.md:78-82` already flags this). Concretely, `User.conditions`
    (`src/graphql/resolvers/users.ts:9-12`) issues one extra query per user whenever not
    preloaded — a feed of N posts by N distinct authors means N extra round-trips.

18. **`cleartextTraffic` enabled app-wide on Android** (`AndroidManifest.xml`,
    `usesCleartextTraffic="true"`). Fine against `localhost` today, must be tightened
    (network security config, HTTPS-only) before pointing at a real backend.

---

## P2 — Worth doing, not urgent

19. **CORS defaults to `*`** (`.env`/`.env.example` `CORS_ORIGIN=*`, applied verbatim in
    `src/app.ts:12` and `src/sockets/index.ts:13`). Not dangerous today (bearer tokens, no
    cookies) but nothing in code enforces tightening it for production beyond a doc comment.

20. **Bundle ID mismatch between platforms.** iOS is `com.abhishek.healingsathi`
    (`ios/AwesomeProject.xcodeproj/project.pbxproj:279,312`); Android is still the RN template
    default `com.awesomeproject` (`android/app/build.gradle:82`). Needs to be intentional and
    matching before any store submission.

21. **Logging has no structure.** Backend uses Fastify's default pino logger with no
    request-id/user-id correlation and no redaction of auth headers/tokens in logs.

22. **35 `any`/`as any` occurrences across 9 frontend files** (`AuthScreen.tsx`,
    `ProfileNameScreen.tsx`, `HealthJourneyScreen.tsx`, `PrivacySafetyScreen.tsx`,
    `GroupDetailsScreen.tsx`, `OnboardingScreen.tsx`, `dummyPost.ts`, `DirectoryScreen.tsx`,
    `CommentsSheet.tsx`). Worth cleaning up as part of the API-integration pass — GraphQL codegen
    should replace most of these with real types at the API boundary.

23. **Zero accessibility support.** No `accessibilityLabel`/`accessibilityRole`/`accessible=`
    anywhere in `src/**/*.tsx`. Icon-only buttons currently have no screen-reader labels.

24. **Dead code / half-finished routes.** `BookingScreen.tsx` is fully commented out; its import
    and `<Stack.Screen>` are commented out in `AppNavigator.tsx:12,58` while `Booking: undefined`
    remains live in `RootStackParamList` — a reachable-looking type for an unreachable route.
    Commented `SignInScreen`/`SignUpScreen` imports also linger (`AppNavigator.tsx:53-54`). Needs
    a decision: finish it or delete it.

25. **Booking engine's scheduling mechanism is unresolved.**
    `LATER_WORKFLOW/Booking.md` compares Calendly vs. Cal.com but reaches no conclusion; this
    directly blocks finishing `ConsultantProfileScreen`/`BookingScreen`.

26. **Open product question, not yet decided:** whether consultants need a separate sign-in flow
    or an Instagram-style "switch to professional account" model
    (`src/requirements.md:31-33`). The backend already implemented the latter
    (`becomeHealer` on a single `User` model) — worth explicitly closing this loop with product
    so the frontend doesn't build the wrong flow.

27. **Repo hygiene: stray build artifacts and duplicate files, untracked.**
    `android/app/build 2/` (a full duplicate Gradle output directory, ~80K) and duplicate icons
    like `alert 2.png`, `apple 2.png` etc. (accidental Finder/macOS copies). Should be deleted,
    not committed.

28. **Dependency staleness (not urgent):** `@prisma/client`/`prisma` (6.19.3 → 7.8.0),
    `@fastify/cors` (10.1.0 → 11.2.0), `graphql` (16.14.2 → 17.0.2), `zod` (3.25.76 → 4.4.3),
    `typescript` (5.9.3 → 6.0.3) all have majors available. Frontend is on bleeding-edge React
    19.2.3 / React Native 0.86.0 with New Architecture enabled — fine, but every native module
    added from here (already have `react-native-pager-view`, `react-native-linear-gradient`,
    and the unmaintained `react-native-size-matters`) raises RN-upgrade compatibility risk.

29. **iOS `NSLocationWhenInUseUsageDescription` is present but empty**, with no location feature
    in the app to justify it — would get flagged in App Store review if triggered as-is.

---

## What's actually solid (don't re-litigate)

- Backend error handling: a clean `AppError` taxonomy mapped to GraphQL `extensions.code`
  (`src/utils/errors.ts`, `src/app.ts:19-29`).
- Auth token design: argon2 password hashing, rotating refresh tokens that are hashed at rest
  and revoked on reuse (`src/modules/auth/service.ts`).
- No SQL injection surface — everything goes through Prisma's typed query builder, zero raw
  queries found.
- Backend code organization (service/resolver split, one domain per file) is consistent with no
  god files or duplicated logic.
- Frontend theme discipline (`useTheme()` + `makeStyles(colors)`) is followed almost everywhere
  — a real sign that the design-consistency pass actually stuck.
- Docs (`docs/ARCHITECTURE.md`, `docs/API.md`, both `understand.md` files) are thorough and
  verified accurate against the code — they already self-report most of the "next steps" above.

---

## Suggested order of attack

1. Commit `HealingSathiBackend/` to the repo (#2).
2. Fix the socket auth bypass (#3) — it's a real data leak, small fix.
3. Add rate limiting + password validation to auth (#4, #5) — small, high-value.
4. Cap pagination `first` args (#6) — small, closes a DoS vector.
5. Fix Android release signing before any distribution (#7).
6. Start the frontend↔backend wiring (#1) — decide the state-management story (#14) as part of
   this, not after, since Apollo Client's cache would solve both at once.
7. Everything else (tests, CI, DataLoader, moderation workflow, accessibility) can follow
   incrementally once the app is actually talking to the backend.
