import React, { memo, useEffect, useMemo, useRef, useState } from "react";
import {
    Alert,
    Animated,
    View,
    Text,
    StyleSheet,
    Pressable,
    Image,
    ImageSourcePropType,
} from "react-native";

import { useNavigation } from "@react-navigation/native";
import UserAvatar from "./UserAvatar";
import ImageCarousel from "./ImageCarousel";
import { useTheme } from "../../theme/ThemeContext";
import { useAuth } from "../../context/AuthContext";
import { useSavedPosts } from "../../context/SavedPostsContext";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import imagePath from "../../constant/imagePath";

export interface Post {
    id: string;
    author: string;
    /** Present on live (API) posts — tapping the author opens their public profile. */
    authorId?: string;
    circle: string;
    time: string;
    /** Optional headline (live posts) — editable on your own posts. */
    title?: string;
    content: string;
    image?: string;
    /** All photos (up to 10) — rendered as a swipeable carousel. */
    images?: string[];
    supportCount: number;
    helpfulCount: number;
    commentCount: number;
    /** Present on live (API) posts — seeds the toggles with the server-side state. */
    supportedByMe?: boolean;
    helpfulByMe?: boolean;
}

interface Props {
    post: Post;
    onCommentPress?: () => void;
    onSharePress?: () => void;
    /** Tapping anywhere on the card (outside the action icons) — used to open the immersive post view. */
    onPress?: () => void;
    /** Denser layout for embedded feeds like the profile screen. */
    compact?: boolean;
    /** Position in the feed list — staggers the mount-in animation slightly per card. */
    index?: number;
}

interface ActionButtonProps {
    icon: ImageSourcePropType;
    onPress?: () => void;
    tintColor: string;
    count?: number;
    countColor?: string;
}

const AVATAR_SIZE = 42;
const COMPACT_AVATAR_SIZE = 34;
const IMAGE_HEIGHT = moderateVerticalScale(220);
const COMPACT_IMAGE_HEIGHT = moderateVerticalScale(150);
const ENTER_OFFSET = 12;
const ENTER_DURATION = 280;
const MAX_STAGGER_INDEX = 6;
const STAGGER_MS = 60;

const ActionButton = memo(function ActionButton({
    icon,
    onPress,
    tintColor,
    count,
    countColor,
}: ActionButtonProps) {
    const pressScale = useRef(new Animated.Value(1)).current;

    const onPressIn = () => {
        Animated.spring(pressScale, { toValue: 0.85, useNativeDriver: true, speed: 40 }).start();
    };
    const onPressOut = () => {
        Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
    };

    return (
        <Pressable
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.actionButton}
            hitSlop={8}
        >
            <Animated.Image
                style={[styles.actionIcon, { tintColor, transform: [{ scale: pressScale }] }]}
                source={icon}
                resizeMode="contain"
            />
            {typeof count === "number" && count > 0 ? (
                <Text style={[styles.actionCount, { color: countColor ?? tintColor }]}>{count}</Text>
            ) : null}
        </Pressable>
    );
});

function useEnterAnimation(index: number) {
    const opacity = useRef(new Animated.Value(0)).current;
    const translateY = useRef(new Animated.Value(ENTER_OFFSET)).current;

    useEffect(() => {
        const delay = Math.min(index, MAX_STAGGER_INDEX) * STAGGER_MS;
        const animation = Animated.parallel([
            Animated.timing(opacity, {
                toValue: 1,
                duration: ENTER_DURATION,
                delay,
                useNativeDriver: true,
            }),
            Animated.timing(translateY, {
                toValue: 0,
                duration: ENTER_DURATION,
                delay,
                useNativeDriver: true,
            }),
        ]);

        animation.start();
        return () => animation.stop();
    }, [index, opacity, translateY]);

    return useMemo(
        () => ({ opacity, transform: [{ translateY }] }),
        [opacity, translateY],
    );
}

