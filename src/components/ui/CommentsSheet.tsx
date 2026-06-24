import React, { useState } from "react";
import { Modal, View, Text, StyleSheet, Pressable, ScrollView, TextInput, KeyboardAvoidingView, Platform } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";

// Dummy Threaded Data
const initialComments = [
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

// Recursive Component for Threaded UI
const CommentItem = ({ comment, depth = 0 }: { comment: any, depth?: number }) => {
    return (
        <View style={[styles.commentWrapper, depth > 0 && styles.replyWrapper]}>
            <View style={styles.commentHeader}>
                <UserAvatar initials={comment.initials} size={28} bg="#E9EEF8" color="#4E79C7" />
                <Text style={styles.commentAuthor}>{comment.user}</Text>
                <Text style={styles.commentTime}>• {comment.time}</Text>
            </View>
            <Text style={styles.commentText}>{comment.text}</Text>
            <View style={styles.commentActions}>
                <Pressable><Text style={styles.actionText}>⇧ Upvote</Text></Pressable>
                <Pressable><Text style={styles.actionText}>💬 Reply</Text></Pressable>
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

                    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
                        {initialComments.map((comment) => (
                            <CommentItem key={comment.id} comment={comment} />
                        ))}
                    </ScrollView>

                    <View style={styles.inputSection}>
                        <TextInput
                            style={styles.input}
                            placeholder="Add a comment..."
                            placeholderTextColor="#8A9CB5"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <Pressable style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}>
                            <Text style={styles.sendBtnText}>Post</Text>
                        </Pressable>
                    </View>
                </KeyboardAvoidingView>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    sheetContainer: { backgroundColor: colors.white, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, height: "80%", paddingBottom: moderateVerticalScale(20) },
    dragHandle: { width: moderateScale(40), height: moderateVerticalScale(4), backgroundColor: "#D1D5DB", alignSelf: "center", borderRadius: radius.sm, marginTop: moderateVerticalScale(10), marginBottom: moderateVerticalScale(10) },
    sheetTitle: { fontSize: TextStyles.title, fontWeight: "700", textAlign: "center", marginBottom: moderateVerticalScale(10), color: colors.text },
    scrollContent: { paddingHorizontal: moderateScale(16), paddingBottom: moderateVerticalScale(20) },

    // Threaded Comment Styles
    commentWrapper: { marginTop: moderateVerticalScale(12) },
    replyWrapper: { marginLeft: moderateScale(16), borderLeftWidth: 2, borderLeftColor: "#E2E8F0", paddingLeft: moderateScale(12), marginTop: moderateVerticalScale(8) },
    commentHeader: { flexDirection: "row", alignItems: "center", marginBottom: moderateVerticalScale(4) },
    commentAuthor: { fontSize: scale(14), fontWeight: "600", color: colors.text, marginLeft: moderateScale(8) },
    commentTime: { fontSize: scale(12), color: "#6F87A6", marginLeft: moderateScale(6) },
    commentText: { fontSize: scale(14), color: colors.text, lineHeight: scale(20), marginTop: moderateVerticalScale(4) },
    commentActions: { flexDirection: "row", gap: moderateScale(16), marginTop: moderateVerticalScale(6) },
    actionText: { fontSize: scale(12), color: "#6F87A6", fontWeight: "600" },
    repliesContainer: { marginTop: moderateVerticalScale(4) },

    // Input Styles
    inputSection: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(16), paddingTop: moderateVerticalScale(10), borderTopWidth: 1, borderTopColor: "#E2E8F0", backgroundColor: colors.white },
    input: { flex: 1, backgroundColor: "#F3F4F6", borderRadius: radius.md, paddingHorizontal: moderateScale(14), paddingTop: moderateVerticalScale(10), paddingBottom: moderateVerticalScale(10), maxHeight: moderateVerticalScale(100), fontSize: scale(14), color: colors.text },
    sendBtn: { marginLeft: moderateScale(12), backgroundColor: "#7453C8", paddingHorizontal: moderateScale(16), paddingVertical: moderateVerticalScale(10), borderRadius: radius.md },
    sendBtnDisabled: { backgroundColor: "#A2B0C4" },
    sendBtnText: { color: colors.white, fontWeight: "600" }
});