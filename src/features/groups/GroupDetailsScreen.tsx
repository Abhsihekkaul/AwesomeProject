import React, { useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import PostCard from "../../components/ui/PostCard";
import CommentsSheet from "../../components/ui/CommentsSheet";
import ShareSheet from "../../components/ui/ShareSheet";
import UserAvatar from "../../components/ui/UserAvatar";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { dummyPosts } from "../../utils/dummyPost";
import BackButton from "../../components/ui/BackButton";
import { useAuth } from "../../context/AuthContext";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { timeAgo } from "../../utils/timeAgo";
import { apiErrorMessage } from "../../api/http";
import { pickImageAsDataUri } from "../../utils/pickImage";
import { GROUP_COVER_PRESETS } from "./groupCovers";
import imagePath from "../../constant/imagePath";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Expanded Dummy Members
const dummyMembers = [
  { id: "1", name: "Maya Harrison", role: "Member", initials: "MH" },
  { id: "2", name: "Jamie L.", role: "Member", initials: "JL" },
  { id: "3", name: "Dr. Priya Patel", role: "Moderator", initials: "PP" },
  { id: "4", name: "Alex Johnson", role: "Member", initials: "AJ" },
  { id: "5", name: "Sarah Connor", role: "Member", initials: "SC" },
  { id: "6", name: "David Kim", role: "Contributor", initials: "DK" },
  { id: "7", name: "Emma Wilson", role: "Member", initials: "EW" },
];

// Replaced Resources with Health Tips using your existing title/type keys
const dummyHealthTips = [
  { id: "1", title: "4-7-8 Breathing Technique", type: "Helps calm the central nervous system during flare-ups." },
  { id: "2", title: "Pacing Your Energy", type: "Break large tasks into smaller chunks to avoid the 'boom and bust' cycle." },
  { id: "3", title: "Gentle Morning Movement", type: "5-10 minutes of bed-stretching can significantly reduce morning stiffness." },
  { id: "4", title: "Optimizing Sleep Hygiene", type: "Keep your room cool, dark, and strictly avoid screens an hour before bed." },
];

// Wrapped About content in an array so the FlatList renders it correctly once
const dummyAbout = [
  {
    id: "1",
    text: "A supportive community for people living with fibromyalgia. Share experiences, coping strategies, and find understanding.\n\nGroup Guidelines:\n1. Be kind and respectful to all members.\n2. Share personal experiences, not medical advice.\n3. Maintain strict confidentiality.\n4. No spamming or self-promotion."
  }
];

export default function GroupDetailsScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user } = useAuth();

  // Live groups arrive with their id + directory info from GroupsScreen;
  // demo groups (signed out) have no id and render the built-in dummy content.
  const groupId: string | undefined = route.params?.id;
  const groupName = route.params?.name ?? "Fibromyalgia Warriors";
  const memberSummary: string = route.params?.members ?? "1,284 members";
  const moderator: string = route.params?.moderator || "Dr. Priya Patel";
  const description: string | undefined = route.params?.description;
  const joined: boolean = route.params?.joined ?? true;

  const [tab, setTab] = useState<"Posts" | "Members" | "HealthTips" | "About">("Posts");

  // Group cover: arrives with the directory data; members can change it
  // (healing presets first, own photo second — same contract as the web).
  const [coverUrl, setCoverUrl] = useState<string | null>(route.params?.coverUrl ?? null);
  const [coverPickerOpen, setCoverPickerOpen] = useState(false);
  const [savingCover, setSavingCover] = useState(false);

  const saveCover = async (value: string | null) => {
    if (!groupId) return;
    setSavingCover(true);
    try {
      const res = await resourcesApi.setGroupCover(groupId, value);
      setCoverUrl(res.coverUrl);
      setCoverPickerOpen(false);
    } catch (err) {
      Alert.alert("Couldn't change the cover", apiErrorMessage(err));
    } finally {
      setSavingCover(false);
    }
  };

  // This group's posts. Refetches on focus, so a post created via the FAB is
  // visible the moment you're back — this was the reported "posted to a group but
  // it never shows up there" bug: the screen only ever rendered dummy data.
  const { data: groupPosts, isLive: postsLive, loading: postsLoading } = useLiveOrDemo(
    async () =>
      groupId
        ? (await resourcesApi.getFeed(groupId)).map((p: any) => ({ ...p, time: timeAgo(p.time) }))
        : [],
    dummyPosts,
    undefined,
    20_000,
  );

  const { data: members, isLive: membersLive } = useLiveOrDemo(
    async () =>
      groupId
        ? (await resourcesApi.getGroupMembers(groupId)).map((m: any) => ({
            ...m,
            initials: initialsOf(m.name),
          }))
        : [],
    dummyMembers,
  );

  // Sathi (friend) requests to fellow members — optimistic; live sends persist.
  const [requested, setRequested] = useState<Record<string, boolean>>({});
  const toggleRequest = (member: any) => {
    setRequested((prev) => ({ ...prev, [member.id]: !prev[member.id] }));
    if (membersLive && !requested[member.id]) {
      resourcesApi.sendSathiRequest(member.id).catch(() => {
        setRequested((prev) => ({ ...prev, [member.id]: false }));
      });
    }
  };

  const switchTab = (next: typeof tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(next);
  };

  // Sheet States
  const [selectedCommentPost, setSelectedCommentPost] = useState<any>(null);
  const [selectedSharePost, setSelectedSharePost] = useState<any>(null);

  // Group Details Header Component
  const renderHeader = () => (
    <View>
      {/* Top Bar */}
      <View style={styles.topRow}>
        <BackButton />
        <Text style={styles.title} numberOfLines={1}>{groupName}</Text>
        {joined ? (
          <View style={styles.joinedPill}>
            <Text style={styles.joinedText}>Joined</Text>
          </View>
        ) : null}
      </View>

      {/* Cover — every live group has one; members can change it */}
      {coverUrl ? (
        <View style={styles.coverWrap}>
          <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          {joined && groupId ? (
            <Pressable style={styles.coverEditBtn} onPress={() => setCoverPickerOpen(true)} hitSlop={6}>
              <Image source={imagePath.CameraIcon} style={styles.coverEditIcon} />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      {/* Meta Info */}
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>{memberSummary}</Text>
        <View style={styles.dot} />
        <Text style={styles.metaText}> MODERATED</Text>
      </View>

      <View style={styles.moderatorBox}>
        <Text style={styles.moderatorText}>Moderated by {moderator}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(["Posts", "Members", "HealthTips", "About"] as const).map((item) => (
          <Pressable key={item} onPress={() => switchTab(item)} style={styles.tabItem}>
            <Text style={[styles.tabText, tab === item && styles.tabActive]}>{item}</Text>
            {tab === item ? <View style={styles.underline} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  // Determine what data to feed the FlatList based on the selected tab
  const getListData = () => {
    if (tab === "Posts") return groupPosts;
    if (tab === "Members") return members;
    if (tab === "HealthTips") return dummyHealthTips;
    if (tab === "About") return description ? [{ id: "1", text: description }] : dummyAbout;
    return [];
  };

  return (
    <ScreenWrapper>

      {/* Header rendered directly inside ScreenWrapper */}
      {renderHeader()}

      <FlatList
        data={getListData() as any[]}
        keyExtractor={(item: any) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          tab === "Posts" && postsLive && !postsLoading ? (
            <View style={styles.emptyPosts}>
              <Text style={styles.emptyPostsTitle}>No posts here yet</Text>
              <Text style={styles.emptyPostsBody}>
                Be the first to share something with {groupName}.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item, index }: { item: any; index: number }) => {

          // Render POSTS Tab
          if (tab === "Posts") {
            return (
              <View>
                <PostCard
                  post={item}
                  index={index}
                  onPress={() => navigation.navigate("PostDetails", { post: item })}
                  onCommentPress={() => setSelectedCommentPost(item)}
                  onSharePress={() => setSelectedSharePost(item)}
                />
              </View>
            );
          }

          // Render MEMBERS Tab
          if (tab === "Members") {
            const isMe = membersLive && item.id === user?.id;
            return (
              <View style={styles.memberCard}>
                <Pressable
                  style={styles.memberTap}
                  disabled={!membersLive || isMe}
                  onPress={() =>
                    navigation.navigate("UserProfile", { userId: item.id, name: item.name })
                  }
                >
                  <UserAvatar initials={item.initials} size={40} />
                  <View style={styles.memberInfo}>
                    <Text style={styles.memberName}>{item.name}</Text>
                    <Text style={styles.memberRole}>{isMe ? "You" : item.role}</Text>
                  </View>
                </Pressable>
                {!isMe ? (
                  <Pressable
                    onPress={() => toggleRequest(item)}
                    style={[styles.addSathiBtn, requested[item.id] && styles.addSathiBtnDone]}
                    hitSlop={6}
                  >
                    <Text style={[styles.addSathiText, requested[item.id] && styles.addSathiTextDone]}>
                      {requested[item.id] ? "Requested ✓" : "+ Add Sathi"}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            );
          }

          // Render HEALTH TIPS Tab (Using your exact styles, just swapped the icon to a lightbulb)
          if (tab === "HealthTips") {
            return (
              <View style={styles.resourceCard}>
                <Text style={styles.resourceIcon}>💡</Text>
                <View style={styles.resourceInfo}>
                  <Text style={styles.resourceTitle}>{item.title}</Text>
                  <Text style={styles.resourceType}>{item.type}</Text>
                </View>
              </View>
            );
          }

          // Render ABOUT Tab (Using your exact styles, pulling in the expanded text)
          if (tab === "About") {
            return (
              <View style={styles.resourceCard}>
                <Text style={styles.desc}>
                  {item.text}
                </Text>
              </View>
            );
          }

          return null;
        }}
      />

      {/* Floating Action Button — composing from here preselects this group */}
      {tab === "Posts" && (
        <Pressable
          style={styles.postFab}
          onPress={() => navigation.navigate("CreatePost", groupId ? { groupId } : undefined)}
        >
          <Text style={styles.postFabText}>+ Post</Text>
        </Pressable>
      )}

      {/* Bottom Sheets for Post Interactions */}
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

      {/* Cover picker: healing presets first, own photo second */}
      {coverPickerOpen ? (
        <Modal transparent animationType="slide" onRequestClose={() => setCoverPickerOpen(false)}>
          <Pressable style={styles.coverBackdrop} onPress={() => setCoverPickerOpen(false)}>
            <Pressable style={styles.coverSheet} onPress={() => {}}>
              <Text style={styles.coverSheetTitle}>Group cover</Text>
              <Text style={styles.coverSheetHint}>
                Pick a healing scene, or add your own — calm imagery keeps the space gentle.
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetRow}>
                {GROUP_COVER_PRESETS.map((p) => (
                  <Pressable key={p.key} onPress={() => saveCover(p.key)} disabled={savingCover} style={styles.presetCell}>
                    <Image source={{ uri: p.uri }} style={styles.presetThumb} />
                    <Text style={styles.presetName}>{p.name}</Text>
                  </Pressable>
                ))}
              </ScrollView>
              <View style={styles.coverActionsRow}>
                <Pressable
                  style={styles.coverActionBtn}
                  disabled={savingCover}
                  onPress={async () => {
                    const uri = await pickImageAsDataUri();
                    if (uri) saveCover(uri);
                  }}
                >
                  <Text style={styles.coverActionText}>Upload a photo</Text>
                </Pressable>
                <Pressable style={styles.coverActionBtn} disabled={savingCover} onPress={() => saveCover(null)}>
                  <Text style={styles.coverActionText}>Use the preset</Text>
                </Pressable>
              </View>
              {savingCover ? <Text style={styles.coverSaving}>Saving…</Text> : null}
            </Pressable>
          </Pressable>
        </Modal>
      ) : null}
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    listContent: {
      paddingTop: moderateVerticalScale(10),
    },
    // Top Bar
    topRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    backBtn: {
      paddingRight: moderateScale(10),
    },
    backIcon: {
      fontSize: scale(32),
      color: colors.primary,
      lineHeight: scale(34),
    },
    title: {
      flex: 1,
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
      marginRight: moderateScale(10),
    },
    coverWrap: {
      borderRadius: radius.md,
      overflow: "hidden",
      marginBottom: moderateVerticalScale(10),
    },
    coverImage: {
      width: "100%",
      height: moderateScale(110),
      resizeMode: "cover",
    },
    coverEditBtn: {
      position: "absolute",
      right: moderateScale(10),
      bottom: moderateScale(10),
      width: moderateScale(30),
      height: moderateScale(30),
      borderRadius: moderateScale(15),
      backgroundColor: "rgba(0,0,0,0.45)",
      alignItems: "center",
      justifyContent: "center",
    },
    coverEditIcon: {
      width: moderateScale(15),
      height: moderateScale(15),
      resizeMode: "contain",
      tintColor: "#FFFFFF",
    },
    coverBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "flex-end",
    },
    coverSheet: {
      backgroundColor: colors.card,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: moderateScale(18),
      paddingBottom: moderateScale(28),
    },
    coverSheetTitle: {
      fontSize: TextStyles.subtitle,
      fontWeight: "700",
      color: colors.text,
    },
    coverSheetHint: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(3),
      marginBottom: moderateVerticalScale(12),
    },
    presetRow: {
      gap: moderateScale(10),
    },
    presetCell: {
      width: moderateScale(120),
    },
    presetThumb: {
      width: moderateScale(120),
      height: moderateScale(46),
      borderRadius: radius.sm,
      resizeMode: "cover",
    },
    presetName: {
      fontSize: scale(10),
      fontWeight: "600",
      color: colors.mutedText,
      textAlign: "center",
      marginTop: moderateVerticalScale(3),
    },
    coverActionsRow: {
      flexDirection: "row",
      gap: moderateScale(10),
      marginTop: moderateVerticalScale(14),
    },
    coverActionBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: moderateVerticalScale(9),
      alignItems: "center",
    },
    coverActionText: {
      fontSize: TextStyles.caption,
      fontWeight: "700",
      color: colors.text,
    },
    coverSaving: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(8),
    },
    joinedPill: {
      backgroundColor: colors.lightPurple,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
    },
    joinedText: {
      color: colors.primary,
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
      marginLeft: moderateScale(10),
      fontWeight: "500",
      fontSize: TextStyles.caption,
      color: colors.mutedText,
    },
    dot: {
      width: moderateScale(4),
      height: moderateScale(4),
      borderRadius: moderateScale(2),
      backgroundColor: colors.primary,
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
      marginHorizontal: moderateScale(16),
      padding: moderateScale(10),
    },
    moderatorText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      fontWeight: "500",
    },
    // Tabs
    tabRow: {
      display: "flex",
      flexDirection: "row",
      marginTop: moderateVerticalScale(2),
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingHorizontal: moderateScale(16),
    },
    tabItem: {
      marginRight: moderateScale(24),
      paddingBottom: moderateVerticalScale(10),
      position: "relative",
    },
    tabText: {
      color: colors.mutedText,
      fontSize: TextStyles.body,
      fontWeight: "500",
    },
    tabActive: {
      color: colors.primary,
    },
    underline: {
      position: "absolute",
      bottom: -1,
      left: 0,
      right: 0,
      height: moderateVerticalScale(3),
      backgroundColor: colors.primary,
      borderRadius: radius.md,
    },

    // List Item Wrappers
    memberCard: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: moderateVerticalScale(10),
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },

    memberTap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },

    memberInfo: {
      flex: 1,
      marginLeft: moderateScale(8),
    },

    addSathiBtn: {
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(6),
    },
    addSathiBtnDone: {
      backgroundColor: colors.lightPurple,
    },
    addSathiText: {
      fontSize: TextStyles.caption,
      color: colors.white,
      fontWeight: "600",
    },
    addSathiTextDone: {
      color: colors.primary,
    },

    memberName: {
      fontSize: TextStyles.body,
      fontWeight: "500",
      color: colors.text,
    },

    memberRole: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },

    resourceCard: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(12),
      padding: moderateScale(14),
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
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
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(4),
    },

    emptyPosts: {
      alignItems: "center",
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: radius.md,
      padding: moderateScale(24),
      marginTop: moderateVerticalScale(8),
    },
    emptyPostsTitle: {
      fontSize: TextStyles.body,
      fontWeight: "700",
      color: colors.text,
    },
    emptyPostsBody: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      textAlign: "center",
      marginTop: moderateVerticalScale(6),
    },

    // Floating Action Button
    postFab: {
      position: "absolute",
      right: moderateScale(20),
      bottom: moderateVerticalScale(30),
      backgroundColor: colors.primary,
      borderRadius: radius.md,
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateVerticalScale(10),
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.5,
      shadowRadius: 8,
      elevation: 5,
    },
    postFabText: {
      color: colors.white,
      fontSize: TextStyles.caption,
      fontWeight: "500",
    },
  });