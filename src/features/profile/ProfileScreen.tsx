import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { FlatList, Image, LayoutAnimation, Pressable, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import BackButton from "../../components/ui/BackButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";
import imagePath from "../../constant/imagePath";
import { useSavedPosts } from "../../context/SavedPostsContext";

type ProfileTab = "My Posts" | "Saved";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { savedPosts } = useSavedPosts();

  // Sheets State for PostCards
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>("My Posts");

  // Example: Filtering dummy posts to only show the user's own posts
  // You would replace this with an actual API call to fetch user posts
  const userPosts = dummyPosts.slice(0, 2);
  const listData = activeTab === "My Posts" ? userPosts : savedPosts;

  const switchTab = (tab: ProfileTab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  // Everything above the posts is extracted into this ListHeaderComponent
  const renderHeader = () => (
    <View>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          {/* Only shown when Profile is pushed on the stack (e.g. from Home) — as a tab it's a root */}
          {navigation.canGoBack() ? <BackButton /> : null}
          <Text style={styles.screenTitle}>Profile</Text>
        </View>
        <Pressable onPress={() => navigation.navigate("Settings")} style={styles.settingsBtn} hitSlop={8}>
          <Image source={imagePath.SettingIcon} style={styles.settingsIcon} />
        </Pressable>
      </View>

      {/* Hero Section (Centered) */}
      <View style={styles.hero}>
        <UserAvatar initials="A" size={100} />
        <Text style={styles.name}>Abhishek</Text>
        <Text style={styles.memberSince}>Member since June 2025</Text>

        <View style={styles.chipsRow}>
          {["Fibromyalgia", "Type 2 Diabetes", "Long COVID"].map((chip) => (
            <View key={chip} style={styles.chip}>
              <Text style={styles.chipText}>{chip}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* My Posts / Saved segmented tabs */}
      <View style={styles.tabRow}>
        {(["My Posts", "Saved"] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => switchTab(tab)}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
          >
            <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
              {tab === "Saved" ? `Saved${savedPosts.length ? ` (${savedPosts.length})` : ""}` : tab}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <ScreenWrapper edges={["top", "left", "right"]}>
      <FlatList
        data={listData}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          activeTab === "Saved" ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyEmoji}>🔖</Text>
              <Text style={styles.emptyTitle}>No saved posts yet</Text>
              <Text style={styles.emptyText}>
                Tap the ••• menu on any post and choose "Save Post" — it will show up here.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }) => (
          <PostCard
            post={item}
            index={index}
            compact
            onPress={() => navigation.navigate("PostDetails", { post: item })}
            onCommentPress={() => setSelectedCommentPost(item)}
            onSharePress={() => setSelectedSharePost(item)}
          />
        )}
      />

      {/* Bottom Sheets for Post Interactions */}
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

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    listContent: {
      paddingBottom: moderateVerticalScale(96),
    },

    // Top Bar
    topBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(8),
    },
    screenTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    settingsBtn: {
      width: moderateScale(40),
      height: moderateScale(40),
      borderRadius: moderateScale(20),
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      alignItems: "center",
      justifyContent: "center",
    },
    settingsIcon: {
      width: moderateScale(18),
      height: moderateScale(18),
      resizeMode: "contain",
      tintColor: colors.text,
    },

    // Hero Section
    hero: {
      alignItems: "center",
    },
    name: {
      marginTop: moderateVerticalScale(16),
      fontSize: TextStyles.heading,
      fontWeight: "600",
      color: colors.text,
    },
    memberSince: {
      marginTop: moderateVerticalScale(4),
      color: colors.mutedText,
      fontSize: TextStyles.caption,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      marginTop: moderateVerticalScale(16),
      justifyContent: "center",
      gap: moderateScale(8),
    },
    chip: {
      backgroundColor: colors.primary,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
      borderRadius: radius.md,
    },
    chipText: {
      color: colors.white,
      fontWeight: "500",
      fontSize: TextStyles.caption,
    },

    topBarLeft: {
      flexDirection: "row",
      alignItems: "center",
    },

    // My Posts / Saved tabs
    tabRow: {
      flexDirection: "row",
      gap: moderateScale(8),
      marginTop: moderateVerticalScale(20),
      marginBottom: moderateVerticalScale(10),
    },
    tabChip: {
      flex: 1,
      paddingVertical: moderateVerticalScale(9),
      borderRadius: radius.xl,
      alignItems: "center",
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tabChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tabChipText: {
      color: colors.mutedText,
      fontWeight: "600",
      fontSize: TextStyles.stepCounts,
    },
    tabChipTextActive: {
      color: colors.white,
    },

    // Saved empty state
    emptyWrap: {
      alignItems: "center",
      marginTop: moderateVerticalScale(30),
      paddingHorizontal: moderateScale(30),
    },
    emptyEmoji: {
      fontSize: scale(34),
      marginBottom: moderateVerticalScale(10),
    },
    emptyTitle: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
      marginBottom: moderateVerticalScale(6),
    },
    emptyText: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      textAlign: "center",
      lineHeight: scale(18),
    },
  });
