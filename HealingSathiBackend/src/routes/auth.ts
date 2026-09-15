import crypto from "crypto";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import {
  Booking,
  ConsultantApplication,
  Conversation,
  ExitFeedback,
  Group,
  LoginCode,
  Message,
  Notification,
  PasswordReset,
  Post,
  RefreshToken,
  SathiRequest,
  User,
} from "../models";
import { sendAuthCode } from "../utils/mailer";
import { requireAuth } from "../middleware/auth";
import { asyncHandler, HttpError } from "../utils/asyncHandler";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { env } from "../config/env";
import { cleanEmail, cleanOptionalString, cleanString, cleanStringArray } from "../utils/validate";

const router = Router();

const publicUser = (u: any) => ({
  id: u._id.toString(),
  email: u.email,
  name: u.name,
  avatarColor: u.avatarColor,
  avatarUrl: u.avatarUrl,
  coverUrl: u.coverUrl,
  conditions: u.conditions ?? [],
  role: u.role ?? "member",
  notifyOnMessages: u.notifyOnMessages !== false,
});

// Compared against when a sign-in email doesn't exist (see timing note in /signin).
const DUMMY_PASSWORD_HASH = bcrypt.hashSync("timing-equalizer", 10);

/** Issues an access+refresh pair and persists the refresh token (revocable sessions). */
const issueTokens = async (userId: string) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);
  await RefreshToken.create({
    user: userId,
    token: refreshToken,
    expiresAt: new Date(Date.now() + env.refreshTokenTtlDays * 24 * 60 * 60 * 1000),
  });
  return { accessToken, refreshToken };
};

// POST /api/auth/signup { email, password, name }
router.post(
  "/signup",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const password = cleanString(req.body?.password, "password", { min: 8, max: 128 });
    const name = cleanString(req.body?.name, "name", { max: 80 });

    const existing = await User.findOne({ email });
    if (existing) throw new HttpError(409, "An account with this email already exists");

    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await User.create({ email, passwordHash, name });
    } catch (err: any) {
      // The findOne above is racy — the unique index is the real guarantee.
      if (err?.code === 11000) throw new HttpError(409, "An account with this email already exists");
      throw err;
    }
    const tokens = await issueTokens(user._id.toString());

    res.status(201).json({ ...tokens, user: publicUser(user) });
  }),
);

// POST /api/auth/signin { email, password }
router.post(
  "/signin",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      throw new HttpError(400, "email and password are required");
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    // Timing-safe: always run a bcrypt compare so "unknown email" and "wrong password"
    // take the same time — response timing can't be used to probe which emails exist.
    const passwordOk = await bcrypt.compare(
      password,
      user ? String(user.passwordHash) : DUMMY_PASSWORD_HASH,
    );
    if (!user || !passwordOk) {
      throw new HttpError(401, "Invalid email or password");
    }

    const tokens = await issueTokens(user._id.toString());
    res.json({ ...tokens, user: publicUser(user) });
  }),
);

// POST /api/auth/refresh { refreshToken } → new access+refresh pair (rotation)
router.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (!refreshToken) throw new HttpError(400, "refreshToken is required");

    const stored = await RefreshToken.findOne({ token: refreshToken });
    if (!stored) throw new HttpError(401, "Refresh token revoked or unknown");
    if (stored.expiresAt < new Date()) {
      await stored.deleteOne();
      throw new HttpError(401, "Refresh token expired");
    }

    let userId: string;
    try {
      userId = verifyRefreshToken(refreshToken).userId;
    } catch {
      await stored.deleteOne();
      throw new HttpError(401, "Refresh token expired");
    }

    await stored.deleteOne(); // rotate: old refresh token is single-use
    const tokens = await issueTokens(userId);
    res.json(tokens);
  }),
);

// POST /api/auth/signout { refreshToken } — revokes the session server-side
router.post(
  "/signout",
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body ?? {};
    if (refreshToken) await RefreshToken.deleteOne({ token: refreshToken });
    res.json({ ok: true });
  }),
);

// GET /api/auth/me (Bearer)
router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user: publicUser(user) });
  }),
);

