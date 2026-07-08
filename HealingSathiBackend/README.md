# HealingSathiBackend

The backend for **HealingSathi** — a social + mental-health support app (Instagram-style
condition-based groups and posts, threaded discussions, 1:1 chat, and consultant/healer
booking). This service is standalone from the React Native app in the parent directory; the
two communicate purely over GraphQL + Socket.io.

## Stack

- **Fastify** + **Mercurius** (GraphQL server)
- **PostgreSQL** + **Prisma** (schema, migrations, client)
- **Socket.io** for real-time chat and live notification delivery
- **JWT** (access + rotating refresh tokens) + **argon2** password hashing
- TypeScript throughout, run via `tsx` in development

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the modules fit together and
[docs/API.md](docs/API.md) for the full GraphQL reference with example requests.

## Prerequisites

- Node.js 20+
- A PostgreSQL database. Locally, the easiest option is Docker:
  ```bash
  docker run -d --name healingsathi-postgres \
    -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=healingsathi \
    -p 5432:5432 postgres:16-alpine
  ```

## Setup

```bash
cd HealingSathiBackend
npm install
cp .env.example .env        # edit if your DB/ports differ
npx prisma migrate dev      # creates tables
npm run prisma:seed         # conditions catalog + demo users/group/healer
npm run dev                 # starts the server with hot reload
```

The server logs the GraphiQL URL on boot — by default:
**http://localhost:4000/graphiql**

Health check: `GET http://localhost:4000/health` → `{ "status": "ok" }`

## Demo accounts (from the seed script)

All demo accounts use the password `password123`.

| Email | Role |
|---|---|
| `patient@healingsathi.dev` | Patient, member of "Fibromyalgia Warriors" |
| `alex@healingsathi.dev` | Patient, second member of the same group |
| `dr.chen@healingsathi.dev` | Healer (Clinical Psychologist), Mon/Wed/Fri 9am–1pm availability |

After seeding, a healer must call `generateSlots(fromDate, toDate)` (see docs/API.md) to
materialize bookable `Slot` rows from their `AvailabilityRule`s before patients can book.

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start the server with file-watch reload |
| `npm run build` / `npm start` | Compile to `dist/` and run the compiled server |
| `npm run prisma:migrate` | Create/apply a migration from schema changes |
| `npm run prisma:studio` | Open Prisma Studio to browse the database |
| `npm run prisma:seed` | Re-run the seed script (idempotent — safe to re-run) |

## What's explicitly NOT implemented yet

These are called out in code (search for `NotImplementedError` / "Not implemented yet") and
in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md#follow-up-work) so they aren't mistaken for
oversights:

- Google / Apple sign-in (stubs exist; need real client IDs + id-token verification)
- Payments and video-call link generation for bookings
- Push notifications to native devices (APNs/FCM) — Socket.io only covers in-app real-time
- Wiring the existing React Native screens to call this API (they still render local dummy data)
