import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import SearchBar from "../../components/ui/SearchBar";
import CategoryChip from "../../components/ui/CategoryChip";
import UserAvatar from "../../components/ui/UserAvatar";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";
import { resourcesApi } from "../../api/resourcesApi";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";

const doctors = [
  {
    initials: "SC",
    name: "Dr. Sarah Chen",
    role: "Clinical Psychologist",
    rating: "4.9 (127)",
    tags: ["Chronic Illness Adaptation", "Health Anxiety"],
    next: "Today, 3:00 PM",
  },
  {
    initials: "MW",
    name: "Dr. Marcus Williams",
    role: "Psychiatrist",
    rating: "4.8 (98)",
    tags: ["Mood Disorders", "Trauma & PTSD"],
    next: "Tomorrow, 10:00 AM",
  },
  {
    initials: "PP",
    name: "Dr. Priya Patel",
    role: "Licensed Counselor",
    rating: "4.95 (203)",
    tags: ["Grief & Loss", "Chronic Pain"],
    next: "Wed, Jun 12",
  },
  {
    initials: "AK",
    name: "Dr. Anna Kowalski",
    role: "Health Psychologist",
    rating: "4.7 (64)",
    tags: ["Insomnia", "Stress Management"],
    next: "Thu, 4:00 PM",
  },
  // --- New Entries Below ---
  {
    initials: "ER",
    name: "Dr. Elena Rodriguez",
    role: "Clinical Social Worker",
    rating: "4.85 (142)",
    tags: ["Caregiver Burnout", "Family Therapy"],
    next: "Tomorrow, 1:00 PM",
  },
  {
    initials: "DO",
    name: "Dr. David Okafor",
    role: "Psychiatrist",
    rating: "4.9 (88)",
    tags: ["Medication Management", "ADHD"],
    next: "Fri, 9:00 AM",
  },
  {
    initials: "JL",
    name: "Dr. James Lin",
    role: "Neuropsychologist",
    rating: "4.75 (115)",
    tags: ["Brain Fog", "CBT"],
    next: "Today, 5:30 PM",
  },
  {
    initials: "FA",
    name: "Dr. Fatima Al-Sayed",
    role: "Holistic Therapist",
    rating: "4.95 (210)",
    tags: ["Mindfulness", "Somatic Experiencing"],
    next: "Mon, Jun 17",
  },
  {
    initials: "RV",
    name: "Dr. Robert Vance",
    role: "Pain Psychologist",
    rating: "4.8 (76)",
    tags: ["Fibromyalgia", "ACT"],
    next: "Tue, Jun 18",
  },
  {
    initials: "SO",
    name: "Dr. Sophia Ortiz",
    role: "Licensed Counselor",
    rating: "4.9 (150)",
    tags: ["Medical Trauma", "Depression"],
    next: "Tomorrow, 11:30 AM",
  }
];

export default function PsychologicalHelpScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Live consultant directory when signed in; demo list when signed out.
  const { data: allDoctors } = useLiveOrDemo(
    async () =>
      (await resourcesApi.getConsultants()).map((c: any) => ({
        id: c.id,
        initials: c.name
          .replace("Dr. ", "")
          .split(" ")
          .map((p: string) => p[0])
          .join("")
          .slice(0, 2)
          .toUpperCase(),
        name: c.name,
        role: c.role,
        rating: `${c.rating} (${c.reviewCount})`,
        tags: c.tags ?? [],
        next: "",
      })),
    doctors.map((d) => ({ ...d, id: undefined as string | undefined })),
  );

  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const visibleDoctors = q
    ? allDoctors.filter(
        (d: any) =>
          d.name.toLowerCase().includes(q) ||
          d.role.toLowerCase().includes(q) ||
          d.tags.some((t: string) => t.toLowerCase().includes(q)),
      )
    : allDoctors;

  // Theme-aware avatar tints, cycled by list position
  const avatarTints = [
    { bg: colors.lightPurple, fg: colors.primary },
    { bg: colors.lightBlue, fg: colors.info },
    { bg: colors.lightGreen, fg: colors.success },
    { bg: colors.lightOrange, fg: colors.warning },
  ];

  return (
    <ScreenWrapper edges={["top", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Psychological Help</Text>
          <Pressable onPress={() => navigation.navigate("BecomeConsultant")} hitSlop={6}>
            <Text style={styles.BecomeDoctor}>Join as a consultant →</Text>
          </Pressable>
          <Text style={styles.sub}>Verified professionals who understand chronic illness</Text>
        </View>

        <SearchBar placeholder="Search doctors, specialties..." value={query} onChangeText={setQuery} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <View style={styles.filters}>
            <CategoryChip label="All" active />
            <CategoryChip label="My Doctors" />
            <CategoryChip label="Available Now" />
          </View>
        </ScrollView>

        <View style={styles.listContainer}>
          {visibleDoctors.length === 0 ? (
            <Text style={styles.emptyText}>No doctors match "{query.trim()}".</Text>
          ) : null}
          {visibleDoctors.map((d: any, i: number) => (
            <Pressable
              key={d.name}
              onPress={() => navigation.navigate("ConsultantProfile", { name: d.name, consultantId: d.id })}
              style={styles.card}
            >
              <UserAvatar
                initials={d.initials}
                size={moderateScale(46)}
                bg={avatarTints[i % avatarTints.length].bg}
                color={avatarTints[i % avatarTints.length].fg}
              />

              <View style={styles.CardText}>
                <View style={styles.rowBetween}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.nameRow}>
                      <Text style={styles.name}>{d.name}</Text>
                      <Image source={imagePath.ShieldIcon} style={styles.verifiedIcon} />
                    </View>
                    <Text style={styles.role}>{d.role}</Text>
                  </View>
                  <View style={styles.RatingSetting}>
                    <Image source={imagePath.StarIcon} style={styles.Star} />
                    <Text style={styles.rating}>{d.rating}</Text>
                  </View>
                </View>

                <View style={styles.tagsRow}>
                  {d.tags.map((t: string) => (
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

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
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
    color: colors.primary,
    fontWeight : "800"
  },

  sub: {
    fontSize: TextStyles.caption,
    color: colors.mutedText,
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
    paddingBottom: moderateVerticalScale(96),
  },

  emptyText: {
    textAlign: "center",
    color: colors.mutedText,
    fontSize: TextStyles.body,
    marginTop: moderateVerticalScale(24),
  },

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
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

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: moderateScale(6),
  },

  verifiedIcon: {
    width: moderateScale(12),
    height: moderateScale(12),
    resizeMode: "contain",
    tintColor: colors.success,
  },

  role: {
    fontSize: TextStyles.caption,
    color: colors.mutedText,
    marginTop: moderateVerticalScale(2),
  },

  RatingSetting: {
    display: "flex",
    flexDirection: "row",
  },

  Star: {
    height: moderateVerticalScale(16),
    width: moderateScale(16),
    tintColor: colors.warning,
    resizeMode: "contain",
  },
  rating: {
    marginLeft : moderateScale(4),
    color: colors.warning,
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
    backgroundColor: colors.primary,
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(4),
  },
  tagText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: moderateScale(12),
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: moderateVerticalScale(6),
  },
  next: {
    color: colors.success,
    fontSize: scale(13),
    fontWeight: "600",
  },
  session: {
    backgroundColor: colors.lightBlue,
    color: colors.primary,
    fontWeight: "600",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(10),
    paddingVertical: moderateVerticalScale(4),
    marginLeft: moderateScale(8),
    overflow: "hidden",
  },
});