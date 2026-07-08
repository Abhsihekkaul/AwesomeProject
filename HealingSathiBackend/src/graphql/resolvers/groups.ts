import { GraphQLContext, requireUserId } from "../context";
import * as groupsService from "../../modules/groups/service";

type GroupWithCount = { id: string; _count?: { memberships: number } };

export const groupsResolvers = {
  Query: {
    groups: (_root: unknown, { category }: { category?: string | null }) =>
      groupsService.listGroups(category),
    group: (_root: unknown, { id }: { id: string }) => groupsService.getGroupById(id),
    groupMembers: (_root: unknown, { groupId }: { groupId: string }) =>
      groupsService.listGroupMembers(groupId),
  },
  Mutation: {
    proposeGroup: (
      _root: unknown,
      { input }: { input: groupsService.ProposeGroupInput },
      ctx: GraphQLContext,
    ) => groupsService.proposeGroup(requireUserId(ctx), input),

    joinGroup: (_root: unknown, { groupId }: { groupId: string }, ctx: GraphQLContext) =>
      groupsService.joinGroup(requireUserId(ctx), groupId),

    leaveGroup: (_root: unknown, { groupId }: { groupId: string }, ctx: GraphQLContext) =>
      groupsService.leaveGroup(requireUserId(ctx), groupId),
  },
  Group: {
    memberCount: (parent: GroupWithCount) => parent._count?.memberships ?? 0,
    isJoined: async (parent: GroupWithCount, _args: unknown, ctx: GraphQLContext) =>
      Boolean(await groupsService.getMyMembership(ctx.userId, parent.id)),
    myRole: async (parent: GroupWithCount, _args: unknown, ctx: GraphQLContext) =>
      (await groupsService.getMyMembership(ctx.userId, parent.id))?.role ?? null,
  },
};
