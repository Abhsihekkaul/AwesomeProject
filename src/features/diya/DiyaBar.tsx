import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { useAuth } from "../../context/AuthContext";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { pickImageAsDataUri } from "../../utils/pickImage";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

/**
 * Diya — HealingSathi's daily check-in ritual (see DiyaFeature.md).
 * A story ring bar: up to 20 diyas a day, each live for 24h, sathi-visible
 * only. Viewing steps through a sathi's diyas full-screen (30s each, blurred
 * photo backdrop); replies go into the 1:1 chat carrying a reference card.
 * The flame (streak) is gentle by design: a missed day rests it, never nags.
 */

// Text-only moods — matches the design system's single-accent, no-emoji icon language.
export const DIYA_MOODS = [
  { key: "bright", label: "Bright day" },
  { key: "steady", label: "Steady" },
  { key: "managing", label: "Managing" },
  { key: "heavy", label: "Heavy" },
  { key: "resting", label: "Resting" },
  { key: "small-win", label: "Small win" },
];

type DiyaShape = {
  id: string;
  mood: string;
  note: string;
  photo: string | null;
  supportCount: number;
  supported: boolean;
};

type CircleEntry = {
  user: { id: string; name: string; avatarColor?: string; avatarUrl?: string | null };
  streak: number;
  diyas: DiyaShape[];
};

type DiyaData = {
  mine: { litToday: boolean; streak: number; diyas: DiyaShape[] };
  circle: CircleEntry[];
};

const DEMO_DATA: DiyaData = {
  mine: { litToday: false, streak: 0, diyas: [] },
  circle: [
    {
      user: { id: "d1", name: "Alex K." },
      streak: 12,
      diyas: [
        { id: "dd1", mood: "small-win", note: "Walked to the park without a flare. Tiny, huge.", photo: null, supportCount: 4, supported: false },
      ],
    },
    {
      user: { id: "d2", name: "Maya Harrison" },
      streak: 5,
      diyas: [
        { id: "dd2", mood: "managing", note: "Rough morning, better evening. Pacing works.", photo: null, supportCount: 2, supported: true },
      ],
    },
  ],
};

