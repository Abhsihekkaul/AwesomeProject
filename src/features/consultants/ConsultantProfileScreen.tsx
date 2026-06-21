import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

const reviews = [
  {
    initials: "MH",
    name: "M. H.",
    date: "May 2025",
    text: "Dr. Chen helped me understand my health anxiety in ways no one else had. She's warm, patient, and genuinely gets it.",
    stars: "★★★★★",
  },
  {
    initials: "TK",
    name: "T. K.",
    date: "Apr 2025",
    text: "The best therapist I have had for my fibro journey. She doesn't just address the mental side — she helps me cope with the physical reality too.",
    stars: "★★★★★",
  },
  {
    initials: "RS",
    name: "R. S.",
    date: "Mar 2025",
    text: "Very professional and caring. Sessions are structured but never rigid. Highly recommend for anyone navigating chronic illness.",
    stars: "★★★★☆",
  },
];

export default function ConsultantProfileScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Consultant Profile</Text>
      </View>

      <View style={styles.topCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>SC</Text>
        </View>
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={styles.name}>Dr. Sarah Chen ✦</Text>
          <Text style={styles.role}>Clinical Psychologist</Text>
          <Text style={styles.rating}>★★★★★ 4.9 <Text style={{ color: "#8A9CB5" }}>(127 reviews)</Text></Text>
        </View>
        <View style={styles.onlineDot} />
      </View>

      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.paragraph}>
          Dr. Chen specializes in helping people navigate the emotional challenges of chronic illness. With 12 years of experience, she provides evidence-based therapy in a warm, non-judgmental environment.
        </Text>
      </View>

      <Text style={styles.blockTitle}>Specializes In</Text>
      <View style={styles.pillsRow}>
        <View style={styles.pill}><Text style={styles.pillText}>Chronic Illness Adaptation</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>Health Anxiety</Text></View>
        <View style={styles.pill}><Text style={styles.pillText}>CBT</Text></View>
      </View>

      <View style={styles.infoGrid}>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🌐</Text>
          <Text style={styles.infoText}>English,{`\n`}Mandarin</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>🕒</Text>
          <Text style={[styles.infoText, { color: "#4FA57B" }]}>Today, 3:00{`\n`}PM</Text>
        </View>
        <View style={styles.infoBox}>
          <Text style={styles.infoIcon}>💲</Text>
          <Text style={styles.infoText}>$80–{`\n`}120/session</Text>
        </View>
      </View>

      <Text style={styles.blockTitle}>Session Type</Text>
      <View style={styles.sessionRow}>
        <View style={[styles.sessionCard, styles.sessionActive]}>
          <Text style={styles.sessionIcon}>🎥</Text>
          <Text style={[styles.sessionLabel, styles.sessionActiveText]}>Video</Text>
        </View>
        <View style={styles.sessionCard}><Text style={styles.sessionIcon}>🎙</Text><Text style={styles.sessionLabel}>Audio</Text></View>
        <View style={styles.sessionCard}><Text style={styles.sessionIcon}>💬</Text><Text style={styles.sessionLabel}>Chat</Text></View>
      </View>

      <Text style={styles.blockTitle}>Pick a Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
        {["Today\n10", "Tue\n11", "Wed\n12", "Thu\n13", "Fri\n14"].map((d, i) => (
          <View key={d} style={[styles.dateBox, i === 0 && styles.dateActive]}>
            <Text style={[styles.dateText, i === 0 && styles.dateActiveText]}>{d}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.blockTitle}>Available Times</Text>
      <View style={styles.timeGrid}>
        {["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:30 PM"].map((t, i) => (
          <View key={t} style={[styles.timeBox, i === 5 && styles.timeActive, (i === 0 || i === 1 || i === 4) && styles.timeDisabled]}>
            <Text style={[styles.timeText, i === 5 && styles.timeActiveText, (i === 0 || i === 1 || i === 4) && styles.timeDisabledText]}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.blockTitle}>Reviews</Text>
      {reviews.map((r) => (
        <View key={r.name} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{r.initials}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{r.name}</Text>
              <Text style={styles.reviewDate}>{r.date}</Text>
            </View>
            <Text style={styles.reviewStars}>{r.stars}</Text>
          </View>
          <Text style={styles.reviewText}>{r.text}</Text>
        </View>
      ))}

      <Pressable style={styles.bookBtn} onPress={() => navigation.navigate("Booking")}>
        <Text style={styles.bookText}>Book Session</Text>
      </Pressable>
      </ScrollView>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 6 },
  back: { fontSize: 36, color: "#7453C8", marginRight: 10 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: "#7453C8" },
  topCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 20, marginTop: 4, marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 22, backgroundColor: "#E9E3FB", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "#CDBFF2" },
  avatarText: { fontSize: 28, fontWeight: "800", color: "#7453C8" },
  name: { fontSize: 24, fontWeight: "800", color: colors.text },
  role: { fontSize: 18, color: "#6F87A6", marginTop: 4 },
  rating: { marginTop: 6, fontSize: scale(16), fontWeight: "800", color: "#E67E22" },
  onlineDot: { width: 18, height: 18, borderRadius: 9, backgroundColor: "#4FA57B", borderWidth: 3, borderColor: colors.white, position: "absolute", left: 82, bottom: 10 },
  sectionCard: { backgroundColor: colors.white, borderRadius: 24, padding: 18, marginHorizontal: 20, borderWidth: 1, borderColor: "#E3EAF4" },
  sectionTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 10 },
  paragraph: { color: colors.text, fontSize: scale(17), lineHeight: 26 },
  blockTitle: { marginHorizontal: 20, marginTop: 18, marginBottom: 10, fontSize: 22, fontWeight: "800", color: colors.text },
  pillsRow: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20 },
  pill: { backgroundColor: "#EEE7FF", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 10, marginBottom: 10 },
  pillText: { color: "#7453C8", fontWeight: "700" },
  infoGrid: { flexDirection: "row", justifyContent: "space-between", marginHorizontal: 20, marginTop: 8 },
  infoBox: { width: "31%", backgroundColor: colors.white, borderRadius: 18, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "#E3EAF4" },
  infoIcon: { fontSize: 22 },
  infoText: { textAlign: "center", marginTop: 8, color: "#6F87A6", fontWeight: "700" },
  sessionRow: { flexDirection: "row", marginHorizontal: 20 },
  sessionCard: { flex: 1, backgroundColor: colors.white, borderRadius: 18, paddingVertical: 18, alignItems: "center", borderWidth: 1, borderColor: "#E3EAF4", marginRight: 10 },
  sessionActive: { backgroundColor: "#EEE7FF", borderColor: "#8A66D2" },
  sessionIcon: { fontSize: 24 },
  sessionLabel: { marginTop: 8, color: "#6F87A6", fontWeight: "800" },
  sessionActiveText: { color: "#7453C8" },
  dateBox: { width: 76, height: 84, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: "#E3EAF4", alignItems: "center", justifyContent: "center", marginLeft: 20 },
  dateActive: { backgroundColor: "#7453C8", borderColor: "#7453C8" },
  dateText: { color: colors.text, fontWeight: "800", textAlign: "center", fontSize: 18, lineHeight: 24 },
  dateActiveText: { color: colors.white },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20 },
  timeBox: { width: "23%", marginRight: "2%", backgroundColor: colors.white, borderRadius: 999, paddingVertical: 12, alignItems: "center", marginBottom: 12, borderWidth: 1, borderColor: "#DCE5F3" },
  timeText: { color: colors.text, fontWeight: "800", fontSize: scale(14), textAlign: "center" },
  timeActive: { backgroundColor: "#7453C8", borderColor: "#7453C8" },
  timeActiveText: { color: colors.white },
  timeDisabled: { backgroundColor: "#F0F4FA", opacity: 0.8 },
  timeDisabledText: { color: "#A2B0C4" },
  reviewCard: { backgroundColor: colors.white, borderRadius: 22, marginHorizontal: 20, marginTop: 12, padding: 16, borderWidth: 1, borderColor: "#E3EAF4" },
  reviewTop: { flexDirection: "row", alignItems: "center" },
  reviewAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#EEE7FF", alignItems: "center", justifyContent: "center", marginRight: 10 },
  reviewAvatarText: { color: "#7453C8", fontWeight: "800" },
  reviewName: { fontSize: 18, fontWeight: "800", color: colors.text },
  reviewDate: { color: "#6F87A6", marginTop: 2 },
  reviewStars: { color: "#E67E22", fontSize: scale(16), fontWeight: "800" },
  reviewText: { color: colors.text, fontSize: scale(16), lineHeight: 24, marginTop: 12 },
  bookBtn: { marginHorizontal: 20, marginTop: 18, backgroundColor: "#7453C8", borderRadius: 22, paddingVertical: 16, alignItems: "center" },
  bookText: { color: colors.white, fontSize: 18, fontWeight: "800" },
});