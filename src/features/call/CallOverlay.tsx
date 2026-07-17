import React, { useEffect, useState } from "react";
import { Image, NativeModules, Pressable, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import imagePath from "../../constant/imagePath";
import { useCall } from "../../context/CallContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

// RTCView comes from the lazily-loaded native module (see CallContext) — loaded
// only when the native half is actually linked into this binary.
let RTCView: any = null;
try {
  if (NativeModules.WebRTCModule) {
    RTCView = require("react-native-webrtc").RTCView;
  }
} catch {
  RTCView = null;
}

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const ControlButton = ({
  label,
  active,
  danger,
  onPress,
  icon,
  glyph,
}: {
  label: string;
  active?: boolean;
  danger?: boolean;
  onPress: () => void;
  icon?: number;
  glyph?: string;
}) => (
  <Pressable style={styles.controlWrap} onPress={onPress}>
    <View
      style={[
        styles.controlCircle,
        active && styles.controlCircleActive,
        danger && styles.controlCircleDanger,
      ]}
    >
      {icon ? (
        <Image source={icon} style={[styles.controlIcon, active && styles.controlIconActive]} />
      ) : (
        <Text style={styles.controlGlyph}>{glyph}</Text>
      )}
    </View>
    <Text style={styles.controlLabel}>{label}</Text>
  </Pressable>
);

/**
 * Full-screen call UI, rendered ABOVE the whole app (inside CallProvider) so a
 * call rings and stays visible no matter which screen is open.
 *
 * Incoming → big accept/decline. Outgoing/active → remote video (or avatar for
 * audio), local preview PiP, and the control row: mute · speaker · camera flip ·
 * video on/off · end.
 */
export default function CallOverlay() {
  const {
    call,
    localStream,
    remoteStream,
    muted,
    speakerOn,
    videoEnabled,
    acceptCall,
    declineCall,
    hangUp,
    toggleMute,
    toggleSpeaker,
    toggleVideo,
    flipCamera,
  } = useCall();
  const { colors } = useTheme();

  // Call duration ticks only while active.
  const [seconds, setSeconds] = useState(0);
  const isActive = call?.status === "active";
  useEffect(() => {
    if (!isActive) {
      setSeconds(0);
      return undefined;
    }
    const interval = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  if (!call) return null;

  const isVideo = call.kind === "video";
  const showRemoteVideo = isVideo && isActive && remoteStream && RTCView;
  const statusLine =
    call.status === "incoming"
      ? `Incoming ${call.kind} call…`
      : call.status === "outgoing"
        ? "Ringing…"
        : isVideo
          ? formatDuration(seconds)
          : `${formatDuration(seconds)} · ${call.kind} call`;

  return (
    <View style={styles.overlay}>
      {/* Remote video fills the screen on an active video call */}
      {showRemoteVideo ? (
        <RTCView streamURL={remoteStream.toURL()} style={StyleSheet.absoluteFill} objectFit="cover" />
      ) : null}

      {/* Identity block (audio calls + ringing states) */}
      {!showRemoteVideo ? (
        <View style={styles.identity}>
          <UserAvatar
            initials={initialsOf(call.peerName)}
            uri={call.peerAvatarUrl}
            size={110}
            MarginRightSide={0}
          />
          <Text style={styles.peerName}>{call.peerName}</Text>
        </View>
      ) : null}

      {/* Status pill (always visible, floats over video too) */}
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>
          {showRemoteVideo ? `${call.peerName} · ${statusLine}` : statusLine}
        </Text>
      </View>

      {/* Local preview PiP */}
      {isVideo && localStream && RTCView && call.status !== "incoming" ? (
        <View style={styles.pip}>
          <RTCView streamURL={localStream.toURL()} style={styles.pipVideo} objectFit="cover" mirror />
          {!videoEnabled ? (
            <View style={styles.pipOff}>
              <Text style={styles.pipOffText}>Camera off</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Controls */}
      {call.status === "incoming" ? (
        <View style={styles.incomingRow}>
          <Pressable style={[styles.bigBtn, styles.declineBtn]} onPress={declineCall}>
            <Image source={imagePath.PhoneIcon} style={[styles.bigBtnIcon, styles.declineIcon]} />
          </Pressable>
          <Pressable style={[styles.bigBtn, styles.acceptBtn]} onPress={acceptCall}>
            <Image
              source={isVideo ? imagePath.VideoIcon : imagePath.PhoneIcon}
              style={styles.bigBtnIcon}
            />
          </Pressable>
        </View>
      ) : (
        <View style={styles.controlsRow}>
          <ControlButton label={muted ? "Unmute" : "Mute"} active={muted} onPress={toggleMute} glyph={muted ? "🔇" : "🎙"} />
          <ControlButton
            label="Speaker"
            active={speakerOn}
            onPress={toggleSpeaker}
            glyph="🔊"
          />
          {isVideo ? (
            <>
              <ControlButton label="Flip" onPress={flipCamera} icon={imagePath.CameraIcon} />
              <ControlButton
                label={videoEnabled ? "Video off" : "Video on"}
                active={!videoEnabled}
                onPress={toggleVideo}
                icon={imagePath.VideoIcon}
              />
            </>
          ) : null}
          <ControlButton label="End" danger onPress={hangUp} icon={imagePath.PhoneIcon} />
        </View>
      )}

      {/* Theme accent kept subtle: the overlay is deliberately dark for both themes */}
      <View style={[styles.accent, { backgroundColor: colors.primary }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: "#101018",
    zIndex: 1000,
    alignItems: "center",
    justifyContent: "center",
  },
  accent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: moderateVerticalScale(3),
  },
  identity: {
    alignItems: "center",
    marginBottom: moderateVerticalScale(120),
  },
  peerName: {
    color: "#FFFFFF",
    fontSize: TextStyles.title,
    fontWeight: "700",
    marginTop: moderateVerticalScale(16),
  },
  statusPill: {
    position: "absolute",
    top: moderateVerticalScale(64),
    alignSelf: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: moderateScale(16),
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(6),
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: scale(13),
    fontWeight: "600",
    fontVariant: ["tabular-nums"],
  },
  pip: {
    position: "absolute",
    top: moderateVerticalScale(104),
    right: moderateScale(16),
    width: moderateScale(96),
    height: moderateScale(140),
    borderRadius: moderateScale(12),
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
  },
  pipVideo: {
    flex: 1,
  },
  pipOff: {
    ...(StyleSheet.absoluteFill as object),
    backgroundColor: "rgba(0,0,0,0.8)",
    alignItems: "center",
    justifyContent: "center",
  },
  pipOffText: {
    color: "#FFFFFF",
    fontSize: scale(10),
    fontWeight: "600",
  },

  // Incoming accept/decline
  incomingRow: {
    position: "absolute",
    bottom: moderateVerticalScale(72),
    flexDirection: "row",
    gap: moderateScale(80),
  },
  bigBtn: {
    width: moderateScale(72),
    height: moderateScale(72),
    borderRadius: moderateScale(36),
    alignItems: "center",
    justifyContent: "center",
  },
  acceptBtn: {
    backgroundColor: "#2EBD59",
  },
  declineBtn: {
    backgroundColor: "#E5484D",
  },
  bigBtnIcon: {
    width: moderateScale(28),
    height: moderateScale(28),
    resizeMode: "contain",
    tintColor: "#FFFFFF",
  },
  declineIcon: {
    transform: [{ rotate: "135deg" }],
  },

  // Active controls
  controlsRow: {
    position: "absolute",
    bottom: moderateVerticalScale(56),
    flexDirection: "row",
    alignItems: "flex-start",
    gap: moderateScale(18),
  },
  controlWrap: {
    alignItems: "center",
    width: moderateScale(64),
  },
  controlCircle: {
    width: moderateScale(56),
    height: moderateScale(56),
    borderRadius: moderateScale(28),
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  controlCircleActive: {
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  controlCircleDanger: {
    backgroundColor: "#E5484D",
  },
  controlIcon: {
    width: moderateScale(22),
    height: moderateScale(22),
    resizeMode: "contain",
    tintColor: "#FFFFFF",
  },
  controlIconActive: {
    tintColor: "#101018",
  },
  controlGlyph: {
    fontSize: scale(20),
  },
  controlLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: scale(10),
    fontWeight: "600",
    marginTop: moderateVerticalScale(6),
  },
});