// Custom moods are stored as their own text — show them verbatim.
const moodOf = (key: string) => DIYA_MOODS.find((m) => m.key === key) ?? { key, label: key };

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function DiyaBar() {
  const { isAuthenticated, user } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [lighting, setLighting] = useState(false);
  const [viewing, setViewing] = useState<CircleEntry | null>(null);

  // Focus-refetch + 45s silent poll: a sathi's freshly lit diya appears in
  // your bar (and yours in theirs) without pulling to refresh.
  const { data, isLive, refresh } = useLiveOrDemo<DiyaData>(
    async () => resourcesApi.getDiyas(),
    DEMO_DATA,
    { mine: { litToday: false, streak: 0, diyas: [] }, circle: [] },
    45_000,
  );

  const mine = data.mine;

  const openLight = () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Create an account to light your diya for your circle.");
      return;
    }
    setLighting(true);
  };

  return (
    <View style={styles.card}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {/* Your diya — your avatar; brand ring when lit, dashed ring + "+" until then */}
        <Pressable style={styles.entry} onPress={openLight}>
          <View style={[styles.ring, mine.diyas.length > 0 ? styles.ringLit : styles.ringUnlit]}>
            <UserAvatar
              initials={initialsOf(user?.name ?? "You")}
              uri={user?.avatarUrl}
              size={moderateScale(48)}
              MarginRightSide={0}
            />
            {mine.litToday && mine.streak > 0 ? (
              <View style={styles.streakBadge}>
                <Text style={styles.streakText}>{mine.streak}</Text>
              </View>
            ) : null}
            {!mine.litToday ? (
              <View style={styles.plusBadge}>
                <Text style={styles.plusText}>+</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.entryName} numberOfLines={1}>
            {mine.diyas.length > 0 ? "Your diya" : "Light yours"}
          </Text>
        </Pressable>

        {/* The circle — one ring per sathi with live diyas */}
        {data.circle.map((entry) => (
          <Pressable key={entry.user.id} style={styles.entry} onPress={() => setViewing(entry)}>
            <View style={[styles.ring, styles.ringLit]}>
              <UserAvatar
                initials={initialsOf(entry.user.name)}
                uri={entry.user.avatarUrl}
                size={moderateScale(48)}
                MarginRightSide={0}
              />
              {entry.diyas.length > 1 ? (
                <View style={styles.countBadge}>
                  <Text style={styles.streakText}>{entry.diyas.length}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.entryName} numberOfLines={1}>
              {entry.user.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {lighting ? (
        <LightDiyaModal
          litCount={mine.diyas.length}
          streak={mine.streak}
          userName={user?.name}
          onClose={() => setLighting(false)}
          onLit={() => {
            setLighting(false);
            refresh({ silent: true });
          }}
        />
      ) : null}

      {viewing ? (
        <ViewDiyaModal
          entry={viewing}
          canInteract={isLive}
          onClose={() => setViewing(null)}
          onChanged={() => refresh({ silent: true })}
        />
      ) : null}
    </View>
  );
}

/** Light a new diya (up to 20/day): mood (preset or your own word), thought, photo. */
function LightDiyaModal({
  litCount,
  streak,
  userName,
  onClose,
  onLit,
}: {
  litCount: number;
  streak: number;
  userName?: string;
  onClose: () => void;
  onLit: () => void;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [mood, setMood] = useState("");
  // A custom mood word — same idea as the preset chips, in the user's own words.
  const [custom, setCustom] = useState("");
  const [note, setNote] = useState("");
  const [photo, setPhoto] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!mood) {
      Alert.alert("Pick a mood", "How does this moment feel? That's the whole ritual.");
      return;
    }
    setBusy(true);
    try {
      await resourcesApi.lightDiya({ mood, note: note.trim() || undefined, photo });
      onLit();
    } catch (err) {
      Alert.alert("Couldn't light your diya", apiErrorMessage(err));
      setBusy(false);
    }
  };

  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <Text style={styles.sheetTitle}>
            {`Light a diya${userName ? `, ${userName.split(" ")[0]}` : ""}`}
          </Text>
          <Text style={styles.sheetHint}>
            One honest moment. Your sathis see it for 24 hours.
            {streak > 1 ? ` Flame: ${streak} days.` : ""}
            {litCount > 0 ? ` Lit today: ${litCount}/20.` : ""}
          </Text>

          <View style={styles.moodGrid}>
            {DIYA_MOODS.map((m) => (
              <Pressable
                key={m.key}
                onPress={() => {
                  setMood(m.key);
                  setCustom("");
                }}
                style={[styles.moodCell, mood === m.key && styles.moodCellActive]}
              >
                <Text style={[styles.moodLabel, mood === m.key && styles.moodLabelActive]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Your own word, if none of the chips fit */}
          <TextInput
            style={[styles.customMoodInput, custom.trim().length > 0 && styles.customMoodActive]}
            placeholder="Or your own word... (e.g. Hopeful)"
            placeholderTextColor={colors.mutedText}
            maxLength={40}
            value={custom}
            onChangeText={(v) => {
              setCustom(v);
              setMood(v.trim());
            }}
          />

          <TextInput
            style={styles.noteInput}
            placeholder="A thought, if you have one... (optional)"
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={500}
            value={note}
            onChangeText={setNote}
            textAlignVertical="top"
          />

          <View style={styles.photoRow}>
            <Pressable
              onPress={async () => {
                const uri = await pickImageAsDataUri();
                if (uri) setPhoto(uri);
              }}
            >
              <Text style={styles.photoAction}>{photo ? "Change photo" : "+ Add a photo (optional)"}</Text>
            </Pressable>
            {photo ? (
              <>
                <Image source={{ uri: photo }} style={styles.photoThumb} />
                <Pressable onPress={() => setPhoto(null)}>
                  <Text style={styles.photoRemove}>Remove</Text>
                </Pressable>
              </>
            ) : null}
          </View>

          <PrimaryButton title={busy ? "Lighting…" : "Light it"} onPress={submit} disabled={busy} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const VIEW_SECONDS = 30; // story-style dwell time per diya

/** A sathi's diyas, full-screen story-style: blurred photo backdrop, segmented
 *  30s progress per diya (auto-advance), Hold, and an inline reply bar whose
 *  message lands in the 1:1 chat with a card referencing the shown diya. */
function ViewDiyaModal({
  entry,
  canInteract,
  onClose,
  onChanged,
}: {
  entry: CircleEntry;
  canInteract: boolean;
  onClose: () => void;
  onChanged: () => void;
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [index, setIndex] = useState(0);
  const diya = entry.diyas[Math.min(index, entry.diyas.length - 1)];
  const mood = moodOf(diya.mood);

  const [supported, setSupported] = useState(diya.supported);
  const [count, setCount] = useState(diya.supportCount);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const goTo = useCallback(
    (i: number) => {
      if (i < 0) return;
      if (i >= entry.diyas.length) {
        onClose();
        return;
      }
      setIndex(i);
      setSupported(entry.diyas[i].supported);
      setCount(entry.diyas[i].supportCount);
      setSent(false);
    },
    [entry.diyas, onClose],
  );

  // 30s per diya: the current segment drains, then auto-advances (or closes).
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    progress.setValue(0);
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration: VIEW_SECONDS * 1000,
      easing: Easing.linear,
      useNativeDriver: false, // animating width
    });
    anim.start(({ finished }) => {
      if (finished) goTo(index + 1);
    });
    return () => anim.stop();
  }, [progress, index, goTo]);

  const hold = async () => {
    if (!canInteract) return;
    const prev = { supported, count };
    setSupported(!supported);
    setCount((c) => c + (supported ? -1 : 1));
    try {
      const res = await resourcesApi.supportDiya(diya.id);
      setSupported(res.supported);
      setCount(res.supportCount);
      onChanged();
    } catch {
      setSupported(prev.supported);
      setCount(prev.count);
    }
  };

  // Inline story reply → the 1:1 chat, tagged with this diya's reference card.
  const sendReply = async () => {
    const text = reply.trim();
    if (!text || sending) return;
    if (!canInteract) {
      Alert.alert("Demo mode", "Sign in to reply to your sathis.");
      return;
    }
    setSending(true);
    try {
      const chatId = await resourcesApi.openChatWith(entry.user.id);
      await resourcesApi.sendMessage(chatId, { text, diyaId: diya.id });
      setReply("");
      setSent(true);
    } catch (err) {
      Alert.alert("Couldn't send your reply", apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const body = (
    <View style={styles.storyRoot}>
      {/* Segmented story progress — one segment per diya */}
      <View style={styles.segmentsRow}>
        {entry.diyas.map((d, i) => (
          <View key={d.id} style={styles.storyTrack}>
            {i < index ? (
              <View style={[styles.storyFill, styles.segDone]} />
            ) : i === index ? (
              <Animated.View
                style={[
                  styles.storyFill,
                  { width: progress.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] }) },
                ]}
              />
            ) : null}
          </View>
        ))}
      </View>

      <View style={styles.viewHeader}>
        <UserAvatar initials={initialsOf(entry.user.name)} uri={entry.user.avatarUrl} size={40} MarginRightSide={0} />
        <View style={styles.viewHeaderText}>
          <Text style={styles.storyName}>{entry.user.name}</Text>
          <Text style={styles.storyMood}>
            {mood.label}
            {entry.streak > 1 ? ` · ${entry.streak}-day flame` : ""}
            {entry.diyas.length > 1 ? ` · ${index + 1}/${entry.diyas.length}` : ""}
          </Text>
        </View>
        <Pressable onPress={onClose} hitSlop={10}>
          <Text style={styles.storyClose}>✕</Text>
        </Pressable>
      </View>

      {/* Tap left/right halves to step back/forward, story-style */}
      <View style={styles.storyBody}>
        <Pressable style={styles.tapLeft} onPress={() => goTo(index - 1)} />
        <Pressable style={styles.tapRight} onPress={() => goTo(index + 1)} />
        {diya.photo ? <Image source={{ uri: diya.photo }} style={styles.storyPhoto} /> : null}
        {diya.note || !diya.photo ? (
          <Text style={styles.storyNote}>
            {diya.note || `${entry.user.name.split(" ")[0]} lit a diya — showing up is the whole message.`}
          </Text>
        ) : null}
      </View>

      <Pressable style={[styles.storyHoldBtn, supported && styles.holdBtnActive]} onPress={hold}>
        <Text style={[styles.storyHoldText, supported && styles.holdTextActive]}>
          {supported ? "♥ Holding them" : "♡ Hold them"}
          {count > 0 ? `  · ${count}` : ""}
        </Text>
      </Pressable>

      {/* Inline reply — lands in your chat with a card referencing this diya */}
      <View style={styles.replyRow}>
        <TextInput
          style={styles.replyInput}
          placeholder={sent ? "Sent ✓ — say more?" : `Reply to ${entry.user.name.split(" ")[0]}...`}
          placeholderTextColor="rgba(255,255,255,0.7)"
          maxLength={2000}
          value={reply}
          onChangeText={(v) => {
            setReply(v);
            setSent(false);
          }}
          onSubmitEditing={sendReply}
          returnKeyType="send"
        />
        <Pressable
          style={[styles.replySend, (!reply.trim() || sending) && styles.replySendDisabled]}
          onPress={sendReply}
          disabled={!reply.trim() || sending}
        >
          <Text style={styles.replySendText}>{sending ? "…" : "Send"}</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <Modal animationType="fade" onRequestClose={onClose}>
      {/* Full-screen story: the photo itself, blurred, is the backdrop */}
      {diya.photo ? (
        <ImageBackground source={{ uri: diya.photo }} style={styles.storyBg} blurRadius={30}>
          <View style={styles.storyDim}>{body}</View>
        </ImageBackground>
      ) : (
        <View style={[styles.storyBg, styles.storyBgPlain]}>
          <View style={styles.storyDim}>{body}</View>
        </View>
      )}
    </Modal>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingVertical: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    row: {
      paddingHorizontal: moderateScale(10),
      gap: moderateScale(12),
    },
    entry: {
      width: moderateScale(60),
      alignItems: "center",
    },
    ring: {
      width: moderateScale(58),
      height: moderateScale(58),
      borderRadius: moderateScale(29),
      alignItems: "center",
      justifyContent: "center",
    },
    ringLit: {
      borderWidth: 3,
      borderColor: colors.primary,
    },
    ringUnlit: {
      borderWidth: 2,
      borderColor: colors.border,
      borderStyle: "dashed",
    },
    streakBadge: {
      position: "absolute",
      right: -moderateScale(4),
      bottom: -moderateScale(2),
      backgroundColor: colors.primary,
      borderRadius: moderateScale(9),
      paddingHorizontal: moderateScale(5),
      paddingVertical: 1,
    },
    countBadge: {
      position: "absolute",
      right: -moderateScale(4),
      top: -moderateScale(2),
      backgroundColor: colors.primary,
      borderRadius: moderateScale(9),
      paddingHorizontal: moderateScale(5),
      paddingVertical: 1,
    },
    streakText: {
      color: colors.white,
      fontSize: moderateScale(10),
      fontWeight: "700",
    },
    plusBadge: {
      position: "absolute",
      right: -moderateScale(2),
      bottom: -moderateScale(2),
      width: moderateScale(18),
      height: moderateScale(18),
      borderRadius: moderateScale(9),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    plusText: {
      color: colors.white,
      fontSize: moderateScale(12),
      fontWeight: "700",
      lineHeight: moderateScale(14),
    },
    entryName: {
      marginTop: moderateVerticalScale(4),
      fontSize: TextStyles.caption,
      color: colors.text,
      maxWidth: moderateScale(60),
    },

    backdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: moderateScale(18),
    },
    sheetTitle: {
      fontSize: TextStyles.subtitle,
      fontWeight: "700",
      color: colors.text,
    },
    sheetHint: {
      marginTop: moderateVerticalScale(4),
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginBottom: moderateVerticalScale(12),
    },
    moodGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      marginBottom: moderateVerticalScale(10),
    },
    moodCell: {
      width: "30.5%",
      alignItems: "center",
      paddingVertical: moderateVerticalScale(8),
      borderRadius: moderateScale(20),
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
    },
    moodCellActive: {
      borderColor: colors.primary,
      backgroundColor: colors.lightPurple,
    },
    moodLabel: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      fontWeight: "600",
    },
    moodLabelActive: {
      color: colors.primary,
    },
    customMoodInput: {
      backgroundColor: colors.lightBlue,
      borderRadius: moderateScale(20),
      borderWidth: 1,
      borderColor: "transparent",
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(8),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
      marginBottom: moderateVerticalScale(10),
    },
    customMoodActive: {
      borderColor: colors.primary,
      backgroundColor: colors.lightPurple,
    },
    noteInput: {
      minHeight: moderateVerticalScale(70),
      backgroundColor: colors.lightBlue,
      borderRadius: radius.md,
      padding: moderateScale(12),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
      marginBottom: moderateVerticalScale(10),
    },
    photoRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      marginBottom: moderateVerticalScale(14),
    },
    photoAction: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: TextStyles.caption,
    },
    photoThumb: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: radius.sm,
    },
    photoRemove: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      textDecorationLine: "underline",
    },

    // Full-screen story view
    storyRoot: {
      flex: 1,
      paddingTop: moderateVerticalScale(52),
      paddingBottom: moderateVerticalScale(24),
      paddingHorizontal: moderateScale(16),
    },
    storyBg: {
      flex: 1,
      backgroundColor: "#000",
    },
    storyBgPlain: {
      backgroundColor: "#14121e",
    },
    storyDim: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.45)",
    },
    segmentsRow: {
      flexDirection: "row",
      gap: moderateScale(4),
      marginBottom: moderateVerticalScale(12),
    },
    storyTrack: {
      flex: 1,
      height: 3,
      borderRadius: 2,
      backgroundColor: "rgba(255,255,255,0.3)",
      overflow: "hidden",
    },
    storyFill: {
      height: "100%",
      backgroundColor: "#FFFFFF",
      borderRadius: 2,
    },
    segDone: {
      width: "100%",
    },
    storyName: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: "#FFFFFF",
    },
    storyMood: {
      fontSize: TextStyles.caption,
      color: "rgba(255,255,255,0.85)",
      marginTop: 1,
    },
    storyClose: {
      color: "#FFFFFF",
      fontSize: moderateScale(18),
      padding: moderateScale(4),
    },
    viewHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(10),
      marginBottom: moderateVerticalScale(10),
    },
    viewHeaderText: {
      flex: 1,
    },
    storyBody: {
      flex: 1,
      justifyContent: "center",
    },
    tapLeft: {
      position: "absolute",
      left: -moderateScale(16),
      top: 0,
      bottom: 0,
      width: "35%",
      zIndex: 2,
    },
    tapRight: {
      position: "absolute",
      right: -moderateScale(16),
      top: 0,
      bottom: 0,
      width: "35%",
      zIndex: 2,
    },
    storyPhoto: {
      width: "100%",
      height: "70%",
      resizeMode: "contain",
      borderRadius: radius.md,
    },
    storyNote: {
      fontSize: TextStyles.body,
      lineHeight: moderateScale(24),
      color: "#FFFFFF",
      textAlign: "center",
      marginTop: moderateVerticalScale(12),
      textShadowColor: "rgba(0,0,0,0.5)",
      textShadowRadius: 6,
    },
    storyHoldBtn: {
      borderRadius: moderateScale(22),
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.6)",
      paddingVertical: moderateVerticalScale(11),
      alignItems: "center",
    },
    holdBtnActive: {
      borderColor: colors.primary,
      backgroundColor: colors.lightPurple,
    },
    storyHoldText: {
      fontSize: TextStyles.stepCounts,
      fontWeight: "600",
      color: "#FFFFFF",
    },
    holdTextActive: {
      color: colors.primary,
    },
    replyRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      marginTop: moderateVerticalScale(10),
    },
    replyInput: {
      flex: 1,
      borderRadius: moderateScale(22),
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.5)",
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateVerticalScale(9),
      fontSize: TextStyles.stepCounts,
      color: "#FFFFFF",
    },
    replySend: {
      borderRadius: moderateScale(22),
      backgroundColor: colors.primary,
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateVerticalScale(9),
    },
    replySendDisabled: {
      opacity: 0.5,
    },
    replySendText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: TextStyles.stepCounts,
    },
  });

  