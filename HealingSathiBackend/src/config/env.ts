import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

/**
 * In production, refuse to boot with missing/placeholder secrets — a forgotten env var
 * must be a crash at deploy time, never a silently forgeable JWT.
 */
const requireInProduction = (name: string, fallback: string): string => {
  const value = process.env[name];
  if (isProduction && (!value || value.includes("change-me") || value.startsWith("dev-"))) {
    console.error(`✗ ${name} must be set to a strong value in production (generate one with: openssl rand -hex 32)`);
    process.exit(1);
  }
  return value ?? fallback;
};

if (isProduction && !process.env.MONGODB_URI) {
  console.error("✗ MONGODB_URI must be set explicitly in production.");
  process.exit(1);
}

/**
 * Central, validated environment config.
 * Every value has a sane local-dev default so `npm run dev` works out of the box —
 * override via a `.env` file (see `.env.example`) in production.
 */
export const env = {
  port: Number(process.env.PORT ?? 4000),

  // Local MongoDB by default. For MongoDB Atlas paste your connection string here.
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/healingsathi",

  jwtAccessSecret: requireInProduction("JWT_ACCESS_SECRET", "dev-access-secret-change-me"),
  jwtRefreshSecret: requireInProduction("JWT_REFRESH_SECRET", "dev-refresh-secret-change-me"),

  accessTokenTtl: process.env.ACCESS_TOKEN_TTL ?? "15m",
  refreshTokenTtlDays: Number(process.env.REFRESH_TOKEN_TTL_DAYS ?? 30),

  // Comma-separated allowlist of web origins. Empty = allow all (fine for dev &
  // native mobile clients, which don't send an Origin header).
  corsOrigins: (process.env.CORS_ORIGIN ?? "")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  isProduction,
} as const;
