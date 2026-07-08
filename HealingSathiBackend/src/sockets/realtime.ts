import { Server } from "socket.io";

let io: Server | null = null;

export const setSocketServer = (server: Server) => {
  io = server;
};

export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};

export const emitToConversation = (conversationId: string, event: string, payload: unknown) => {
  io?.to(`conversation:${conversationId}`).emit(event, payload);
};
