import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, NativeModules } from "react-native";
import { useAuth } from "./AuthContext";
import { connectAppSocket, disconnectAppSocket, getAppSocket } from "../api/appSocket";

/**
 * WebRTC calling engine — audio & video over wifi/internet with no third-party
 * service. Our own Socket.io server relays the SDP/ICE signaling; the media
 * itself flows peer-to-peer (Google's public STUN resolves addresses; a
 * self-hosted TURN server is the infra add-on for symmetric-NAT networks).
 *
 * The native module (react-native-webrtc) is lazy-required — until the app is
 * rebuilt with its pods, call buttons explain instead of crashing (the same
 * pattern Google Sign-In uses).
 *
 * State machine: idle → outgoing (ringing) → active → idle
 *                idle → incoming (ringing) → active → idle
 */

// Lazy natives — resolved once, never crash an unbuilt app. Requiring the JS is
// not enough: node_modules has it even before a rebuild, and the libraries
// dereference their native halves internally (optional chaining on OUR side can't
// save that). So we only load the wrapper when its NATIVE module is linked.
let webrtc: any = null;
try {
  if (NativeModules.WebRTCModule) {
    webrtc = require("react-native-webrtc");
  }
} catch {
  webrtc = null;
}
let InCallManager: any = null;
try {
  if (NativeModules.InCallManager) {
    InCallManager = require("react-native-incall-manager").default;
  }
} catch {
  InCallManager = null;
}

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    // Self-hosted TURN goes here when provisioned (coturn) — see pendingTask.md.
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
  peerAvatarUrl?: string | null;
};

type CallContextValue = {
  call: CallState | null;
  localStream: any;
  remoteStream: any;
  muted: boolean;
  speakerOn: boolean;
  videoEnabled: boolean;
  /** Whether the native WebRTC module is present (app rebuilt with pods). */
  callsReady: boolean;
  startCall: (peer: { id: string; name: string }, kind: CallKind) => Promise<void>;
  acceptCall: () => Promise<void>;
  declineCall: () => void;
  hangUp: () => void;
  toggleMute: () => void;
  toggleSpeaker: () => void;
  toggleVideo: () => void;
  flipCamera: () => void;
};

