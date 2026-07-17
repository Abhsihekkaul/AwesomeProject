import React, { useEffect, useState } from "react";
import { Alert, Modal, View, Text, StyleSheet, Pressable, ScrollView, TextInput, Keyboard, KeyboardAvoidingView, Platform } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";
import { useAuth } from "../../context/AuthContext";
import { ThreadedComment, useComments } from "../../hooks/useComments";

// Dummy Threaded Data (exported so PostDetailsScreen can render the same thread inline)
export const initialComments: ThreadedComment[] = [
    {
        id: "1",
        user: "Shivani Rawat",
        initials: "SR",
        text: "This breathing technique completely changed my mornings. Highly recommend giving it at least a week to see results.",
        time: "2h",
        supportCount: 4,
        supportedByMe: false,
        replies: [
            {
                id: "1a",
                user: "Arun",
                initials: "A",
                text: "Did you do it before or after your morning coffee? I feel like the caffeine messes with my heart rate.",
                time: "1h",
                supportCount: 1,
                supportedByMe: false,
                replies: [
                    {
                        id: "1a1",
                        user: "Shivani Rawat",
                        initials: "SR",
                        text: "Definitely before! Right after waking up.",
                        time: "45m",
                        supportCount: 0,
                        supportedByMe: false,
                        replies: []
                    }
                ]
            }
        ]
    },
    {
        id: "2",
        user: "Alex K.",
        initials: "AK",
        text: "I tried this but struggled to stay consistent. Will give it another shot.",
        time: "3h",
        supportCount: 2,
        supportedByMe: false,
        replies: []
    }
];

// Reddit-style thread ergonomics: indentation stops deepening after this level so a
// long back-and-forth never walks off the right edge of the screen…
const MAX_INDENT_DEPTH = 3;
// …and branches at this depth start collapsed behind a "View N replies" toggle.
const AUTO_COLLAPSE_DEPTH = 3;

const countReplies = (comment: ThreadedComment): number =>
    comment.replies.reduce((sum, r) => sum + 1 + countReplies(r), 0);

// Recursive Component for Threaded UI (exported for reuse in PostDetailsScreen)
export const CommentItem = ({
    comment,
    depth = 0,
    onReply,
    onSupport,
    onAuthorPress,
    onDelete,
    currentUserId,
}: {
    comment: ThreadedComment;
    depth?: number;
    onReply?: (comment: ThreadedComment) => void;
    onSupport?: (commentId: string) => void;
    onAuthorPress?: (comment: ThreadedComment) => void;
    /** Delete handler — the action only shows on the current user's own comments. */
    onDelete?: (comment: ThreadedComment) => void;
    currentUserId?: string;
}) => {
    const { colors } = useTheme();
    const styles = makeStyles(colors);
    // Deep branches start folded — but only if they already had replies when they
    // mounted, so a reply you just posted never hides itself.
    const [collapsed, setCollapsed] = useState(
        depth >= AUTO_COLLAPSE_DEPTH && comment.replies.length > 0,
    );
    const replyCount = countReplies(comment);

    return (
        <View
            style={[
                styles.commentWrapper,
                // Past the cap, replies keep the thread line but stop indenting further.
                depth > 0 && (depth <= MAX_INDENT_DEPTH ? styles.replyWrapper : styles.deepReplyWrapper),
            ]}
        >
            <Pressable
                style={styles.commentHeader}
                onPress={() => onAuthorPress?.(comment)}
                disabled={!onAuthorPress || !comment.authorId}
            >
                <UserAvatar initials={comment.initials} size={28} />
                <Text style={styles.commentAuthor}>{comment.user}</Text>
                <Text style={styles.commentTime}>• {comment.time}</Text>
            </Pressable>
            <Text style={styles.commentText}>{comment.text}</Text>
            <View style={styles.commentActions}>
                <Pressable onPress={() => onSupport?.(comment.id)} hitSlop={6}>
                    <Text style={[styles.actionText, comment.supportedByMe && styles.actionTextActive]}>
                        ♥ {comment.supportCount > 0 ? `${comment.supportCount} ` : ""}Support
                    </Text>
                </Pressable>
                {onReply ? (
                    <Pressable onPress={() => onReply(comment)} hitSlop={6}>
                        <Text style={styles.actionText}>Reply</Text>
                    </Pressable>
                ) : null}
                {onDelete && !!comment.authorId && comment.authorId === currentUserId ? (
                    <Pressable onPress={() => onDelete(comment)} hitSlop={6}>
                        <Text style={styles.deleteText}>Delete</Text>
                    </Pressable>
                ) : null}
                {replyCount > 0 ? (
                    <Pressable onPress={() => setCollapsed((c) => !c)} hitSlop={6}>
                        <Text style={styles.toggleText}>
                            {collapsed
                                ? `View ${replyCount} ${replyCount === 1 ? "reply" : "replies"}`
                                : "Hide replies"}
                        </Text>
                    </Pressable>
                ) : null}
            </View>

            {/* Recursively render replies (folded away while collapsed) */}
            {!collapsed && comment.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {comment.replies.map((reply) => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} onReply={onReply} onSupport={onSupport} onAuthorPress={onAuthorPress} onDelete={onDelete} currentUserId={currentUserId} />
                    ))}
                </View>
            )}
        </View>
    );
};

