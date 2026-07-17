# Admin account — what it is and how to use it

Simple guide to the superuser ("admin") side of HealingSathi.

---

## 1. The login

| | |
|---|---|
| **Email** | `admin@healingsathi.dev` |
| **Password** | `password123` |

This account is created by the database seed. If you have never run the seed (or
you reset the database), run this once inside `HealingSathiBackend/`:

```
npm run seed
```

Don't worry — the seed only wipes the `@healingsathi.dev` demo accounts and demo
content. **Real accounts that people signed up with are kept.**

## 2. How to get in

1. Open the app and go to the sign-in screen.
2. Sign in with `admin@healingsathi.dev` / `password123` (normal sign-in, nothing
   special).
3. Go to **Profile → Settings**. You will see a section that normal users never
   see: **ADMIN → "Review queue"**.
4. Tap **Review queue**. That's the whole admin area.

The admin account behaves like a regular member everywhere else — it can post,
chat, join groups, etc. The only extra power is the review queue.

## 3. What the review queue does

Two kinds of requests from users land there, and they stay invisible to the
public until YOU approve them:

**a) Group proposals** — when a user taps "Request a group" and fills the form:
- **Approve** → the group goes live for everyone, the proposer automatically
  becomes its first member, and they get a notification.
- **Reject** → the group never appears; the proposer is notified (you can add an
  optional reason).

**b) Consultant applications** — when a user fills "Join as a consultant":
- **Approve** → a public consultant profile is created (visible in Psychological
  Help) and the applicant is notified.
- **Reject** → the applicant is notified with your optional reason, and they are
  allowed to fix things and apply again.

Every button asks for confirmation first, so you can't approve something with an
accidental tap.

## 4. Why it's safe

- The ADMIN section in Settings only renders for admin accounts — but that's just
  cosmetics. The real protection is on the server: every `/api/admin/...` request
  checks the account's role in the database and answers **403 Forbidden** for
  anyone who isn't an admin, no matter what the app claims.
- There is **deliberately no way to become admin from inside the app** — no
  hidden button, no signup trick. Admin can only be granted by touching the
  database directly (next section). That's why a leaked password alone can't
  create new admins.

## 5. Making your own account an admin (optional)

If you want YOUR real account (not the seeded one) to have admin powers:

1. Open MongoDB Atlas → your cluster → **Browse Collections** → `users`.
2. Find your account (search by your email).
3. Edit the document: change `role` from `"member"` to `"admin"` and save.
4. Sign out and back in inside the app — the ADMIN section appears.

(Change it back to `"member"` any time to remove the power.)

## 6. Good to know

- **Change the password before any real launch.** `password123` is a development
  convenience. Easiest way: sign in as the admin → Settings → Change password.
- The other seeded logins, if you need them for testing: `patient@healingsathi.dev`,
  `alex@healingsathi.dev`, `maya@healingsathi.dev` — all with `password123`.
- To test the full loop by yourself: sign in as a normal user → request a group
  (Groups → "Request a group") or apply as a consultant (Help → "Join as a
  consultant") → sign in as the admin → Settings → Review queue → approve →
  sign back in as the user and see the result + notification.
- Coming later (already in the backlog in `pendingTask.md`): user "Report post"
  reports flowing into this same queue, and admin alerts when something new
  arrives — today you have to open the queue to see what's waiting.
