# Understanding the HealingSathi frontend (this app)

A quick orientation for anyone (including future-you) picking this project up, plus a concrete
list of what's left to do after this session's changes.

## What this app is

HealingSathi is a React Native app (currently named `AwesomeProject` at the package.json
level) combining two things:
1. **A condition-based social network** — Instagram-style home feed ("Healing Stream"),
   condition-specific Groups you can join, posts with reactions/comments/shares, 1:1 chat,
   notifications, and a profile.
2. **Consultant/healer booking** — browsing psychologists/healers, seeing their availability,
   and booking a session (video/audio/chat).

## How the screens fit together

```
App.tsx → navigation/AppNavigator.tsx (stack: Onboarding → Auth → ProfileSetup → MainTabs)
                                        MainTabs → navigation/MainTabNavigator.tsx (custom
                                        PagerView-based tab bar, not React Navigation's tabs)
```

- `features/onboarding` — 3-slide intro, then routes to Auth.
- `features/auth/AuthScreen.tsx` — sign in/up tabs (Google/Apple buttons present but unwired).
- `features/profileSetup/*` — 3-step setup: name → health conditions → privacy, before landing
  on MainTabs.
- `features/home/HomeScreen.tsx` — the feed (`Home` tab).
- `features/groups/*` — Groups list, Group detail (posts/members/health-tips/about tabs),
  Create Post, Request a new Group.
- `features/chat/*` — conversation list + a single hardcoded chat room.
- `features/consultants/*` — consultant profile with date/time slot picker (working UI state,
  not wired to any data) and reviews; `BookingScreen.tsx` exists but is fully commented out.
- `features/help/PsychologicalHelpScreen.tsx` — the `Help` tab.
- `features/profile/*` — profile + settings (privacy/notification toggles, currently local
  state only).

## Everything is dummy data right now

There is no network layer anywhere in this app. Every screen reads from local arrays:
`src/utils/dummyPost.ts`, `src/data/conditions.ts`, and inline arrays inside `GroupsScreen`,
`ChatsScreen`, `ConsultantProfileScreen`, `NotificationsScreen`, etc. Nothing you tap
persists — reloading the app resets everything.

## What changed in this session

- Cleaned up dead code flagged by `npx eslint .`: unused imports/variables across ~15 files.
  Zero behavior change — see the note at the bottom of the corresponding backend doc for the
  one exception below. Both `npx eslint .` and `npx tsc --noEmit` now report zero errors.
- **One real bug fix**: on `ConsultantProfileScreen`, the "Write a Review" submit button used
  to just `console.log` and do nothing. It now actually calls the (already-written but
  previously unused) `handleReviewSubmit`, so a submitted review appears in the list.
- Built a complete backend from scratch — see `HealingSathiBackend/` (its own README,
  `docs/API.md`, `docs/ARCHITECTURE.md`, and `understand.md`).

**No visual/design changes were made anywhere.** Colors, spacing, layout, icons — all
untouched. If you want a design pass, that's a separate, unstarted task (see below).

## What you need to do next

1. **Connect this app to the new backend.** This is the big one. Nothing here calls
   `HealingSathiBackend` yet:
   - Add a GraphQL client (Apollo Client or urql are the standard RN choices).
   - Replace the dummy arrays screen-by-screen: `dummyPost.ts` → `feed` query,
     `GroupsScreen`'s inline array → `groups` query, `ConsultantProfileScreen`'s
     `availableDates`/`availableTimes` → `healerAvailableDates`/`healerTimeSlots` (the shapes
     already match, see `HealingSathiBackend/docs/API.md`), `AuthScreen` → `signIn`/`signUp`
     mutations with token storage (e.g. `react-native-keychain` or `AsyncStorage`), etc.
   - Wire up Socket.io client (`socket.io-client`) for `ChatRoomScreen` and live notifications.
2. **Decide on the design/branding pass** flagged in your own `src/requirements.md`: icon
   optimization (32px vs 512px assets), a single reusable Avatar component, image
   optimization, and general brand consistency. None of that was touched this session.
3. **`BookingScreen.tsx` is fully commented out** and `ProfileScreen`'s "My Circles"/privacy
   toggle block is commented out too — decide whether to re-enable and wire them to the new
   backend, or delete them if the flows have been superseded by what's on
   `ConsultantProfileScreen`/`SettingsScreen` respectively.
4. **The date/time slot picker** on `ConsultantProfileScreen` currently uses hardcoded
   `available`/`unavailable` arrays. Once wired to `healerAvailableDates`/`healerTimeSlots`,
   double check the "select a date → refetch times for that date" interaction, since right now
   both arrays render independently with no such dependency.
5. **Google/Apple sign-in buttons** on `AuthScreen` are unwired UI. The backend has stub
   mutations (`signInWithGoogle`/`signInWithApple`) that throw `NOT_IMPLEMENTED` until you
   supply real OAuth client IDs — see `HealingSathiBackend/understand.md`.
