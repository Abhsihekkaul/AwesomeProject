import argon2 from "argon2";
import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type AccessTokenPayload = {
  sub: string;
};

export const hashPassword = (password: string) => argon2.hash(password);

export const verifyPassword = (hash: string, password: string) =>
  argon2.verify(hash, password);

export const signAccessToken = (userId: string) =>
  jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_TTL,
  } as jwt.SignOptions);

export const signRefreshToken = (userId: string) =>
  jwt.sign({ sub: userId } satisfies AccessTokenPayload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_TTL,
  } as jwt.SignOptions);

export const verifyAccessToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string): AccessTokenPayload =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as AccessTokenPayload;
