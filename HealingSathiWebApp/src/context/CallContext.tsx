"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { connectAppSocket, getAppSocket } from "@/api/appSocket";

/**
 * The app's WebRTC calling engine, web edition — the SAME state machine
 * (idle → outgoing/incoming → active, ICE queueing until the remote
 * description lands, busy auto-decline, dead-connection teardown) over the
 * SAME `call:*` socket signaling, so web↔phone calls just work. Only the
 * media layer differs: the browser's built-in RTCPeerConnection and
 * getUserMedia instead of react-native-webrtc.
 */

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Self-hosted TURN goes here when provisioned (same as the app).
  ],
};

export type CallKind = "audio" | "video";
export type CallStatus = "incoming" | "outgoing" | "active";

export type CallState = {
  status: CallStatus;
  kind: CallKind;
  callId: string;
  peerId: string;
  peerName: string;
};

type CallContextValue = {
  call: CallState | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  muted: boolean;
  videoEnabled: boolean;
  startCall: (peer: { id: string; name: string }, kind: CallKind) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

/** Soft repeating ring (WebAudio) — no asset needed, stops on state change. */
const startRinger = () => {
  try {
    const ctx = new AudioContext();
    let stopped = false;
    const beep = () => {
      if (stopped) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 480;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.9);
    };
    beep();
    const interval = setInterval(beep, 2000);
    return () => {
      stopped = true;
      clearInterval(interval);
      ctx.close().catch(() => {});
    };
  } catch {
    return () => {};
  }
};

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const [call, setCallState] = useState<CallState | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [muted, setMuted] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const pendingOfferRef = useRef<RTCSessionDescriptionInit | null>(null);
  const pendingIceRef = useRef<RTCIceCandidateInit[]>([]);
  const ringerStopRef = useRef<(() => void) | null>(null);
  const callRef = useRef<CallState | null>(null);

  // Ref and state move together in the same tick: socket handlers read the ref
  // (stale-closure-safe), render reads the state.
  const setCall = useCallback((next: CallState | null) => {
    callRef.current = next;
    setCallState(next);
  }, []);

  const cleanup = useCallback(() => {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
    } catch {
      // best-effort teardown
    }
    pcRef.current = null;
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
    ringerStopRef.current?.();
    ringerStopRef.current = null;
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setVideoEnabled(true);
    setCall(null);
  }, [setCall]);

  const getMedia = useCallback(async (kind: CallKind) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: kind === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  const createPeerConnection = useCallback(
    (peerId: string, callId: string) => {
      const pc = new RTCPeerConnection(ICE_SERVERS);
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          getAppSocket()?.emit("call:ice", { toUserId: peerId, callId, candidate: e.candidate });
        }
      };
      pc.ontrack = (e) => {
        if (e.streams?.[0]) setRemoteStream(e.streams[0]);
      };
      pc.onconnectionstatechange = () => {
        if (["failed", "closed"].includes(pc.connectionState) && callRef.current?.callId === callId) {
          cleanup();
        }
      };
      pcRef.current = pc;
      return pc;
    },
    [cleanup],
  );

  const drainPendingIce = useCallback(async () => {
    const pc = pcRef.current;
    if (!pc) return;
    for (const candidate of pendingIceRef.current) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch {
        // individual candidates may fail; the connection survives on the rest
      }
    }
    pendingIceRef.current = [];
  }, []);

  const startCall = useCallback(
    async (peer: { id: string; name: string }, kind: CallKind) => {
      if (callRef.current) return; // already on a call
      const socket = await connectAppSocket();
      if (!socket) return;

      const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const stream = await getMedia(kind);
        const pc = createPeerConnection(peer.id, callId);
        stream.getTracks().forEach((t) => pc.addTrack(t, stream));

        setCall({ status: "outgoing", kind, callId, peerId: peer.id, peerName: peer.name });

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        socket.emit("call:invite", { toUserId: peer.id, callId, kind, offer });
      } catch (err) {
        cleanup();
        window.alert(
          `Couldn't start the call: ${err instanceof Error ? err.message : "check mic/camera permissions"}`,
        );
      }
    },
    [cleanup, createPeerConnection, getMedia, setCall],
  );

  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    const offer = pendingOfferRef.current;
    if (!current || current.status !== "incoming" || !offer) return;

    ringerStopRef.current?.();
    ringerStopRef.current = null;
    try {
      const stream = await getMedia(current.kind);
      const pc = createPeerConnection(current.peerId, current.callId);
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      await drainPendingIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getAppSocket()?.emit("call:answer", {
        toUserId: current.peerId,
        callId: current.callId,
        answer,
      });
      setCall({ ...current, status: "active" });
    } catch (err) {
      getAppSocket()?.emit("call:decline", { toUserId: current.peerId, callId: current.callId });
      cleanup();
      window.alert(
        `Couldn't join the call: ${err instanceof Error ? err.message : "check mic/camera permissions"}`,
      );
    }
  }, [cleanup, createPeerConnection, drainPendingIce, getMedia, setCall]);

  const declineCall = useCallback(() => {
    const current = callRef.current;
    if (current) {
      getAppSocket()?.emit("call:decline", { toUserId: current.peerId, callId: current.callId });
    }
    cleanup();
  }, [cleanup]);

  const hangUp = useCallback(() => {
    const current = callRef.current;
    if (current) {
      getAppSocket()?.emit("call:end", { toUserId: current.peerId, callId: current.callId });
    }
    cleanup();
  }, [cleanup]);

  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      localStreamRef.current?.getAudioTracks().forEach((t) => {
        t.enabled = prev; // unmuting re-enables
      });
      return !prev;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((prev) => {
      localStreamRef.current?.getVideoTracks().forEach((t) => {
        t.enabled = !prev;
      });
      return !prev;
    });
  }, []);

  // ---------- Signaling listeners (browser-wide while signed in) ----------
  useEffect(() => {
    if (!isAuthenticated) return undefined;

    let disposed = false;
    const handlers: Record<string, (payload: never) => void> = {};

    (async () => {
      const socket = await connectAppSocket();
      if (!socket || disposed) return;

      const on = <T,>(event: string, handler: (payload: T) => void) => {
        handlers[event] = handler as (payload: never) => void;
        socket.on(event, handler as (...args: unknown[]) => void);
      };

      on<{
        callId: string;
        fromUserId: string;
        fromName?: string;
        kind?: string;
        offer: RTCSessionDescriptionInit;
      }>("call:incoming", (payload) => {
        if (callRef.current) {
          socket.emit("call:decline", { toUserId: payload.fromUserId, callId: payload.callId });
          return;
        }
        pendingOfferRef.current = payload.offer;
        pendingIceRef.current = [];
        setCall({
          status: "incoming",
          kind: payload.kind === "video" ? "video" : "audio",
          callId: payload.callId,
          peerId: payload.fromUserId,
          peerName: payload.fromName ?? "Member",
        });
        ringerStopRef.current = startRinger();
      });

      on<{ callId: string; answer: RTCSessionDescriptionInit }>("call:answered", async (payload) => {
        const current = callRef.current;
        if (!current || payload.callId !== current.callId || !pcRef.current) return;
        try {
          await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          await drainPendingIce();
          setCall({ ...current, status: "active" });
        } catch {
          hangUp();
        }
      });

      on<{ callId: string; candidate: RTCIceCandidateInit }>("call:ice", async (payload) => {
        if (payload.callId !== callRef.current?.callId) return;
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
          } catch {
            // tolerate individual bad candidates
          }
        } else {
          pendingIceRef.current.push(payload.candidate);
        }
      });

      const endEvents: [string, string][] = [
        ["call:declined", "Call declined"],
        ["call:ended", ""],
        ["call:unavailable", "They're not reachable right now — try a message instead."],
      ];
      for (const [event, notice] of endEvents) {
        on<{ callId?: string } | undefined>(event, (payload) => {
          if (payload?.callId !== callRef.current?.callId) return;
          cleanup();
          if (notice) window.alert(notice);
        });
      }
    })();

    return () => {
      disposed = true;
      const socket = getAppSocket();
      for (const [event, handler] of Object.entries(handlers)) {
        socket?.off(event, handler as never);
      }
      cleanup();
    };
  }, [isAuthenticated, cleanup, drainPendingIce, hangUp, setCall]);

  const value = useMemo(
    () => ({
      call,
      localStream,
      remoteStream,
      muted,
      videoEnabled,
      startCall,
      acceptCall,
      declineCall,
      hangUp,
      toggleMute,
      toggleVideo,
    }),
    [call, localStream, remoteStream, muted, videoEnabled, startCall, acceptCall, declineCall, hangUp, toggleMute, toggleVideo],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
};
