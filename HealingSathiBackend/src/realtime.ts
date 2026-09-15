import type { Server as HttpServer } from "http";
import { Server as SocketServer } from "socket.io";
import { Conversation, User } from "./models";
import { verifyAccessToken } from "./utils/jwt";

/**
 * Realtime layer (Socket.io) for live chat and WebRTC call signaling.
 *
 * Chat design: messages are SENT over REST (POST /chats/:id/messages — validation,
 * persistence and rate limiting stay in one place) and RECEIVED over the socket.
 * The REST handler calls emitToChat() after saving, so every connected participant
 * gets `message:new` instantly. Clients keep polling as a fallback — a dropped
 * socket degrades to "slightly delayed", never "broken".
 *
 * Call design: the server is a pure signaling relay — SDP offers/answers and ICE
 * candidates hop between the two users' personal rooms; the audio/video itself
 * flows peer-to-peer over WebRTC (no third-party service; STUN only, self-hosted
 * TURN is the infra add-on for hostile NATs). Every relayed event re-checks that
 * the two users actually share a conversation, so strangers can't ring anyone.
 *
 * Auth: the client passes its JWT access token in the connection handshake
 * (`auth: { token }`); invalid tokens never finish connecting. Room membership is
 * re-checked against the Conversation document on every `chat:join`.
 */
let io: SocketServer | null = null;

// A call exchanges dozens of ICE candidates — cache the "do these two share a
// conversation?" check briefly instead of hitting Mongo for each one.
const contactCache = new Map<string, { ok: boolean; expiresAt: number }>();
const CONTACT_CACHE_TTL_MS = 60_000;

const areInContact = async (userId: string, otherId: string): Promise<boolean> => {
  const key = [userId, otherId].sort().join(":");
  const cached = contactCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.ok;

  const conversation = await Conversation.findOne({
    participants: { $all: [userId, otherId], $size: 2 },
  });
  const ok = conversation !== null;
  contactCache.set(key, { ok, expiresAt: Date.now() + CONTACT_CACHE_TTL_MS });
  return ok;
};

export const initRealtime = (server: HttpServer): SocketServer => {
  io = new SocketServer(server, {
    // Native mobile clients send no Origin header; browsers are gated by the REST
    // CORS allowlist anyway — the socket carries no data without a valid JWT.
    cors: { origin: "*" },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      socket.data.userId = verifyAccessToken(String(token ?? "")).userId;
      next();
    } catch {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    // Personal room: chat-list updates, future notification pushes.
    socket.join(`user:${userId}`);

    // Join a conversation's room — only if the caller is a participant.
    socket.on("chat:join", async (chatId: unknown) => {
      try {
        const conversation = await Conversation.findOne({ _id: String(chatId), participants: userId });
        if (conversation) socket.join(`chat:${conversation._id.toString()}`);
      } catch {
        // Malformed id — silently ignore; the client still has polling.
      }
    });

    socket.on("chat:leave", (chatId: unknown) => {
      socket.leave(`chat:${String(chatId)}`);
    });

    // ---------- WebRTC call signaling ----------
    // The relay validates contact on EVERY event; payloads (SDP/ICE) pass through
    // opaquely. `callId` is client-generated and lets both sides ignore stale events.

    /** Relays a call event to the peer after the contact check. */
    const relayCall = (event: string) =>
      async (payload: any) => {
        try {
          const toUserId = String(payload?.toUserId ?? "");
          if (!toUserId || !(await areInContact(userId, toUserId))) return;
          io?.to(`user:${toUserId}`).emit(event, { ...payload, fromUserId: userId });
        } catch {
          // Malformed payload — drop silently; the caller's UI has its own timeout.
        }
      };

    // Invite is special: it also resolves the caller's display identity and tells
    // the caller immediately when the peer has no connected devices.
    socket.on("call:invite", async (payload: any) => {
      try {
        const toUserId = String(payload?.toUserId ?? "");
        if (!toUserId || !(await areInContact(userId, toUserId))) return;

        const peerOnline = (io?.sockets.adapter.rooms.get(`user:${toUserId}`)?.size ?? 0) > 0;
        if (!peerOnline) {
          socket.emit("call:unavailable", { callId: payload?.callId });
          return;
        }

        const caller = await User.findById(userId, "name avatarUrl");
        io?.to(`user:${toUserId}`).emit("call:incoming", {
          callId: payload?.callId,
          kind: payload?.kind === "video" ? "video" : "audio",
          offer: payload?.offer,
          fromUserId: userId,
          fromName: caller?.name ?? "Member",
          fromAvatarUrl: caller?.avatarUrl ?? null,
        });
      } catch {
        socket.emit("call:unavailable", { callId: payload?.callId });
      }
    });

    socket.on("call:answer", relayCall("call:answered"));
    socket.on("call:ice", relayCall("call:ice"));
    socket.on("call:decline", relayCall("call:declined"));
    socket.on("call:end", relayCall("call:ended"));
  });

  return io;
};

/** Emits to everyone currently inside a conversation. No-op before initRealtime(). */
export const emitToChat = (chatId: string, event: string, payload: unknown) => {
  io?.to(`chat:${chatId}`).emit(event, payload);
};

/** Emits to all of a user's connected devices. No-op before initRealtime(). */
export const emitToUser = (userId: string, event: string, payload: unknown) => {
  io?.to(`user:${userId}`).emit(event, payload);
};