function PostCard({ post, onCommentPress, onSharePress, onPress, compact, index = 0 }: Props) {
    const { colors } = useTheme();
    const navigation = useNavigation<any>();
    const animatedStyle = useEnterAnimation(index);

    // All photos, new (`images`) or legacy (`image`) — the carousel swipes through them.
    const postImages = post.images?.length ? post.images : post.image ? [post.image] : [];

    // Tapping the author's avatar/name opens their read-only profile (live posts
    // carry authorId; demo posts don't, so the tap falls through to the card).
    const openAuthorProfile = post.authorId
        ? () => navigation.navigate("UserProfile", { userId: post.authorId, name: post.author })
        : undefined;

    // Reactions flip optimistically, then reconcile twice over:
    //  - the react endpoint answers with the authoritative state + counts
    //    (concurrency-safe on the server — two devices can never double-count)
    //  - feed polling refreshes the post prop, so other people's reactions
    //    tick up live, like any social platform
    const { isAuthenticated, user } = useAuth();
    const [supported, setSupported] = useState(post.supportedByMe ?? false);
    const [supportCount, setSupportCount] = useState(post.supportCount);
    const [markedHelpful, setMarkedHelpful] = useState(post.helpfulByMe ?? false);
    const [helpfulCount, setHelpfulCount] = useState(post.helpfulCount);

    useEffect(() => {
        setSupported(post.supportedByMe ?? false);
        setSupportCount(post.supportCount);
        setMarkedHelpful(post.helpfulByMe ?? false);
        setHelpfulCount(post.helpfulCount);
    }, [post.supportedByMe, post.supportCount, post.helpfulByMe, post.helpfulCount]);

    const { isSaved, toggleSave } = useSavedPosts();
    const saved = isSaved(post.id);

    const react = (type: "support" | "helpful") => {
        const wasActive = type === "support" ? supported : markedHelpful;
        const setActive = type === "support" ? setSupported : setMarkedHelpful;
        const setCount = type === "support" ? setSupportCount : setHelpfulCount;

        setActive(!wasActive);
        setCount((c) => Math.max(0, c + (wasActive ? -1 : 1)));

        if (isAuthenticated) {
            resourcesApi
                .reactToPost(post.id, type)
                .then((res) => {
                    setActive(res.active);
                    setCount(type === "support" ? res.supportCount : res.helpfulCount);
                })
                .catch(() => {});
        }
    };

    const handleSaveToggle = () => {
        toggleSave(post); // local persistence (demo + instant UI)
        if (isAuthenticated) resourcesApi.toggleSavePost(post.id).catch(() => {});
    };

    // Own live posts get Edit/Delete in the menu; the delete hides the card
    // immediately (optimistic) and every feed's polling reconciles the rest.
    const isOwnPost = isAuthenticated && !!post.authorId && post.authorId === user?.id;
    const [deleted, setDeleted] = useState(false);

    const confirmDelete = () => {
        Alert.alert("Delete this post?", "It disappears for everyone. This can't be undone.", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    setDeleted(true);
                    try {
                        await resourcesApi.deletePost(post.id);
                    } catch (err) {
                        setDeleted(false);
                        Alert.alert("Couldn't delete", apiErrorMessage(err));
                    }
                },
            },
        ]);
    };

    const showPostMenu = () => {
        Alert.alert("Post Options", undefined, [
            ...(isOwnPost
                ? [
                      { text: "Edit Post", onPress: () => navigation.navigate("EditPost", { post }) },
                      { text: "Delete Post", style: "destructive" as const, onPress: confirmDelete },
                  ]
                : []),
            {
                text: saved ? "Remove from Saved" : "Save Post",
                onPress: handleSaveToggle,
            },
            { text: "Report Post", style: "destructive", onPress: () => {} },
            { text: "Cancel", style: "cancel" },
        ]);
    };

    if (deleted) return null;

    return (
        <Animated.View
            style={[
                styles.card,
                compact && styles.cardCompact,
                { backgroundColor: colors.card, borderColor: colors.border },
                animatedStyle,
            ]}
        >
            <Pressable onPress={onPress}>
                <View style={styles.header}>
                    <Pressable style={styles.authorTap} onPress={openAuthorProfile} disabled={!openAuthorProfile}>
                        <UserAvatar initials={post.author[0]} size={compact ? COMPACT_AVATAR_SIZE : AVATAR_SIZE} />

                        <View style={styles.userInfo}>
                            <Text style={[styles.author, compact && styles.authorCompact, { color: colors.text }]} numberOfLines={1}>
                                {post.author}
                            </Text>
                            <Text style={[styles.meta, { color: colors.mutedText }]} numberOfLines={1}>
                                {/* Personal-feed posts have no group — show just the time,
                                    only real groups get named here. */}
                                {post.circle ? `${post.circle} • ${post.time}` : post.time}
                            </Text>
                        </View>
                    </Pressable>

                    <Pressable hitSlop={8} onPress={showPostMenu}>
                        <Image
                            source={imagePath.MoreIcon}
                            style={styles.more}
                            tintColor={colors.mutedText}
                            resizeMode="contain"
                        />
                    </Pressable>
                </View>

                <Text
                    style={[styles.content, compact && styles.contentCompact, { color: colors.text }]}
                    numberOfLines={compact ? 3 : undefined}
                >
                    {post.content}
                </Text>

                {postImages.length > 0 ? (
                    <ImageCarousel
                        images={postImages}
                        height={compact ? COMPACT_IMAGE_HEIGHT : IMAGE_HEIGHT}
                        style={[styles.image, compact && styles.imageCompact]}
                    />
                ) : null}

                <View style={[styles.actions, compact && styles.actionsCompact]}>
                    <ActionButton
                        icon={imagePath.HeartIcon}
                        onPress={() => react("support")}
                        tintColor={supported ? colors.danger : colors.text}
                        count={supportCount}
                        countColor={supported ? colors.danger : colors.mutedText}
                    />
                    <ActionButton
                        icon={imagePath.Help}
                        onPress={() => react("helpful")}
                        tintColor={markedHelpful ? colors.primary : colors.text}
                        count={helpfulCount}
                        countColor={markedHelpful ? colors.primary : colors.mutedText}
                    />
                    <ActionButton
                        icon={imagePath.ChatIcon}
                        onPress={onCommentPress}
                        tintColor={colors.text}
                        count={post.commentCount}
                        countColor={colors.mutedText}
                    />
                    <ActionButton
                        icon={imagePath.ShareIcon}
                        onPress={onSharePress}
                        tintColor={colors.text}
                    />
                </View>
            </Pressable>
        </Animated.View>
    );
}

