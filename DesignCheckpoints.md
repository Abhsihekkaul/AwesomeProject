# HealingSathi — Design Checkpoints

Living tracker for the full-app UI overhaul (started 2026-07-11).
Legend: `[x]` done · `[ ]` pending. Newest decisions win; history lives in git.

---

## ✅ Shipped

### Navigation & app shell
- [x] Floating pill tab bar — detached, absolutely positioned (reserves no layout space),
      rounded (height/2), soft shadow, floats above the home indicator
- [x] **Frosted-glass tab bar on iOS** — BlurView (`chromeMaterialLight/Dark` per theme) under
      a 45% tint, clipped inside the pill; Android keeps solid card. *Needs `npm run ios`
      rebuild — new native module.*
- [x] Tab screens skip the bottom safe-area edge (`ScreenWrapper edges` prop) and pad their
      lists ~96 so content scrolls behind the bar without hiding the last item
- [x] Full-screen swipe-back on iOS (`fullScreenGestureEnabled`)
- [x] Route param types for Booking / ConsultantProfile / ChatRoom / Directory / HealthTips

### The "purple button broken on iOS" bug — root causes, both fixed
- [x] AuthScreen keyboard trap: ScrollView lacked `keyboardShouldPersistTaps="handled"` — on
      iOS the first tap only dismissed the keyboard, so Sign In felt dead
- [x] Dead route: "Book Session" navigated to `"Booking"` which was commented out of the
      navigator (BookingScreen has since been rebuilt and registered)
- [x] Ruled out: linear-gradient pod was installed all along

### Screens built from scratch
- [x] **BookingScreen** — confirmation step: consultant card, session/when/fee summary rows,
      optional note, free-cancellation reassurance; receives sessionType/date/time params
- [x] **HealingDiary** — private on-device journal (AsyncStorage only, never cloud; the
      privacy promise is stated at the bottom of both views). Autosaving editor with
      "✓ Auto-saved" chip, entry list with previews, long-press delete, Home entry card
- [x] **HealthTipsScreen** — search ("Find your problem..."), basic-advice rail on top,
      browse-by-condition chips, doctor posts as Article 📄 / Video 🎥 / Photo Guide 🖼 cards;
      seeded with dummy data; wired from the Home "Need Quick Health Tips" card

### ChatRoom (redesigned twice, per feedback)
- [x] Header: avatar + name + online status, voice-call & video-call buttons
- [x] Composer: round "+" attach button → sheet (Camera / Photos / Files / Location), pill
      input, round send button; local send works with auto-scroll
- [x] "Healing" bubbles: my messages wear the brand purple gradient (same as PrimaryButton),
      theirs sit in calm lightBlue with no border; generous radii, soft lift shadow
- [x] Chat title/initials come from route params (Chats list, Directory, Search all pass them)

### Home
- [x] Quick actions show real counts (Groups 25 · My Posts 2 · Friends 25) as small
      tabular-nums figures *below* the labels (iterated 3× per feedback: big → inline → below)
- [x] "My Posts" uses the user's mini avatar (it represents *their* content) and routes to
      Profile — which now shows a back button when pushed from Home
- [x] Hidden Instagram gesture: swipe right on the feed → CreatePost. **Bugfix:** handlers
      originally sat on the ScrollView (whose native responder swallows them); moved to a
      wrapper View with capture-phase claiming (`onMoveShouldSetPanResponderCapture`)
- [x] Healing Diary + Health Tips entry cards

### Notifications
- [x] **Requests tab** — Sathi requests with avatar, mutual-group/compatibility context;
      Accept → green "✓ You're now Sathis" pill; Decline → animated removal; pending-count
      badge on the tab
- [x] Unread state (tinted card + purple dot), "Mark all read", count badge on All tab,
      per-tab empty states

### Social features (local state until backend lands)
- [x] Add Sathi buttons ("+ Add Sathi" ↔ "Requested ✓") on Search people results and
      GroupDetails member rows
- [x] Profile split into **My Posts | Saved** tabs; "Save Post" in every post's ••• menu;
      saved posts persist on-device via SavedPostsContext (AsyncStorage)
- [x] PostCard: Support/Helpful toggles with tint + visible counts; Groups Join ↔ Joined ✓
- [x] Comments & replies append locally (CommentsSheet + PostDetails), disabled when empty

### Forms & flows wired (were dead buttons)
- [x] CreatePost: controlled inputs, Post disabled till valid, success flow; polished UI
      (author avatar row, branded media pills, larger title input, keyboard handling)
- [x] RequestGroup: required-field validation, live "n of 3 filled" hint, disabled submit,
      keyboard avoidance
- [x] ProfileName: "Choose your color" now has 4 theme-aware avatar swatches w/ live preview
- [x] Settings: full IA — Account / Appearance / Privacy / Notifications / Support / About
      (+ version) — with **working Sign Out** (clears tokens, resets to Auth) and guarded
      Delete Account; placeholder rows say "coming soon"
- [x] Live search filters: HealthJourney conditions, PsychologicalHelp doctors, Directory
- [x] Copy fixes ("Enter HealCircle ›", "Join as a consultant →"), AppToggle instead of
      iOS-green Switch in profile setup, dark-mode icon tints, dead components removed
      (SettingRow, SectionCard)

### Tooling
- [x] **Jest repaired**: installed missing `@react-native/jest-preset`, preset →
      `react-native`, `transformIgnorePatterns` for RN/ESM deps, official AsyncStorage mock.
      `App.test.tsx` renders the whole app tree green

---

## 📋 Pending

### Verify on a real device (next `npm run ios` / Android run)
- [x] Glass tab bar — **VERIFIED in iOS simulator (iPhone 17 Pro, dark mode)**: frosted pill
      renders, feed content visibly blurs through it. The earlier "Unimplemented component
      <BlurView>" was a stale binary; full rebuild resolved it. Still check light mode +
      Android solid fallback.
- [ ] Swipe-right-to-compose on Home (especially Android — pager gesture contention)
- [ ] Floating-bar clearance over each tab's last list item
- [ ] Auth keyboard fix: tap Sign In with keyboard open → responds first tap
- [ ] NEW (spotted in simulator): a post with a broken/unloadable image URL reserves a large
      blank block in the card (e.g. Aisha's post) — hide the image on load error or show a
      tinted placeholder

### Deferred — needs backend
- [ ] Real auth (social buttons, forgot password), posting/comments/joins persistence
- [ ] Real calling & media upload (ChatRoom buttons show honest "coming soon" dialogs)
- [ ] Sathi requests & saved posts synced to account (currently device-local)
- [ ] Doctor-published Health Tips content (currently dummy data)

---

## Verification status (last full run)
| Check | Result |
|-------|--------|
| TypeScript `tsc --noEmit` | ✅ 0 errors |
| ESLint | ✅ 0 errors (17 pre-existing style warnings) |
| Jest | ✅ passing |
| iOS simulator | ✅ built, installed & launched (iPhone 17 Pro) — glass tab bar confirmed on screen |

Full history and per-session details: `testReport.md` + git log.
