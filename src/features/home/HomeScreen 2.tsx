import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import SearchBar from "../../components/ui/SearchBar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import imagePath from "../../constant/imagePath";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";
import { dummyFriends, dummyGroups } from "../../components/ui/DirectoryScreen";

// Import your newly created sheets here
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";

export default function HomeScreen() {
    const navigation = useNavigation<any>();

    const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
    const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

    const { colors } = useTheme();
    const styles = makeStyles(colors);

    // Updated navigation routes and params, with social-style counts.
    // "My Posts" shows the user's mini avatar — it represents *their* content,
    // not the generic compose glyph.
    const quickActions = [
        { title: "Groups", count: dummyGroups.length, icon: imagePath.GroupIcon, route: "Directory", type: "Groups" },
        { title: "My Posts", count: dummyPosts.slice(0, 2).length, isAvatar: true, route: "Profile" }, // Routes straight to Profile
        { title: "Friends", count: dummyFriends.length, icon: imagePath.UserIcon, route: "Directory", type: "Friends" },
    ] as const;

    // Hidden Instagram-style gesture: swipe right anywhere on the feed to open the
    // post composer (swipe back / left-edge gesture returns). No visible chrome.
    const swipeHandled = useRef(false);
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponder: (_evt, g) =>
                g.dx > 24 && Math.abs(g.dy) < 18 && g.dx > Math.abs(g.dy) * 2.5,
            onPanResponderGrant: () => {
                swipeHandled.current = false;
            },
            onPanResponderMove: (_evt, g) => {
                if (!swipeHandled.current && g.dx > 64) {
                    swipeHandled.current = true;
                    navigation.navigate("CreatePost");
                }
            },
        }),
    ).current;

    return (
        <ScreenWrapper edges={["top", "left", "right"]}>
            <ScrollView showsVerticalScrollIndicator={false} {...panResponder.panHandlers}>
                <View style={styles.topBar}>
                    <Pressable onPress={() => navigation.navigate("Profile")}>
                        <UserAvatar initials="A" size={40} MarginRightSide={0} />
                    </Pressable>

                    <View style={styles.topBarSearch}>
                        <SearchBar
                            placeholder="Search people, groups, consultants..."
                            onPress={() => navigation.navigate("Search")}
                        />
                    </View>

                    <Pressable onPress={() => navigation.navigate("Notifications")}>
                        <Image style={styles.notificationIcon} source={imagePath.NotificationIcon} />
                    </Pressable>
                </View>

                <View style={styles.quickGrid}>
                    {quickActions.map((item) => (
                        <Pressable
                            key={item.title}
                            onPress={() => {
                                if ("type" in item && item.type) {
                                    navigation.navigate(item.route, { type: item.type });
                                } else {
                                    navigation.navigate(item.route);
                                }
                            }}
                            style={styles.quickCard}
                        >
                            {"isAvatar" in item && item.isAvatar ? (
                                <UserAvatar initials="A" size={moderateScale(21)} MarginRightSide={0} />
                            ) : (
                                <Image source={"icon" in item ? item.icon : undefined} style={styles.quickIcon} />
                            )}
                            <Text style={[styles.quickTitle]}>{item.title}</Text>
                            <Text style={styles.quickCount}>{item.count}</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable style={styles.QuickTips} onPress={() => navigation.navigate("HealthTips")}>
                    <Image style={styles.HeartBtn} source={imagePath.HeartIcon} tintColor={colors.text}/>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.TipsTitle}>Need Quick Health Tips</Text>
                        <Text style={styles.TipsSub}>100+ resources available</Text>
                    </View>
                    <Image style={styles.RightIcon} source={imagePath.RightIcon} />
                </Pressable>

                <Pressable style={styles.QuickTips} onPress={() => navigation.navigate("HealingDiary")}>
                    <Text style={styles.DiaryEmoji}>📔</Text>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.TipsTitle}>Healing Diary</Text>
                        <Text style={styles.TipsSub}>Private journal — stored only on this phone</Text>
                    </View>
                    <Image style={styles.RightIcon} source={imagePath.RightIcon} />
                </Pressable>

                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Healing Stream</Text>
                    <Pressable onPress={() => navigation.navigate("CreatePost")}>
                        <Image style={styles.Post} source={imagePath.PostIcon} />
                    </Pressable>
                </View>

                <View style={{ marginTop: moderateVerticalScale(8) }}>
                    {dummyPosts.map((item, index) => (
                        <PostCard
                            key={item.id}
                            post={item}
                            index={index}
                            onPress={() => navigation.navigate("PostDetails", { post: item })}
                            onCommentPress={() => setSelectedCommentPost(item)}
                            onSharePress={() => setSelectedSharePost(item)}
                        />
                    ))}
                </View>

            </ScrollView>

            <CommentsSheet
                visible={!!selectedCommentPost}
                onClose={() => setSelectedCommentPost(null)}
            />

            <ShareSheet
                visible={!!selectedSharePost}
                onClose={() => setSelectedSharePost(null)}
                postUrl={selectedSharePost ? `https://healingstream.app/p/${selectedSharePost.id}` : undefined}
            />

        </ScreenWrapper>
    );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        gap: moderateScale(10),
        marginBottom: moderateVerticalScale(10),
    },
    topBarSearch: {
        flex: 1,
    },
    notificationIcon: {
        height: moderateVerticalScale(25),
        width: moderateScale(25),
        tintColor: colors.text,
    },
    QuickTips: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: moderateScale(11),
        marginBottom: moderateVerticalScale(12),
    },
    HeartBtn: {
        height: moderateVerticalScale(20),
        width: moderateScale(22),
        marginRight: moderateScale(12)
    },
    DiaryEmoji: {
        fontSize: moderateScale(18),
        marginRight: moderateScale(12),
    },
    TipsTitle: {
        fontSize: TextStyles.stepCounts,
        fontWeight: "600",
        color: colors.text,
    },
    TipsSub: {
        fontSize: TextStyles.caption,
        marginTop: moderateVerticalScale(2),
        color: colors.mutedText,
    },
    RightIcon: {
        height: moderateVerticalScale(14),
        width: moderateScale(14),
        tintColor: colors.mutedText,
    },
    quickGrid: {
        flexDirection: "row",
        justifyContent: "space-evenly"
    },
    quickCard: {
        padding: moderateScale(10),
        marginBottom: moderateScale(4),
        alignItems: "center",
        justifyContent: "center",
    },
    quickIcon: {
        height: moderateVerticalScale(20),
        width: moderateScale(20),
        resizeMode: "contain",
        tintColor: colors.text,
    },
    quickTitle: {
        marginTop: moderateVerticalScale(4),
        fontSize: TextStyles.caption,
        color: colors.mutedText,
    },
    // Deliberately quiet: a small tabular figure tucked under the label, not a loud stat
    quickCount: {
        marginTop: moderateVerticalScale(1),
        fontSize: TextStyles.caption,
        fontWeight: "600",
        color: colors.text,
        fontVariant: ["tabular-nums"],
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: moderateVerticalScale(2),
    },
    sectionTitle: {
        fontSize: TextStyles.body,
        color: colors.text,
    },
    Post: {
        height: moderateVerticalScale(20),
        width: moderateScale(20),
        tintColor: colors.text,
    },
});
