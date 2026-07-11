# layman.md — How to Run and Understand This Project

This is written for you to follow without needing to read the code. It covers: what this
project actually is, how to get both halves running on your machine, how to log in, how dark
mode works, and how to swap in real branding later. Follow it top to bottom the first time.

---

## 1. The big picture

HealingSathi is two separate programs that talk to each other:

1. **The app** (root of this repo, folder name `AwesomeProject`) — what you see on your phone/
   simulator. Written in React Native.
2. **The backend** (`HealingSathiBackend/` folder) — a server that stores users, posts, groups,
   chat messages, and bookings in a database, and answers questions the app asks it.

Until this session, the app only showed fake, hardcoded data — it never talked to the backend
at all. That's now wired up for sign-in/sign-up. **The backend must be running on your computer
for sign-in to work** — if it's not running, the app has nothing to talk to and login will fail.

---

## 2. One-time setup (do this once)

You need three things installed: **Node.js**, **Docker Desktop**, and (for iOS) **Xcode** with
**CocoaPods**. If you already ran this app before, you likely have these — skip to step 3.

- Node.js: check by running `node -v` in a terminal. Need 20 or newer.
- Docker Desktop: download from docker.com, install it, open it once (it needs to be *running*
  in the background — you'll see a whale icon in your menu bar — for the next steps to work).

---

## 3. Running the backend (do this every time you want to test the app for real)

Open a terminal and run these one at a time, in order:

```bash
# 1. Start a database in the background (only needs to be done once per machine reboot —
#    if you already have this container, this command will just say it already exists, that's fine)
docker run -d --name healingsathi-postgres \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=healingsathi \
  -p 5432:5432 postgres:16-alpine

# 2. Go into the backend folder
cd HealingSathiBackend

# 3. Install its dependencies (only needed the first time, or after pulling new backend code)
npm install

# 4. Create the database tables (only needed the first time, or after a schema change)
npm run prisma:migrate

# 5. Fill the database with sample data — this is what creates the "Try the Demo" login
npm run prisma:seed

# 6. Start the server — LEAVE THIS RUNNING in this terminal window
npm run dev
```

If step 6 prints something like `Server listening at http://127.0.0.1:4000`, it worked. Leave
that terminal window open the whole time you're testing the app — closing it stops the backend.

**If `docker run` fails** with "Docker daemon not running", open the Docker Desktop app first
and wait for the whale icon to stop animating, then retry.

**To check the backend is really working**, open `http://localhost:4000/graphiql` in a browser
while it's running — you should see a GraphQL playground, not an error page.

---

## 4. Running the app

In a **second, separate terminal window** (keep the backend running in the first one):

```bash
# From the repo root (not inside HealingSathiBackend)
npm install          # only needed first time / after pulling new app code

# iOS only, only needed first time / after adding a native dependency:
cd ios && pod install && cd ..

# Then, to actually launch it:
npm run ios          # opens the iOS Simulator
# or
npm run android       # opens an Android emulator
```

### iOS Simulator vs. a real phone vs. Android emulator

The app is currently hardcoded to look for the backend at `localhost` (iOS simulator) or
`10.0.2.2` (Android emulator) — see `src/api/config.ts`. This works automatically for
simulators/emulators running on the same Mac as the backend.

**If you test on a real physical phone**, `localhost` won't reach your computer — you'll need
to change `src/api/config.ts` to use your computer's local network IP address (e.g.
`192.168.1.23`) instead, and make sure your phone is on the same Wi-Fi network.

---

## 5. Logging in

On the auth screen you have three options:
- **"Try the Demo" button** — one tap, signs in as a pre-made sample account (Priya Sharma).
  This only works if you've run the backend's seed step (step 3.5 above).
- **Sign up** — creates a brand-new real account in the database. Needs a password at least
  8 characters with letters and numbers.
- **Sign in** — for an account you already created.

**If login does nothing / shows an error**: it's almost always because the backend isn't
running, or Postgres isn't running. Go back to section 3 and make sure step 6's terminal is
still open and didn't crash.

---

## 6. How dark mode works (read this before changing any screen's styling)

Every screen reads colors through a hook, not hardcoded hex values:

```tsx
const { colors } = useTheme();
const styles = makeStyles(colors);
```

Then styles are defined as a *function* that takes `colors` in, not a plain object:

```tsx
const makeStyles = (colors) => StyleSheet.create({
  card: { backgroundColor: colors.card, borderColor: colors.border },
});
```

`colors.card`, `colors.text`, `colors.border` etc. automatically flip between light and dark
values (defined once in `src/theme/colors.ts`). **If you ever write a literal color like
`"#F3F4F6"` or `"white"` directly into a style, it will look wrong in dark mode** — that exact
bug was just fixed in several screens this session. Always reach for a `colors.*` token instead.
The full token list is in `src/theme/colors.ts`.

---

## 7. Branding: logo, app icon, splash screen

- `branding.md` (repo root) contains a ready-to-paste prompt for generating a proper logo via
  an AI image tool, if you want something more polished than what's there now.
- Right now, the app icon and splash screen use a generated placeholder: a white infinity
  symbol (∞) on the brand purple, chosen to represent "infinite bonding/care." The source files
  are in `src/assets/branding/icon-options/` (the one actually in use is
  `option-5-infinity.png`).
- **If you generate a new logo and want to swap it in**: save your new logo as a square PNG
  (ideally 1024x1024, transparent background, single-color glyph works best), then tell your
  next Claude Code session "replace the app icon with this file" and point it at the new PNG —
  it will regenerate every required size for iOS and Android and update the splash screen for
  you (the same way this session did it — see `src/components/SplashScreen.tsx`, iOS's
  `Images.xcassets/AppIcon.appiconset/`, and Android's `mipmap-*` folders).

---

## 8. Preparing a real release build (only needed before publishing to an app store)

Right now, Android "release" builds are signed with a public debug key, which is fine for
testing but **must never be used to publish to the Play Store**. Before you publish:
1. Generate a real signing key (one-time, see `android/keystore.properties.example` for the
   exact command).
2. Copy that example file to `android/keystore.properties` (same folder) and fill in your real
   values — this file is gitignored on purpose, never commit it.
3. From then on, `assembleRelease` will use your real key automatically.

---

## 9. Where to look next

- `bugs.md` (repo root) — the full list of known issues, what's already fixed, and what's still
  open, ranked by severity. Worth skimming before asking for new work so you know what's already
  been handled.
- `HealingSathiBackend/docs/ARCHITECTURE.md` and `docs/API.md` — deeper technical detail on the
  backend if you ever want it, though you shouldn't need them for day-to-day use.
