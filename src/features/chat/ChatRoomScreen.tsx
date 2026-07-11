import React, { useRef, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import imagePath from "../../constant/imagePath";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";

type ChatMessage = {
  id: string;
  mine?: boolean;
  text: string;
  time: string;
};

const initialMessages: ChatMessage[] = [
  { id: "1", text: "I've found that pacing myself and not pushing through pain helps the most. Also, warm baths before sleep. What's been your biggest challenge lately?", time: "10:18 AM" },
  { id: "2", mine: true, text: "Definitely the unpredictability. You never know when a bad day is coming. I've been trying journaling — it helps me notice patterns.", time: "10:22 AM" },
  { id: "3", text: "That's such a good idea. I should try that. It's really comforting to talk to someone who gets it. 💙", time: "10:24 AM" },
  { id: "4", mine: true, text: "I feel the same way. Most people are supportive, but unless they've experienced it themselves, it's hard for them to fully understand.", time: "10:25 AM" },
  { id: "5", text: "Exactly. Sometimes I spend more energy explaining my condition than actually managing it.", time: "10:27 AM" },
  { id: "6", mine: true, text: "That sounds exhausting. Have you found anything that helps on difficult days?", time: "10:29 AM" },
  { id: "7", text: "I've started keeping my expectations realistic. Instead of focusing on everything I can't do, I try to celebrate the small wins.", time: "10:31 AM" },
  { id: "8", mine: true, text: "I like that mindset. Breaking tasks into smaller steps makes them feel less overwhelming.", time: "10:33 AM" },
  { id: "9", text: "That's smart. Some days even getting out for a short walk feels like a huge achievement.", time: "10:35 AM" },
  { id: "10", mine: true, text: "Absolutely. Progress isn't always obvious, but those small moments add up over time.", time: "10:36 AM" },
  { id: "11", text: "Thank you for saying that. I needed the reminder today. 😊", time: "10:38 AM" },
];

// Attachment options shown from the "+" button. Emoji glyphs keep this asset-free,
// matching how the rest of the app renders decorative icons (💡, 🛡, ⌕).
const attachmentOptions: { key: string; label: string; glyph: string; tint: "lightPurple" | "lightBlue" | "lightGreen" | "lightOrange" }[] = [
  { key: "camera", label: "Camera", glyph: "📷", tint: "lightPurple" },
  { key: "photos", label: "Photos", glyph: "🖼️", tint: "lightBlue" },
  { key: "files", label: "Files", glyph: "📄", tint: "lightGreen" },
  { key: "location", label: "Location", glyph: "📍", tint: "lightOrange" },
];

const formatNow = () => {
  const d = new Date();
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, "0");
  const suffix = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${m} ${suffix}`;
};

const Message = ({
  message,
  initials,
  gradient,
  styles,
}: {
  message: ChatMessage;
  initials: string;
  gradient: string[];
  styles: ReturnType<typeof makeStyles>;
}) => {
  const body = (
    <>
      <Text style={[styles.msgText, message.mine && styles.mineText]}>{message.text}</Text>
      <Text style={[styles.time, message.mine && styles.mineTime]}>
        {message.time}
        {message.mine ? "  ✓✓" : ""}
      </Text>
    </>
  );

  return (
    <View style={[styles.msgWrap, message.mine && styles.msgWrapMine]}>
      {!message.mine ? <UserAvatar initials={initials} size={30} /> : null}

      {message.mine ? (
        // Your words carry the healing gradient — same warmth as the brand button
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.bubble, styles.mineBubble]}
        >
          {body}
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.theirBubble]}>{body}</View>
      )}
    </View>
  );
};

export default function ChatRoomScreen() {
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const name: string = route.params?.name ?? "Alex K.";
  const initials: string =
    route.params?.initials ??
    name
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), mine: true, text, time: formatNow() },
    ]);
    setDraft("");
  };

  const startCall = (kind: "voice" | "video") => {
    Alert.alert(
      kind === "voice" ? `Call ${name}?` : `Video call ${name}?`,
      "Calls connect once the realtime backend goes live.",
      [
        { text: "Cancel", style: "cancel" },
        { text: kind === "voice" ? "Call" : "Start", onPress: () => {} },
      ],
    );
  };

  const pickAttachment = (label: string) => {
    setAttachOpen(false);
    Alert.alert(label, `${label} sharing will open here once media upload is wired to the backend.`);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <UserAvatar initials={initials} size={38} />
          <View style={styles.headerCenter}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <View style={styles.statusRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.status}>Online · Fibromyalgia</Text>
            </View>
          </View>

          <Pressable style={styles.headerBtn} hitSlop={6} onPress={() => startCall("voice")}>
            <Image source={imagePath.PhoneIcon} style={styles.headerBtnIcon} />
          </Pressable>
          <Pressable style={styles.headerBtn} hitSlop={6} onPress={() => startCall("video")}>
            <Image source={imagePath.VideoIcon} style={styles.headerBtnIcon} />
          </Pressable>
        </View>

        {/* Conversation */}
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.chatArea}
          onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
        >
          <View style={styles.dayPill}>
            <Text style={styles.dayPillText}>Today</Text>
          </View>

          {messages.map((m) => (
            <Message
              key={m.id}
              message={m}
              initials={initials}
              gradient={[colors.primary, colors.primaryDark]}
              styles={styles}
            />
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={styles.inputBar}>
          <Pressable style={styles.attachBtn} hitSlop={6} onPress={() => setAttachOpen(true)}>
            <Text style={styles.attachPlus}>+</Text>
          </Pressable>

          <TextInput
            placeholder="Write something supportive..."
            placeholderTextColor={colors.mutedText}
            style={styles.input}
            value={draft}
            onChangeText={setDraft}
            multiline
          />

          <Pressable
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!draft.trim()}
          >
            <Image source={imagePath.RightIcon} style={styles.sendIcon} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      {/* Attachment sheet */}
      <Modal visible={attachOpen} transparent animationType="slide" onRequestClose={() => setAttachOpen(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetDismiss} onPress={() => setAttachOpen(false)} />
          <View style={styles.sheet}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Share</Text>
            <View style={styles.sheetGrid}>
              {attachmentOptions.map((opt) => (
                <Pressable key={opt.key} style={styles.sheetOption} onPress={() => pickAttachment(opt.label)}>
                  <View style={[styles.sheetOptionCircle, { backgroundColor: colors[opt.tint] }]}>
                    <Text style={styles.sheetOptionGlyph}>{opt.glyph}</Text>
                  </View>
                  <Text style={styles.sheetOptionLabel}>{opt.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },

    // Header
    header: {
      flexDirection: "row",
      alignItems: "center",
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      paddingBottom: moderateVerticalScale(10),
      paddingTop: moderateVerticalScale(4),
    },
    headerCenter: {
      flex: 1,
      marginLeft: moderateScale(2),
    },
    name: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    statusRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(2),
    },
    onlineDot: {
      width: moderateScale(7),
      height: moderateScale(7),
      borderRadius: moderateScale(4),
      backgroundColor: colors.success,
      marginRight: moderateScale(5),
    },
    status: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
    },
    headerBtn: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: colors.lightPurple,
      alignItems: "center",
      justifyContent: "center",
      marginLeft: moderateScale(8),
    },
    headerBtnIcon: {
      width: moderateScale(17),
      height: moderateScale(17),
      resizeMode: "contain",
      tintColor: colors.primary,
    },

    // Conversation
    chatArea: {
      paddingTop: moderateVerticalScale(12),
      paddingBottom: moderateVerticalScale(8),
    },
    dayPill: {
      alignSelf: "center",
      backgroundColor: colors.lightBlue,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(4),
      marginBottom: moderateVerticalScale(12),
    },
    dayPillText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      fontWeight: "600",
    },
    msgWrap: {
      flexDirection: "row",
      alignItems: "flex-end",
      marginBottom: moderateVerticalScale(12),
    },
    msgWrapMine: {
      justifyContent: "flex-end",
    },
    // Healing language: generous rounding, soft calming tints, a gentle lift off the page —
    // nothing clinical or boxy.
    bubble: {
      maxWidth: "78%",
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateScale(10),
      borderRadius: radius.lg,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 1,
    },
    theirBubble: {
      backgroundColor: colors.lightBlue,
      borderBottomLeftRadius: radius.sm / 2,
      borderTopLeftRadius: radius.md,
    },
    mineBubble: {
      borderBottomRightRadius: radius.sm / 2,
      borderTopRightRadius: radius.md,
    },
    msgText: {
      color: colors.text,
      fontSize: TextStyles.stepCounts,
      lineHeight: moderateScale(21),
    },
    mineText: {
      color: colors.white,
    },
    time: {
      color: colors.mutedText,
      fontSize: scale(10),
      marginTop: moderateScale(6),
      alignSelf: "flex-end",
    },
    mineTime: {
      color: "rgba(255,255,255,0.8)",
    },

    // Composer
    inputBar: {
      flexDirection: "row",
      alignItems: "flex-end",
      paddingTop: moderateVerticalScale(8),
      paddingBottom: moderateVerticalScale(4),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      gap: moderateScale(8),
    },
    attachBtn: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: colors.lightPurple,
      alignItems: "center",
      justifyContent: "center",
    },
    attachPlus: {
      color: colors.primary,
      fontSize: scale(22),
      lineHeight: scale(24),
      fontWeight: "500",
    },
    input: {
      flex: 1,
      backgroundColor: colors.lightBlue,
      borderRadius: radius.lg,
      paddingHorizontal: moderateScale(14),
      paddingTop: moderateVerticalScale(9),
      paddingBottom: moderateVerticalScale(9),
      minHeight: moderateScale(38),
      maxHeight: moderateVerticalScale(100),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
    },
    sendBtn: {
      width: moderateScale(38),
      height: moderateScale(38),
      borderRadius: moderateScale(19),
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    sendBtnDisabled: {
      backgroundColor: colors.border,
    },
    sendIcon: {
      width: moderateScale(16),
      height: moderateScale(16),
      resizeMode: "contain",
      tintColor: colors.white,
    },

    // Attachment sheet
    sheetOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    sheetDismiss: {
      flex: 1,
    },
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: moderateScale(20),
      paddingBottom: moderateVerticalScale(36),
    },
    dragHandle: {
      width: moderateScale(40),
      height: moderateVerticalScale(4),
      backgroundColor: colors.border,
      alignSelf: "center",
      borderRadius: radius.sm,
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(10),
    },
    sheetTitle: {
      fontSize: TextStyles.subtitle,
      fontWeight: "700",
      color: colors.text,
      textAlign: "center",
      marginBottom: moderateVerticalScale(18),
    },
    sheetGrid: {
      flexDirection: "row",
      justifyContent: "space-around",
    },
    sheetOption: {
      alignItems: "center",
    },
    sheetOptionCircle: {
      width: moderateScale(58),
      height: moderateScale(58),
      borderRadius: moderateScale(29),
      alignItems: "center",
      justifyContent: "center",
      marginBottom: moderateVerticalScale(8),
    },
    sheetOptionGlyph: {
      fontSize: scale(24),
    },
    sheetOptionLabel: {
      fontSize: TextStyles.caption,
      color: colors.text,
      fontWeight: "500",
    },
  });
