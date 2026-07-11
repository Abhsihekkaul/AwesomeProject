import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";

// Dummy Threaded Data (exported so PostDetailsScreen can render the same thread inline)
export const initialComments = [
    {
        id: "1",
        user: "Shivani Rawat",
        initials: "SR",
        text: "This breathing technique completely changed my mornings. Highly recommend giving it at least a week to see results.",
        time: "2h",
        replies: [
            {
                id: "1a",
                user: "Arun",
                initials: "A",
                text: "Did you do it before or after your morning coffee? I feel like the caffeine messes with my heart rate.",
                time: "1h",
                replies: [
                    {
                        id: "1a1",
                        user: "Shivani Rawat",
                        initials: "SR",
                        text: "Definitely before! Right after waking up.",
                        time: "45m",
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
        replies: []
    }
];

// Recursive Component for Threaded UI (exported for reuse in PostDetailsScreen)
export const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => {
    const { colors } = useTheme();
    const styles = makeStyles(colors);
    return (
        <View style={[styles.commentWrapper, depth > 0 && styles.replyWrapper]}>
            <View style={styles.commentHeader}>
                <UserAvatar initials={comment.initials} size={28} />
                <Text style={styles.commentAuthor}>{comment.user}</Text>
                <Text style={styles.commentTime}>• {comment.time}</Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
            <View style={styles.commentActions}>
                <Pressable><Text style={styles.actionText}>Support</Text></Pressable>
                <Pressable><Text style={styles.actionText}>Reply</Text></Pressable>
            </View>

            {/* Recursively render replies */}
            {comment.replies && comment.replies.length > 0 && (
                <View style={styles.repliesContainer}>
                    {comment.replies.map((reply: any) => (
                        <CommentItem key={reply.id} comment={reply} depth={depth + 1} />
                    ))}
                </View>
            )}
        </View>
    );
};

export default function CommentsSheet({ visible, onClose }: { visible: boolean, onClose: () => void }) {
    const [inputText, setInputText] = useState("");
    const [comments, setComments] = useState(initialComments);
    const { colors } = useTheme();
    const styles = makeStyles(colors);

    const postComment = () => {
        const text = inputText.trim();
        if (!text) return;
        setComments((prev) => [
            ...prev,
            { id: Date.now().toString(), user: "You", initials: "ME", text, time: "now", replies: [] },
        ]);
        setInputText("");
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
                        {comments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </ScrollView>

                    <View style={styles.inputSection}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a comment..."
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
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    sheetContainer: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, height: "80%", paddingBottom: moderateVerticalScale(20) },
    dragHandle: { width: moderateScale(40), height: moderateVerticalScale(4), backgroundColor: colors.border, alignSelf: "center", borderRadius: radius.sm, marginTop: moderateVerticalScale(10), marginBottom: moderateVerticalScale(10) },
    sheetTitle: { fontSize: TextStyles.title, fontWeight: "700", textAlign: "center", marginBottom: moderateVerticalScale(10), color: colors.text },
    scrollContent: { paddingHorizontal: moderateScale(16), paddingBottom: moderateVerticalScale(20) },

    // Threaded Comment Styles
    commentWrapper: { marginTop: moderateVerticalScale(12) },
    replyWrapper: { marginLeft: moderateScale(16), borderLeftWidth: 2, borderLeftColor: colors.border, paddingLeft: moderateScale(12), marginTop: moderateVerticalScale(8) },
    commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: moderateVerticalScale(4) },
    commentAuthor: { fontSize: scale(14), fontWeight: "600", color: colors.text, marginLeft: moderateScale(8) },
    commentTime: { fontSize: scale(12), color: colors.mutedText, marginLeft: moderateScale(6) },
    commentText: { fontSize: scale(14), color: colors.text, lineHeight: scale(20), marginTop: moderateVerticalScale(4) },
    commentActions: { flexDirection: "row", gap: moderateScale(16), marginTop: moderateVerticalScale(6) },
    actionText: { fontSize: scale(12), color: colors.mutedText, fontWeight: "600" },
    repliesContainer: { marginTop: moderateVerticalScale(4) },

    // Input Styles
    inputSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(16), paddingTop: moderateVerticalScale(10), borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.card },
    input: { flex: 1, backgroundColor: colors.lightBlue, borderRadius: radius.md, paddingHorizontal: moderateScale(14), paddingTop: moderateVerticalScale(10), paddingBottom: moderateVerticalScale(10), maxHeight: moderateVerticalScale(100), fontSize: scale(14), color: colors.text },
    sendBtn: { marginLeft: moderateScale(12), backgroundColor: colors.primary, paddingHorizontal: moderateScale(16), paddingVertical: moderateVerticalScale(10), borderRadius: radius.md },
    sendBtnDisabled: { backgroundColor: colors.mutedText },
    sendBtnText: { color: colors.white, fontWeight: "600" }
});