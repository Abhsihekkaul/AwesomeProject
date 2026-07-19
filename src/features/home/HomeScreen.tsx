import { useNavigation } from "@react-navigation/native";
import React, { useRef, useState } from "react";
import { Image, PanResponder, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import DiyaBar from "../diya/DiyaBar";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import SearchBar from "../../components/ui/SearchBar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import imagePath from "../../constant/imagePath";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";
import { dummyFriends, dummyGroups } from "../../components/ui/DirectoryScreen";
import { resourcesApi } from "../../api/resourcesApi";
import { useAuth } from "../../context/AuthContext";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { timeAgo } from "../../utils/timeAgo";

// Import your newly created sheets here
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";

export default function HomeScreen() {
    const navigation = useNavigation<any>();

    const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
    const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

    const { colors } = useTheme();
    const styles = makeStyles(colors);
    const { user } = useAuth();
    const myInitial = (user?.name ?? "A").trim()[0]?.toUpperCase() ?? "A";

    // Live feed when signed in; built-in demo posts when signed out (see useLiveOrDemo).
    // Refetches on focus (a just-created post shows up the moment you're back) and
    // polls every 20s while the screen is open, so sathis' posts appear near-real-time.
    const { data: posts, isLive, loading, refresh } = useLiveOrDemo(
        async () =>
            (await resourcesApi.getFeed()).map((p: any) => ({ ...p, time: timeAgo(p.time) })),
        dummyPosts,
        undefined,
        20_000,
    );
    const [refreshing, setRefreshing] = useState(false);
    const onPullRefresh = async () => {
        setRefreshing(true);
        await refresh({ silent: true });
        setRefreshing(false);
    };

    // Quick-action counts are REAL for signed-in users (their joined groups, their
    // posts, their sathis — a fresh account honestly shows 0s); the dummy numbers
    // only ever appear in signed-out "Try the Demo" mode.
    const { data: quickCounts } = useLiveOrDemo(
        async () => {
            const [groups, myPosts, sathis] = await Promise.all([
                resourcesApi.getGroups(),
                resourcesApi.getMyPosts(),
                resourcesApi.getSathis(),
            ]);
            return {
                groups: groups.filter((g: any) => g.joined).length,
                posts: myPosts.length,
                friends: sathis.length,
            };
        },
        { groups: dummyGroups.length, posts: dummyPosts.slice(0, 2).length, friends: dummyFriends.length },
        { groups: 0, posts: 0, friends: 0 },
    );

    // Updated navigation routes and params, with social-style counts.
    // "My Posts" shows the user's mini avatar — it represents *their* content,
    // not the generic compose glyph.
    const quickActions = [
        { title: "Groups", count: quickCounts.groups, icon: imagePath.GroupIcon, route: "Directory", type: "Groups" },
        { title: "My Posts", count: quickCounts.posts, isAvatar: true, route: "Profile" }, // Routes straight to Profile
        { title: "Friends", count: quickCounts.friends, icon: imagePath.UserIcon, route: "Directory", type: "Friends" },
    ] as const;

    // Hidden Instagram-style gesture: swipe right anywhere on the feed to open the
    // post composer (swipe back / left-edge gesture returns). No visible chrome.
    // Handlers live on a wrapper View (NOT the ScrollView — its own responder logic
    // would swallow them) and use the capture phase so a decisively horizontal drag
    // wins before the vertical scroll claims the touch.
    const swipeHandled = useRef(false);
    const panResponder = useRef(
        PanResponder.create({
            onMoveShouldSetPanResponderCapture: (_evt, g) =>
                g.dx > 20 && g.dx > Math.abs(g.dy) * 2,
            onPanResponderGrant: () => {
                swipeHandled.current = false;
            },
            onPanResponderMove: (_evt, g) => {
                if (!swipeHandled.current && g.dx > 56) {
                    swipeHandled.current = true;
                    navigation.navigate("CreatePost");
                }
            },
            onPanResponderRelease: () => {
                swipeHandled.current = false;
            },
            onPanResponderTerminate: () => {
                swipeHandled.current = false;
            },
        }),
    ).current;

    return (
        <ScreenWrapper edges={["top", "left", "right"]}>
            <View style={styles.flex} {...panResponder.panHandlers}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onPullRefresh} tintColor={colors.primary} />
                }
            >
                <View style={styles.topBar}>
                    <Pressable onPress={() => navigation.navigate("Profile")}>
                        <UserAvatar initials={myInitial} uri={user?.avatarUrl} size={40} MarginRightSide={0} />
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

                {/* Diya — the daily check-in ring bar (DiyaFeature.md) */}
                <DiyaBar />

                {/* Quick links — tinted icon tiles, same card language as the tips shelf */}
                <Pressable style={styles.QuickTips} onPress={() => navigation.navigate("HealthTips")}>
                    <View style={[styles.quickLinkTile, { backgroundColor: colors.lightPurple }]}>
                        <Image style={styles.quickLinkIcon} source={imagePath.HeartIcon} tintColor={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.TipsTitle}>Health Tips</Text>
                        <Text style={styles.TipsSub}>Daily habits, doctor-written guides & more</Text>
                    </View>
                    <Image style={styles.RightIcon} source={imagePath.RightIcon} />
                </Pressable>

                <Pressable style={styles.QuickTips} onPress={() => navigation.navigate("HealingDiary")}>
                    <View style={[styles.quickLinkTile, { backgroundColor: colors.lightBlue }]}>
                        <Image style={styles.quickLinkIcon} source={imagePath.PostIcon} tintColor={colors.info} />
                    </View>
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
                    {/* Fresh accounts see an honest empty stream (never fake posts) with a
                        pointer to Search — connections are what fill the feed. */}
                    {isLive && !loading && posts.length === 0 ? (
                        <View style={styles.emptyFeed}>
                            <Text style={styles.emptyFeedTitle}>Your stream is quiet</Text>
                            <Text style={styles.emptyFeedBody}>
                                Posts from you, your Sathis and your groups show up here. Find
                                people to connect with, or share something yourself.
                            </Text>
                            <Pressable style={styles.emptyFeedBtn} onPress={() => navigation.navigate("Search")}>
                                <Text style={styles.emptyFeedBtnText}>Find people</Text>
                            </Pressable>
                        </View>
                    ) : null}
                    {posts.map((item: any, index: number) => (
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
            </View>

            <CommentsSheet
                visible={!!selectedCommentPost}
                post={selectedCommentPost}
                onClose={() => setSelectedCommentPost(null)}
            />

            <ShareSheet
                visible={!!selectedSharePost}
                onClose={() => setSelectedSharePost(null)}
                post={selectedSharePost}
                postUrl={selectedSharePost ? `https://healingstream.app/p/${selectedSharePost.id}` : undefined}
            />

        </ScreenWrapper>
    );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
    flex: {
        flex: 1,
    },
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
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: moderateScale(10),
        marginBottom: moderateVerticalScale(10),
    },
    quickLinkTile: {
        width: moderateScale(38),
        height: moderateScale(38),
        borderRadius: radius.sm,
        alignItems: "center",
        justifyContent: "center",
        marginRight: moderateScale(11),
    },
    quickLinkIcon: {
        width: moderateScale(18),
        height: moderateScale(18),
        resizeMode: "contain",
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
        fontSize: TextStyles.stepCounts,
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
    emptyFeed: {
        alignItems: "center",
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth,
        borderRadius: radius.md,
        padding: moderateScale(24),
        marginTop: moderateVerticalScale(8),
    },
    emptyFeedTitle: {
        fontSize: TextStyles.body,
        fontWeight: "700",
        color: colors.text,
    },
    emptyFeedBody: {
        fontSize: TextStyles.caption,
        color: colors.mutedText,
        textAlign: "center",
        marginTop: moderateVerticalScale(6),
        lineHeight: moderateVerticalScale(18),
    },
    emptyFeedBtn: {
        marginTop: moderateVerticalScale(14),
        backgroundColor: colors.primary,
        borderRadius: radius.xl,
        paddingHorizontal: moderateScale(18),
        paddingVertical: moderateVerticalScale(8),
    },
    emptyFeedBtnText: {
        color: colors.white,
        fontWeight: "600",
        fontSize: TextStyles.stepCounts,
    },
});