export default memo(PostCard);

const styles = StyleSheet.create({
    header: {
        flexDirection: "row",
        alignItems: "center",
    },
    authorTap: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
    },
    userInfo: {
        flex: 1,
        marginLeft: moderateScale(12),
    },
    author: {
        fontSize: scale(15),
        fontWeight: "700",
    },
    meta: {
        fontSize: scale(12),
        marginTop: moderateVerticalScale(2),
    },
    more: {
        height: moderateVerticalScale(18),
        width: moderateScale(18),
    },
    content: {
        marginTop: moderateScale(10),
        fontSize: scale(14),
        lineHeight: scale(18),
    },
    // Height intentionally lives on the carousel (multi-photo pages are uniform;
    // a single photo renders at its real proportions instead).
    image: {
        width: "100%",
        borderRadius: moderateScale(16),
        marginTop: moderateVerticalScale(12),
    },
    actions: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingTop: moderateVerticalScale(12),
    },
    actionButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        minWidth: moderateScale(36),
        gap: moderateScale(5),
    },
    actionIcon: {
        height: moderateVerticalScale(20),
        width: moderateScale(20),
    },
    actionCount: {
        fontSize: scale(12),
        fontWeight: "600",
    },
    card: {
        borderRadius: moderateScale(18),
        padding: moderateScale(12),
        marginBottom: moderateVerticalScale(10),
        borderWidth: StyleSheet.hairlineWidth,
    },

    // Compact variant (denser feeds, e.g. profile)
    cardCompact: {
        padding: moderateScale(10),
        borderRadius: moderateScale(14),
        marginBottom: moderateVerticalScale(8),
    },
    authorCompact: {
        fontSize: scale(13),
    },
    contentCompact: {
        marginTop: moderateScale(8),
        fontSize: scale(13),
        lineHeight: scale(17),
    },
    imageCompact: {
        marginTop: moderateVerticalScale(8),
    },
    actionsCompact: {
        paddingTop: moderateVerticalScale(8),
    },
});
