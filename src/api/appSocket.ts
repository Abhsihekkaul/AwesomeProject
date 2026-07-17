import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "./config";
import { tokenStorage } from "./tokenStorage";

/**
 * App-wide realtime socket, one per signed-in session. Chat rooms still use their
 * own short-lived socket (chatSocket.ts); THIS one stays connected while the app
 * is open so calls can ring you on any screen. Reconnects automatically; the
 * server re-authenticates the JWT on every (re)connect.
 */
let socket: Socket | null = null;

export const connectAppSocket = async (): Promise<Socket | null> => {
  if (socket) return socket;
  const token = await tokenStorage.getAccessToken();
  if (!token) return null;

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ["websocket"],
    reconnection: true,
    reconnectionDelayMax: 10_000,
  });
  return socket;
};

export const getAppSocket = (): Socket | null => socket;

export const disconnectAppSocket = () => {
  socket?.disconnect();
  socket = null;
};
