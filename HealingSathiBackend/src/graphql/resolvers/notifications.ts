import { GraphQLContext, requireUserId } from "../context";
import * as notificationsService from "../../modules/notifications/service";

export const notificationsResolvers = {
  Query: {
    notifications: (
      _root: unknown,
      { first, after }: { first: number; after?: string | null },
      ctx: GraphQLContext,
    ) => notificationsService.listNotifications(requireUserId(ctx), first, after),

    unreadNotificationCount: (_root: unknown, _args: unknown, ctx: GraphQLContext) =>
      notificationsService.unreadCount(requireUserId(ctx)),
  },
  Mutation: {
    markNotificationRead: (_root: unknown, { id }: { id: string }, ctx: GraphQLContext) =>
      notificationsService.markNotificationRead(requireUserId(ctx), id),

    markAllNotificationsRead: (_root: unknown, _args: unknown, ctx: GraphQLContext) =>
      notificationsService.markAllNotificationsRead(requireUserId(ctx)),
  },
};