/**
 * The post's comment thread as a bottom sheet. Live posts load (and post) real
 * threaded comments via useComments; the demo thread keeps signed-out mode alive.
 * Tapping "Reply" targets that comment — the composer shows who you're replying to.
 */
export default function CommentsSheet({
    visible,
    onClose,
    post,
}: {
    visible: boolean;
    onClose: () => void;
    post?: { id: string } | null;
}) {
    const [inputText, setInputText] = useState("");
    const [replyTo, setReplyTo] = useState<ThreadedComment | null>(null);
    const { comments, refresh, addComment, toggleSupport, removeComment } = useComments(post?.id, initialComments);
    const { user } = useAuth();
    const navigation = useNavigation<any>();
    const { colors } = useTheme();
    const styles = makeStyles(colors);
    // Keeps the composer above the home indicator / gesture bar on every device —
    // a fixed padding sat too low on notched phones (the reported bug).
    // The inset lives on a spacer INSIDE the sheet, not on the KeyboardAvoidingView:
    // iOS's behavior="padding" composes its own paddingBottom over the style (0 with
    // the keyboard closed), which silently erased the safe-area padding there.
    // The spacer collapses while the keyboard is up so the input hugs the keyboard.
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom, moderateVerticalScale(12));
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    useEffect(() => {
        const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
        const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
        const show = Keyboard.addListener(showEvent, () => setKeyboardOpen(true));
        const hide = Keyboard.addListener(hideEvent, () => setKeyboardOpen(false));
        return () => {
            show.remove();
            hide.remove();
        };
    }, []);

    // The sheet must close before navigating — a native Modal would otherwise
    // stay stacked above the pushed profile screen.
    const openAuthorProfile = (comment: ThreadedComment) => {
        if (!comment.authorId) return;
        onClose();
        navigation.navigate("UserProfile", { userId: comment.authorId, name: comment.user });
    };

    // Fresh thread every time the sheet opens (and reset any half-typed reply target).
    useEffect(() => {
        if (visible) {
            setReplyTo(null);
            refresh();
        }
    }, [visible, refresh]);

    const postComment = () => {
        const text = inputText.trim();
        if (!text) return;
        addComment(text, replyTo?.id);
        setInputText("");
        setReplyTo(null);
    };

    const confirmDeleteComment = (comment: ThreadedComment) => {
        const hasReplies = comment.replies.length > 0;
        Alert.alert(
            "Delete this comment?",
            hasReplies ? "The replies under it are removed too." : "This can't be undone.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => removeComment(comment.id) },
            ],
        );
    };

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />

                <KeyboardAvoidingView
                    behavior={Platform.OS === "ios" ? "padding" : "height"}
                    style={styles.sheetContainer}
                >
                    <View style={styles.dragHandle} />
                    <Text style={styles.sheetTitle}>Comments</Text>

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
                        {comments.length === 0 ? (
                            <Text style={styles.emptyThread}>No comments yet — start the conversation.</Text>
                        ) : null}
                        {comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} onReply={setReplyTo} onSupport={toggleSupport} onAuthorPress={openAuthorProfile} onDelete={confirmDeleteComment} currentUserId={user?.id} />
                        ))}
                    </ScrollView>

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

                    <View style={styles.inputSection}>
                        <TextInput
                            style={styles.input}
                            placeholder={replyTo ? `Reply to ${replyTo.user}...` : "Add a comment..."}
                            placeholderTextColor={colors.mutedText}
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <Pressable
                            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
                            onPress={postComment}
                            disabled={!inputText.trim()}
                        >
                            <Text style={styles.sendBtnText}>Post</Text>
                        </Pressable>
                    </View>

                    {/* Safe-area spacer: home-indicator clearance with the keyboard
                        closed; collapses (iOS) while typing so the input hugs the keyboard. */}
                    <View
                        style={{
                            height:
                                keyboardOpen && Platform.OS === "ios"
                                    ? moderateVerticalScale(8)
                                    : bottomPad,
                        }}
                    />
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    // Bottom padding is applied inline from the live safe-area inset.
    sheetContainer: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, height: "80%" },
    dragHandle: { width: moderateScale(40), height: moderateVerticalScale(4), backgroundColor: colors.border, alignSelf: "center", borderRadius: radius.sm, marginTop: moderateVerticalScale(10), marginBottom: moderateVerticalScale(10) },
    sheetTitle: { fontSize: TextStyles.title, fontWeight: "700", textAlign: "center", marginBottom: moderateVerticalScale(10), color: colors.text },
    scrollContent: { paddingHorizontal: moderateScale(16), paddingBottom: moderateVerticalScale(20) },
    emptyThread: { color: colors.mutedText, fontSize: scale(13), textAlign: "center", marginTop: moderateVerticalScale(24) },

    // Threaded Comment Styles
    commentWrapper: { marginTop: moderateVerticalScale(12) },
    replyWrapper: { marginLeft: moderateScale(16), borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: moderateScale(12), marginTop: moderateVerticalScale(8) },
    deepReplyWrapper: { borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: moderateScale(12), marginTop: moderateVerticalScale(8) },
    commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: moderateVerticalScale(4) },
    commentAuthor: { fontSize: scale(14), fontWeight: "600", color: colors.text, marginLeft: moderateScale(8) },
    commentTime: { fontSize: scale(12), color: colors.mutedText, marginLeft: moderateScale(6) },
    commentText: { fontSize: scale(14), color: colors.text, lineHeight: scale(20), marginTop: moderateVerticalScale(4) },
    commentActions: { flexDirection: "row", gap: moderateScale(16), marginTop: moderateVerticalScale(6) },
    actionText: { fontSize: scale(12), color: colors.mutedText, fontWeight: "600" },
    actionTextActive: { color: colors.danger },
    deleteText: { fontSize: scale(12), color: colors.danger, fontWeight: "600" },
    toggleText: { fontSize: scale(12), color: colors.primary, fontWeight: "600" },
    repliesContainer: { marginTop: moderateVerticalScale(4) },

    // "Replying to" banner
    replyBanner: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: moderateScale(16), paddingVertical: moderateVerticalScale(6), backgroundColor: colors.lightPurple },
    replyBannerText: { flex: 1, color: colors.primary, fontSize: scale(12), fontWeight: "600", marginRight: moderateScale(10) },
    replyBannerClose: { color: colors.primary, fontSize: scale(13), fontWeight: "700" },

    // Input Styles
    inputSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(16), paddingTop: moderateVerticalScale(10), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
    input: { flex: 1, backgroundColor: colors.lightBlue, borderRadius: radius.md, paddingHorizontal: moderateScale(14), paddingTop: moderateVerticalScale(10), paddingBottom: moderateVerticalScale(10), maxHeight: moderateVerticalScale(100), fontSize: scale(14), color: colors.text },
    sendBtn: { marginLeft: moderateScale(12), backgroundColor: colors.primary, paddingHorizontal: moderateScale(16), paddingVertical: moderateVerticalScale(10), borderRadius: radius.md },
    sendBtnDisabled: { backgroundColor: colors.mutedText },
    sendBtnText: { color: colors.white, fontWeight: "600" }
});
