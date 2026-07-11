import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import authRoutes from "./routes/auth";
import postRoutes from "./routes/posts";
import groupRoutes from "./routes/groups";
import chatRoutes from "./routes/chats";
import sathiRoutes from "./routes/sathi";
import miscRoutes from "./routes/misc";
import { errorHandler } from "./middleware/error";
import { env } from "./config/env";

export const createApp = () => {
  const app = express();

  // Deploy hosts (Render/Railway/Fly/nginx) sit behind a proxy — without this every
  // request shares the proxy's IP and per-IP rate limiting is meaningless.
  app.set("trust proxy", 1);

  app.use(helmet());

  // Native mobile clients send no Origin header and pass through unaffected; the
  // allowlist only gates browsers. Empty allowlist (dev) = allow all.
  app.use(
    cors(env.corsOrigins.length > 0 ? { origin: env.corsOrigins } : undefined),
  );

  app.use(express.json({ limit: "1mb" }));

  // Minimal request log: method, path, status, duration. Skipped during smoke tests.
  if (process.env.NODE_ENV !== "test") {
    app.use((req, res, next) => {
      const startedAt = Date.now();
      res.on("finish", () => {
        console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - startedAt}ms`);
      });
      next();
    });
  }

  const globalLimiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 300, // generous: an active app screen polls a handful of endpoints
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please slow down" },
  });

  // Strict on auth: blunts credential stuffing / signup spam without locking out
  // a household NAT (limit is per-IP per 15 min).
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many attempts, please try again later" },
  });

  app.use("/api", globalLimiter);

  // Liveness probe — reports DB state so the platform health check restarts us
  // if Mongo drops (readyState 1 = connected).
  app.get("/health", (_req, res) => {
    const dbConnected = mongoose.connection.readyState === 1;
    res.status(dbConnected ? 200 : 503).json({
      ok: dbConnected,
      service: "healingsathi-backend",
      db: dbConnected ? "connected" : "disconnected",
      time: new Date().toISOString(),
    });
  });

  app.use("/api/auth", authLimiter, authRoutes);
  app.use("/api/posts", postRoutes);
  app.use("/api/groups", groupRoutes);
  app.use("/api/chats", chatRoutes);
  app.use("/api/sathi", sathiRoutes);
  app.use("/api", miscRoutes); // /api/notifications, /api/consultants, /api/bookings, /api/tips

  app.use((_req, res) => res.status(404).json({ error: "Route not found" }));
  app.use(errorHandler);

  return app;
};
