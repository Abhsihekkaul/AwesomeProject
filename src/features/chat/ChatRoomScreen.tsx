import React, { useCallback, useEffect, useRef, useState } from "react";
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
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LinearGradient from "react-native-linear-gradient";
import { useAuth } from "../../context/AuthContext";
import { useCall } from "../../context/CallContext";
import { useChatNotifications } from "../../context/ChatNotificationsContext";
import { resourcesApi } from "../../api/resourcesApi";
import { joinChatRoom } from "../../api/chatSocket";
import { captureImageAsDataUri, pickImageAsDataUri } from "../../utils/pickImage";
import { timeAgo } from "../../utils/timeAgo";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import imagePath from "../../constant/imagePath";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import AutoHeightImage from "../../components/ui/AutoHeightImage";

type ChatMessage = {
  id: string;
  mine?: boolean;
  text: string;
  /** Base64 data-URI photo (same MVP transport as post images). */
  image?: string | null;
  /** In-app shared post (full card shape) — renders as a tappable post card. */
  sharedPost?: any;
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

// Attachment options shown from the "+" button. Same tinted icon assets as the rest
// of the platform (the post composer uses the identical Upload/Video icons), so the
// sheet reads as one design language. Photos work today; the rest says when it lands.
const attachmentOptions: {
  key: string;
  label: string;
  icon: number;
  tint: "lightPurple" | "lightBlue" | "lightGreen" | "lightOrange";
  comingSoon?: string;
}[] = [
  { key: "camera", label: "Camera", icon: imagePath.CameraIcon, tint: "lightPurple" },
  { key: "photo", label: "Photos", icon: imagePath.UploadIcon, tint: "lightBlue" },
  {
    key: "video",
    label: "Video",
    icon: imagePath.VideoIcon,
    tint: "lightGreen",
    comingSoon: "Video sharing arrives with cloud media storage (next on the roadmap). Photos work today!",
  },
  {
    key: "file",
    label: "File",
    icon: imagePath.PostIcon,
    tint: "lightOrange",
    comingSoon: "File sharing arrives with cloud media storage (next on the roadmap). Photos work today!",
  },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p: string) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const formatClock = (value?: string | Date) => {
  const d = value ? new Date(value) : new Date();
  if (Number.isNaN(d.getTime())) return String(value ?? "");
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
  onOpenPost,
  onImagePress,
}: {
  message: ChatMessage;
  initials: string;
  gradient: string[];
  styles: ReturnType<typeof makeStyles>;
  onOpenPost?: (post: any) => void;
  onImagePress?: (uri: string) => void;
}) => {
  const shared = message.sharedPost;
  const body = (
    <>
      {/* Photo message: full proportions in the bubble, tap for fullscreen. */}
      {message.image ? (
        <Pressable onPress={() => onImagePress?.(message.image!)}>
          <AutoHeightImage uri={message.image} style={styles.msgImage} />
        </Pressable>
      ) : null}
      {/* Shared post → a mini post card; tapping it opens the full post. */}
      {shared ? (
        <Pressable style={styles.sharedCard} onPress={() => onOpenPost?.(shared)}>
          <View style={styles.sharedCardHeader}>
            <UserAvatar initials={initialsOf(shared.author ?? "Member")} size={24} />
            <View style={styles.sharedCardHeaderText}>
              <Text style={styles.sharedCardAuthor} numberOfLines={1}>{shared.author}</Text>
              {/* Feed posts have no group — "in {group}" only when there is one. */}
              {shared.circle ? (
                <Text style={styles.sharedCardCircle} numberOfLines={1}>in {shared.circle}</Text>
              ) : null}
            </View>
          </View>
          {shared.image ? (
            <AutoHeightImage uri={shared.image} style={styles.sharedCardImage} />
          ) : null}
          {shared.title ? (
            <Text style={styles.sharedCardTitle} numberOfLines={2}>{shared.title}</Text>
          ) : null}
          <Text style={styles.sharedCardSnippet} numberOfLines={3}>{shared.content}</Text>
          <View style={styles.sharedCardFooter}>
            <Text style={styles.sharedCardCounts}>
              ♥ {shared.supportCount ?? 0}   💬 {shared.commentCount ?? 0}
            </Text>
            <Text style={styles.sharedCardCta}>View post →</Text>
          </View>
        </Pressable>
      ) : null}
      {message.text ? (
        <Text style={[styles.msgText, message.mine && styles.mineText]}>{message.text}</Text>
      ) : null}
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
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  // Keeps the attachment sheet above the home indicator on every device.
  const insets = useSafeAreaInsets();
  const sheetBottomPad = Math.max(insets.bottom, moderateVerticalScale(16));

  const name: string = route.params?.name ?? "Alex K.";
  const initials: string =
    route.params?.initials ??
    name
      .split(" ")
      .map((p: string) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  const { isAuthenticated, user } = useAuth();
  const chatId: string | undefined = route.params?.chatId;
  // The other participant's id (live chats) — tapping the header opens their profile.
  const otherUserId: string | undefined = route.params?.userId;

  // While this conversation is on screen its messages never pop a banner, and the
  // unread counter zeroes the moment you're here (badge on the Chats tab follows).
  const { setActiveChat, markChatRead } = useChatNotifications();
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated || !chatId) return undefined;
      setActiveChat(chatId);
      markChatRead(chatId);
      return () => setActiveChat(null);
    }, [isAuthenticated, chatId, setActiveChat, markChatRead]),
  );

  // Live thread when signed in and opened from a live chat list; demo thread otherwise.
  // The 15s poll is only the fallback — the socket below delivers messages instantly.
  const { data: messages, setData: setMessages, isLive } = useLiveOrDemo<ChatMessage[]>(
    async () => {
      if (!chatId) return [];
      return (await resourcesApi.getMessages(chatId)).map((m: any) => ({
        id: m.id,
        mine: m.mine,
        text: m.text,
        image: m.image,
        sharedPost: m.sharedPost,
        time: formatClock(m.time),
      }));
    },
    initialMessages,
    undefined,
    15_000,
  );

  // Realtime receive: the other side's messages appear the moment they're sent.
  // Own messages are skipped (the optimistic bubble already showed them) and ids
  // are deduped in case the fallback poll landed first.
  useEffect(() => {
    if (!isAuthenticated || !chatId) return undefined;
    return joinChatRoom(chatId, ({ message }) => {
      if (message.senderId === user?.id) return;
      setMessages((prev) =>
        prev.some((m) => m.id === message.id)
          ? prev
          : [
              ...prev,
              {
                id: message.id,
                mine: false,
                text: message.text,
                image: message.image,
                sharedPost: message.sharedPost,
                time: formatClock(message.time),
              },
            ],
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, chatId, user?.id]);

  const [draft, setDraft] = useState("");
  const [attachOpen, setAttachOpen] = useState(false);
  // Fullscreen photo viewer — tapping any chat image shows the complete picture.
  const [viewerUri, setViewerUri] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  // Shared send path for text and photos: optimistic bubble first, then the API
  // persists it (the socket + polling reconcile the real message for the other side).
  const deliver = async (payload: { text?: string; image?: string }) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        mine: true,
        text: payload.text ?? "",
        image: payload.image ?? null,
        time: formatClock(),
      },
    ]);
    if (isAuthenticated && isLive && chatId) {
      try {
        await resourcesApi.sendMessage(chatId, payload);
      } catch {
        // Keep the optimistic bubble; polling will reconcile next open.
      }
    }
  };

  const sendMessage = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    deliver({ text });
  };

  // Gallery photo or a fresh camera shot — either way the photo sends immediately.
  const sendPhoto = async (source: "camera" | "library") => {
    const image =
      source === "camera" ? await captureImageAsDataUri() : await pickImageAsDataUri();
    if (image) deliver({ image });
  };

  // Real WebRTC calls (audio/video, peer-to-peer over our own signaling).
  // Demo chats have no real person behind them, so they explain instead.
  const { startCall: startWebrtcCall } = useCall();
  const startCall = (kind: "voice" | "video") => {
    if (!isAuthenticated || !otherUserId) {
      Alert.alert(
        "Calls need a real Sathi",
        "Sign in and open a conversation with one of your sathis to call them.",
      );
      return;
    }
    startWebrtcCall({ id: otherUserId, name }, kind === "voice" ? "audio" : "video");
  };

  const pickAttachment = (option: (typeof attachmentOptions)[number]) => {
    setAttachOpen(false);
    if (option.comingSoon) {
      Alert.alert(`${option.label}s are coming soon`, option.comingSoon);
      return;
    }
    sendPhoto(option.key === "camera" ? "camera" : "library");
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
          <Pressable
            style={styles.headerIdentity}
            disabled={!otherUserId}
            onPress={() =>
              navigation.navigate("UserProfile", { userId: otherUserId, name })
            }
          >
            <UserAvatar initials={initials} size={38} />
            <View style={styles.headerCenter}>
              <Text style={styles.name} numberOfLines={1}>{name}</Text>
              <View style={styles.statusRow}>
                <View style={styles.onlineDot} />
                <Text style={styles.status}>Online · Fibromyalgia</Text>
              </View>
            </View>
          </Pressable>

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
              onOpenPost={(post) =>
                navigation.navigate("PostDetails", { post: { ...post, time: timeAgo(post.time) } })
              }
              onImagePress={setViewerUri}
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

      {/* Fullscreen photo viewer — the complete image, letterboxed, tap to close */}
      <Modal
        visible={!!viewerUri}
        transparent
        animationType="fade"
        onRequestClose={() => setViewerUri(null)}
      >
        <Pressable style={styles.viewerBackdrop} onPress={() => setViewerUri(null)}>
          {viewerUri ? (
            <Image source={{ uri: viewerUri }} style={styles.viewerImage} resizeMode="contain" />
          ) : null}
          <Text style={styles.viewerHint}>Tap anywhere to close</Text>
        </Pressable>
      </Modal>

      {/* Attachment sheet */}
      <Modal visible={attachOpen} transparent animationType="slide" onRequestClose={() => setAttachOpen(false)}>
        <View style={styles.sheetOverlay}>
          <Pressable style={styles.sheetDismiss} onPress={() => setAttachOpen(false)} />
          <View style={[styles.sheet, { paddingBottom: sheetBottomPad + moderateVerticalScale(12) }]}>
            <View style={styles.dragHandle} />
            <Text style={styles.sheetTitle}>Share</Text>
            <View style={styles.sheetGrid}>
              {attachmentOptions.map((opt) => (
                <Pressable key={opt.key} style={styles.sheetOption} onPress={() => pickAttachment(opt)}>
                  <View style={[styles.sheetOptionCircle, { backgroundColor: colors[opt.tint] }]}>
                    <Image source={opt.icon} style={styles.sheetOptionIcon} />
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
    headerIdentity: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
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
    // Height comes from the photo's real aspect ratio (AutoHeightImage) — the
    // complete picture shows, nothing is cropped into a square.
    msgImage: {
      width: moderateScale(220),
      borderRadius: radius.md,
      marginBottom: moderateVerticalScale(4),
    },

    // Shared-post card inside a bubble: a real mini PostCard — author header,
    // full-proportion image, title/snippet, engagement footer.
    sharedCard: {
      width: moderateScale(230),
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
      marginBottom: moderateVerticalScale(4),
    },
    sharedCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: moderateScale(10),
      paddingTop: moderateScale(10),
      paddingBottom: moderateScale(8),
    },
    sharedCardHeaderText: {
      flex: 1,
      marginLeft: moderateScale(2),
    },
    sharedCardAuthor: {
      color: colors.text,
      fontSize: scale(12),
      fontWeight: "700",
    },
    sharedCardCircle: {
      color: colors.mutedText,
      fontSize: scale(10),
      fontWeight: "500",
      marginTop: moderateVerticalScale(1),
    },
    sharedCardImage: {
      width: "100%",
    },
    sharedCardTitle: {
      color: colors.text,
      fontSize: TextStyles.stepCounts,
      fontWeight: "700",
      paddingHorizontal: moderateScale(10),
      marginTop: moderateVerticalScale(8),
    },
    sharedCardSnippet: {
      color: colors.text,
      fontSize: scale(12),
      lineHeight: scale(17),
      paddingHorizontal: moderateScale(10),
      marginTop: moderateVerticalScale(3),
    },
    sharedCardFooter: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateScale(8),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      marginTop: moderateVerticalScale(8),
    },
    sharedCardCounts: {
      color: colors.mutedText,
      fontSize: scale(11),
      fontWeight: "600",
      fontVariant: ["tabular-nums"],
    },
    sharedCardCta: {
      color: colors.primary,
      fontSize: scale(11),
      fontWeight: "700",
    },

    // Fullscreen photo viewer
    viewerBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.94)",
      alignItems: "center",
      justifyContent: "center",
    },
    viewerImage: {
      width: "100%",
      height: "86%",
    },
    viewerHint: {
      position: "absolute",
      bottom: moderateVerticalScale(40),
      alignSelf: "center",
      color: "rgba(255,255,255,0.75)",
      fontSize: scale(12),
      fontWeight: "500",
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
    // Bottom padding is applied inline from the live safe-area inset.
    sheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      paddingHorizontal: moderateScale(20),
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
    sheetOptionIcon: {
      width: moderateScale(24),
      height: moderateScale(24),
      resizeMode: "contain",
      tintColor: colors.primary,
    },
    sheetOptionLabel: {
      fontSize: TextStyles.caption,
      color: colors.text,
      fontWeight: "500",
    },
  });
