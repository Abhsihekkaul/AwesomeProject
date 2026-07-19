import React, { useState } from "react";
import { StyleSheet, Text, View, Pressable, FlatList, TouchableOpacity, ScrollView, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

// Banner tints reference theme tokens so cards adapt to dark mode
type BannerTint = "lightBlue" | "lightPurple" | "lightGreen" | "lightOrange";

const groups: {
  title: string;
  members: string;
  tag: string;
  tint: BannerTint;
  joined: boolean;
}[] = [
  {
    title: "Fibromyalgia Warriors",
    members: "1,284 members",
    tag: "Chronic Pain",
    tint: "lightBlue",
    joined: true,
  },
  {
    title: "Type 2 Diabetes",
    members: "3,421 members",
    tag: "Metabolic",
    tint: "lightPurple",
    joined: true,
  },
  {
    title: "Long COVID Recovery",
    members: "892 members",
    tag: "Post-Viral",
    tint: "lightGreen",
    joined: true,
  },
  {
    title: "Multiple Sclerosis",
    members: "678 members",
    tag: "Neurology",
    tint: "lightOrange",
    joined: false,
  },
];

const bannerTints: BannerTint[] = ["lightBlue", "lightPurple", "lightGreen", "lightOrange"];

export default function GroupsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Live group directory when signed in; the built-in demo groups when signed out.
  const { data: allGroups, isLive } = useLiveOrDemo(
    async () =>
      (await resourcesApi.getGroups()).map((g: any, i: number) => ({
        id: g.id,
        title: g.name,
        members: `${g.memberCount} member${g.memberCount === 1 ? "" : "s"}`,
        tag: g.tag || "Community",
        tint: bannerTints[i % bannerTints.length],
        joined: g.joined,
        moderator: g.moderator,
        description: g.description,
        coverUrl: g.coverUrl ?? null,
      })),
    groups.map((g) => ({
      ...g,
      id: undefined as string | undefined,
      moderator: undefined as string | undefined,
      description: undefined as string | undefined,
      coverUrl: undefined as string | null | undefined,
    })),
  );

  // Local overrides let both demo and live toggles feel instant.
  const [joinedMap, setJoinedMap] = useState<Record<string, boolean>>({});
  const isJoined = (g: any) => joinedMap[g.title] ?? g.joined;

  const toggleJoin = (g: any) => {
    setJoinedMap((prev) => ({ ...prev, [g.title]: !isJoined(g) }));
    if (isLive && g.id) resourcesApi.toggleJoinGroup(g.id).catch(() => {});
  };

  // Everything above the list goes into the Header Component
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Support Groups</Text>
        <Pressable onPress={() => navigation.navigate("RequestGroup")} style={styles.requestBtn}>
          <Text style={styles.requestText}>+ Request</Text>
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
    <ScreenWrapper edges={["top", "left", "right"]}>
      <FlatList
        data={allGroups}
        keyExtractor={(item: any) => item.title}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        renderItem={({ item: g }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() =>
              navigation.navigate("GroupDetails", {
                id: g.id,
                name: g.title,
                members: g.members,
                tag: g.tag,
                moderator: g.moderator,
                description: g.description,
                joined: isJoined(g),
                coverUrl: g.coverUrl ?? null,
              })
            }
            style={styles.card}
          >
            {/* Banner: the group's cover (server sends one for every live group —
                a member's photo or its healing preset); tinted icon in demo mode */}
            {g.coverUrl ? (
              <Image source={{ uri: g.coverUrl }} style={styles.bannerImage} />
            ) : (
              <View style={[styles.banner, { backgroundColor: colors[g.tint as BannerTint] }]}>
                <Image
                  source={imagePath.GroupIcon}
                  style={styles.bannerIcon}
                />
              </View>
            )}

            {/* Content Section */}
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{g.title}</Text>

              <Text style={styles.metaText}>{g.members}</Text>

              <View style={styles.cardFooter}>
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>{g.tag}</Text>
                </View>

                {isJoined(g) ? (
                  <SecondaryButton
                    title="Joined ✓"
                    onPress={() => toggleJoin(g)}
                    size="compact"
                  />
                ) : (
                  <PrimaryButton
                    title="Join"
                    onPress={() => toggleJoin(g)}
                    size="compact"
                  />
                )}
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  listContent: {
    paddingBottom: moderateVerticalScale(96),
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
    backgroundColor: colors.lightPurple,
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(8),
  },
  requestText: {
    color: colors.primary,
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
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: moderateVerticalScale(16),
    overflow: "hidden", // Ensures the banner image rounds to the card edges
  },
  banner: {
    width: "100%",
    height: moderateScale(100),
    alignItems: "center",
    justifyContent: "center",
  },
  bannerImage: {
    width: "100%",
    height: moderateScale(100),
    resizeMode: "cover",
  },
  bannerIcon: {
    width: moderateScale(36),
    height: moderateScale(36),
    resizeMode: "contain",
    tintColor: colors.primary,
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
    color: colors.mutedText,
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
    backgroundColor: colors.lightBlue,
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(6),
    borderRadius: radius.sm,
  },
  tagText: {
    color: colors.mutedText,
    fontWeight: "600",
    fontSize: scale(11),
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
