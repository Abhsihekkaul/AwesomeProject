import crypto from "node:crypto";
import { prisma } from "../../lib/prisma";
import {
  hashPassword,
  signAccessToken,
  signRefreshToken,
  verifyPassword,
  verifyRefreshToken,
} from "../../lib/auth";
import { env } from "../../config/env";
import { enforceRateLimit } from "../../lib/rateLimiter";
import {
  ConflictError,
  NotImplementedError,
  UnauthorizedError,
  ValidationError,
} from "../../utils/errors";

const MIN_PASSWORD_LENGTH = 8;

const assertPasswordStrength = (password: string) => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters long`);
  }
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new ValidationError("Password must contain both letters and numbers");
  }
};

const hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

const ttlToMs = (ttl: string) => {
  const match = /^(\d+)([smhd])$/.exec(ttl);
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const unitMs = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 }[unit]!;
  return value * unitMs;
};

const issueTokenPair = async (userId: string) => {
  const accessToken = signAccessToken(userId);
  const refreshToken = signRefreshToken(userId);

  await prisma.refreshToken.create({
    data: {
      userId,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + ttlToMs(env.JWT_REFRESH_TTL)),
    },
  });

  return { accessToken, refreshToken };
};

const withUser = async (userId: string) => {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    include: { conditions: true },
  });
  return user;
};

export const signUp = async (email: string, password: string, name: string, ip: string) => {
  enforceRateLimit(`signup:ip:${ip}`, 10, 60 * 60 * 1000);
  assertPasswordStrength(password);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError("An account with this email already exists");

  const passwordHash = await hashPassword(password);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
    include: { conditions: true },
  });

  const tokens = await issueTokenPair(user.id);
  return { ...tokens, user };
};

export const signIn = async (email: string, password: string, ip: string) => {
  enforceRateLimit(`signin:ip:${ip}`, 20, 15 * 60 * 1000);
  enforceRateLimit(`signin:email:${email.toLowerCase()}`, 10, 15 * 60 * 1000);

  const user = await prisma.user.findUnique({
    where: { email },
    include: { conditions: true },
  });
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
    throw new UnauthorizedError("Invalid email or password");
  }

  const tokens = await issueTokenPair(user.id);
  return { ...tokens, user };
};

export const refreshAccessToken = async (refreshToken: string, ip: string) => {
  enforceRateLimit(`refresh:ip:${ip}`, 30, 15 * 60 * 1000);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: { userId: payload.sub, tokenHash, revoked: false, expiresAt: { gt: new Date() } },
  });
  if (!stored) throw new UnauthorizedError("Refresh token has been revoked or expired");

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });

  const tokens = await issueTokenPair(payload.sub);
  const user = await withUser(payload.sub);
  return { ...tokens, user };
};

export const signInWithGoogle = async (_idToken: string) => {
  throw new NotImplementedError(
    "Google sign-in isn't wired up yet — set GOOGLE_CLIENT_ID and implement id-token verification in modules/auth/service.ts",
  );
};

export const signInWithApple = async (_idToken: string) => {
  throw new NotImplementedError(
    "Apple sign-in isn't wired up yet — set APPLE_CLIENT_ID and implement id-token verification in modules/auth/service.ts",
  );
};
