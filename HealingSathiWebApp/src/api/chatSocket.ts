import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { tokenStorage } from "./tokenStorage";

export type IncomingMessage = {
  chatId: string;
  message: {
    id: string;
    senderId: string;
    text: string;
    image?: string | null;
    /** Shared post as a full card shape (see backend shapePost), or null. */
    sharedPost?: unknown;
    time: string;
  };
};

/**
 * Live-chat socket. Messages are still SENT over REST (resourcesApi.sendMessage);
 * this connection only RECEIVES `message:new` so both sides of a conversation see
 * each other's messages instantly. Polling stays on as a fallback — if the socket
 * can't connect, chat degrades to slightly-delayed instead of breaking.
 *
 * Returns a cleanup function; call it when the chat screen unmounts.
 */
export const joinChatRoom = (
  chatId: string,
  onMessage: (payload: IncomingMessage) => void,
): (() => void) => {
  let socket: Socket | null = null;
  let cancelled = false;

  (async () => {
    const token = await tokenStorage.getAccessToken();
    if (cancelled || !token) return;

    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"], // skip HTTP long-polling upgrade dance on native
      reconnectionAttempts: 5,
    });
    socket.emit("chat:join", chatId);
    // Rooms don't survive a reconnect — rejoin every time the connection comes back.
    socket.on("connect", () => socket?.emit("chat:join", chatId));
    socket.on("message:new", (payload: IncomingMessage) => {
      if (payload?.chatId === chatId) onMessage(payload);
    });
  })();

  return () => {
    cancelled = true;
    socket?.disconnect();
  };
};
