import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";

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
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        
        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Consultant Profile</Text>
        </View>

        <View style={styles.topCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SC</Text>
            </View>
            <View style={styles.onlineDot} />
          </View>

          <View style={styles.topCardText}>
            <Text style={styles.name}>Dr. Sarah Chen ✦</Text>
            <Text style={styles.role}>Clinical Psychologist</Text>
            <Text style={styles.rating}>
              ★★★★★ 4.9 <Text style={styles.reviewCount}>(127 reviews)</Text>
            </Text>
          </View>
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
          <View style={styles.sessionCard}>
            <Text style={styles.sessionIcon}>🎙</Text>
            <Text style={styles.sessionLabel}>Audio</Text>
          </View>
          <View style={styles.sessionCard}>
            <Text style={styles.sessionIcon}>💬</Text>
            <Text style={styles.sessionLabel}>Chat</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>Pick a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
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

        <Pressable style={styles.bookBtn} onPress={() => navigation.navigate("Booking")}>
          <Text style={styles.bookText}>Book Session</Text>
        </Pressable>

        <Text style={styles.blockTitle}>Reviews</Text>
        {reviews.map((r) => (
          <View key={r.name} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <View style={styles.reviewAvatar}>
                <Text style={styles.reviewAvatarText}>{r.initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{r.name}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
              <Text style={styles.reviewStars}>{r.stars}</Text>
            </View>
            <Text style={styles.reviewText}>{r.text}</Text>
          </View>
        ))}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerTitle: {
    fontSize: TextStyles.heading,
    fontWeight: "600",
  },

  topCard: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical : moderateVerticalScale(10),
  },

  avatarContainer: {
    position: "relative",
  },

  avatar: {
    width: moderateScale(80),
    height: moderateScale(80),
    borderRadius: radius.md,
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },

  avatarText: {
    fontSize: scale(24),
    fontWeight: "600",
    color: "#7453C8"
  },

  onlineDot: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: "#4FA57B",
    borderWidth: 2,
    borderColor: colors.white,
    position: "absolute",
    right: -moderateScale(4),
    bottom: moderateScale(6)
  },

  topCardText: {
    flex: 1,
    marginLeft: moderateScale(14)
  },

  name: {
    fontSize: TextStyles.heading,
    fontWeight: "600",
    color: colors.text
  },
  role: {
    fontSize: TextStyles.caption,
    color: "#6F87A6",
    marginTop: moderateVerticalScale(4)
  },
  rating: {
    marginTop: moderateVerticalScale(6),
    fontSize: scale(14),
    fontWeight: "700",
    color: "#E67E22"
  },
  reviewCount: {
    color: "#8A9CB5",
    fontWeight: "400",
  },

  sectionCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: moderateScale(14),
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },

  sectionTitle: {
    fontSize: TextStyles.subtitle,
    fontWeight: "600",
    marginBottom: moderateVerticalScale(4)
  }, 

  paragraph: {
    fontSize: TextStyles.stepCounts,
    lineHeight: scale(20)
  },

  blockTitle: {
    marginTop : moderateVerticalScale(12),
    fontSize: TextStyles.subtitle,
    fontWeight: "600",
  },

  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    paddingVertical: moderateVerticalScale(6),
  },

  pill: {
    backgroundColor: "#7984fb",
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(5),
  },

  pillText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: TextStyles.caption
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBox: {
    width: "31%",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: moderateVerticalScale(16),
    alignItems: "center",
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },
  infoIcon: {
    fontSize: scale(20)
  },
  infoText: {
    textAlign: "center",
    marginTop: moderateVerticalScale(6),
    color: "#6F87A6",
    fontWeight: "600",
    fontSize: scale(11)
  },
  sessionRow: {
    flexDirection: "row",
    marginHorizontal: moderateScale(16),
    gap: moderateScale(10)
  },
  sessionCard: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    paddingVertical: moderateVerticalScale(14),
    alignItems: "center",
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },
  sessionActive: {
    backgroundColor: "#F1EBFF",
    borderColor: "#7453C8"
  },
  sessionIcon: {
    fontSize: scale(20)
  },
  sessionLabel: {
    marginTop: moderateVerticalScale(6),
    color: "#6F87A6",
    fontWeight: "600",
    fontSize: TextStyles.caption
  },
  sessionActiveText: {
    color: "#7453C8"
  },
  dateScroll: {
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10)
  },
  dateBox: {
    width: moderateScale(68),
    height: moderateVerticalScale(76),
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    alignItems: "center",
    justifyContent: "center",
  },
  dateActive: {
    backgroundColor: "#7453C8",
    borderColor: "#7453C8"
  },
  dateText: {
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
    fontSize: TextStyles.caption,
    lineHeight: scale(20)
  },
  dateActiveText: {
    color: colors.white
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: moderateScale(16),
    gap: moderateScale(10)
  },
  timeBox: {
    width: "22.5%",
    backgroundColor: colors.white,
    borderRadius: moderateScale(20),
    paddingVertical: moderateVerticalScale(10),
    alignItems: "center",
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },
  timeText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: scale(11),
    textAlign: "center"
  },
  timeActive: {
    backgroundColor: "#7453C8",
    borderColor: "#7453C8"
  },
  timeActiveText: {
    color: colors.white
  },
  timeDisabled: {
    backgroundColor: "#F0F4FA",
    opacity: 0.6
  },
  timeDisabledText: {
    color: "#A2B0C4"
  },
  reviewCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(10),
    padding: moderateScale(14),
    borderWidth: 0.2,
    borderColor: "#b8bbc0"
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center"
  },
  reviewAvatar: {
    width: moderateScale(36),
    height: moderateScale(36),
    borderRadius: moderateScale(18),
    backgroundColor: "#F1EBFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(10)
  },
  reviewAvatarText: {
    color: "#7453C8",
    fontWeight: "600",
    fontSize: scale(12)
  },
  reviewName: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text
  },
  reviewDate: {
    color: "#6F87A6",
    marginTop: moderateVerticalScale(2),
    fontSize: scale(11)
  },
  reviewStars: {
    color: "#E67E22",
    fontSize: scale(14),
    fontWeight: "700"
  },
  reviewText: {
    color: colors.text,
    fontSize: TextStyles.caption,
    lineHeight: scale(20),
    marginTop: moderateVerticalScale(10)
  },
  bookBtn: {
    marginHorizontal: moderateScale(16),
    marginTop: moderateVerticalScale(24),
    backgroundColor: "#7453C8",
    borderRadius: moderateScale(24),
    paddingVertical: moderateVerticalScale(14),
    alignItems: "center"
  },

  bookText: {
    color: colors.white,
    fontSize: TextStyles.body,
    fontWeight: "600"
  },

});