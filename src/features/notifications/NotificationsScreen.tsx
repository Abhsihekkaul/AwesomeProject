import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
export default function NotificationsScreen() {
  const navigation = useNavigation<any>();

  const [activeTab, setActiveTab] = useState("All");

  const notifications = [
    {
      type: "Groups",
      title: "Jamie replied to your post",
      message:
        "Yes! The 4-7-8 technique completely changed my sleep quality.",
      time: "18m ago",
      color: "#7453C8",
    },

    {
      type: "Chats",
      title: "New match found!",
      message:
        "Alex K. wants to connect with you. 87% compatibility match.",
      time: "42m ago",
      color: "#4E79C7",
    },

    {
      type: "Groups",
      title: "Your post received 47 upvotes",
      message:
        "The community appreciated your contribution.",
      time: "1h ago",
      color: "#4FA57B",
    },

    {
      type: "System",
      title: "Dr. Sarah Chen has availability",
      message:
        "A new appointment slot is available tomorrow.",
      time: "3h ago",
      color: "#E67E22",
    },

    {
      type: "System",
      title: "Welcome to HealCircle",
      message:
        "Your profile setup is complete. Explore the community.",
      time: "1d ago",
      color: "#7453C8",
    },
  ];

  const filtered =
    activeTab === "All"
      ? notifications
      : notifications.filter(
          item => item.type === activeTab
        );

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.back}>
              ←
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            Notifications
          </Text>
        </View>

        {/* FILTERS */}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {[
            "All",
            "Groups",
            "Chats",
            "System",
          ].map(tab => (
            <Pressable
              key={tab}
              style={[
                styles.tab,
                activeTab === tab &&
                  styles.activeTab,
              ]}
              onPress={() =>
                setActiveTab(tab)
              }
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab &&
                    styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* LIST */}

        <View style={styles.card}>
          {filtered.map(
            (notification, index) => (
              <View
                key={index}
                style={[
                  styles.notificationRow,
                  index !==
                    filtered.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor:
                      "#EDF1F7",
                  },
                ]}
              >
                <View
                  style={[
                    styles.icon,
                    {
                      backgroundColor:
                        notification.color,
                    },
                  ]}
                />

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text
                    style={
                      styles.notificationTitle
                    }
                  >
                    {notification.title}
                  </Text>

                  <Text
                    style={
                      styles.notificationMessage
                    }
                  >
                    {notification.message}
                  </Text>

                  <Text
                    style={
                      styles.notificationTime
                    }
                  >
                    {notification.time}
                  </Text>
                </View>
              </View>
            )
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
  },

  back: {
    fontSize: 32,
    color: "#1F314A",
    marginRight: 16,
  },

  headerTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#1F314A",
  },

  tabsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },

  tab: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#E7EDF5",
  },

  activeTab: {
    backgroundColor: "#4E79C7",
    borderColor: "#4E79C7",
  },

  tabText: {
    color: "#6F87A6",
    fontWeight: "700",
  },

  activeTabText: {
    color: "#FFFFFF",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E7EDF5",
    overflow: "hidden",
  },

  notificationRow: {
    flexDirection: "row",
    padding: 18,
  },

  icon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
  },

  notificationTitle: {
    fontSize: scale(17),
    fontWeight: "700",
    color: "#1F314A",
  },

  notificationMessage: {
    color: "#6F87A6",
    marginTop: 5,
    lineHeight: 22,
  },

  notificationTime: {
    marginTop: 8,
    color: "#6F87A6",
    fontSize: 13,
  },
});