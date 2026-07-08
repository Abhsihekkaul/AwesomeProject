import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import mercurius from "mercurius";
import { env } from "./config/env";
import { schema, resolvers } from "./graphql";
import { buildContext } from "./graphql/context";
import { AppError } from "./utils/errors";

export const buildApp = () => {
  const app = Fastify({ logger: true });

  app.register(cors, { origin: env.CORS_ORIGIN });

  // Coarse, per-IP safety net across the whole (single) GraphQL endpoint.
  // Auth mutations additionally enforce tighter, per-email limits in
  // modules/auth/service.ts since this can't distinguish operations by name.
  app.register(rateLimit, { max: 300, timeWindow: "1 minute" });

  app.register(mercurius, {
    schema,
    resolvers,
    context: buildContext,
    graphiql: env.NODE_ENV !== "production",
    errorFormatter: (execution, ctx) => {
      const formatted = mercurius.defaultErrorFormatter(execution, ctx);

      formatted.response.errors = formatted.response.errors?.map((error, i) => {
        const original = execution.errors?.[i]?.originalError;
        const code = original instanceof AppError ? original.code : undefined;
        return code ? { ...error, extensions: { ...error.extensions, code } } : error;
      });

      return formatted;
    },
  });

  app.get("/health", async () => ({ status: "ok" }));

  return app;
};
