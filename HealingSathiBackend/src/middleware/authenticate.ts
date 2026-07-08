import { FastifyRequest } from "fastify";
import { verifyAccessToken } from "../lib/auth";

/** Extracts the authenticated user id from a `Bearer` access token, or null if absent/invalid. */
export const getUserIdFromRequest = (request: FastifyRequest): string | null => {
  const header = request.headers.authorization;
  if (!header?.startsWith("Bearer ")) return null;

  try {
    return verifyAccessToken(header.slice("Bearer ".length)).sub;
  } catch {
    return null;
  }
};
