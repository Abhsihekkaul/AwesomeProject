import { prisma } from "../../lib/prisma";
import { clampFirst } from "../../lib/pagination";
import { NotFoundError } from "../../utils/errors";
import { emitToUser } from "../../sockets/realtime";

export const listNotifications = (userId: string, first: number, after?: string | null) =>
  prisma.notification.findMany({
    where: { userId },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: clampFirst(first),
    ...(after ? { cursor: { id: after }, skip: 1 } : {}),
  });

export const unreadCount = (userId: string) =>
  prisma.notification.count({ where: { userId, read: false } });

export type CreateNotificationInput = {
  userId: string;
  type: "Groups" | "Chats" | "System" | "Booking";
  title: string;
  message: string;
  deepLinkType?: string | null;
  deepLinkId?: string | null;
};

export const createNotification = (input: CreateNotificationInput) =>
  prisma.notification.create({ data: input });

/** Persists a notification and pushes it live to the recipient's `user:{id}` socket room. */
export const notifyUser = async (input: CreateNotificationInput) => {
  const notification = await createNotification(input);
  emitToUser(input.userId, "notification:new", notification);
  return notification;
};

export const markNotificationRead = async (userId: string, id: string) => {
  const notification = await prisma.notification.findUnique({ where: { id } });
  if (!notification || notification.userId !== userId) {
    throw new NotFoundError("Notification not found");
  }
  return prisma.notification.update({ where: { id }, data: { read: true } });
};

export const markAllNotificationsRead = async (userId: string) => {
  await prisma.notification.updateMany({ where: { userId, read: false }, data: { read: true } });
  return true;
};
