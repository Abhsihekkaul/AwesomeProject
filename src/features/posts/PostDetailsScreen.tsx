import React, { useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import ShareSheet from "../../components/ui/ShareSheet";
import { CommentItem, initialComments } from "../../components/ui/CommentsSheet";
import { Post } from "../../components/ui/PostCard";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

const fallbackPost: Post = {
  id: "0",
  author: "Maya Harrison",
  circle: "Fibromyalgia Warriors",
  time: "2h ago",
  content: "Finally found a sleep routine that works for me.",
  supportCount: 0,
  helpfulCount: 0,
  commentCount: 0,
};

export default function PostDetailsScreen() {
  const route = useRoute<any>();
  const post: Post = route.params?.post ?? fallbackPost;

  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [inputText, setInputText] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [shareVisible, setShareVisible] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const postReply = () => {
    const text = inputText.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      { id: Date.now().toString(), user: "You", initials: "ME", text, time: "now", replies: [] },
    ]);
    setInputText("");
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>Post</Text>
            <Text style={styles.headerSub} numberOfLines={1}>in {post.circle}</Text>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Author */}
          <View style={styles.authorRow}>
            <UserAvatar initials={post.author[0]} size={46} />
            <View style={styles.authorInfo}>
              <Text style={styles.author}>{post.author}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {post.circle} • {post.time}
              </Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.content}>{post.content}</Text>

          {post.image ? (
            <Image source={{ uri: post.image }} style={styles.image} resizeMode="cover" />
          ) : null}

          {/* Actions */}
          <View style={styles.actions}>
            <Pressable hitSlop={8} style={styles.actionBtn}>
              <Image source={imagePath.HeartIcon} style={styles.actionIcon} />
            </Pressable>
            <Pressable hitSlop={8} style={styles.actionBtn}>
              <Image source={imagePath.Help} style={styles.actionIcon} />
            </Pressable>
            <Pressable hitSlop={8} style={styles.actionBtn} onPress={() => inputRef.current?.focus()}>
              <Image source={imagePath.ChatIcon} style={styles.actionIcon} />
            </Pressable>
            <Pressable hitSlop={8} style={styles.actionBtn} onPress={() => setShareVisible(true)}>
              <Image source={imagePath.ShareIcon} style={styles.actionIcon} />
            </Pressable>
          </View>

          {/* Threaded Conversation */}
          <Text style={styles.repliesTitle}>Conversation</Text>
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ScrollView>

        {/* Reply Input */}
        <View style={styles.inputSection}>
          <TextInput
            ref={inputRef}
            style={styles.input}
            placeholder="Join the conversation..."
            placeholderTextColor={colors.mutedText}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <Pressable
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={postReply}
            disabled={!inputText.trim()}
          >
            <Text style={styles.sendBtnText}>Post</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ShareSheet
        visible={shareVisible}
        onClose={() => setShareVisible(false)}
        postUrl={`https://healingstream.app/p/${post.id}`}
      />
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    headerTextWrap: {
      flex: 1,
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    headerSub: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    scrollContent: {
      paddingBottom: moderateVerticalScale(20),
    },
    authorRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    authorInfo: {
      flex: 1,
      marginLeft: moderateScale(4),
    },
    author: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    meta: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    content: {
      marginTop: moderateVerticalScale(14),
      fontSize: TextStyles.body,
      lineHeight: scale(24),
      color: colors.text,
    },
    image: {
      width: "100%",
      height: moderateVerticalScale(220),
      borderRadius: radius.md,
      marginTop: moderateVerticalScale(12),
    },
    actions: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: moderateVerticalScale(14),
      marginTop: moderateVerticalScale(6),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    actionBtn: {
      alignItems: "center",
      minWidth: moderateScale(36),
    },
    actionIcon: {
      height: moderateVerticalScale(20),
      width: moderateScale(20),
      resizeMode: "contain",
      tintColor: colors.text,
    },
    repliesTitle: {
      marginTop: moderateVerticalScale(14),
      fontSize: TextStyles.subtitle,
      fontWeight: "600",
      color: colors.text,
    },
    inputSection: {
      flexDirection: "row",
      alignItems: "center",
      paddingTop: moderateVerticalScale(10),
      paddingBottom: moderateVerticalScale(6),
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    input: {
      flex: 1,
      backgroundColor: colors.lightBlue,
      borderRadius: radius.md,
      paddingHorizontal: moderateScale(14),
      paddingTop: moderateVerticalScale(10),
      paddingBottom: moderateVerticalScale(10),
      maxHeight: moderateVerticalScale(100),
      fontSize: scale(14),
      color: colors.text,
    },
    sendBtn: {
      marginLeft: moderateScale(12),
      backgroundColor: colors.primary,
      paddingHorizontal: moderateScale(16),
      paddingVertical: moderateVerticalScale(10),
      borderRadius: radius.md,
    },
    sendBtnDisabled: {
      backgroundColor: colors.mutedText,
    },
    sendBtnText: {
      color: colors.white,
      fontWeight: "600",
    },
  });
