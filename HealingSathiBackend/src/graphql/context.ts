import { FastifyRequest } from "fastify";
import { prisma } from "../lib/prisma";
import { getUserIdFromRequest } from "../middleware/authenticate";
import { UnauthorizedError } from "../utils/errors";

export type GraphQLContext = {
  prisma: typeof prisma;
  userId: string | null;
  ip: string;
};

export const buildContext = async (request: FastifyRequest): Promise<GraphQLContext> => ({
  prisma,
  userId: getUserIdFromRequest(request),
  ip: request.ip,
});

export const requireUserId = (ctx: GraphQLContext): string => {
  if (!ctx.userId) throw new UnauthorizedError();
  return ctx.userId;
};