// PATCH /api/auth/me { name?, avatarColor?, conditions?, avatarUrl?, coverUrl? }
// avatarUrl: the profile photo (base64 data-URI for now, same transport as post
// photos); send null to remove it and fall back to initials.
// coverUrl: the profile cover/banner photo — same transport and null-to-remove.
router.patch(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const name = cleanOptionalString(req.body?.name, "name", { max: 80 });
    const avatarColor = cleanOptionalString(req.body?.avatarColor, "avatarColor", { max: 30 });
    const conditions = cleanStringArray(req.body?.conditions, "conditions", { maxItems: 20, maxLength: 60 });
    const avatarUrl = cleanOptionalString(req.body?.avatarUrl, "avatarUrl", { max: 8_000_000 });
    const clearAvatar = req.body?.avatarUrl === null;
    const coverUrl = cleanOptionalString(req.body?.coverUrl, "coverUrl", { max: 8_000_000 });
    const clearCover = req.body?.coverUrl === null;
    const notifyOnMessages =
      typeof req.body?.notifyOnMessages === "boolean" ? req.body.notifyOnMessages : undefined;
    const user = await User.findByIdAndUpdate(
      req.userId,
      {
        $set: {
          ...(name && { name }),
          ...(avatarColor && { avatarColor }),
          ...(conditions && { conditions }),
          ...(avatarUrl && { avatarUrl }),
          ...(clearAvatar && { avatarUrl: null }),
          ...(coverUrl && { coverUrl }),
          ...(clearCover && { coverUrl: null }),
          ...(notifyOnMessages !== undefined && { notifyOnMessages }),
        },
      },
      { new: true },
    );
    if (!user) throw new HttpError(404, "User not found");
    res.json({ user: publicUser(user) });
  }),
);

// DELETE /api/auth/me { password, reason, feedback? } — permanent account deletion
// (app-store requirement). Password-confirmed like change-email/change-password
// (Google-created accounts set a password via forgot-password first). `reason` is
// required (the app offers preset options) and lands — with the optional free-text
// feedback — in an ANONYMOUS ExitFeedback record so the product can learn; nothing
// in it points back to the deleted person. Then the account and everything it
// touched is erased: posts, comments, reactions, conversations + messages, sathi
// links/requests, group memberships + pending proposals, bookings, applications,
// notifications, sessions.
router.delete(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const password = cleanString(req.body?.password, "password", { max: 128 });
    const reason = cleanString(req.body?.reason, "reason", { max: 120 });
    const feedback = cleanOptionalString(req.body?.feedback, "feedback", { max: 2000 });

    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, "User not found");
    if (!(await bcrypt.compare(password, String(user.passwordHash)))) {
      throw new HttpError(401, "Incorrect password");
    }
    const userId = user._id;

    // Written BEFORE the erase so a mid-delete crash can't lose the learning.
    await ExitFeedback.create({
      reason,
      details: feedback ?? "",
      memberForDays: Math.max(
        0,
        Math.round((Date.now() - new Date(user.createdAt as any).getTime()) / 86_400_000),
      ),
    });

    // Their posts go away entirely; then their traces on OTHER people's posts
    // (comments they wrote, reactions they left).
    const myPosts = await Post.find({ author: userId }, "_id");
    const myPostIds = myPosts.map((p: any) => p._id);
    await Post.deleteMany({ author: userId });
    await Post.updateMany(
      {},
      { $pull: { comments: { author: userId }, supports: userId, helpfuls: userId } },
    );

    // Conversations are 1:1 — deleting the account removes those threads for both
    // sides (matches the "erases your messages" promise in Settings).
    const conversations = await Conversation.find({ participants: userId }, "_id");
    const conversationIds = conversations.map((c: any) => c._id);
    await Message.deleteMany({ conversation: { $in: conversationIds } });
    await Conversation.deleteMany({ _id: { $in: conversationIds } });

    // Social graph + dangling references held by other users.
    await User.updateMany(
      {},
      { $pull: { sathis: userId, blockedUsers: userId, savedPosts: { $in: myPostIds } } },
    );
    await SathiRequest.deleteMany({ $or: [{ from: userId }, { to: userId }] });
    await Group.updateMany({}, { $pull: { members: userId } });
    await Group.deleteMany({ status: "proposed", "proposal.proposedBy": userId });

    // Personal records + every session (all devices are signed out for good).
    await Promise.all([
      Notification.deleteMany({ user: userId }),
      Booking.deleteMany({ user: userId }),
      ConsultantApplication.deleteMany({ user: userId }),
      PasswordReset.deleteMany({ user: userId }),
      LoginCode.deleteMany({ user: userId }),
      RefreshToken.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });

    res.json({ ok: true });
  }),
);

