import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import imagePath from "../../constant/imagePath";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";

// Import your newly created sheets here
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";

export default function HomeScreen() {
    const navigation = useNavigation<any>();

    const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
    const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

    // Updated navigation routes and params
    const quickActions = [
        { title: "Groups", Count: "23", route: "Directory", type: "Groups" },
        { title: "Posts", Count: "2", route: "Profile" }, // Routes straight to Profile
        { title: "Friends", Count: "28", route: "Directory", type: "Friends" },
    ];

    return (
        <ScreenWrapper>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.topRow}>
                    <UserAvatar MarginRightSide={8} initials="A" size={40} bg="#E9E3FB" color="#7453C8" />
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.greeting}>Good afternoon,</Text>
                        <Text style={styles.name}>Abhishek</Text>
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
                                if (item.type) {
                                    navigation.navigate(item.route, { type: item.type });
                                } else {
                                    navigation.navigate(item.route);
                                }
                            }}
                            style={styles.quickCard}
                        >
                            <Text style={styles.Numbers}>{item.Count}</Text>
                            <Text style={[styles.quickTitle]}>{item.title}</Text>
                        </Pressable>
                    ))}
                </View>

                <Pressable style={styles.QuickTips}>
                    <Image style={styles.HeartBtn} source={imagePath.HeartIcon} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.TipsTitle}>Need Quick Health Tips</Text>
                        <Text style={styles.TipsSub}>100+ resources available</Text>
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
                    {dummyPosts.map((item) => (
                        <PostCard
                            key={item.id}
                            post={item}
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

const styles = StyleSheet.create({
    topRow: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: moderateVerticalScale(12)
    },
    greeting: {
        fontSize: TextStyles.stepCounts,
    },
    name: {
        color: colors.text,
        fontSize: TextStyles.heading,
        fontWeight: "600"
    },
    notificationIcon: {
        height: moderateVerticalScale(25),
        width: moderateScale(25),
    },
    QuickTips: {
        flexDirection: "row",
        alignItems: "center",
        borderColor: "black",
        borderWidth: 0.2,
        borderRadius: radius.md,
        padding: moderateScale(11),
        marginBottom: moderateVerticalScale(12),
    },
    HeartBtn: {
        height: moderateVerticalScale(20),
        width: moderateScale(22),
        marginRight: moderateScale(12)
    },
    TipsTitle: {
        fontSize: TextStyles.stepCounts,
        fontWeight: "600"
    },
    TipsSub: {
        fontSize: TextStyles.caption,
        marginTop: moderateVerticalScale(2),
    },
    RightIcon: {
        height: moderateVerticalScale(14),
        width: moderateScale(14),
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
    Numbers: {
        fontSize: TextStyles.body,
        fontWeight: "600"
    },
    quickTitle: {
        marginTop: moderateVerticalScale(4),
        fontSize: TextStyles.stepCounts,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginVertical: moderateVerticalScale(2),
    },
    sectionTitle: {
        fontSize: TextStyles.title,
    },
    Post: {
        height: moderateVerticalScale(20),
        width: moderateScale(20),
    },
});