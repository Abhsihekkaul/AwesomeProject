import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View, Pressable, TextInput, Image } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import BackButton from "../../components/ui/BackButton";
import imagePath from "../../constant/imagePath";
import UserAvatar from "../../components/ui/UserAvatar";
import PrimaryButton from "../../components/ui/PrimaryButton";

const initialReviews = [
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

const availableDates = [
  { label: "Mon\n10", available: false },
  { label: "Tue\n11", available: true },
  { label: "Wed\n12", available: true },
  { label: "Thu\n13", available: false },
  { label: "Fri\n14", available: true },
  { label: "Sat\n15", available: true },
];

const availableTimes = [
  { label: "9:00 AM", available: false },
  { label: "10:00 AM", available: false },
  { label: "11:00 AM", available: true },
  { label: "1:00 PM", available: true },
  { label: "2:00 PM", available: false },
  { label: "3:00 PM", available: true },
  { label: "4:00 PM", available: true },
  { label: "5:30 PM", available: true },
];

export default function ConsultantProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // State for Date and Time Selection
  const [selectedDate, setSelectedDate] = useState("Tue\n11");
  const [selectedTime, setSelectedTime] = useState("3:00 PM");
  const [selectedSessionType, setSelectedSessionType] = useState("Video");

  // State for Reviews
  const [reviews, setReviews] = useState(initialReviews);
  const [isWritingReview, setIsWritingReview] = useState(false);
  const [newReviewText, setNewReviewText] = useState("");

  const handleReviewSubmit = () => {
    if (newReviewText.trim() === "") return;

    const newReview = {
      initials: "ME", // Represents the logged-in user
      name: "Me",
      date: "Just now",
      text: newReviewText,
      stars: "★★★★★", // Hardcoded for mockup purposes
    };

    setReviews([newReview, ...reviews]);
    setNewReviewText("");
    setIsWritingReview(false);
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <BackButton />
          <Text style={styles.headerTitle}>Consultant Profile</Text>
        </View>

        <View style={styles.topCard}>
          <View style={styles.avatarContainer}>
            <UserAvatar initials="SC" size={80} />
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
            <Image style={styles.icons} source={imagePath.LanguageIcon} />
            <Text style={styles.infoText}>English,{`\n`}Mandarin</Text>
          </View>
          <View style={styles.infoBox}>
            <Image style={styles.icons} source={imagePath.ClockIcon} />
            <Text style={[styles.infoText, { color: colors.success }]}>Today, 3:00{`\n`}PM</Text>
          </View>
          <View style={styles.infoBox}>
            <Image style={styles.icons} source={imagePath.MoneyIcon} />
            <Text style={styles.infoText}>$80–{`\n`}120/session</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>Session Type</Text>

        <View style={styles.sessionRow}>
          {[
            {
              label: "Video",
              icon: imagePath.VideoIcon,
            },
            {
              label: "Audio",
              icon: imagePath.PhoneIcon,
            },
            {
              label: "Chat",
              icon: imagePath.ChatIcon,
            },
          ].map((item) => {
            const isActive = selectedSessionType === item.label;

            return (
              <Pressable
                key={item.label}
                style={[styles.sessionCard, isActive && styles.sessionActive]}
                onPress={() => setSelectedSessionType(item.label)}
              >
                <Image
                  source={item.icon}
                  resizeMode="contain"
                  style={[
                    styles.sessionIcon,
                    isActive && styles.sessionIconActive,
                  ]}
                />

                <Text
                  style={[
                    styles.sessionLabel,
                    isActive && styles.sessionActiveText,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.blockTitle}>Pick a Date</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
          {availableDates.map((d) => (
            <Pressable
              key={d.label}
              style={[
                styles.dateBox,
                selectedDate === d.label && styles.dateActive,
                !d.available && styles.dateDisabled
              ]}
              disabled={!d.available}
              onPress={() => setSelectedDate(d.label)}
            >
              <Text style={[
                styles.dateText,
                selectedDate === d.label && styles.dateActiveText,
                !d.available && styles.dateDisabledText
              ]}>{d.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <Text style={styles.blockTitle}>Available Times</Text>
        <View style={styles.timeGrid}>
          {availableTimes.map((t) => (
            <Pressable
              key={t.label}
              style={[
                styles.timeBox,
                selectedTime === t.label && styles.timeActive,
                !t.available && styles.timeDisabled
              ]}
              disabled={!t.available}
              onPress={() => setSelectedTime(t.label)}
            >
              <Text style={[
                styles.timeText,
                selectedTime === t.label && styles.timeActiveText,
                !t.available && styles.timeDisabledText
              ]}>{t.label}</Text>
            </Pressable>
          ))}
        </View>

        <PrimaryButton
          title="Book Session"
          onPress={() =>
            navigation.navigate("Booking", {
              consultant: "Dr. Sarah Chen",
              role: "Clinical Psychologist",
              sessionType: selectedSessionType,
              date: selectedDate,
              time: selectedTime,
            })
          }
          style={styles.bookBtn}
        />

        {/* Reviews Section Header */}
        <View style={styles.reviewHeaderRow}>
          <Text style={styles.blockTitleWithMargin0}>Reviews</Text>
          <Pressable onPress={() => setIsWritingReview(!isWritingReview)}>
            <Text style={styles.writeReviewBtnText}>
              {isWritingReview ? "Cancel" : "+ Write a Review"}
            </Text>
          </Pressable>
        </View>

        {/* Write Review Form */}
        {isWritingReview && (
          <View style={styles.writeReviewContainer}>
            <TextInput
              style={styles.reviewInput}
              placeholder="Share your experience..."
              placeholderTextColor={colors.mutedText}
              multiline
              numberOfLines={4}
              value={newReviewText}
              onChangeText={setNewReviewText}
              textAlignVertical="top"
            />
            <Pressable
              style={[styles.submitReviewBtn, !newReviewText.trim() && styles.submitReviewBtnDisabled]}
              onPress={handleReviewSubmit}
              disabled={!newReviewText.trim()}
            >
              <Text style={styles.submitReviewBtnText}>Submit</Text>
            </Pressable>
          </View>
        )}

        {/* Existing Reviews List */}
        {reviews.map((r, index) => (
          <View key={index.toString()} style={styles.reviewCard}>
            <View style={styles.reviewTop}>
              <UserAvatar initials={r.initials} size={36} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reviewName}>{r.name}</Text>
                <Text style={styles.reviewDate}>{r.date}</Text>
              </View>
              <Text style={styles.reviewStars}>{r.stars}</Text>
            </View>
            <Text style={styles.reviewText}>{r.text}</Text>
          </View>
        ))}

        <View style={{ height: moderateVerticalScale(40) }} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: TextStyles.heading,
    fontWeight: "600",
    color: colors.text,
  },
  topCard: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: moderateVerticalScale(10),
  },
  avatarContainer: {
    position: "relative",
  },
  onlineDot: {
    width: moderateScale(16),
    height: moderateScale(16),
    borderRadius: moderateScale(8),
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.white,
    position: "absolute",
    right: -moderateScale(4),
    bottom: moderateScale(6),
  },
  topCardText: {
    flex: 1,
    marginLeft: moderateScale(14),
  },
  name: {
    fontSize: TextStyles.heading,
    fontWeight: "600",
    color: colors.text,
  },
  role: {
    fontSize: TextStyles.caption,
    color: colors.mutedText,
    marginTop: moderateVerticalScale(4),
  },
  rating: {
    marginTop: moderateVerticalScale(6),
    fontSize: scale(14),
    fontWeight: "700",
    color: colors.warning,
  },
  reviewCount: {
    color: colors.mutedText,
    fontWeight: "400",
  },
  sectionCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: moderateScale(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sectionTitle: {
    fontSize: TextStyles.subtitle,
    fontWeight: "500",
    color: colors.text,
    marginBottom: moderateVerticalScale(4),
  },
  paragraph: {
    fontSize: TextStyles.stepCounts,
    lineHeight: scale(20),
    color: colors.mutedText,
  },
  blockTitle: {
    marginTop: moderateVerticalScale(12),
    fontSize: TextStyles.subtitle,
    fontWeight: "500",
    color: colors.text,
    marginBottom: moderateVerticalScale(8)
  },
  blockTitleWithMargin0: {
    fontSize: TextStyles.subtitle,
    fontWeight: "600",
    color: colors.text,
  },
  pillsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(6),
    marginBottom: moderateVerticalScale(12),
  },
  pill: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(20),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateVerticalScale(5),
  },
  pillText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoBox: {
    width: "31%",
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: moderateVerticalScale(16),
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  icons: {
    height: moderateVerticalScale(23),
    width : moderateScale(24),
    tintColor: colors.text,
    resizeMode: "contain",
  },
  infoText: {
    textAlign: "center",
    marginTop: moderateVerticalScale(6),
    fontWeight: "400",
    fontSize: TextStyles.caption,
    color: colors.text,
  },
  sessionRow: {
    flexDirection: "row",
    gap: moderateScale(10),
  },
  sessionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: moderateVerticalScale(8),
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  sessionActive: {
    backgroundColor: colors.lightPurple,
    borderColor: colors.primary,
    borderWidth: 1,
  },
  sessionIcon: {
    width: moderateScale(24),
    height: moderateScale(24),
    tintColor: colors.mutedText,
  },

  sessionIconActive: {
    tintColor: colors.primary,
  },
  sessionLabel: {
    marginTop: moderateVerticalScale(6),
    color: colors.mutedText,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  sessionActiveText: {
    color: colors.primary,
  },
  dateScroll: {
    gap: moderateScale(10),
  },
  dateBox: {
    width: moderateScale(68),
    height: moderateVerticalScale(76),
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dateActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dateDisabled: {
    backgroundColor: colors.lightBlue,
    opacity: 0.6,
  },
  dateText: {
    color: colors.text,
    fontWeight: "600",
    textAlign: "center",
    fontSize: TextStyles.caption,
    lineHeight: scale(20),
  },
  dateActiveText: {
    color: colors.white,
  },
  dateDisabledText: {
    color: colors.mutedText,
  },
  timeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: moderateScale(10),
  },
  timeBox: {
    width: "22.5%",
    backgroundColor: colors.card,
    borderRadius: moderateScale(20),
    paddingVertical: moderateVerticalScale(10),
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  timeText: {
    color: colors.text,
    fontWeight: "600",
    fontSize: scale(11),
    textAlign: "center",
  },
  timeActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeActiveText: {
    color: colors.white,
  },
  timeDisabled: {
    backgroundColor: colors.lightBlue,
    opacity: 0.6,
  },
  timeDisabledText: {
    color: colors.mutedText,
  },
  bookBtn: {
    marginTop: moderateVerticalScale(24),
  },

  /* --- Review Section Styles --- */
  reviewHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: moderateVerticalScale(24),
    marginBottom: moderateVerticalScale(10),
  },
  writeReviewBtnText: {
    color: colors.primary,
    fontWeight: "600",
    fontSize: TextStyles.caption,
  },
  writeReviewContainer: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: moderateScale(14),
    marginBottom: moderateVerticalScale(10),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  reviewInput: {
    height: moderateVerticalScale(80),
    backgroundColor: colors.background,
    borderRadius: radius.sm,
    padding: moderateScale(12),
    fontSize: TextStyles.caption,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  submitReviewBtn: {
    backgroundColor: colors.primary,
    borderRadius: moderateScale(20),
    paddingVertical: moderateVerticalScale(10),
    alignItems: "center",
    marginTop: moderateVerticalScale(12),
    alignSelf: "flex-end",
    paddingHorizontal: moderateScale(20),
  },
  submitReviewBtnDisabled: {
    backgroundColor: colors.mutedText,
  },
  submitReviewBtnText: {
    color: colors.white,
    fontWeight: "600",
    fontSize: scale(12),
  },
  reviewCard: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    marginTop: moderateVerticalScale(10),
    padding: moderateScale(14),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  reviewTop: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewName: {
    fontSize: TextStyles.body,
    fontWeight: "600",
    color: colors.text,
  },
  reviewDate: {
    color: colors.mutedText,
    marginTop: moderateVerticalScale(2),
    fontSize: scale(11),
  },
  reviewStars: {
    color: colors.warning,
    fontSize: scale(14),
    fontWeight: "700",
  },
  reviewText: {
    color: colors.text,
    fontSize: TextStyles.caption,
    lineHeight: scale(20),
    marginTop: moderateVerticalScale(10),
  },
});