// ---------- One-time auth codes (password reset + email-code sign-in) ----------

const CODE_TTL_MS = 10 * 60 * 1000;
const CODE_MAX_ATTEMPTS = 5;
const NEUTRAL_CODE_MESSAGE = "If that email exists, a code has been sent.";

type CodeModel = typeof PasswordReset | typeof LoginCode;

/** Creates (or replaces) the user's active code and returns the plaintext to email. */
const issueCode = async (model: CodeModel, userId: unknown): Promise<string> => {
  const code = crypto.randomInt(100000, 1000000).toString(); // 6 digits
  await model.findOneAndUpdate(
    { user: userId },
    { codeHash: await bcrypt.hash(code, 10), expiresAt: new Date(Date.now() + CODE_TTL_MS), attempts: 0 },
    { upsert: true },
  );
  return code;
};

/** Validates a submitted code: expiry, attempt cap, hash match. Consumes it on success. */
const consumeCode = async (model: CodeModel, userId: unknown, code: string): Promise<void> => {
  const record = await model.findOne({ user: userId });
  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "Code is invalid or has expired — request a new one");
  }
  if (record.attempts >= CODE_MAX_ATTEMPTS) {
    await record.deleteOne();
    throw new HttpError(429, "Too many incorrect attempts — request a new code");
  }
  if (!(await bcrypt.compare(code, record.codeHash))) {
    await record.updateOne({ $inc: { attempts: 1 } });
    throw new HttpError(400, "Incorrect code");
  }
  await record.deleteOne();
};

/**
 * Shared "send a code" response: with SMTP configured the code is emailed; without it
 * the code is console-logged and, outside production, returned as `devCode` so the
 * flow stays testable. Always the same 200 body shape — account existence is never
 * revealed (`user` may be null).
 */
const respondWithCode = async (
  res: Parameters<Parameters<typeof asyncHandler>[0]>[1],
  user: { _id: unknown; email: string } | null,
  model: CodeModel,
  purpose: "reset your password" | "sign in",
) => {
  if (user) {
    const code = await issueCode(model, user._id);
    const sent = await sendAuthCode(user.email, purpose, code);
    if (!sent) {
      console.log(`[auth-code] ${purpose} code for ${user.email}: ${code} (SMTP not configured)`);
      if (!env.isProduction) {
        res.json({ ok: true, message: NEUTRAL_CODE_MESSAGE, devCode: code });
        return;
      }
    }
  }
  res.json({ ok: true, message: NEUTRAL_CODE_MESSAGE });
};

// POST /api/auth/forgot-password { email }
router.post(
  "/forgot-password",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const user = await User.findOne({ email });
    await respondWithCode(res, user as any, PasswordReset, "reset your password");
  }),
);

// POST /api/auth/reset-password { email, code, newPassword }
router.post(
  "/reset-password",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const code = cleanString(req.body?.code, "code", { min: 6, max: 6 });
    const newPassword = cleanString(req.body?.newPassword, "newPassword", { min: 8, max: 128 });

    const user = await User.findOne({ email });
    if (!user) throw new HttpError(400, "Code is invalid or has expired — request a new one");
    await consumeCode(PasswordReset, user._id, code);

    await user.updateOne({ passwordHash: await bcrypt.hash(newPassword, 10) });
    // Every session is revoked: whoever holds old tokens (possibly the reason for the
    // reset) is signed out everywhere.
    await RefreshToken.deleteMany({ user: user._id });

    res.json({ ok: true });
  }),
);

