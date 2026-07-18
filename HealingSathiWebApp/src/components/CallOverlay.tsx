"use client";

import { useEffect, useRef, useState } from "react";
import UserAvatar from "@/components/ui/UserAvatar";
import Icon from "@/components/ui/Icon";
import { useCall } from "@/context/CallContext";
import { cn } from "@/lib/cn";

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

function Video({ stream, muted, className }: { stream: MediaStream | null; muted?: boolean; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.srcObject = stream;
  }, [stream]);
  if (!stream) return null;
  return <video ref={ref} autoPlay playsInline muted={muted} className={className} />;
}

/**
 * The app's CallOverlay, web edition — rendered above the whole shell so you
 * can be rung on any page: incoming accept/decline, remote video fullscreen,
 * local preview PiP, mute / video / hang-up controls, live timer.
 */
/** Mounted only while the call is active, so every call's timer starts at 0. */
function CallTimer() {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{formatDuration(seconds)}</>;
}

export default function CallOverlay() {
  const { call, localStream, remoteStream, muted, videoEnabled, acceptCall, declineCall, hangUp, toggleMute, toggleVideo } = useCall();

  if (!call) return null;

  const isVideo = call.kind === "video";

  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center bg-black/95 text-white">
      {/* Remote video fills the screen on video calls */}
      {isVideo ? (
        <Video stream={remoteStream} className="absolute inset-0 h-full w-full object-contain" />
      ) : null}

      {/* Identity + status (always visible on audio; floats on video) */}
      <div className={cn("relative z-10 flex flex-col items-center", isVideo && remoteStream && "absolute top-8")}>
        <UserAvatar name={call.peerName} size={88} />
        <h2 className="mt-3 text-heading font-bold">{call.peerName}</h2>
        <p className="mt-1 text-step text-white/70">
          {call.status === "incoming"
            ? `Incoming ${call.kind} call...`
            : call.status === "outgoing"
              ? "Ringing..."
              : <CallTimer />}
        </p>
      </div>

      {/* Local preview PiP */}
      {isVideo && localStream ? (
        <Video
          stream={localStream}
          muted
          className="absolute right-4 bottom-32 z-10 h-40 w-28 rounded-2xl border border-white/30 object-cover"
        />
      ) : null}

      {/* Controls */}
      <div className="absolute bottom-10 z-10 flex items-center gap-5">
        {call.status === "incoming" ? (
          <>
            <button
              onClick={declineCall}
              aria-label="Decline"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white hover:opacity-90"
            >
              <Icon name="phone" size={24} className="rotate-135" />
            </button>
            <button
              onClick={acceptCall}
              aria-label="Accept"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white hover:opacity-90"
            >
              <Icon name="phone" size={24} />
            </button>
          </>
        ) : (
          <>
            <button
              onClick={toggleMute}
              aria-label={muted ? "Unmute" : "Mute"}
              className={cn(
                "flex h-13 w-13 items-center justify-center rounded-full p-3.5",
                muted ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30",
              )}
            >
              🎙
            </button>
            {isVideo ? (
              <button
                onClick={toggleVideo}
                aria-label={videoEnabled ? "Turn video off" : "Turn video on"}
                className={cn(
                  "flex h-13 w-13 items-center justify-center rounded-full p-3.5",
                  !videoEnabled ? "bg-white text-black" : "bg-white/20 text-white hover:bg-white/30",
                )}
              >
                <Icon name="Video" size={20} />
              </button>
            ) : null}
            <button
              onClick={hangUp}
              aria-label="End call"
              className="flex h-16 w-16 items-center justify-center rounded-full bg-danger text-white hover:opacity-90"
            >
              <Icon name="phone" size={24} className="rotate-135" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