const CallContext = createContext<CallContextValue | null>(null);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();

  const [call, setCall] = useState<CallState | null>(null);
  const [localStream, setLocalStream] = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);

  const pcRef = useRef<any>(null);
  const localStreamRef = useRef<any>(null);
  const pendingOfferRef = useRef<any>(null);
  // ICE candidates that arrive before the remote description is set are queued.
  const pendingIceRef = useRef<any[]>([]);
  const callRef = useRef<CallState | null>(null);
  callRef.current = call;

  const cleanup = useCallback(() => {
    try {
      localStreamRef.current?.getTracks?.().forEach((t: any) => t.stop());
      pcRef.current?.close?.();
    } catch {
      // Best-effort teardown.
    }
    pcRef.current = null;
    localStreamRef.current = null;
    pendingOfferRef.current = null;
    pendingIceRef.current = [];
    InCallManager?.stop?.();
    setLocalStream(null);
    setRemoteStream(null);
    setMuted(false);
    setSpeakerOn(false);
    setVideoEnabled(true);
    setCall(null);
  }, []);

  /** Mic (+ camera for video) capture. */
  const getMedia = useCallback(async (kind: CallKind) => {
    const stream = await webrtc.mediaDevices.getUserMedia({
      audio: true,
      video: kind === "video" ? { facingMode: "user" } : false,
    });
    localStreamRef.current = stream;
    setLocalStream(stream);
    return stream;
  }, []);

  /** Peer connection wired to the signaling socket. */
  const createPeerConnection = useCallback(
    (peerId: string, callId: string) => {
      const pc = new webrtc.RTCPeerConnection(ICE_SERVERS);

      pc.addEventListener("icecandidate", (e: any) => {
        if (e.candidate) {
          getAppSocket()?.emit("call:ice", { toUserId: peerId, callId, candidate: e.candidate });
        }
      });
      pc.addEventListener("track", (e: any) => {
        if (e.streams?.[0]) setRemoteStream(e.streams[0]);
      });
      pc.addEventListener("connectionstatechange", () => {
        if (["failed", "closed"].includes(pc.connectionState)) {
          // Network died mid-call — end gracefully on this side too.
          if (callRef.current?.callId === callId) cleanup();
        }
      });

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
        await pc.addIceCandidate(new webrtc.RTCIceCandidate(candidate));
      } catch {
        // Individual candidates may fail; the connection survives on the rest.
      }
    }
    pendingIceRef.current = [];
  }, []);

  const startInCallAudio = useCallback((kind: CallKind) => {
    InCallManager?.start?.({ media: kind });
    if (kind === "video") {
      InCallManager?.setSpeakerphoneOn?.(true);
      setSpeakerOn(true);
    }
  }, []);

  // ---------- Outgoing ----------
  const startCall = useCallback(
    async (peer: { id: string; name: string }, kind: CallKind) => {
      if (!webrtc) {
        Alert.alert(
          "One rebuild needed",
          "Calling uses a native module — run `npm run ios` (or android) once and calls go live.",
        );
        return;
      }
      if (callRef.current) return; // already on a call

      const socket = await connectAppSocket();
      if (!socket) return;

      const callId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      try {
        const stream = await getMedia(kind);
        const pc = createPeerConnection(peer.id, callId);
        stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));

        setCall({ status: "outgoing", kind, callId, peerId: peer.id, peerName: peer.name });
        startInCallAudio(kind);

        const offer = await pc.createOffer({});
        await pc.setLocalDescription(offer);
        socket.emit("call:invite", { toUserId: peer.id, callId, kind, offer });
      } catch (err: any) {
        cleanup();
        Alert.alert("Couldn't start the call", err?.message ?? "Check mic/camera permissions.");
      }
    },
    [cleanup, createPeerConnection, getMedia, startInCallAudio],
  );

  // ---------- Incoming ----------
  const acceptCall = useCallback(async () => {
    const current = callRef.current;
    const offer = pendingOfferRef.current;
    if (!current || current.status !== "incoming" || !offer) return;

    try {
      const stream = await getMedia(current.kind);
      const pc = createPeerConnection(current.peerId, current.callId);
      stream.getTracks().forEach((t: any) => pc.addTrack(t, stream));

      await pc.setRemoteDescription(new webrtc.RTCSessionDescription(offer));
      await drainPendingIce();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      getAppSocket()?.emit("call:answer", {
        toUserId: current.peerId,
        callId: current.callId,
        answer,
      });
      startInCallAudio(current.kind);
      setCall({ ...current, status: "active" });
    } catch (err: any) {
      getAppSocket()?.emit("call:decline", { toUserId: current.peerId, callId: current.callId });
      cleanup();
      Alert.alert("Couldn't join the call", err?.message ?? "Check mic/camera permissions.");
    }
  }, [cleanup, createPeerConnection, drainPendingIce, getMedia, startInCallAudio]);

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

  // ---------- Controls ----------
  const toggleMute = useCallback(() => {
    setMuted((prev) => {
      localStreamRef.current?.getAudioTracks?.().forEach((t: any) => {
        t.enabled = prev; // unmuting re-enables
      });
      return !prev;
    });
  }, []);

  const toggleSpeaker = useCallback(() => {
    setSpeakerOn((prev) => {
      InCallManager?.setSpeakerphoneOn?.(!prev);
      return !prev;
    });
  }, []);

  const toggleVideo = useCallback(() => {
    setVideoEnabled((prev) => {
      localStreamRef.current?.getVideoTracks?.().forEach((t: any) => {
        t.enabled = !prev;
      });
      return !prev;
    });
  }, []);

  const flipCamera = useCallback(() => {
    localStreamRef.current?.getVideoTracks?.().forEach((t: any) => t._switchCamera?.());
  }, []);

  // ---------- Signaling listeners (app-wide, while signed in) ----------
  useEffect(() => {
    if (!isAuthenticated || !webrtc) return undefined;

    let disposed = false;
    (async () => {
      const socket = await connectAppSocket();
      if (!socket || disposed) return;

      socket.on("call:incoming", (payload: any) => {
        if (callRef.current) {
          // Already on a call — auto-decline the second one (caller sees "declined").
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
          peerAvatarUrl: payload.fromAvatarUrl,
        });
        InCallManager?.startRingtone?.("_BUNDLE_");
      });

      socket.on("call:answered", async (payload: any) => {
        const current = callRef.current;
        if (!current || payload.callId !== current.callId || !pcRef.current) return;
        try {
          await pcRef.current.setRemoteDescription(new webrtc.RTCSessionDescription(payload.answer));
          await drainPendingIce();
          setCall({ ...current, status: "active" });
        } catch {
          hangUp();
        }
      });

      socket.on("call:ice", async (payload: any) => {
        if (payload.callId !== callRef.current?.callId) return;
        const pc = pcRef.current;
        if (pc?.remoteDescription) {
          try {
            await pc.addIceCandidate(new webrtc.RTCIceCandidate(payload.candidate));
          } catch {
            // Tolerate individual bad candidates.
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
        socket.on(event, (payload: any) => {
          if (payload?.callId !== callRef.current?.callId) return;
          InCallManager?.stopRingtone?.();
          cleanup();
          if (notice) Alert.alert(notice);
        });
      }
    })();

    return () => {
      disposed = true;
      const socket = getAppSocket();
      ["call:incoming", "call:answered", "call:ice", "call:declined", "call:ended", "call:unavailable"].forEach(
        (event) => socket?.off(event),
      );
      disconnectAppSocket();
    };
  }, [isAuthenticated, cleanup, drainPendingIce, hangUp]);

  // Ringtone stops the moment the incoming call is answered/declined/gone.
  useEffect(() => {
    if (call?.status !== "incoming") InCallManager?.stopRingtone?.();
  }, [call?.status]);

  const value = useMemo(
    () => ({
      call,
      localStream,
      remoteStream,
      muted,
      speakerOn,
      videoEnabled,
      callsReady: webrtc !== null,
      startCall,
      acceptCall,
      declineCall,
      hangUp,
      toggleMute,
      toggleSpeaker,
      toggleVideo,
      flipCamera,
    }),
    [
      call, localStream, remoteStream, muted, speakerOn, videoEnabled,
      startCall, acceptCall, declineCall, hangUp, toggleMute, toggleSpeaker, toggleVideo, flipCamera,
    ],
  );

  return <CallContext.Provider value={value}>{children}</CallContext.Provider>;
};

export const useCall = () => {
  const ctx = useContext(CallContext);
  if (!ctx) throw new Error("useCall must be used within a CallProvider");
  return ctx;
};