// ---------- Passwordless sign-in ("email me a code") ----------

// POST /api/auth/email-code/request { email }
router.post(
  "/email-code/request",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const user = await User.findOne({ email });
    await respondWithCode(res, user as any, LoginCode, "sign in");
  }),
);

// POST /api/auth/email-code/verify { email, code } → full auth payload (like /signin)
router.post(
  "/email-code/verify",
  asyncHandler(async (req, res) => {
    const email = cleanEmail(req.body?.email);
    const code = cleanString(req.body?.code, "code", { min: 6, max: 6 });

    const user = await User.findOne({ email });
    if (!user) throw new HttpError(400, "Code is invalid or has expired — request a new one");
    await consumeCode(LoginCode, user._id, code);

    const tokens = await issueTokens(user._id.toString());
    res.json({ ...tokens, user: publicUser(user) });
  }),
);

// ---------- Google sign-in ----------

const googleClient = new OAuth2Client();

// POST /api/auth/google { idToken } — the app's Google button hands us the id token;
// we verify it against our OAuth client IDs and find-or-create the account.
router.post(
  "/google",
  asyncHandler(async (req, res) => {
    if (env.googleClientIds.length === 0) {
      throw new HttpError(501, "Google sign-in isn't configured on the server (set GOOGLE_CLIENT_IDS)");
    }
    const idToken = cleanString(req.body?.idToken, "idToken", { max: 4096 });

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.googleClientIds });
      payload = ticket.getPayload();
    } catch {
      throw new HttpError(401, "Google sign-in failed — invalid token");
    }
    if (!payload?.email || !payload.email_verified) {
      throw new HttpError(401, "Google account has no verified email");
    }

    const email = payload.email.toLowerCase();
    let user = await User.findOne({ email });
    if (!user) {
      // First Google sign-in creates the account. The random password hash keeps the
      // schema invariant (passwordHash required); they can set a real one via
      // forgot-password if they ever want email+password sign-in.
      user = await User.create({
        email,
        name: payload.name ?? email.split("@")[0],
        passwordHash: await bcrypt.hash(crypto.randomUUID(), 10),
        avatarUrl: payload.picture ?? null,
      });
    }

    const tokens = await issueTokens(user._id.toString());
    res.json({ ...tokens, user: publicUser(user) });
  }),
);

// POST /api/auth/change-password { currentPassword, newPassword, refreshToken? } (Bearer)
// The optional refreshToken identifies the calling device's session so it survives;
// every OTHER session is revoked.
router.post(
  "/change-password",
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = cleanString(req.body?.currentPassword, "currentPassword", { max: 128 });
    const newPassword = cleanString(req.body?.newPassword, "newPassword", { min: 8, max: 128 });

    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, "User not found");
    if (!(await bcrypt.compare(currentPassword, String(user.passwordHash)))) {
      throw new HttpError(401, "Current password is incorrect");
    }

    await user.updateOne({ passwordHash: await bcrypt.hash(newPassword, 10) });

    const keepToken = typeof req.body?.refreshToken === "string" ? req.body.refreshToken : null;
    await RefreshToken.deleteMany({
      user: user._id,
      ...(keepToken ? { token: { $ne: keepToken } } : {}),
    });

    res.json({ ok: true });
  }),
);

// POST /api/auth/change-email { newEmail, password } (Bearer)
router.post(
  "/change-email",
  requireAuth,
  asyncHandler(async (req, res) => {
    const newEmail = cleanEmail(req.body?.newEmail);
    const password = cleanString(req.body?.password, "password", { max: 128 });

    const user = await User.findById(req.userId);
    if (!user) throw new HttpError(404, "User not found");
    if (!(await bcrypt.compare(password, String(user.passwordHash)))) {
      throw new HttpError(401, "Password is incorrect");
    }

    try {
      user.email = newEmail;
      await user.save();
    } catch (err: any) {
      if (err?.code === 11000) throw new HttpError(409, "That email is already in use");
      throw err;
    }

    res.json({ user: publicUser(user) });
  }),
);

export default router;
