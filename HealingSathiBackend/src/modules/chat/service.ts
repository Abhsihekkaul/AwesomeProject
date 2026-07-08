import { prisma } from "../../lib/prisma";
import { clampFirst } from "../../lib/pagination";
import { ForbiddenError, NotFoundError } from "../../utils/errors";

export const listConversations = (userId: string) =>
  prisma.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: { participants: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

export const assertParticipant = async (userId: string, conversationId: string) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) throw new ForbiddenError("You are not part of this conversation");
  return participant;
};

export const getConversationById = async (userId: string, id: string) => {
  await assertParticipant(userId, id);
  return prisma.conversation.findUnique({
    where: { id },
    include: { participants: { include: { user: true } } },
  });
};

export const listMessages = async (
  userId: string,
  conversationId: string,
  first: number,
  before?: string | null,
) => {
  await assertParticipant(userId, conversationId);
  return prisma.message.findMany({
    where: { conversationId },
    include: { sender: true },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: clampFirst(first),
    ...(before ? { cursor: { id: before }, skip: 1 } : {}),
  });
};

export const getLastMessage = (conversationId: string) =>
  prisma.message.findFirst({
    where: { conversationId },
    include: { sender: true },
    orderBy: { createdAt: "desc" },
  });

export const getUnreadCount = async (userId: string, conversationId: string) => {
  const participant = await prisma.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  if (!participant) return 0;

  return prisma.message.count({
    where: {
      conversationId,
      senderId: { not: userId },
      createdAt: { gt: participant.lastReadAt },
    },
  });
};

export const startConversation = async (userId: string, otherUserId: string) => {
  if (userId === otherUserId) throw new ForbiddenError("Cannot start a conversation with yourself");

  const otherUser = await prisma.user.findUnique({ where: { id: otherUserId } });
  if (!otherUser) throw new NotFoundError("User not found");

  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: otherUserId } } },
      ],
    },
    include: { participants: { include: { user: true } } },
  });
  if (existing) return existing;

  return prisma.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: otherUserId }],
      },
    },
    include: { participants: { include: { user: true } } },
  });
};

export const sendMessage = async (
  userId: string,
  conversationId: string,
  text: string,
  attachmentUrl?: string | null,
) => {
  await assertParticipant(userId, conversationId);

  const message = await prisma.message.create({
    data: { conversationId, senderId: userId, text, attachmentUrl: attachmentUrl ?? null },
    include: { sender: true },
  });

  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });

  return message;
};

export const markConversationRead = async (userId: string, conversationId: string) => {
  await assertParticipant(userId, conversationId);
  await prisma.conversationParticipant.update({
    where: { conversationId_userId: { conversationId, userId } },
    data: { lastReadAt: new Date() },
  });
  return prisma.conversation.findUnique({
    where: { id: conversationId },
    include: { participants: { include: { user: true } } },
  });
};

export const listOtherParticipantIds = async (conversationId: string, excludingUserId: string) => {
  const rows = await prisma.conversationParticipant.findMany({
    where: { conversationId, userId: { not: excludingUserId } },
    select: { userId: true },
  });
  return rows.map((r) => r.userId);
};
