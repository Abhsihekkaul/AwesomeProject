import { TooManyRequestsError } from "../utils/errors";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

// Simple in-memory fixed-window limiter. Fine for a single-instance deploy;
// swap for a Redis-backed limiter before running more than one server process.
export const enforceRateLimit = (key: string, limit: number, windowMs: number) => {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return;
  }

  bucket.count += 1;
  if (bucket.count > limit) {
    throw new TooManyRequestsError();
  }
};
