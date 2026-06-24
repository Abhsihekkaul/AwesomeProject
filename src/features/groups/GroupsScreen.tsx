import React from "react";
import { StyleSheet, Text, View, Pressable, Image, FlatList, TouchableOpacity, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

// Enhanced dummy data with background colors for banner fallbacks
const groups = [
  {
    title: "Fibromyalgia Warriors",
    members: "1,284 members",
    posts: "47 posts today",
    tag: "Chronic Pain",
    bg: "#EAF1FF",
    accent: "#4E79C7",
    joined: true,
  },
  {
    title: "Type 2 Diabetes",
    members: "3,421 members",
    posts: "112 posts today",
    tag: "Metabolic",
    bg: "#F1EBFF",
    accent: "#7453C8",
    joined: true,
  },
  {
    title: "Long COVID Recovery",
    members: "892 members",
    posts: "34 posts today",
    tag: "Post-Viral",
    bg: "#E8F6EE",
    accent: "#4FA57B",
    joined: true,
  },
  {
    title: "Multiple Sclerosis",
    members: "678 members",
    posts: "19 posts today",
    tag: "Neurology",
    bg: "#FDF2E9",
    accent: "#E67E22",
    joined: false,
  },
];

export default function GroupsScreen() {
  const navigation = useNavigation<any>();

  // Everything above the list goes into the Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Support Groups</Text>
        <Pressable onPress={() => navigation.navigate("RequestGroup")} style={styles.requestBtn}>
          <Text style={styles.requestText}>＋ Request</Text>
        </Pressable>
      </View>

      <SearchBar placeholder="Search conditions, groups..." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <View style={styles.chipRow}>
          <CategoryChip label="All" active />
          <CategoryChip label="My Groups" />
          <CategoryChip label="Mental Health" />
          <CategoryChip label="Autoimmune" />
        </View>
      </ScrollView>
    </View>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={groups}
        keyExtractor={(item) => item.title}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: g }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate("GroupDetails", { name: g.title })}
            style={styles.card}
          >
            {/* Banner Section */}
            <View style={[styles.banner, { backgroundColor: g.bg }]}>
              {/* If you have actual images, you would conditionally render them here.
                  For now, we use a clean colored banner with a community icon.
               */}
              <Text style={styles.bannerIcon}>👥</Text>
            </View>

            {/* Content Section */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{g.title}</Text>

              <Text style={styles.metaText}>
                {g.members}  •  {g.posts}
              </Text>

              <View style={styles.cardFooter}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{g.tag}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => console.log(`Toggled join for ${g.title}`)}
                  style={[
                    styles.joinBtn,
                    g.joined ? styles.joinedBtnActive : { backgroundColor: g.accent, borderColor: g.accent },
                  ]}
                >
                  <Text
                    style={[
                      styles.joinBtnText,
                      g.joined ? { color: "#6F87A6" } : { color: colors.white },
                    ]}
                  >
                    {g.joined ? "Joined ✓" : "Join"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: moderateVerticalScale(40),
  },
  headerContainer: {
    paddingBottom: moderateVerticalScale(8),
  },

  // Header Elements
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: moderateVerticalScale(16),
  },
  title: {
    fontSize: TextStyles.title,
    fontWeight: "700",
    color: colors.text,
  },
  requestBtn: {
    backgroundColor: "#F1EBFF",
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(8),
  },
  requestText: {
    color: "#7453C8",
    fontWeight: "700",
    fontSize: scale(12),
  },
  chipScroll: {
    marginTop: moderateVerticalScale(16),
    marginBottom: moderateVerticalScale(8),
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(8),
    paddingRight: moderateScale(16),
  },

  // Card Styling
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    marginBottom: moderateVerticalScale(16),
    overflow: "hidden", // Ensures the banner image rounds to the card edges
  },
  banner: {
    width: "100%",
    height: moderateScale(100),
    alignItems: "center",
    justifyContent: "center",
  },
  bannerIcon: {
    fontSize: scale(36),
    opacity: 0.8,
  },
  cardContent: {
    padding: moderateScale(14),
  },
  cardTitle: {
    fontSize: TextStyles.heading,
    fontWeight: "700",
    color: colors.text,
    marginBottom: moderateVerticalScale(4),
  },
  metaText: {
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    fontWeight: "500",
  },

  // Footer: Tag & Join Button
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateVerticalScale(16),
  },
  tagPill: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.sm,
  },
  tagText: {
    color: "#475569",
    fontWeight: "600",
    fontSize: scale(11),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  joinBtn: {
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateVerticalScale(8),
    borderRadius: radius.xl,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  joinedBtnActive: {
    backgroundColor: "transparent",
    borderColor: "#b8bbc0",
  },
  joinBtnText: {
    fontSize: scale(12),
    fontWeight: "700",
  },
});