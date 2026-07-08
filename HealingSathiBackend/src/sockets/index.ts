import { Server as HttpServer } from "node:http";
import { Server, Socket } from "socket.io";
import { verifyAccessToken } from "../lib/auth";
import { env } from "../config/env";
import { setSocketServer, emitToConversation } from "./realtime";
import * as chatService from "../modules/chat/service";
import * as notificationsService from "../modules/notifications/service";

type AuthedSocket = Socket & { userId: string };

export const initSockets = (httpServer: HttpServer) => {
  const io = new Server(httpServer, {
    cors: { origin: env.CORS_ORIGIN },
  });

  setSocketServer(io);

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Missing auth token"));

    try {
      const payload = verifyAccessToken(token);
      (socket as AuthedSocket).userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket as AuthedSocket;
    socket.join(`user:${userId}`);

    socket.on(
      "conversation:join",
      async (conversationId: string, ack?: (result: { ok: boolean; error?: string }) => void) => {
        try {
          await chatService.assertParticipant(userId, conversationId);
          socket.join(`conversation:${conversationId}`);
          ack?.({ ok: true });
        } catch (err) {
          ack?.({ ok: false, error: (err as Error).message });
        }
      },
    );

    socket.on("conversation:leave", (conversationId: string) => {
      socket.leave(`conversation:${conversationId}`);
    });

    socket.on(
      "message:send",
      async (
        payload: { conversationId: string; text: string; attachmentUrl?: string },
        ack?: (result: { ok: boolean; error?: string }) => void,
      ) => {
        try {
          const message = await chatService.sendMessage(
            userId,
            payload.conversationId,
            payload.text,
            payload.attachmentUrl,
          );

          emitToConversation(payload.conversationId, "message:new", message);

          const otherUserIds = await chatService.listOtherParticipantIds(
            payload.conversationId,
            userId,
          );
          await Promise.all(
            otherUserIds.map((recipientId) =>
              notificationsService.notifyUser({
                userId: recipientId,
                type: "Chats",
                title: message.sender.name,
                message: message.text,
                deepLinkType: "conversation",
                deepLinkId: payload.conversationId,
              }),
            ),
          );

          ack?.({ ok: true });
        } catch (err) {
          ack?.({ ok: false, error: (err as Error).message });
        }
      },
    );
  });

  return io;
};
