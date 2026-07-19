# Diya 🪔 — HealingSathi's daily ritual

*The healing answer to Instagram stories and Snapchat streaks.*

## The idea in one line

Once a day, you **light your diya**: pick how today feels, optionally add a
thought or a photo — and your sathis see your little flame burning in a ring
bar at the top of their feed until tomorrow.

## Why "Diya"

A diya is the small oil lamp lit daily in Indian homes — a quiet act of
hope and continuity, not a performance. That is exactly the emotional register
this feature wants: *"I showed up today."* It's also unmistakably ours —
HealingSathi is the companion (sathi) and the diya is the daily light you keep
for each other. One word, one emoji (🪔), instantly explainable.

## What makes it different from stories/streaks

Design research on 2026 wellness apps is blunt about this: hard streak
mechanics (loss warnings, "don't break the chain!" pressure) make health apps
feel like another system to satisfy, and actively harm users during bad
stretches. So Diya is deliberately **gentle**:

- **A check-in, not a highlight reel.** The unit of content is a *mood* —
  from a hand-picked healing palette (Bright day 🌤️ · Steady 🌿 · Managing 🌦️ ·
  Heavy 🌧️ · Resting 🫧 · Small win 🌱) — plus an optional thought (≤500 chars)
  and/or one photo. "Heavy" is as valid a diya as "Small win": honesty is the
  content.
- **The flame never shames.** Consecutive days build your **flame** (a small
  number on your ring). Miss a day and the flame simply *rests* — the next
  diya starts it again at 1. There are **no** warnings, reminder nags, streak
  freezes, or "about to lose it" copy anywhere, ever. This is a hard rule.
- **Private to your circle.** Diyas are visible only to accepted sathis —
  never public, never searchable, gone from the bar after the day ends
  (records stay in the DB for a future "my months in moods" personal view).
- **Support, not likes.** The only reaction is **"🤍 Hold them"** — a single,
  warm acknowledgment. No counts race, no comment threads, no resharing.

## Where it lives

- **Web**: ring bar at the top of `/feed` (`DiyaBar.tsx`) — your diya first
  (dashed ring + 🪔 until lit, gradient ring + your mood emoji after), then
  every sathi who lit theirs today. Click yours → light/update dialog; click
  theirs → story-style viewer with Hold.
- **App**: the same bar on the Home screen (`src/features/diya/DiyaBar.tsx`),
  with bottom-sheet modals for lighting and viewing.
- Both clients show demo diyas in signed-out demo mode.

## Backend (all new, live)

- `Diya` model: `{ user, day: "YYYY-MM-DD", mood, note, photo, supports[] }`,
  unique per user+day. `User` gains `diyaStreak` + `lastDiyaDay`.
- `POST /api/diyas` `{ mood, note?, photo? }` — light or update today's diya
  (streak ticks once per day: yesterday-lit → +1, else → 1).
- `GET /api/diyas` — `{ mine: { litToday, streak, diya }, circle: [...] }` —
  today's diyas from your sathis only.
- `POST /api/diyas/:id/support` — toggle "holding them" (sathis + owner only).

## Viewing

On the app, opening a sathi's diya is a **full-screen story view**: the photo
fills the screen with a blurred copy of itself as the backdrop, a thin progress
bar drains over **30 seconds** and then the view closes itself (or tap ✕).
The web viewer is a centered dialog.

## Later (not built yet)

- **30–60s video diyas** — blocked on the "cloud media storage" backlog item:
  video cannot ride the current base64-in-JSON transport (a minute of video is
  10×+ the API's 25mb budget), and the app needs `react-native-video` +
  camera capture (native modules, full rebuild). When media storage lands,
  the Diya model's `photo` field generalizes to `media { type, url }`.

- A personal "flame history" — your months as a calendar of mood colors
  (private, in the Healing Diary).
- Gentle diya notification: at most one, user-opt-in, phrased as an invitation
  ("your circle's diyas are glowing") — never as streak pressure.
- Mood-aware nudges: if someone's diyas have been Heavy for days, quietly
  surface the Psychological Help tab to *them* (never to others).
