import React, { useState } from "react";
import { FlatList, StyleSheet, Text, View, Pressable, ScrollView } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import NotificationCard, { NotificationType } from "../../components/ui/NotificationCard";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

export default function NotificationsScreen() {
  const navigation = useNavigation<any>();
  const [activeTab, setActiveTab] = useState("All");

  const notifications: NotificationType[] = [
    {
      type: "Groups",
      title: "Jamie replied to your post",
      message: "Yes! The 4-7-8 technique completely changed my sleep quality.",
      time: "18m ago",
      color: "#7453C8",
    },
    {
      type: "Chats",
      title: "New match found!",
      message: "Alex K. wants to connect with you. 87% compatibility match.",
      time: "42m ago",
      color: "#4E79C7",
    },
    {
      type: "Groups",
      title: "Your post received 47 upvotes",
      message: "The community appreciated your contribution.",
      time: "1h ago",
      color: "#4FA57B",
    },
    {
      type: "System",
      title: "Dr. Sarah Chen has availability",
      message: "A new appointment slot is available tomorrow.",
      time: "3h ago",
      color: "#E67E22",
    },
    {
      type: "System",
      title: "Welcome to Healing Stream",
      message: "Your profile setup is complete. Explore the community.",
      time: "1d ago",
      color: "#7453C8",
    },
  ];

  const filteredNotifications =
    activeTab === "All"
      ? notifications
      : notifications.filter((item) => item.type === activeTab);

  const renderHeader = () => (
    <View style={styles.headerContainer}>

      {/* Header Bar */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Notifications</Text>
      </View>

      {/* Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabsContainer}
      >
        {["All", "Groups", "Chats", "System"].map((tab) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <ScreenWrapper>
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item, index) => index.toString()}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <NotificationCard notification={item} />}
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

  // Header Row
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(10),
    marginBottom: moderateVerticalScale(16),
  },
  backBtn: {
    paddingRight: moderateScale(12),
  },
  backIcon: {
    fontSize: scale(32),
    color: "#7453C8",
    lineHeight: scale(34),
  },
  headerTitle: {
    fontSize: TextStyles.heading,
    fontWeight: "700",
    color: colors.text,
  },

  // Tabs
  tabsContainer: {
    paddingHorizontal: moderateScale(16),
    marginBottom: moderateVerticalScale(10),
    gap: moderateScale(8),
  },
  tab: {
    paddingHorizontal: moderateScale(18),
    paddingVertical: moderateVerticalScale(8),
    backgroundColor: colors.white,
    borderRadius: radius.xl,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
  },
  activeTab: {
    backgroundColor: "#7453C8",
    borderColor: "#7453C8",
  },
  tabText: {
    color: "#6F87A6",
    fontWeight: "600",
    fontSize: scale(13),
  },
  activeTabText: {
    color: colors.white,
  },
});