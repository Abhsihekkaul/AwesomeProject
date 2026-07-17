import React, { useCallback, useState } from "react";
import {
  Alert,
  LayoutAnimation,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import PostCard, { Post } from "../../components/ui/PostCard";
import TagChip from "../../components/ui/TagChip";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { timeAgo } from "../../utils/timeAgo";

type ProfileUser = {
  id: string;
  name: string;
  avatarColor: string;
  conditions: string[];
  memberSince: string;
  sathiCount: number;
  relation: "self" | "sathi" | "pending" | "none";
};

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/** "Member since March 2026" — the profile's tenure line. */
const memberSinceLabel = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "Member";
  return `Member since ${d.toLocaleDateString(undefined, { month: "long", year: "numeric" })}`;
};

/**
 * Someone else's profile — strictly read-only: their name, how long they've been
 * part of the community, their posts and the posts they've supported. The only
 * actions are social: Message them or send a Sathi request.
 */
export default function UserProfileScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const userId: string = route.params?.userId;
  const fallbackName: string = route.params?.name ?? "Member";

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [likedPosts, setLikedPosts] = useState<Post[]>([]);
  const [tab, setTab] = useState<"Posts" | "Liked">("Posts");
  const [loading, setLoading] = useState(true);
  const [openingChat, setOpeningChat] = useState(false);

  const load = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await resourcesApi.getUserProfile(userId);
      const withTime = (list: any[]) => list.map((p) => ({ ...p, time: timeAgo(p.time) }));
      setProfile(data.user);
      setPosts(withTime(data.posts));
      setLikedPosts(withTime(data.likedPosts));
    } catch {
      // Offline / demo id — the header below falls back to route params.
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const name = profile?.name ?? fallbackName;

  const openChat = async () => {
    setOpeningChat(true);
    try {
      const chatId = await resourcesApi.openChatWith(userId);
      navigation.navigate("ChatRoom", { name, initials: initialsOf(name), chatId, userId });
    } catch (err) {
      Alert.alert("Couldn't open the chat", apiErrorMessage(err));
    } finally {
      setOpeningChat(false);
    }
  };

  const sendRequest = async () => {
    if (!profile || profile.relation !== "none") return;
    setProfile({ ...profile, relation: "pending" }); // optimistic
    try {
      await resourcesApi.sendSathiRequest(userId);
    } catch (err) {
      setProfile((p) => (p ? { ...p, relation: "none" } : p));
      Alert.alert("Couldn't send the request", apiErrorMessage(err));
    }
  };

  const relationLabel =
    profile?.relation === "sathi"
      ? "Sathis ✓"
      : profile?.relation === "pending"
        ? "Requested ✓"
        : "+ Add Sathi";

  const switchTab = (next: typeof tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(next);
  };

  const visiblePosts = tab === "Posts" ? posts : likedPosts;

  return (
    <ScreenWrapper>
      <View style={styles.topRow}>
        <BackButton />
        <Text style={styles.topTitle} numberOfLines={1}>
          {name}
        </Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Identity */}
        <View style={styles.identity}>
          <UserAvatar initials={initialsOf(name)} size={64} />
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.tenure}>
            {profile ? memberSinceLabel(profile.memberSince) : " "}
            {profile ? ` · ${profile.sathiCount} sathi${profile.sathiCount === 1 ? "" : "s"}` : ""}
          </Text>

          {profile && profile.conditions.length > 0 ? (
            <View style={styles.conditionsWrap}>
              {profile.conditions.map((c) => (
                <TagChip key={c} label={c} />
              ))}
            </View>
          ) : null}

          {/* Social actions — the profile itself is view-only */}
          {profile && profile.relation !== "self" ? (
            <View style={styles.actionsRow}>
              <Pressable
                style={[styles.actionBtn, styles.messageBtn, openingChat && styles.btnDisabled]}
                onPress={openChat}
                disabled={openingChat}
              >
                <Text style={styles.messageText}>Message</Text>
              </Pressable>
              <Pressable
                style={[
                  styles.actionBtn,
                  styles.sathiBtn,
                  profile.relation !== "none" && styles.sathiBtnDone,
                ]}
                onPress={sendRequest}
                disabled={profile.relation !== "none"}
              >
                <Text style={[styles.sathiText, profile.relation !== "none" && styles.sathiTextDone]}>
                  {relationLabel}
                </Text>
              </Pressable>
            </View>
          ) : null}
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(["Posts", "Liked"] as const).map((item) => (
            <Pressable key={item} onPress={() => switchTab(item)} style={styles.tabItem}>
              <Text style={[styles.tabText, tab === item && styles.tabActive]}>
                {item === "Posts" ? `Posts (${posts.length})` : `Liked (${likedPosts.length})`}
              </Text>
              {tab === item ? <View style={styles.underline} /> : null}
            </Pressable>
          ))}
        </View>

        {!loading && visiblePosts.length === 0 ? (
          <Text style={styles.empty}>
            {tab === "Posts" ? `${name} hasn't posted yet.` : `${name} hasn't supported any posts yet.`}
          </Text>
        ) : null}

        {visiblePosts.map((item, index) => (
          <PostCard
            key={item.id}
            post={item}
            index={index}
            compact
            onPress={() => navigation.navigate("PostDetails", { post: item })}
          />
        ))}

        <View style={{ height: moderateVerticalScale(30) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    topRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    topTitle: {
      flex: 1,
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    identity: {
      alignItems: "center",
      paddingVertical: moderateVerticalScale(16),
    },
    name: {
      fontSize: TextStyles.title,
      fontWeight: "700",
      color: colors.text,
      marginTop: moderateVerticalScale(10),
    },
    tenure: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(4),
    },
    conditionsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: moderateScale(8),
      marginTop: moderateVerticalScale(12),
    },
    actionsRow: {
      flexDirection: "row",
      gap: moderateScale(10),
      marginTop: moderateVerticalScale(16),
    },
    actionBtn: {
      borderRadius: radius.xl,
      paddingHorizontal: moderateScale(24),
      paddingVertical: moderateVerticalScale(9),
    },
    messageBtn: {
      backgroundColor: colors.primary,
    },
    messageText: {
      color: colors.white,
      fontWeight: "700",
      fontSize: TextStyles.caption,
    },
    sathiBtn: {
      backgroundColor: colors.lightPurple,
    },
    sathiBtnDone: {
      opacity: 0.7,
    },
    sathiText: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: TextStyles.caption,
    },
    sathiTextDone: {
      color: colors.mutedText,
    },
    btnDisabled: {
      opacity: 0.6,
    },
    tabRow: {
      flexDirection: "row",
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tabItem: {
      marginRight: moderateScale(24),
      paddingBottom: moderateVerticalScale(10),
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
    empty: {
      color: colors.mutedText,
      fontSize: scale(13),
      textAlign: "center",
      marginTop: moderateVerticalScale(24),
    },
  });
