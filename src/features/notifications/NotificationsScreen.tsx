import React, { useState } from "react";
import { FlatList, LayoutAnimation, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import NotificationCard, { NotificationType } from "../../components/ui/NotificationCard";
import BackButton from "../../components/ui/BackButton";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

type SathiRequest = {
  id: string;
  name: string;
  initials: string;
  mutual: string;
  time: string;
  accepted?: boolean;
};

const initialRequests: SathiRequest[] = [
  { id: "r1", name: "Priya Sharma", initials: "PS", mutual: "3 mutual groups · Fibromyalgia Warriors", time: "5m ago" },
  { id: "r2", name: "Alex King", initials: "AK", mutual: "87% compatibility · Chronic Pain", time: "42m ago" },
  { id: "r3", name: "Meera Iyer", initials: "MI", mutual: "1 mutual group · Sleep Strategies", time: "2h ago" },
];

const TABS = ["All", "Requests", "Groups", "Chats", "System"] as const;
type Tab = (typeof TABS)[number];

export default function NotificationsScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("All");
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [notifications, setNotifications] = useState<NotificationType[]>([
    {
      type: "Groups",
      title: "Jamie replied to your post",
      message: "Yes! The 4-7-8 technique completely changed my sleep quality.",
      time: "18m ago",
      color: colors.primary,
      unread: true,
    },
    {
      type: "Chats",
      title: "New match found!",
      message: "Alex K. wants to connect with you. 87% compatibility match.",
      time: "42m ago",
      color: colors.info,
      unread: true,
    },
    {
      type: "Groups",
      title: "People found your post helpful",
      message: "The community appreciated your contribution.",
      time: "1h ago",
      color: colors.success,
    },
    {
      type: "System",
      title: "Dr. Sarah Chen has availability",
      message: "A new appointment slot is available tomorrow.",
      time: "3h ago",
      color: colors.warning,
    },
    {
      type: "System",
      title: "Welcome to Healing Stream",
      message: "Your profile setup is complete. Explore the community.",
      time: "1d ago",
      color: colors.primary,
    },
  ]);

  const [requests, setRequests] = useState<SathiRequest[]>(initialRequests);

  const unreadCount = notifications.filter((n) => n.unread).length;
  const pendingCount = requests.filter((r) => !r.accepted).length;

  const markAllRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const acceptRequest = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRequests((prev) => prev.map((r) => (r.id === id ? { ...r, accepted: true } : r)));
  };

  const declineRequest = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((item) => item.type === activeTab);

  const switchTab = (tab: Tab) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTab(tab);
  };

  const renderHeader = () => (
    <View style={styles.headerContainer}>
      {/* Header Bar */}
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Notifications</Text>
        {unreadCount > 0 ? (
          <Pressable onPress={markAllRead} hitSlop={8}>
            <Text style={styles.markAllRead}>Mark all read</Text>
          </Pressable>
        ) : null}
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {TABS.map((tab) => {
          const badge =
            tab === "Requests" ? pendingCount : tab === "All" ? unreadCount : 0;
          return (
            <Pressable
              key={tab}
              style={[styles.tab, activeTab === tab && styles.activeTab]}
              onPress={() => switchTab(tab)}
            >
              <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                {tab}
              </Text>
              {badge > 0 ? (
                <View style={[styles.tabBadge, activeTab === tab && styles.tabBadgeActive]}>
                  <Text style={[styles.tabBadgeText, activeTab === tab && styles.tabBadgeTextActive]}>
                    {badge}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const renderRequest = (item: SathiRequest) => (
    <View style={styles.requestCard}>
      <UserAvatar initials={item.initials} size={48} />
      <View style={styles.requestInfo}>
        <Text style={styles.requestName}>{item.name}</Text>
        <Text style={styles.requestMutual}>{item.mutual}</Text>
        <Text style={styles.requestTime}>{item.time}</Text>

        {item.accepted ? (
          <View style={styles.acceptedPill}>
            <Text style={styles.acceptedText}>✓ You're now Sathis</Text>
          </View>
        ) : (
          <View style={styles.requestActions}>
            <Pressable style={styles.acceptBtn} onPress={() => acceptRequest(item.id)}>
              <Text style={styles.acceptBtnText}>Accept</Text>
            </Pressable>
            <Pressable style={styles.declineBtn} onPress={() => declineRequest(item.id)}>
              <Text style={styles.declineBtnText}>Decline</Text>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );

  const isRequestsTab = activeTab === "Requests";

  return (
    <ScreenWrapper>
      <FlatList
        data={(isRequestsTab ? requests : filteredNotifications) as any[]}
        keyExtractor={(_item, index) => `${activeTab}-${index}`}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {isRequestsTab ? "No pending Sathi requests. 💜" : "You're all caught up here."}
          </Text>
        }
        renderItem={({ item }) =>
          isRequestsTab ? renderRequest(item as SathiRequest) : <NotificationCard notification={item as NotificationType} />
        }
      />
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  listContent: {
    paddingBottom: moderateVerticalScale(40),
  },
  headerContainer: {
    paddingBottom: moderateVerticalScale(8),
  },

  // Header Row
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateVerticalScale(10),
    marginBottom: moderateVerticalScale(16),
  },
  headerTitle: {
    flex: 1,
    fontSize: TextStyles.heading,
    fontWeight: "500",
    color: colors.text,
  },
  markAllRead: {
    color: colors.primary,
    fontSize: TextStyles.caption,
    fontWeight: "600",
  },

  // Tabs
  tabsContainer: {
    marginBottom: moderateVerticalScale(10),
    gap: moderateScale(8),
    paddingRight: moderateScale(8),
  },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateVerticalScale(8),
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: moderateScale(6),
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabText: {
    color: colors.mutedText,
    fontWeight: "600",
    fontSize: scale(13),
  },
  activeTabText: {
    color: colors.white,
  },
  tabBadge: {
    minWidth: moderateScale(18),
    height: moderateScale(18),
    borderRadius: moderateScale(9),
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(4),
  },
  tabBadgeActive: {
    backgroundColor: colors.white,
  },
  tabBadgeText: {
    color: colors.white,
    fontSize: scale(10),
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  tabBadgeTextActive: {
    color: colors.primary,
  },

  // Sathi request cards
  requestCard: {
    flexDirection: "row",
    padding: moderateScale(14),
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: moderateVerticalScale(8),
  },
  requestInfo: {
    flex: 1,
    marginLeft: moderateScale(4),
  },
  requestName: {
    fontSize: TextStyles.body,
    fontWeight: "700",
    color: colors.text,
  },
  requestMutual: {
    marginTop: moderateVerticalScale(3),
    color: colors.mutedText,
    fontSize: TextStyles.caption,
  },
  requestTime: {
    marginTop: moderateVerticalScale(3),
    color: colors.mutedText,
    fontSize: scale(11),
    fontWeight: "600",
  },
  requestActions: {
    flexDirection: "row",
    gap: moderateScale(8),
    marginTop: moderateVerticalScale(10),
  },
  acceptBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateVerticalScale(7),
  },
  acceptBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  declineBtn: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(20),
    paddingVertical: moderateVerticalScale(7),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  declineBtnText: {
    color: colors.mutedText,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  acceptedPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.lightGreen,
    borderRadius: radius.xl,
    paddingHorizontal: moderateScale(14),
    paddingVertical: moderateVerticalScale(6),
    marginTop: moderateVerticalScale(10),
  },
  acceptedText: {
    color: colors.success,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },

  emptyText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(40),
  },
});
