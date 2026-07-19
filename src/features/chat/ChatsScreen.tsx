import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import UserAvatar from "../../components/ui/UserAvatar";
import SearchBar from "../../components/ui/SearchBar";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { timeAgo } from "../../utils/timeAgo";

const chats = [
  { name: "Alex K.", last: "I've found that pacing myself helps the most...", time: "10:22 AM", unread: 2, initials: "AK" },
  { name: "Maya Harrison", last: "Finally found a sleep routine that works", time: "23m ago", unread: 0, initials: "MH" },
  { name: "Jamie L.", last: "Yes! The 4–7–8 technique changed my sleep quality...", time: "18m ago", unread: 0, initials: "JL" },

  // Indian users
  { name: "Priya Sharma", last: "Meditation before bed has really helped me relax.", time: "12m ago", unread: 1, initials: "PS" },
  { name: "Arjun Mehta", last: "I've been tracking my mood daily and it's useful.", time: "25m ago", unread: 0, initials: "AM" },
  { name: "Neha Verma", last: "The breathing exercises worked surprisingly well!", time: "32m ago", unread: 3, initials: "NV" },
  { name: "Rohan Kapoor", last: "Anyone else journaling before sleep?", time: "45m ago", unread: 0, initials: "RK" },
  { name: "Ananya Gupta", last: "My anxiety levels have dropped this month.", time: "1h ago", unread: 1, initials: "AG" },
  { name: "Karan Singh", last: "Walking after dinner improved my sleep quality.", time: "1h ago", unread: 0, initials: "KS" },
  { name: "Isha Malhotra", last: "Thank you all for the support ❤️", time: "2h ago", unread: 0, initials: "IM" },
  { name: "Rahul Nair", last: "Trying a digital detox this weekend.", time: "3h ago", unread: 2, initials: "RN" },
  { name: "Sneha Reddy", last: "I finally completed a full week of mindfulness.", time: "4h ago", unread: 0, initials: "SR" },
  { name: "Vikram Joshi", last: "Consistency is harder than I expected.", time: "5h ago", unread: 0, initials: "VJ" },
  { name: "Meera Iyer", last: "Sharing a gratitude list really helps.", time: "6h ago", unread: 4, initials: "MI" },
  { name: "Aditya Khanna", last: "The sleep sounds feature is amazing.", time: "8h ago", unread: 0, initials: "AK" },
  { name: "Pooja Bansal", last: "Anyone have tips for staying focused at work?", time: "9h ago", unread: 1, initials: "PB" },
  { name: "Aman Chawla", last: "Small daily improvements add up over time.", time: "Yesterday", unread: 0, initials: "AC" },
];

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export default function ChatsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [query, setQuery] = useState("");

  // Live conversations when signed in; the built-in demo list when signed out.
  // 15s silent poll keeps last-message previews fresh while the tab is open.
  const { data: allChats } = useLiveOrDemo(
    async () =>
      (await resourcesApi.getChats()).map((c: any) => ({
        id: c.id,
        name: c.name,
        userId: c.userId,
        last: c.last,
        time: timeAgo(c.time),
        unread: c.unread ?? 0,
        initials: initialsOf(c.name),
      })),
    chats.map((c) => ({ ...c, id: undefined as string | undefined })),
    undefined,
    15_000,
  );

  const q = query.trim().toLowerCase();
  const visibleChats = q
    ? allChats.filter(
        (c: any) => c.name.toLowerCase().includes(q) || c.last.toLowerCase().includes(q),
      )
    : allChats;

  return (
    <ScreenWrapper edges={["top", "left", "right"]}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Chats</Text>
      <Text style={styles.sub}>Private conversations with community members</Text>

      <View style={styles.searchWrap}>
        <SearchBar placeholder="Search chats..." value={query} onChangeText={setQuery} />
      </View>

      {visibleChats.length === 0 ? (
        <Text style={styles.emptyText}>
          {q ? `No chats match "${query.trim()}".` : "No conversations yet — find a Sathi and say hello."}
        </Text>
      ) : null}
      {visibleChats.map((c: any) => (
        <Pressable
          key={c.id ?? c.name}
          onPress={() => navigation.navigate("ChatRoom", { name: c.name, initials: c.initials, chatId: c.id, userId: c.userId })}
          style={styles.card}
        >
          <UserAvatar initials={c.initials} size={52} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <View style={styles.row}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.time}>{c.time}</Text>
            </View>
            {/* Unread chats keep their last message private until opened */}
            <Text style={[styles.last, c.unread > 0 && styles.lastUnread]} numberOfLines={1}>
              {c.unread > 0
                ? `${c.unread > 99 ? "99+" : c.unread} new ${c.unread === 1 ? "message" : "messages"}`
                : c.last}
            </Text>
          </View>
          {c.unread > 0 ? (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{c.unread > 99 ? "99+" : c.unread}</Text>
            </View>
          ) : null}
        </Pressable>
      ))}
      </ScrollView>
      </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({

  listContent: {
    paddingBottom: moderateVerticalScale(96),
  },

  title: {
    fontSize: TextStyles.title,
    fontWeight: "600",
    color: colors.text,
  },

  sub: {
    fontSize: TextStyles.caption,
    color: colors.mutedText,
  },

  searchWrap: {
    marginTop: moderateVerticalScale(12),
    marginBottom: moderateVerticalScale(6),
  },

  emptyText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(30),
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: moderateScale(10),
    marginVertical: moderateVerticalScale(4)
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    gap : moderateScale(4)
  },

  name: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },

  time: {
    color: colors.mutedText,
    fontSize: TextStyles.caption,
  },

  last: {
    marginTop: moderateVerticalScale(2),
    fontSize: TextStyles.caption,
    color: colors.mutedText,
  },

  lastUnread: {
    color: colors.primary,
    fontWeight: "600",
  },

  unreadBadge: {
    minWidth: moderateScale(20),
    height: moderateScale(20),
    borderRadius: moderateScale(10),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(5),
  },

  unreadBadgeText: {
    color: colors.white,
    fontSize: moderateScale(10),
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },

});