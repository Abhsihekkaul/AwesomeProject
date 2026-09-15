import { HttpError } from "./asyncHandler";

/**
 * Dependency-free request-body validation. Every user-supplied string goes through
 * cleanString so a route can never persist a non-string, an empty value, or an
 * unbounded blob of text.
 */

type CleanOpts = { max: number; min?: number };

/** Required string: trims, enforces type and length, 400s otherwise. */
export const cleanString = (value: unknown, field: string, opts: CleanOpts): string => {
  if (value === undefined || value === null) throw new HttpError(400, `${field} is required`);
  if (typeof value !== "string") throw new HttpError(400, `${field} must be a string`);
  const trimmed = value.trim();
  if (!trimmed) throw new HttpError(400, `${field} is required`);
  if (opts.min && trimmed.length < opts.min) {
    throw new HttpError(400, `${field} must be at least ${opts.min} characters`);
  }
  if (trimmed.length > opts.max) {
    throw new HttpError(400, `${field} must be at most ${opts.max} characters`);
  }
  return trimmed;
};

/** Optional string: undefined/null/empty pass through as undefined. */
export const cleanOptionalString = (
  value: unknown,
  field: string,
  opts: CleanOpts,
): string | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  return cleanString(value, field, opts);
};

/** Optional array of short strings (e.g. tags, conditions). */
export const cleanStringArray = (
  value: unknown,
  field: string,
  opts: { maxItems: number; maxLength: number },
): string[] | undefined => {
  if (value === undefined || value === null) return undefined;
  if (!Array.isArray(value)) throw new HttpError(400, `${field} must be an array`);
  if (value.length > opts.maxItems) {
    throw new HttpError(400, `${field} must have at most ${opts.maxItems} items`);
  }
  return value.map((item, i) => cleanString(item, `${field}[${i}]`, { max: opts.maxLength }));
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const cleanEmail = (value: unknown): string => {
  const email = cleanString(value, "email", { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address");
  return email;
};
