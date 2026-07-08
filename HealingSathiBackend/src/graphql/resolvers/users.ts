import { GraphQLContext, requireUserId } from "../context";
import * as usersService from "../../modules/users/service";
import { prisma } from "../../lib/prisma";

type UserParent = { id: string; conditions?: unknown[] };

export const usersResolvers = {
  User: {
    // Nested User objects (e.g. Post.author) aren't always loaded with `include: { conditions: true }`.
    conditions: (parent: UserParent) =>
      parent.conditions ??
      prisma.condition.findMany({ where: { users: { some: { id: parent.id } } } }),
  },
  Query: {
    me: (_root: unknown, _args: unknown, ctx: GraphQLContext) =>
      ctx.userId ? usersService.getUserById(ctx.userId) : null,
    conditions: () => usersService.listConditions(),
  },
  Mutation: {
    updateProfile: (
      _root: unknown,
      { input }: { input: usersService.UpdateProfileInput },
      ctx: GraphQLContext,
    ) => usersService.updateProfile(requireUserId(ctx), input),
  },
};
