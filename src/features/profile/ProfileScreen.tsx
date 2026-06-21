import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

export default function ProfileScreen() {
  const navigation = useNavigation<any>();

  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);

  const circles = [
    {
      name: "Fibromyalgia Warriors",
      color: "#7453C8",
      bg: "#F1EBFF",
    },
    {
      name: "Type 2 Diabetes",
      color: "#4E79C7",
      bg: "#EAF1FF",
    },
    {
      name: "Long COVID Recovery",
      color: "#4FA57B",
      bg: "#E8F6EE",
    },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {/* HEADER */}

        <View style={styles.hero}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>S</Text>
            </View>

            <Pressable
              style={styles.settingsButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </Pressable>
          </View>

          <Text style={styles.name}>Sarah</Text>

          <Text style={styles.memberSince}>
            Member since June 2025
          </Text>

          <View style={styles.chipsRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>Fibromyalgia</Text>
            </View>

            <View style={styles.chip}>
              <Text style={styles.chipText}>Type 2 Diabetes</Text>
            </View>

            <View style={styles.chip}>
              <Text style={styles.chipText}>Long COVID</Text>
            </View>
          </View>
        </View>

        {/* MY CIRCLES */}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>MY CIRCLES</Text>

          {circles.map((circle, index) => (
            <View
              key={circle.name}
              style={[
                styles.circleRow,
                index !== circles.length - 1 && styles.borderBottom,
              ]}
            >
              <View
                style={[
                  styles.circleIcon,
                  { backgroundColor: circle.bg },
                ]}
              >
                <Text style={{ fontSize: scale(20) }}>👥</Text>
              </View>

              <Text style={styles.circleName}>
                {circle.name}
              </Text>

              <Pressable
                onPress={() =>
                  navigation.navigate("GroupDetails")
                }
              >
                <Text
                  style={[
                    styles.viewText,
                    { color: circle.color },
                  ]}
                >
                  View
                </Text>
              </Pressable>
            </View>
          ))}

          <Pressable
            style={styles.browseButton}
            onPress={() => navigation.navigate("Groups")}
          >
            <Text style={styles.browseText}>
              + Browse more groups
            </Text>
          </Pressable>
        </View>

        {/* PRIVACY */}

        <View style={styles.card}>
          <Text style={styles.sectionLabel}>
            PRIVACY & VISIBILITY
          </Text>

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>
                Public profile
              </Text>
              <Text style={styles.settingSub}>
                Others can view your profile
              </Text>
            </View>

            <Switch
              value={publicProfile}
              onValueChange={setPublicProfile}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingTitle}>
                Show my conditions
              </Text>

              <Text style={styles.settingSub}>
                Visible on your profile
              </Text>
            </View>

            <Switch
              value={showConditions}
              onValueChange={setShowConditions}
            />
          </View>
        </View>

        {/* NOTIFICATIONS PREVIEW */}

        <View style={styles.card}>
          <View style={styles.notificationsHeader}>
            <Text style={styles.sectionLabel}>
              NOTIFICATIONS
            </Text>

            <Pressable
              onPress={() =>
                navigation.navigate("Notifications")
              }
            >
              <Text style={styles.seeAll}>
                View All
              </Text>
            </Pressable>
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              Jamie replied to your post
            </Text>

            <Text style={styles.notificationTime}>
              18m ago
            </Text>
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              New match found!
            </Text>

            <Text style={styles.notificationTime}>
              42m ago
            </Text>
          </View>

          <View style={styles.notificationItem}>
            <Text style={styles.notificationTitle}>
              Your post received 47 upvotes
            </Text>

            <Text style={styles.notificationTime}>
              1h ago
            </Text>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: 40,
  },

  hero: {
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    paddingVertical: 36,
    paddingHorizontal: 20,
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#D8CCF8",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F6F1FF",
  },

  avatarText: {
    fontSize: 48,
    fontWeight: "800",
    color: "#7453C8",
  },

  settingsButton: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#4E79C7",
    justifyContent: "center",
    alignItems: "center",
  },

  settingsIcon: {
    fontSize: 18,
  },

  name: {
    marginTop: 20,
    fontSize: 42,
    fontWeight: "800",
    color: "#1F314A",
  },

  memberSince: {
    marginTop: 8,
    color: "#6F87A6",
    fontSize: 18,
  },

  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 22,
    justifyContent: "center",
  },

  chip: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    margin: 4,
  },

  chipText: {
    color: "#4E79C7",
    fontWeight: "700",
  },

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginTop: 18,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E7EDF5",
  },

  sectionLabel: {
    fontSize: scale(14),
    fontWeight: "800",
    color: "#6F87A6",
    marginBottom: 18,
  },

  circleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 20,
  },

  borderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1F7",
  },

  circleIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  circleName: {
    flex: 1,
    fontSize: 22,
    fontWeight: "700",
    color: "#1F314A",
  },

  viewText: {
    fontSize: 18,
    fontWeight: "700",
  },

  browseButton: {
    marginTop: 16,
    alignItems: "center",
  },

  browseText: {
    color: "#4E79C7",
    fontSize: 18,
    fontWeight: "700",
  },

  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  settingTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F314A",
  },

  settingSub: {
    color: "#6F87A6",
    marginTop: 4,
  },

  divider: {
    height: 1,
    backgroundColor: "#EDF1F7",
    marginVertical: 20,
  },

  notificationsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
  },

  seeAll: {
    color: "#4E79C7",
    fontWeight: "700",
  },

  notificationItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#EDF1F7",
  },

  notificationTitle: {
    color: "#1F314A",
    fontSize: scale(17),
    fontWeight: "600",
  },

  notificationTime: {
    color: "#6F87A6",
    marginTop: 6,
  },
});