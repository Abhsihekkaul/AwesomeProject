import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import UserAvatar from "../../components/ui/UserAvatar";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

const doctors = [
  {
    initials: "SC",
    name: "Dr. Sarah Chen",
    role: "Clinical Psychologist",
    rating: "4.9 (127)",
    tags: ["Chronic Illness Adaptation", "Health Anxiety"],
    next: "Today, 3:00 PM",
    bg: "#F1EBFF",
    color: "#7453C8",
  },
  {
    initials: "MW",
    name: "Dr. Marcus Williams",
    role: "Psychiatrist",
    rating: "4.8 (98)",
    tags: ["Mood Disorders", "Trauma & PTSD"],
    next: "Tomorrow, 10:00 AM",
    bg: "#EAF1FF",
    color: "#4E79C7",
  },
  {
    initials: "PP",
    name: "Dr. Priya Patel",
    role: "Licensed Counselor",
    rating: "4.95 (203)",
    tags: ["Grief & Loss", "Chronic Pain"],
    next: "Wed, Jun 12",
    bg: "#E8F6EE",
    color: "#4FA57B",
  },
  {
    initials: "AK",
    name: "Dr. Anna Kowalski",
    role: "Health Psychologist",
    rating: "4.7 (64)",
    tags: ["Insomnia", "Stress Management"],
    next: "Thu, 4:00 PM",
    bg: "#FFF4E8",
    color: "#E67E22",
  },
];

export default function PsychologicalHelpScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Psycological Help</Text>
        <Pressable onPress={() => navigation.navigate("RequestGroup")} style={styles.requestBtn}>
          <Text style={styles.requestText}>＋ Become a Doctor ?</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>Verified professionals who understand chronic illness</Text>

      <SearchBar placeholder="Search by name or specialty..." />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 14 }}>
        <View style={styles.filters}>
          <CategoryChip label="All" active />
          <CategoryChip label="Available Now" />
          <CategoryChip label="Psychologist" />
          <CategoryChip label="Psychiatrist" />
        </View>
      </ScrollView>

      {doctors.map((d) => (
        <Pressable
          key={d.name}
          onPress={() => navigation.navigate("ConsultantProfile", { name: d.name })}
          style={styles.card}
        >
          <UserAvatar initials={d.initials} size={72} bg={d.bg} color={d.color} />
          <View style={{ flex: 1, marginLeft: 14 }}>
            <View style={styles.rowBetween}>
              <View>
                <Text style={styles.name}>{d.name} ✓</Text>
                <Text style={styles.role}>{d.role}</Text>
              </View>
              <Text style={styles.rating}>⭐ {d.rating}</Text>
            </View>

            <View style={styles.tagsRow}>
              {d.tags.map((t) => (
                <View key={t} style={styles.tag}><Text style={styles.tagText}>{t}</Text></View>
              ))}
            </View>

            <View style={styles.bottomRow}>
              <Text style={styles.next}>🕒 {d.next}</Text>
              <Text style={styles.session}>Video</Text>
              <Text style={styles.session}>Audio</Text>
              <Text style={styles.arrow}>›</Text>
            </View>
          </View>
        </Pressable>
      ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  title: { fontSize: scale(24), fontWeight: "800", color: colors.text },
  requestBtn: {
    backgroundColor: "#EAF1FF",
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sub: { fontSize: scale(18), color: "#6F87A6", marginTop: 8, marginBottom: 16, lineHeight: 26 },
  filters: { flexDirection: "row" },
  card: {
    flexDirection: "column",
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#E3EAF4",
    padding: 16,
    marginTop: 14,
    alignItems: "center",
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  name: { fontSize: 22, fontWeight: "800", color: colors.text },
  role: { fontSize: scale(17), color: "#6F87A6", marginTop: 4 },
  rating: { color: "#E67E22", fontSize: scale(16), fontWeight: "800" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", marginTop: 10 },
  tag: { backgroundColor: "#EEE7FF", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginRight: 8, marginBottom: 8 },
  tagText: { color: "#7453C8", fontWeight: "700", fontSize: 13 },
  bottomRow: { flexDirection: "row", alignItems: "center", marginTop: 6 },
  next: { color: "#4FA57B", fontSize: scale(15), fontWeight: "700" },
  session: { backgroundColor: "#EAF1FF", color: "#4E79C7", fontWeight: "700", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, marginLeft: 8, overflow: "hidden" },
  arrow: { marginLeft: "auto", color: "#8A9CB5", fontSize: 26 },
});