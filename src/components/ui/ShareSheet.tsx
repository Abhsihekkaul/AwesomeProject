import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Modal,
    Pressable,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "../../components/ui/UserAvatar";
import SearchBar from "../../components/ui/SearchBar";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

type ShareTarget = {
    key: string;
    name: string;
    initials: string;
    /** Existing conversation (recent chats). */
    chatId?: string;
    /** Sathi without a conversation yet — the chat gets created on send. */
    userId?: string;
};

const initialsOf = (name: string) =>
    name
        .split(" ")
        .map((p) => p[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

// Demo-mode targets (signed out only).
const demoFriends: ShareTarget[] = [
    { key: "d1", name: "Shivani", initials: "SR" },
    { key: "d2", name: "Arun", initials: "A" },
    { key: "d3", name: "Priya", initials: "PS" },
    { key: "d4", name: "Alex", initials: "AK" },
    { key: "d5", name: "Neha", initials: "NV" },
];

/**
 * Share a post the way every social platform does:
 *  - Quick row: your top 5 people (most recent conversations, else sathis) —
 *    one tap drops the post straight into that chat.
 *  - "Choose people..." flips the sheet into a picker: search ALL your
 *    conversations + sathis, select as many as you like, hit Share once, and
 *    you're back exactly where you were — no detour through the Chats tab.
 *  - The native share row covers everything outside the app.
 */
export default function ShareSheet({
    visible,
    onClose,
    postUrl = "https://healingstream.app/p/123",
    post,
}: {
    visible: boolean;
    onClose: () => void;
    postUrl?: string;
    post?: { id?: string; author?: string; title?: string; content?: string } | null;
}) {
    const { colors } = useTheme();
    const styles = makeStyles(colors);
    const insets = useSafeAreaInsets();
    const bottomPad = Math.max(insets.bottom, moderateVerticalScale(16));

    // Top 5 = most recent conversations; a fresh account without chats falls
    // back to its sathis (the conversation is created on first send).
    const { data: friends, isLive, refresh } = useLiveOrDemo<ShareTarget[]>(async () => {
        const chats = await resourcesApi.getChats();
        if (chats.length > 0) {
            return chats.slice(0, 5).map((c: any) => ({
                key: c.id,
                chatId: c.id,
                userId: c.userId,
                name: c.name,
                initials: initialsOf(c.name),
            }));
        }
        return (await resourcesApi.getSathis()).slice(0, 5).map((s: any) => ({
            key: s.id,
            userId: s.id,
            name: s.name,
            initials: initialsOf(s.name),
        }));
    }, demoFriends);

    // Quick-row per-friend sent state, and the picker's state.
    const [sentTo, setSentTo] = useState<Record<string, boolean>>({});
    const [mode, setMode] = useState<"quick" | "pick">("quick");
    const [allTargets, setAllTargets] = useState<ShareTarget[]>([]);
    const [loadingAll, setLoadingAll] = useState(false);
    const [query, setQuery] = useState("");
    const [selected, setSelected] = useState<Record<string, ShareTarget>>({});
    const [sharing, setSharing] = useState(false);

    useEffect(() => {
        if (visible) {
            setSentTo({});
            setMode("quick");
            setQuery("");
            setSelected({});
            setSharing(false);
            refresh();
        }
    }, [visible, refresh]);

    const snippet = post?.title || post?.content?.slice(0, 80) || "";
    const message = snippet
        ? `Sharing ${post?.author ? `${post.author}'s` : "a"} post: "${snippet}"\n${postUrl}`
        : `Check out this post on HealingSathi: ${postUrl}`;

    /** Sends the post into one conversation (creating it for chat-less sathis). */
    const deliverTo = async (target: ShareTarget) => {
        const chatId = target.chatId ?? (await resourcesApi.openChatWith(target.userId!));
        // In-app shares travel as a structured post reference — the recipient
        // sees a tappable post card, not a link. Text is the external fallback.
        await resourcesApi.sendMessage(
            chatId,
            post?.id ? { sharedPostId: post.id } : { text: message },
        );
    };

    const sendToFriend = async (friend: ShareTarget) => {
        if (sentTo[friend.key]) return;
        setSentTo((prev) => ({ ...prev, [friend.key]: true })); // optimistic ✓

        if (!isLive) return; // demo: the ✓ is the whole story
        try {
            await deliverTo(friend);
        } catch (err) {
            setSentTo((prev) => ({ ...prev, [friend.key]: false }));
            Alert.alert("Couldn't share", apiErrorMessage(err));
        }
    };

    // ---------- Picker mode ----------

    /** ALL conversations + every sathi without a chat yet, deduped by person. */
    const openPicker = async () => {
        setMode("pick");
        if (!isLive) {
            setAllTargets(demoFriends);
            return;
        }
        setLoadingAll(true);
        try {
            const [chats, sathis] = await Promise.all([
                resourcesApi.getChats(),
                resourcesApi.getSathis().catch(() => []),
            ]);
            const targets: ShareTarget[] = chats.map((c: any) => ({
                key: c.id,
                chatId: c.id,
                userId: c.userId,
                name: c.name,
                initials: initialsOf(c.name),
            }));
            const alreadyListed = new Set(chats.map((c: any) => c.userId));
            for (const s of sathis) {
                if (!alreadyListed.has(s.id)) {
                    targets.push({ key: `u-${s.id}`, userId: s.id, name: s.name, initials: initialsOf(s.name) });
                }
            }
            setAllTargets(targets);
        } catch {
            setAllTargets([]);
        } finally {
            setLoadingAll(false);
        }
    };

    const toggleSelect = (target: ShareTarget) => {
        setSelected((prev) => {
            const next = { ...prev };
            if (next[target.key]) delete next[target.key];
            else next[target.key] = target;
            return next;
        });
    };

    /** One Share for everyone selected, then straight back to where you were. */
    const shareToSelected = async () => {
        const targets = Object.values(selected);
        if (targets.length === 0 || sharing) return;
        if (!isLive) {
            onClose(); // demo: nothing to actually send
            return;
        }
        setSharing(true);
        const results = await Promise.all(
            targets.map(async (target) => {
                try {
                    await deliverTo(target);
                    return { target, ok: true };
                } catch {
                    return { target, ok: false };
                }
            }),
        );
        setSharing(false);

        const failed = results.filter((r) => !r.ok);
        if (failed.length === 0) {
            onClose();
            return;
        }
        // The ones that went through are done; the failures stay selected for retry.
        setSelected(Object.fromEntries(failed.map((r) => [r.target.key, r.target])));
        Alert.alert(
            "Some shares didn't go through",
            `Couldn't send to ${failed.map((r) => r.target.name).join(", ")} — they're still selected, try again.`,
        );
    };

    // Triggers the native iOS/Android share overlay
    const handleExternalShare = async () => {
        try {
            await Share.share({
                message,
                url: postUrl, // iOS only
            });
            onClose(); // Close our custom sheet after opening the system one
        } catch (error) {
            console.error(error);
        }
    };

    const q = query.trim().toLowerCase();
    const visibleTargets = q ? allTargets.filter((t) => t.name.toLowerCase().includes(q)) : allTargets;
    const selectedCount = Object.keys(selected).length;

    return (
        <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={styles.dismissArea} onPress={onClose} />

                <View style={[styles.sheetContainer, { paddingBottom: bottomPad }]}>
                    <View style={styles.dragHandle} />

                    {mode === "quick" ? (
                        <>
                            <Text style={styles.sheetTitle}>Share to</Text>

                            {/* Your people — tap to drop the post straight into that chat */}
                            {friends.length === 0 ? (
                                <Text style={styles.emptyFriends}>
                                    No sathis yet — connect with people to share posts with them directly.
                                </Text>
                            ) : (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.friendsScroll}>
                                    {friends.map((friend) => (
                                        <Pressable key={friend.key} style={styles.friendNode} onPress={() => sendToFriend(friend)}>
                                            <UserAvatar initials={friend.initials} size={56} bg={colors.lightPurple} color={colors.primary} />
                                            <Text style={styles.friendName} numberOfLines={1}>
                                                {friend.name}
                                            </Text>
                                            <Text style={[styles.sentLabel, !sentTo[friend.key] && styles.sentLabelHidden]}>
                                                Sent ✓
                                            </Text>
                                        </Pressable>
                                    ))}
                                </ScrollView>
                            )}

                            <View style={styles.divider} />

                            {/* Everyone else — multi-select without leaving this screen */}
                            <Pressable style={styles.externalShareBtn} onPress={openPicker}>
                                <View style={styles.iconPlaceholder}><Text>💬</Text></View>
                                <Text style={styles.externalShareText}>Choose people...</Text>
                            </Pressable>

                            {/* External Platform Sharing */}
                            <Pressable style={styles.externalShareBtn} onPress={handleExternalShare}>
                                <View style={styles.iconPlaceholder}><Text>🔗</Text></View>
                                <Text style={styles.externalShareText}>Share via other apps...</Text>
                            </Pressable>
                        </>
                    ) : (
                        <>
                            {/* Picker header: back to the quick view, live selection count */}
                            <View style={styles.pickHeader}>
                                <Pressable hitSlop={10} onPress={() => setMode("quick")}>
                                    <Text style={styles.pickBack}>←</Text>
                                </Pressable>
                                <Text style={styles.pickTitle}>
                                    {selectedCount > 0 ? `Share with ${selectedCount} ${selectedCount === 1 ? "person" : "people"}` : "Share with..."}
                                </Text>
                            </View>

                            <View style={styles.pickSearchWrap}>
                                <SearchBar placeholder="Search your people..." value={query} onChangeText={setQuery} />
                            </View>

                            {loadingAll ? (
                                <ActivityIndicator color={colors.primary} style={styles.pickLoading} />
                            ) : (
                                <ScrollView style={styles.pickList} keyboardShouldPersistTaps="handled">
                                    {visibleTargets.length === 0 ? (
                                        <Text style={styles.emptyFriends}>
                                            {q ? `No one matches "${query.trim()}".` : "No sathis yet — connect with people first."}
                                        </Text>
                                    ) : (
                                        visibleTargets.map((target) => {
                                            const isSelected = !!selected[target.key];
                                            return (
                                                <Pressable key={target.key} style={styles.pickRow} onPress={() => toggleSelect(target)}>
                                                    <UserAvatar initials={target.initials} size={40} bg={colors.lightPurple} color={colors.primary} />
                                                    <Text style={styles.pickRowName} numberOfLines={1}>{target.name}</Text>
                                                    <View style={[styles.checkCircle, isSelected && styles.checkCircleOn]}>
                                                        {isSelected ? <Text style={styles.checkMark}>✓</Text> : null}
                                                    </View>
                                                </Pressable>
                                            );
                                        })
                                    )}
                                </ScrollView>
                            )}

                            <Pressable
                                style={[styles.shareBtn, (selectedCount === 0 || sharing) && styles.shareBtnDisabled]}
                                onPress={shareToSelected}
                                disabled={selectedCount === 0 || sharing}
                            >
                                <Text style={styles.shareBtnText}>
                                    {sharing ? "Sharing..." : selectedCount > 0 ? `Share (${selectedCount})` : "Share"}
                                </Text>
                            </Pressable>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "flex-end" },
    dismissArea: { flex: 1 },
    // Bottom padding is applied inline from the live safe-area inset.
    sheetContainer: { backgroundColor: colors.card, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
    dragHandle: { width: moderateScale(40), height: moderateVerticalScale(4), backgroundColor: colors.border, alignSelf: "center", borderRadius: radius.sm, marginTop: moderateVerticalScale(10), marginBottom: moderateVerticalScale(10) },
    sheetTitle: { fontSize: TextStyles.title, fontWeight: "700", textAlign: "center", marginBottom: moderateVerticalScale(14), color: colors.text },
    friendsScroll: { paddingHorizontal: moderateScale(16), gap: moderateScale(18), paddingBottom: moderateVerticalScale(6) },
    friendNode: { alignItems: "center", width: moderateScale(64) },
    friendName: { marginTop: moderateVerticalScale(6), fontSize: scale(12), color: colors.text, fontWeight: "500" },
    sentLabel: { marginTop: moderateVerticalScale(2), fontSize: scale(10), color: colors.success, fontWeight: "700" },
    sentLabelHidden: { opacity: 0 },
    emptyFriends: { color: colors.mutedText, fontSize: scale(13), textAlign: "center", paddingHorizontal: moderateScale(24), paddingBottom: moderateVerticalScale(8) },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: moderateVerticalScale(12) },
    externalShareBtn: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(20), paddingBottom: moderateVerticalScale(10) },
    iconPlaceholder: { width: moderateScale(40), height: moderateScale(40), borderRadius: moderateScale(20), backgroundColor: colors.lightBlue, alignItems: "center", justifyContent: "center", marginRight: moderateScale(12) },
    externalShareText: { fontSize: TextStyles.body, color: colors.text, fontWeight: "500" },

    // Picker mode
    pickHeader: { flexDirection: "row", alignItems: "center", paddingHorizontal: moderateScale(16), marginBottom: moderateVerticalScale(8) },
    pickBack: { color: colors.text, fontSize: scale(20), fontWeight: "600", paddingRight: moderateScale(12) },
    pickTitle: { flex: 1, fontSize: TextStyles.title, fontWeight: "700", color: colors.text },
    pickSearchWrap: { paddingHorizontal: moderateScale(16), marginBottom: moderateVerticalScale(6) },
    pickLoading: { marginVertical: moderateVerticalScale(30) },
    pickList: { maxHeight: moderateVerticalScale(300), paddingHorizontal: moderateScale(16) },
    pickRow: { flexDirection: "row", alignItems: "center", paddingVertical: moderateVerticalScale(8) },
    pickRowName: { flex: 1, marginLeft: moderateScale(12), fontSize: TextStyles.body, color: colors.text, fontWeight: "500" },
    checkCircle: { width: moderateScale(24), height: moderateScale(24), borderRadius: moderateScale(12), borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
    checkCircleOn: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkMark: { color: colors.white, fontSize: scale(12), fontWeight: "800" },
    shareBtn: { marginTop: moderateVerticalScale(12), marginHorizontal: moderateScale(16), backgroundColor: colors.primary, borderRadius: radius.xl, paddingVertical: moderateVerticalScale(13), alignItems: "center" },
    shareBtnDisabled: { backgroundColor: colors.border },
    shareBtnText: { color: colors.white, fontSize: TextStyles.body, fontWeight: "700" },
});
