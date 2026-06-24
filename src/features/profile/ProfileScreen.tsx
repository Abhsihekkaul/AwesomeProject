import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import { FlatList, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard from "../../components/ui/PostCard";
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  // Toggles State
  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);

  // Sheets State for PostCards
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

  // Example: Filtering dummy posts to only show the user's own posts
  // You would replace this with an actual API call to fetch user posts
  const userPosts = dummyPosts.slice(0, 2);

  const circles = [
    { name: "Fibromyalgia Warriors", color: "#7453C8", bg: "#F1EBFF" },
    { name: "Type 2 Diabetes", color: "#4E79C7", bg: "#EAF1FF" },
    { name: "Long COVID Recovery", color: "#4FA57B", bg: "#E8F6EE" },
  ];

  // Everything above the posts is extracted into this ListHeaderComponent
  const ProfileHeader = () => (
    <View style={styles.headerContainer}>

      {/* Top Bar with Settings on Right */}
      <View style={styles.topBar}>
        <Pressable onPress={() => navigation.navigate("Settings")} style={styles.settingsBtn}>
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Hero Section (Centered) */}
      <View style={styles.hero}>
        <UserAvatar initials="A" size={100} bg="#F1EBFF" color="#7453C8" />
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

      {/* MY CIRCLES CARD */}
      {/* <View style={styles.card}>
        <Text style={styles.sectionLabel}>MY CIRCLES</Text>
        {circles.map((circle, index) => (
          <View key={circle.name} style={[styles.circleRow, index !== circles.length - 1 && styles.borderBottom]}>
            <View style={[styles.circleIcon, { backgroundColor: circle.bg }]}>
              <Text style={{ fontSize: scale(18) }}>👥</Text>
            </View>
            <Text style={styles.circleName}>{circle.name}</Text>
            <Pressable onPress={() => navigation.navigate("GroupDetails")}>
              <Text style={[styles.viewText, { color: circle.color }]}>View</Text>
            </Pressable>
          </View>
        ))}
        <Pressable style={styles.browseButton} onPress={() => navigation.navigate("Groups")}>
          <Text style={styles.browseText}>+ Browse more groups</Text>
        </Pressable>
      </View> */}

      {/* PRIVACY CARD */}
      {/* <View style={styles.card}>
        <Text style={styles.sectionLabel}>PRIVACY & VISIBILITY</Text>

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Public profile</Text>
            <Text style={styles.settingSub}>Others can view your profile</Text>
          </View>
          <Switch value={publicProfile} onValueChange={setPublicProfile} trackColor={{ true: "#7453C8" }} />
        </View> */}

        {/* <View style={styles.divider} />

        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingTitle}>Show my conditions</Text>
            <Text style={styles.settingSub}>Visible on your profile</Text>
          </View>
          <Switch value={showConditions} onValueChange={setShowConditions} trackColor={{ true: "#7453C8" }} />
        </View>
      </View> */}

      {/* SECTION DIVIDER FOR POSTS */}
      {/* <hr /> */}
      <Text style={styles.postsSectionTitle}>Posts</Text>
    </View>
  );

  return (
    <ScreenWrapper>

      {/* FlatList replaces ScrollView */}
      <FlatList
        data={userPosts}
        keyExtractor={(item) => item.id.toString()}
        ListHeaderComponent={ProfileHeader}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View>
            <PostCard
              post={item}
              onCommentPress={() => setSelectedCommentPost(item)}
              onSharePress={() => setSelectedSharePost(item)}
            />
          </View>
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

const styles = StyleSheet.create({
  listContent: {
    // paddingBottom: moderateVerticalScale(40),
  },
  headerContainer: {
    // paddingBottom: moderateVerticalScale(16),
  },

  // Header & Top Bar
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    // paddingHorizontal: moderateScale(16),
    // marginTop: moderateVerticalScale(10),
  },
  settingsBtn: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: colors.white,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: scale(18),
  },

  // Hero Section
  hero: {
    alignItems: "center",
  },
  name: {
    marginTop: moderateVerticalScale(16),
    fontSize: TextStyles.heading,
    fontWeight: "500",
    color: colors.text,
  },
  memberSince: {
    marginTop: moderateVerticalScale(4),
    color: "#6F87A6",
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
    backgroundColor: "#7984fb",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.md,
  },
  chipText: {
    color: colors.white,
    fontWeight: "500",
    fontSize: TextStyles.caption,
  },

  // Cards (Standardized to match other screens)
  // card: {
  //   backgroundColor: colors.white,
  //   marginHorizontal: moderateScale(16),
  //   marginTop: moderateVerticalScale(20),
  //   borderRadius: radius.md,
  //   padding: moderateScale(16),
  //   borderWidth: 0.2,
  //   borderColor: "#b8bbc0",
  // },
  // sectionLabel: {
  //   fontSize: scale(12),
  //   fontWeight: "800",
  //   color: "#6F87A6",
  //   marginBottom: moderateVerticalScale(12),
  //   letterSpacing: 0.5,
  // },

  // Circle Rows
  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(12),
  },
  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#F0F4FA",
  },
  circleIcon: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    justifyContent: "center",
    alignItems: "center",
    marginRight: moderateScale(12),
  },
  circleName: {
    flex: 1,
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  viewText: {
    fontSize: scale(12),
    fontWeight: "700",
  },
  browseButton: {
    marginTop: moderateVerticalScale(12),
    alignItems: "center",
    paddingVertical: moderateVerticalScale(8),
    backgroundColor: "#F9FAFC",
    borderRadius: radius.sm,
  },
  browseText: {
    color: "#7453C8",
    fontSize: scale(13),
    fontWeight: "600",
  },

  // Privacy Settings
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: moderateVerticalScale(6),
  },
  settingTitle: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  settingSub: {
    color: "#6F87A6",
    fontSize: scale(11),
    marginTop: moderateVerticalScale(2),
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F4FA",
    marginVertical: moderateVerticalScale(12),
  },

  // Posts Area
  postsSectionTitle: {
    borderTopWidth: 0.2,
    fontSize: TextStyles.title,
    fontWeight: "500",
    marginTop: moderateVerticalScale(12),
    marginBottom: moderateVerticalScale(8),
  },
});