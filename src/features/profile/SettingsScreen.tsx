import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  Switch,
  Pressable,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

export default function SettingsScreen() {
  const navigation = useNavigation<any>();

  const [publicProfile, setPublicProfile] = useState(false);
  const [showConditions, setShowConditions] = useState(true);
  const [anonymousPosts, setAnonymousPosts] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [research, setResearch] = useState(false);

  const [groupActivity, setGroupActivity] = useState(true);
  const [replies, setReplies] = useState(true);
  const [matches, setMatches] = useState(true);
  const [consultants, setConsultants] = useState(false);

  const SettingRow = ({
    title,
    subtitle,
    value,
    onChange,
  }: {
    title: string;
    subtitle: string;
    value: boolean;
    onChange: (v: boolean) => void;
  }) => (
    <>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        <Switch value={value} onValueChange={onChange} />
      </View>

      <View style={styles.divider} />
    </>
  );

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>←</Text>
          </Pressable>

          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        {/* PRIVACY */}

        <View style={styles.card}>
          <Text style={styles.section}>
            PRIVACY & VISIBILITY
          </Text>

          <SettingRow
            title="Public profile"
            subtitle="Others can view your profile"
            value={publicProfile}
            onChange={setPublicProfile}
          />

          <SettingRow
            title="Show my conditions"
            subtitle="Visible on your profile"
            value={showConditions}
            onChange={setShowConditions}
          />

          <SettingRow
            title="Anonymous posts by default"
            subtitle="Hide your name on new posts"
            value={anonymousPosts}
            onChange={setAnonymousPosts}
          />

          <SettingRow
            title="Usage analytics"
            subtitle="Help improve HealCircle"
            value={analytics}
            onChange={setAnalytics}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Research participation
              </Text>

              <Text style={styles.subtitle}>
                Contribute to anonymized research
              </Text>
            </View>

            <Switch
              value={research}
              onValueChange={setResearch}
            />
          </View>
        </View>

        {/* NOTIFICATIONS */}

        <View style={styles.card}>
          <Text style={styles.section}>
            NOTIFICATIONS
          </Text>

          <SettingRow
            title="Group activity"
            subtitle="Updates from your communities"
            value={groupActivity}
            onChange={setGroupActivity}
          />

          <SettingRow
            title="Replies to my posts"
            subtitle="Someone responded to you"
            value={replies}
            onChange={setReplies}
          />

          <SettingRow
            title="New matches"
            subtitle="Compatibility connections"
            value={matches}
            onChange={setMatches}
          />

          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>
                Consultant updates
              </Text>

              <Text style={styles.subtitle}>
                Appointment availability
              </Text>
            </View>

            <Switch
              value={consultants}
              onValueChange={setConsultants}
            />
          </View>
        </View>

        <Pressable
          style={styles.notificationsBtn}
          onPress={() =>
            navigation.navigate("Notifications")
          }
        >
          <Text style={styles.notificationsText}>
            View Notifications
          </Text>
        </Pressable>

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

  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E7EDF5",
  },

  section: {
    color: "#6F87A6",
    fontWeight: "800",
    fontSize: scale(14),
    marginBottom: 20,
  },

  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
  },

  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F314A",
  },

  subtitle: {
    color: "#6F87A6",
    marginTop: 4,
    fontSize: scale(15),
  },

  divider: {
    height: 1,
    backgroundColor: "#EDF1F7",
    marginVertical: 10,
  },

  notificationsBtn: {
    backgroundColor: "#4E79C7",
    marginHorizontal: 16,
    paddingVertical: 18,
    borderRadius: 18,
    alignItems: "center",
  },

  notificationsText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 18,
  },
});