import { prisma } from "../../lib/prisma";
import { ConflictError, NotFoundError } from "../../utils/errors";

export const listGroups = (category?: string | null) =>
  prisma.group.findMany({
    where: { status: "Active", ...(category ? { category } : {}) },
    include: { createdBy: true, _count: { select: { memberships: true } } },
    orderBy: { createdAt: "desc" },
  });

export const getGroupById = (id: string) =>
  prisma.group.findUnique({
    where: { id },
    include: { createdBy: true, _count: { select: { memberships: true } } },
  });

export const listGroupMembers = (groupId: string) =>
  prisma.groupMembership.findMany({
    where: { groupId },
    include: { user: true },
    orderBy: { joinedAt: "asc" },
  });

export const getMyMembership = (userId: string | null, groupId: string) =>
  userId
    ? prisma.groupMembership.findUnique({
        where: { userId_groupId: { userId, groupId } },
      })
    : Promise.resolve(null);

export type ProposeGroupInput = {
  conditionName: string;
  briefDescription: string;
  estimatedPopulation?: string;
  whyNeeded: string;
  medicalReferences?: string;
};

export const proposeGroup = (userId: string, input: ProposeGroupInput) =>
  prisma.groupProposal.create({
    data: { requestedById: userId, ...input },
    include: { requestedBy: true },
  });

export const joinGroup = async (userId: string, groupId: string) => {
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) throw new NotFoundError("Group not found");

  await prisma.groupMembership.upsert({
    where: { userId_groupId: { userId, groupId } },
    create: { userId, groupId, role: "Member" },
    update: {},
  });

  return getGroupById(groupId);
};

export const leaveGroup = async (userId: string, groupId: string) => {
  const membership = await prisma.groupMembership.findUnique({
    where: { userId_groupId: { userId, groupId } },
  });
  if (!membership) throw new ConflictError("You are not a member of this group");

  await prisma.groupMembership.delete({ where: { id: membership.id } });
  return getGroupById(groupId);
};
