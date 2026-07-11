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

import UserAvatar from "./UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { useSavedPosts } from "../../context/SavedPostsContext";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import imagePath from "../../constant/imagePath";

export interface Post {
    id: string;
    author: string;
    circle: string;
    time: string;
    content: string;
    image?: string;
    supportCount: number;
    helpfulCount: number;
    commentCount: number;
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
    const animatedStyle = useEnterAnimation(index);

    // Local-only reactions until the feed is backend-wired
    const [supported, setSupported] = useState(false);
    const [markedHelpful, setMarkedHelpful] = useState(false);

    const { isSaved, toggleSave } = useSavedPosts();
    const saved = isSaved(post.id);

    const showPostMenu = () => {
        Alert.alert("Post Options", undefined, [
            {
                text: saved ? "Remove from Saved" : "Save Post",
                onPress: () => toggleSave(post),
            },
            { text: "Report Post", style: "destructive", onPress: () => {} },
            { text: "Cancel", style: "cancel" },
        ]);
    };

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
                    <UserAvatar initials={post.author[0]} size={compact ? COMPACT_AVATAR_SIZE : AVATAR_SIZE} />

                    <View style={styles.userInfo}>
                        <Text style={[styles.author, compact && styles.authorCompact, { color: colors.text }]} numberOfLines={1}>
                            {post.author}
                        </Text>
                        <Text style={[styles.meta, { color: colors.mutedText }]} numberOfLines={1}>
                            {post.circle} • {post.time}
                        </Text>
                    </View>

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

                {post.image ? (
                    <Image
                        source={{ uri: post.image }}
                        style={[styles.image, compact && styles.imageCompact]}
                        resizeMode="cover"
                    />
                ) : null}

                <View style={[styles.actions, compact && styles.actionsCompact]}>
                    <ActionButton
                        icon={imagePath.HeartIcon}
                        onPress={() => setSupported((v) => !v)}
                        tintColor={supported ? colors.danger : colors.text}
                        count={post.supportCount + (supported ? 1 : 0)}
                        countColor={supported ? colors.danger : colors.mutedText}
                    />
                    <ActionButton
                        icon={imagePath.Help}
                        onPress={() => setMarkedHelpful((v) => !v)}
                        tintColor={markedHelpful ? colors.primary : colors.text}
                        count={post.helpfulCount + (markedHelpful ? 1 : 0)}
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
    image: {
        width: "100%",
        height: moderateVerticalScale(220),
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
        height: moderateVerticalScale(150),
    },
    actionsCompact: {
        paddingTop: moderateVerticalScale(8),
    },
});
