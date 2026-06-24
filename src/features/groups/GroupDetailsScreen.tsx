import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import PostCard from "../../components/ui/PostCard";
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";
import UserAvatar from "../../components/ui/UserAvatar";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";

// Dummy data for the other tabs
const dummyMembers = [
  { id: "1", name: "Maya Harrison", role: "Member", initials: "MH" },
  { id: "2", name: "Jamie L.", role: "Member", initials: "JL" },
  { id: "3", name: "Dr. Priya Patel", role: "Moderator", initials: "PP" },
];

const dummyResources = [
  { id: "1", title: "Beginner's Guide to Pacing", type: "PDF Document" },
  { id: "2", title: "4-7-8 Breathing Technique Video", type: "Video Link" },
];

export default function GroupDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const groupName = route.params?.name ?? "Fibromyalgia Warriors";

  const [tab, setTab] = useState<"Posts" | "Members" | "Resources">("Posts");

  // Sheet States
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

  // Group Details Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{groupName}</Text>
        <View style={styles.joinedPill}>
          <Text style={styles.joinedText}>Joined ✓</Text>
        </View>
      </View>

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>👥 1,284 members</Text>
        <View style={styles.dot} />
        <Text style={styles.metaText}>✓ MODERATED</Text>
      </View>

      {/* Description */}
      <Text style={styles.desc}>
        A supportive community for people living with fibromyalgia. Share experiences, coping strategies, and find understanding.
      </Text>

      <View style={styles.moderatorBox}>
        <Text style={styles.moderatorText}>🛡 Moderated by Dr. Priya Patel</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["Posts", "Members", "Resources"] as const).map((item) => (
          <Pressable key={item} onPress={() => setTab(item)} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
            {tab === item ? <View style={styles.underline} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Determine what data to feed the FlatList based on the selected tab
  const getListData = () => {
    if (tab === "Posts") return dummyPosts;
    if (tab === "Members") return dummyMembers;
    return dummyResources;
  };

  return (
    <ScreenWrapper>
      <FlatList
        // 1. Tell TypeScript this data can be anything
        data={getListData() as any[]}
        // 2. Explicitly type the item as any
        keyExtractor={(item: any) => item.id.toString()}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        // 3. Explicitly type the item parameter as any here too
        renderItem={({ item }: { item: any }) => {

          // Render POSTS Tab
          if (tab === "Posts") {
            return (
              <View style={styles.postWrapper}>
                <PostCard
                  post={item}
                  onCommentPress={() => setSelectedCommentPost(item)}
                  onSharePress={() => setSelectedSharePost(item)}
                />
              </View>
            );
          }

          // Render MEMBERS Tab
          if (tab === "Members") {
            return (
              <View style={styles.memberCard}>
                <UserAvatar initials={item.initials} size={40} bg="#E9E3FB" color="#7453C8" />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>{item.name}</Text>
                  <Text style={styles.memberRole}>{item.role}</Text>
                </View>
              </View>
            );
          }

          // Render RESOURCES Tab
          if (tab === "Resources") {
            return (
              <View style={styles.resourceCard}>
                <Text style={styles.resourceIcon}>📄</Text>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceType}>{item.type}</Text>
                </View>
              </View>
            );
          }

          return null;
        }}
      />

      {/* Floating Action Button - Positioned absolute to the screen, NOT the scroll view */}
      {tab === "Posts" && (
        <Pressable style={styles.postFab} onPress={() => navigation.navigate("CreatePost")}>
          <Text style={styles.postFabText}>＋ Post</Text>
        </Pressable>
      )}

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

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: moderateVerticalScale(80), // Extra padding so FAB doesn't cover last post
  },
  headerContainer: {
    paddingBottom: moderateVerticalScale(10),
  },

  // Top Bar
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(10),
  },
  backBtn: {
    paddingRight: moderateScale(10),
  },
  backIcon: {
    fontSize: scale(32),
    color: "#7453C8",
    lineHeight: scale(34),
  },
  title: {
    flex: 1,
    fontSize: TextStyles.heading,
    fontWeight: "700",
    color: colors.text,
    marginRight: moderateScale(10),
  },
  joinedPill: {
    backgroundColor: "#F1EBFF",
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
  },
  joinedText: {
    color: "#7453C8",
    fontWeight: "700",
    fontSize: scale(12),
  },

  // Meta & Description
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(8),
  },
  metaText: {
    color: "#7453C8",
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  dot: {
    width: moderateScale(4),
    height: moderateScale(4),
    borderRadius: moderateScale(2),
    backgroundColor: "#7453C8",
    marginHorizontal: moderateScale(8),
  },
  desc: {
    color: colors.text,
    fontSize: TextStyles.body,
    lineHeight: scale(22),
    paddingHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(12),
  },
  moderatorBox: {
    backgroundColor: "#F9FAFC",
    marginHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(12),
    padding: moderateScale(10),
    borderRadius: radius.sm,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
  },
  moderatorText: {
    color: "#6F87A6",
    fontSize: scale(12),
    fontWeight: "500",
  },

  // Tabs
  tabRow: {
    flexDirection: "row",
    marginTop: moderateVerticalScale(20),
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
    paddingHorizontal: moderateScale(16),
  },
  tabItem: {
    marginRight: moderateScale(24),
    paddingBottom: moderateVerticalScale(10),
    position: "relative",
  },
  tabText: {
    color: "#6F87A6",
    fontSize: TextStyles.body,
    fontWeight: "600",
  },
  tabActive: {
    color: "#7453C8",
  },
  underline: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: moderateVerticalScale(3),
    backgroundColor: "#7453C8",
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
  },

  // List Item Wrappers
  postWrapper: {
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateVerticalScale(12),
  },
  memberCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateVerticalScale(12),
    borderBottomWidth: 0.2,
    borderBottomColor: "#E2E8F0",
  },
  memberInfo: {
    marginLeft: moderateScale(12),
  },
  memberName: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  memberRole: {
    fontSize: TextStyles.caption,
    color: "#6F87A6",
    marginTop: moderateVerticalScale(2),
  },
  resourceCard: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(12),
    padding: moderateScale(14),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
  },
  resourceIcon: {
    fontSize: scale(24),
  },
  resourceInfo: {
    marginLeft: moderateScale(12),
  },
  resourceTitle: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  resourceType: {
    fontSize: scale(11),
    color: "#6F87A6",
    marginTop: moderateVerticalScale(4),
  },

  // Floating Action Button
  postFab: {
    position: "absolute",
    right: moderateScale(20),
    bottom: moderateVerticalScale(30), // Adjusted for typical bottom tab bars
    backgroundColor: "#7453C8",
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateVerticalScale(14),
    shadowColor: "#7453C8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  postFabText: {
    color: colors.white,
    fontSize: TextStyles.body,
    fontWeight: "700",
  },
});