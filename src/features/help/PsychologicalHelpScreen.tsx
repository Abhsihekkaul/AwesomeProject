import React from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { colors } from "../../theme/colors";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import UserAvatar from "../../components/ui/UserAvatar";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

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
  // --- New Entries Below ---
  {
    initials: "ER",
    name: "Dr. Elena Rodriguez",
    role: "Clinical Social Worker",
    rating: "4.85 (142)",
    tags: ["Caregiver Burnout", "Family Therapy"],
    next: "Tomorrow, 1:00 PM",
    bg: "#E8FAFF",
    color: "#2C8C9E", // Teal theme
  },
  {
    initials: "DO",
    name: "Dr. David Okafor",
    role: "Psychiatrist",
    rating: "4.9 (88)",
    tags: ["Medication Management", "ADHD"],
    next: "Fri, 9:00 AM",
    bg: "#FFE8E8",
    color: "#C85353", // Muted red/pink theme
  },
  {
    initials: "JL",
    name: "Dr. James Lin",
    role: "Neuropsychologist",
    rating: "4.75 (115)",
    tags: ["Brain Fog", "CBT"],
    next: "Today, 5:30 PM",
    bg: "#FFF9E6",
    color: "#B38600", // Warm gold theme
  },
  {
    initials: "FA",
    name: "Dr. Fatima Al-Sayed",
    role: "Holistic Therapist",
    rating: "4.95 (210)",
    tags: ["Mindfulness", "Somatic Experiencing"],
    next: "Mon, Jun 17",
    bg: "#EBEFFF",
    color: "#3F51B5", // Indigo theme
  },
  {
    initials: "RV",
    name: "Dr. Robert Vance",
    role: "Pain Psychologist",
    rating: "4.8 (76)",
    tags: ["Fibromyalgia", "ACT"],
    next: "Tue, Jun 18",
    bg: "#F2F0F5",
    color: "#6B5B95", // Deep mauve theme
  },
  {
    initials: "SO",
    name: "Dr. Sophia Ortiz",
    role: "Licensed Counselor",
    rating: "4.9 (150)",
    tags: ["Medical Trauma", "Depression"],
    next: "Tomorrow, 11:30 AM",
    bg: "#FFF0F5",
    color: "#D87093", // Pale violet red theme
  }
];

export default function PsychologicalHelpScreen() {
  const navigation = useNavigation<any>();

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Psychological Help</Text>
          <Text style={styles.BecomeDoctor}>Want to be doctor ?</Text>
          <Text style={styles.sub}>Verified professionals who understand chronic illness</Text>
        </View>

        <SearchBar placeholder="Find new Doctors ..." />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filters}>
            <CategoryChip label="All" active />
            <CategoryChip label="My Doctors" />
            <CategoryChip label="Available Now" />
          </View>
        </ScrollView>

        <View style={styles.listContainer}>
          {doctors.map((d) => (
            <Pressable
              key={d.name}
              onPress={() => navigation.navigate("ConsultantProfile", { name: d.name })}
              style={styles.card}
            >
              <UserAvatar
                initials={d.initials}
                size={moderateScale(46)}
                bg={d.bg}
                color={d.color}
              />

              <View style={styles.CardText}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{d.name} ✓</Text>
                    <Text style={styles.role}>{d.role}</Text>
                  </View>
                  <View style={styles.RatingSetting}>
                    <Image source={imagePath.StarIcon} style={styles.Star} />
                    <Text style={styles.rating}>{d.rating}</Text>
                  </View>
                </View>

                <View style={styles.tagsRow}>
                  {d.tags.map((t) => (
                    <View key={t} style={styles.tag}>
                      <Text style={styles.tagText}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    marginBottom: moderateVerticalScale(12),
  },

  title: {
    fontSize: TextStyles.title,
    fontWeight: "600",
    color: colors.text,
  },
  BecomeDoctor: {
    fontSize: TextStyles.stepCounts,
    color: "#5d76be",
    fontWeight : "800"
  },

  sub: {
    fontSize: TextStyles.caption,
    opacity: 0.5,
    marginTop: moderateVerticalScale(2),
  },
  
  filterScroll: {
    marginTop: moderateVerticalScale(14),
    marginBottom: moderateVerticalScale(8),
  },

  filters: {
    flexDirection: "row",
    gap: moderateScale(8),
  },

  listContainer: {
    paddingBottom: moderateVerticalScale(20),
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    padding: moderateScale(12),
    marginTop: moderateVerticalScale(10),
  },

  CardText: {
    flex: 1,
    marginLeft: moderateScale(12),
  },

  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },

  name: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },

 
  role: {
    fontSize: TextStyles.caption,
    opacity: 0.5,
    marginTop: moderateVerticalScale(2),
  },

  RatingSetting: {
    display: "flex",
    flexDirection: "row",
  },

  Star: {
    height: moderateVerticalScale(16),
    width: moderateScale(16),
  },
  rating: {
    marginLeft : moderateScale(4),
    color: "#93b0f4",
    fontSize: TextStyles.caption,
    fontWeight: "600",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: moderateVerticalScale(8),
    gap: moderateScale(6),
  },
  tag: {
    backgroundColor: "#7984fb",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(4),
  },
  tagText: {
    color: "#ffffff",
    fontWeight: "600",
    fontSize: moderateScale(12),
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateVerticalScale(6),
  },
  next: {
    color: "#4FA57B",
    fontSize: scale(13),
    fontWeight: "600",
  },
  session: {
    backgroundColor: "#EAF1FF",
    color: "#4E79C7",
    fontWeight: "600",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(4),
    marginLeft: moderateScale(8),
    overflow: "hidden",
  },
});