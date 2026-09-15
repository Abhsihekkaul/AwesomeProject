import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { HttpError } from "../utils/asyncHandler";

/** Central error handler — every thrown/rejected error funnels through here. */
export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }

  // A malformed ObjectId in a path/query (e.g. /api/posts/abc) is "not found",
  // not a server error.
  if (err instanceof mongoose.Error.CastError) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({ error: "Invalid input" });
    return;
  }

  // Mongo duplicate-key (unique index) — e.g. racing signups with the same email.
  if (typeof err === "object" && err !== null && (err as { code?: number }).code === 11000) {
    res.status(409).json({ error: "Already exists" });
    return;
  }

  console.error("[unhandled]", err);
  res.status(500).json({ error: "Something went wrong" });
};
