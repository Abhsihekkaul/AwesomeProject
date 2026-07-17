import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
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
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import ShareSheet from "../../components/ui/ShareSheet";
import ImageCarousel from "../../components/ui/ImageCarousel";
import { CommentItem, initialComments } from "../../components/ui/CommentsSheet";
import { ThreadedComment, useComments } from "../../hooks/useComments";
import { Post } from "../../components/ui/PostCard";
import { useAuth } from "../../context/AuthContext";
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
  const navigation = useNavigation<any>();
  const post: Post = route.params?.post ?? fallbackPost;

  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [inputText, setInputText] = useState("");
  const [shareVisible, setShareVisible] = useState(false);
  const [replyTo, setReplyTo] = useState<ThreadedComment | null>(null);
  const inputRef = useRef<TextInput>(null);

  // Live thread for real posts; the demo thread keeps signed-out mode alive.
  const { comments, refresh, addComment, toggleSupport, removeComment } = useComments(post.id, initialComments);
  const { user } = useAuth();
  useEffect(() => {
    refresh();
  }, [refresh]);

  const confirmDeleteComment = (comment: ThreadedComment) => {
    Alert.alert(
      "Delete this comment?",
      comment.replies.length > 0 ? "The replies under it are removed too." : "This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => removeComment(comment.id) },
      ],
    );
  };

  const startReply = (comment: ThreadedComment) => {
    setReplyTo(comment);
    inputRef.current?.focus();
  };

  const postReply = () => {
    const text = inputText.trim();
    if (!text) return;
    addComment(text, replyTo?.id);
    setInputText("");
    setReplyTo(null);
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
            {/* Only group posts belong "in" somewhere — a feed post is just a post. */}
            {post.circle ? (
              <Text style={styles.headerSub} numberOfLines={1}>in {post.circle}</Text>
            ) : null}
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {/* Author */}
          <View style={styles.authorRow}>
            <UserAvatar initials={post.author[0]} size={46} />
            <View style={styles.authorInfo}>
              <Text style={styles.author}>{post.author}</Text>
              <Text style={styles.meta} numberOfLines={1}>
                {post.circle ? `${post.circle} • ${post.time}` : post.time}
              </Text>
            </View>
          </View>

          {/* Content */}
          <Text style={styles.content}>{post.content}</Text>

          {/* One photo → full proportions; several → swipeable carousel (dots + 2/7). */}
          {(post.images?.length || post.image) ? (
            <ImageCarousel
              images={post.images?.length ? post.images : [post.image!]}
              height={moderateVerticalScale(280)}
              style={styles.image}
            />
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
          {comments.length === 0 ? (
            <Text style={styles.emptyThread}>No comments yet — start the conversation.</Text>
          ) : null}
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onReply={startReply}
              onSupport={toggleSupport}
              onAuthorPress={(c) =>
                c.authorId && navigation.navigate("UserProfile", { userId: c.authorId, name: c.user })
              }
              onDelete={confirmDeleteComment}
              currentUserId={user?.id}
            />
          ))}
        </ScrollView>

        {/* Reply target banner */}
        {replyTo ? (
          <View style={styles.replyBanner}>
            <Text style={styles.replyBannerText} numberOfLines={1}>
              Replying to {replyTo.user}
            </Text>
            <Pressable onPress={() => setReplyTo(null)} hitSlop={8}>
              <Text style={styles.replyBannerClose}>✕</Text>
            </Pressable>
          </View>
        ) : null}

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
        post={post}
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
    // Height follows the photo's real aspect ratio (AutoHeightImage).
    image: {
      width: "100%",
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
    emptyThread: {
      color: colors.mutedText,
      fontSize: scale(13),
      marginTop: moderateVerticalScale(12),
    },
    replyBanner: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
      backgroundColor: colors.lightPurple,
      borderRadius: radius.sm,
      marginTop: moderateVerticalScale(6),
    },
    replyBannerText: {
      flex: 1,
      color: colors.primary,
      fontSize: scale(12),
      fontWeight: "600",
      marginRight: moderateScale(10),
    },
    replyBannerClose: {
      color: colors.primary,
      fontSize: scale(13),
      fontWeight: "700",
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
