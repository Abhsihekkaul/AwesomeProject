import mongoose from "mongoose";
import { createApp } from "./app";
import { initRealtime } from "./realtime";
import { env } from "./config/env";

/** Atlas URIs embed the DB password — never log it verbatim. */
const maskedMongoUri = env.mongoUri.replace(/\/\/([^:@/]+):([^@/]+)@/, "//$1:****@");

const start = async () => {
  try {
    // Fail fast (5s) with a helpful message instead of Mongoose's default 30s hang.
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 15000 });
    console.log(`✓ MongoDB connected (${maskedMongoUri})`);
  } catch (err) {
    console.error("✗ Could not connect to MongoDB.");
    console.error(`  Tried: ${maskedMongoUri}`);
    if (env.mongoUri.startsWith("mongodb+srv://")) {
      // Atlas: the #1 cause is an IP that's not on the cluster's access list
      // (home/office IPs rotate). Atlas → Network Access → Add Current IP.
      console.error("  Atlas cluster: check Network Access — your current IP is probably not whitelisted.");
      console.error("  https://www.mongodb.com/docs/atlas/security-whitelist/");
    } else {
      console.error("  Is mongod running? Start it with:  brew services start mongodb-community");
    }
    console.error("  (Full setup instructions: run.md in the AwesomeProject root)");
    process.exit(1);
  }

  const server = createApp().listen(env.port, () => {
    console.log(`✓ HealingSathi API listening on http://localhost:${env.port}`);
    console.log(`  Health check: http://localhost:${env.port}/health`);
  });
  initRealtime(server); // live chat over Socket.io, same port as the REST API

  // Deploy hosts send SIGTERM on redeploy/scale-down: finish in-flight requests,
  // close the DB connection, then exit — instead of dropping connections mid-response.
  const shutdown = (signal: string) => {
    console.log(`${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
    // Escape hatch if a connection refuses to drain.
    setTimeout(() => process.exit(1), 10_000).unref();
  };
  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));

  process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
  process.on("uncaughtException", (err) => {
    console.error("[uncaughtException]", err);
    process.exit(1);
  });
};

start();
