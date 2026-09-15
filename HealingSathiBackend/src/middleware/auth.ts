import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

// Express request augmented with the authenticated user's id.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Requires a valid `Authorization: Bearer <accessToken>` header.
 * On success `req.userId` is set for downstream handlers.
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    res.status(401).json({ error: "Missing access token" });
    return;
  }

  try {
    req.userId = verifyAccessToken(token).userId;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired access token" });
  }
};
