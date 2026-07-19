import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { demoTipById, DEMO_TIPS, type Tip } from "./tipsLibrary";
import { timeAgo } from "../../utils/timeAgo";

const typeGlyph: Record<string, string> = {
  Article: "📄",
  Video: "🎥",
  "Photo Guide": "🖼️",
};

type TipComment = {
  id: string;
  author: string;
  authorId: string;
  avatarColor?: string;
  avatarUrl?: string | null;
  text: string;
  time: string;
  mine: boolean;
};

// What the demo-mode conversation looks like — real questions, honest tone.
const DEMO_COMMENTS: TipComment[] = [
  { id: "dc1", author: "Alex K.", authorId: "d1", text: "The 70% rule finally made pacing click for me. Took about three weeks before it felt natural.", time: "2 days ago", mine: false },
  { id: "dc2", author: "Maya Harrison", authorId: "d2", text: "Question — does mental effort count toward the budget too? Meetings wipe me out as much as walks do.", time: "1 day ago", mine: false },
];

const initialsOf = (name: string) =>
  name
    .replace("Dr. ", "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * A health tip's own screen — like PostDetailsScreen for posts: the full
 * article with a questions-and-experiences thread underneath (web twin:
 * /tips/[id]).
 */
export default function TipDetailsScreen() {
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const styles = makeStyles(colors);

  const tipId: string = route.params?.id;
  const passedTip: Tip | undefined = route.params?.tip;
  const demoFallback = passedTip ?? demoTipById(tipId) ?? DEMO_TIPS[0];

  // Live: the backend copy (with content); demo: the bundled library.
  const { data: tip } = useLiveOrDemo<Tip>(
    async () => resourcesApi.getHealthTip(tipId),
    demoFallback,
    demoFallback,
  );

  const { data: comments, isLive, refresh } = useLiveOrDemo<TipComment[]>(
    async () =>
      (await resourcesApi.getTipComments(tipId)).map((c: TipComment) => ({
        ...c,
        time: timeAgo(c.time),
      })),
    DEMO_COMMENTS,
    [],
    20_000,
  );

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    if (!isAuthenticated) {
      Alert.alert("Sign in required", "Create an account to ask questions and share experiences.");
      return;
    }
    setSending(true);
    try {
      await resourcesApi.addTipComment(tipId, text);
      setDraft("");
      refresh({ silent: true });
    } catch (err) {
      Alert.alert("Couldn't post", apiErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const removeComment = (comment: TipComment) => {
    Alert.alert("Delete this comment?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await resourcesApi.deleteTipComment(comment.id);
            refresh({ silent: true });
          } catch (err) {
            Alert.alert("Couldn't delete", apiErrorMessage(err));
          }
        },
      },
    ]);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.headerRow}>
          <BackButton />
          <Text style={styles.headerTitle} numberOfLines={1}>
            Health Tips
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
          {/* Article hero */}
          <LinearGradient
            colors={[colors.primary, colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={styles.heroPillRow}>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>
                  {typeGlyph[tip.type] ?? "📄"} {tip.type}
                </Text>
              </View>
              <View style={styles.heroPill}>
                <Text style={styles.heroPillText}>{tip.condition}</Text>
              </View>
              {tip.duration ? <Text style={styles.heroDuration}>{tip.duration}</Text> : null}
            </View>
            <Text style={styles.heroTitle}>{tip.title}</Text>
            <View style={styles.heroAuthorRow}>
              <UserAvatar initials={initialsOf(tip.author)} size={26} MarginRightSide={0} />
              <Text style={styles.heroAuthor}>{tip.author}</Text>
            </View>
          </LinearGradient>

          {/* The article */}
          <View style={styles.articleCard}>
            {tip.summary ? (
              <View style={styles.leadWrap}>
                <Text style={styles.leadText}>{tip.summary}</Text>
              </View>
            ) : null}
            {(tip.content ?? []).map((paragraph, i) => (
              <Text key={i} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {(tip.content ?? []).length === 0 ? (
              <Text style={styles.paragraph}>The full article is on its way.</Text>
            ) : null}
            <Text style={styles.disclaimer}>
              General guidance, not personal medical advice — your own clinician knows your
              situation best.
            </Text>
          </View>

          {/* Questions & experiences */}
          <View style={styles.commentsCard}>
            <Text style={styles.commentsTitle}>
              Questions & experiences{comments.length > 0 ? ` · ${comments.length}` : ""}
            </Text>
            <Text style={styles.commentsHint}>
              Ask about this tip or share what worked for you — the community reads along.
            </Text>

            {comments.length === 0 ? (
              <Text style={styles.emptyComments}>No questions yet — yours can be the first.</Text>
            ) : (
              comments.map((c) => (
                <View key={c.id} style={styles.commentRow}>
                  <UserAvatar initials={initialsOf(c.author)} uri={c.avatarUrl} size={30} MarginRightSide={0} />
                  <View style={styles.commentBody}>
                    <Text style={styles.commentMeta}>
                      <Text style={styles.commentAuthor}>{c.author}</Text>
                      <Text style={styles.commentTime}> · {c.time}</Text>
                    </Text>
                    <Text style={styles.commentText}>{c.text}</Text>
                    {c.mine ? (
                      <Pressable onPress={() => removeComment(c)} hitSlop={6}>
                        <Text style={styles.commentDelete}>Delete</Text>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>

        {/* Composer — pinned under the scroll, same pattern as chat */}
        <View style={styles.composerRow}>
          <UserAvatar
            initials={initialsOf(user?.name ?? "You")}
            uri={user?.avatarUrl}
            size={30}
            MarginRightSide={0}
          />
          <TextInput
            style={styles.composerInput}
            placeholder={isLive ? "Ask a question or share..." : "Sign in to join the conversation"}
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={2000}
            value={draft}
            onChangeText={setDraft}
          />
          <Pressable
            style={[styles.sendBtn, (!draft.trim() || sending) && styles.sendBtnDisabled]}
            onPress={submit}
            disabled={!draft.trim() || sending}
          >
            <Text style={styles.sendBtnText}>{sending ? "…" : "Post"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
      flex: 1,
    },
    scrollContent: {
      paddingBottom: moderateVerticalScale(16),
    },

    hero: {
      borderRadius: radius.lg,
      padding: moderateScale(16),
      overflow: "hidden",
    },
    heroPillRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: moderateScale(6),
    },
    heroPill: {
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(9),
      paddingVertical: moderateVerticalScale(3),
    },
    heroPillText: {
      color: "#FFFFFF",
      fontSize: scale(10),
      fontWeight: "700",
    },
    heroDuration: {
      color: "rgba(255,255,255,0.9)",
      fontSize: scale(10),
      fontWeight: "600",
    },
    heroTitle: {
      color: "#FFFFFF",
      fontSize: TextStyles.subtitle,
      fontWeight: "700",
      marginTop: moderateVerticalScale(8),
      lineHeight: scale(23),
    },
    heroAuthorRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: moderateScale(8),
      marginTop: moderateVerticalScale(10),
    },
    heroAuthor: {
      color: "rgba(255,255,255,0.95)",
      fontSize: TextStyles.caption,
      fontWeight: "600",
    },

    articleCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(16),
      marginTop: moderateVerticalScale(12),
    },
    leadWrap: {
      borderLeftWidth: 3,
      borderLeftColor: colors.primary,
      paddingLeft: moderateScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    leadText: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
      lineHeight: scale(21),
    },
    paragraph: {
      fontSize: TextStyles.body,
      color: colors.text,
      lineHeight: scale(22),
      marginBottom: moderateVerticalScale(12),
    },
    disclaimer: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: moderateVerticalScale(10),
    },

    commentsCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(16),
      marginTop: moderateVerticalScale(12),
    },
    commentsTitle: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    commentsHint: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
      marginBottom: moderateVerticalScale(12),
    },
    emptyComments: {
      fontSize: TextStyles.stepCounts,
      color: colors.mutedText,
    },
    commentRow: {
      flexDirection: "row",
      gap: moderateScale(9),
      marginBottom: moderateVerticalScale(12),
    },
    commentBody: {
      flex: 1,
    },
    commentMeta: {
      fontSize: TextStyles.caption,
    },
    commentAuthor: {
      fontWeight: "700",
      color: colors.text,
    },
    commentTime: {
      color: colors.mutedText,
    },
    commentText: {
      fontSize: TextStyles.stepCounts,
      color: colors.text,
      lineHeight: scale(19),
      marginTop: moderateVerticalScale(2),
    },
    commentDelete: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      fontWeight: "600",
      marginTop: moderateVerticalScale(4),
      textDecorationLine: "underline",
    },

    composerRow: {
      flexDirection: "row",
      alignItems: "flex-end",
      gap: moderateScale(8),
      paddingTop: moderateVerticalScale(8),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    composerInput: {
      flex: 1,
      maxHeight: moderateVerticalScale(90),
      backgroundColor: colors.lightBlue,
      borderRadius: radius.lg,
      paddingHorizontal: moderateScale(13),
      paddingVertical: moderateVerticalScale(8),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
    },
    sendBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateVerticalScale(9),
    },
    sendBtnDisabled: {
      opacity: 0.5,
    },
    sendBtnText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: TextStyles.stepCounts,
    },
  });
