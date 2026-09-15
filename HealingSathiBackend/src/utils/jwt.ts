import crypto from "crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AccessPayload = { userId: string };

export const signAccessToken = (userId: string) =>
  jwt.sign({ userId } satisfies AccessPayload, env.jwtAccessSecret, {
    expiresIn: env.accessTokenTtl,
  } as jwt.SignOptions);

export const signRefreshToken = (userId: string) =>
  // jwtid makes every refresh token unique — without it, two tokens signed for the same
  // user within the same second are byte-identical, which breaks single-use rotation.
  jwt.sign({ userId } satisfies AccessPayload, env.jwtRefreshSecret, {
    expiresIn: `${env.refreshTokenTtlDays}d`,
    jwtid: crypto.randomUUID(),
  } as jwt.SignOptions);

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as AccessPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as AccessPayload;
