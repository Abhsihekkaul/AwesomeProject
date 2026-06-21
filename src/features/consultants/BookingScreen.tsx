import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";

export default function BookingScreen() {
  const navigation = useNavigation<any>();

  const dates = ["Today\n10", "Tue\n11", "Wed\n12", "Thu\n13", "Fri\n14"];
  const times = ["9:00 AM", "10:00 AM", "11:00 AM", "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:30 PM"];

  return (
    <ScreenWrapper>
    <ScrollView style={styles.safe} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()}><Text style={styles.back}>‹</Text></Pressable>
        <Text style={styles.title}>Book Session</Text>
      </View>

      <View style={styles.sessionRow}>
        <View style={[styles.sessionBox, styles.sessionActive]}><Text style={styles.sessionTextActive}>🎥{`\n`}Video</Text></View>
        <View style={styles.sessionBox}><Text style={styles.sessionText}>🎙{`\n`}Audio</Text></View>
        <View style={styles.sessionBox}><Text style={styles.sessionText}>💬{`\n`}Chat</Text></View>
      </View>

      <Text style={styles.blockTitle}>Pick a Date</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {dates.map((d, i) => (
          <View key={d} style={[styles.dateBox, i === 0 && styles.dateActive]}>
            <Text style={[styles.dateText, i === 0 && styles.dateActiveText]}>{d}</Text>
          </View>
        ))}
      </ScrollView>

      <Text style={styles.blockTitle}>Available Times</Text>
      <View style={styles.timesWrap}>
        {times.map((t, i) => (
          <View key={t} style={[styles.timeBox, i === 5 && styles.timeActive, (i === 0 || i === 1 || i === 4) && styles.timeDisabled]}>
            <Text style={[styles.timeText, i === 5 && styles.timeActiveText, (i === 0 || i === 1 || i === 4) && styles.timeDisabledText]}>{t}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.blockTitle}>Reviews</Text>

      {[
        ["M. H.", "May 2025", "Dr. Chen helped me understand my health anxiety in ways no one else had.", "★★★★★"],
        ["T. K.", "Apr 2025", "The best therapist I have had for my fibro journey.", "★★★★★"],
        ["R. S.", "Mar 2025", "Very professional and caring. Highly recommend.", "★★★★☆"],
      ].map(([name, date, text, stars]) => (
        <View key={name} style={styles.reviewCard}>
          <View style={styles.reviewTop}>
            <View style={styles.reviewAvatar}><Text style={styles.reviewAvatarText}>{name.split(" ").map((p) => p[0]).join("")}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.reviewName}>{name}</Text>
              <Text style={styles.reviewDate}>{date}</Text>
            </View>
            <Text style={styles.reviewStars}>{stars}</Text>
          </View>
          <Text style={styles.reviewText}>{text}</Text>
        </View>
      ))}

      <View style={{ height: 18 }} />
      <PrimaryButton title="Confirm Booking" onPress={() => {}} />
      </ScrollView>
      </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: "row", alignItems: "center", padding: 20, paddingBottom: 8 },
  back: { fontSize: 36, color: colors.text, marginRight: 12 },
  title: { fontSize: 28, fontWeight: "800", color: colors.text },
  sessionRow: { flexDirection: "row", marginHorizontal: 20, marginTop: 6 },
  sessionBox: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: "#E3EAF4", borderRadius: 22, paddingVertical: 18, alignItems: "center", marginRight: 10 },
  sessionActive: { backgroundColor: "#EEE7FF", borderColor: "#8A66D2" },
  sessionText: { color: "#6F87A6", fontWeight: "800", textAlign: "center", lineHeight: 22 },
  sessionTextActive: { color: "#7453C8", fontWeight: "800", textAlign: "center", lineHeight: 22 },
  blockTitle: { marginHorizontal: 20, marginTop: 18, marginBottom: 10, fontSize: 22, fontWeight: "800", color: colors.text },
  dateBox: { width: 76, height: 84, borderRadius: 22, backgroundColor: colors.white, borderWidth: 1, borderColor: "#E3EAF4", alignItems: "center", justifyContent: "center", marginLeft: 20 },
  dateActive: { backgroundColor: "#7453C8", borderColor: "#7453C8" },
  dateText: { color: colors.text, fontWeight: "800", textAlign: "center", fontSize: 18, lineHeight: 24 },
  dateActiveText: { color: colors.white },
  timesWrap: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20 },
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
});