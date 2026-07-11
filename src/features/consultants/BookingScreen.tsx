import React, { useState } from "react";
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

export default function BookingScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const consultant: string = route.params?.consultant ?? "Dr. Sarah Chen";
  const role: string = route.params?.role ?? "Clinical Psychologist";
  const sessionType: string = route.params?.sessionType ?? "Video";
  const date: string = (route.params?.date ?? "Tue 11").replace("\n", " ");
  const time: string = route.params?.time ?? "3:00 PM";

  const [note, setNote] = useState("");

  const initials = consultant
    .replace("Dr. ", "")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const summaryRows = [
    { icon: imagePath.VideoIcon, label: "Session", value: `${sessionType} session` },
    { icon: imagePath.ClockIcon, label: "When", value: `${date} · ${time}` },
    { icon: imagePath.MoneyIcon, label: "Fee", value: "$80–120 / session" },
  ];

  const confirmBooking = () => {
    Alert.alert(
      "Booking confirmed 🎉",
      `Your ${sessionType.toLowerCase()} session with ${consultant} is set for ${date} at ${time}.`,
      [{ text: "Done", onPress: () => navigation.popToTop() }],
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerTextWrap}>
            <Text style={styles.title}>Confirm Booking</Text>
            <Text style={styles.sub}>Review the details before you book</Text>
          </View>
        </View>

        {/* Consultant card */}
        <View style={styles.consultantCard}>
          <UserAvatar initials={initials} size={56} />
          <View style={styles.consultantInfo}>
            <Text style={styles.consultantName}>{consultant}</Text>
            <Text style={styles.consultantRole}>{role}</Text>
          </View>
          <View style={styles.verifiedPill}>
            <Image source={imagePath.ShieldIcon} style={styles.verifiedIcon} />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          {summaryRows.map((row, i) => (
            <View key={row.label} style={[styles.summaryRow, i > 0 && styles.summaryRowBorder]}>
              <View style={styles.summaryIconWrap}>
                <Image source={row.icon} style={styles.summaryIcon} />
              </View>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={styles.summaryValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Note to consultant */}
        <Text style={styles.blockTitle}>Anything to share beforehand? (optional)</Text>
        <TextInput
          style={styles.noteInput}
          placeholder="Share context, symptoms, or what you'd like to focus on..."
          placeholderTextColor={colors.mutedText}
          value={note}
          onChangeText={setNote}
          multiline
          textAlignVertical="top"
        />

        {/* Reassurance */}
        <View style={styles.notice}>
          <Image source={imagePath.ShieldIcon} style={[styles.noticeIcon, { tintColor: colors.success }]} />
          <Text style={styles.noticeText}>
            Free cancellation up to 24 hours before your session. Everything you share stays
            between you and your consultant.
          </Text>
        </View>

        <PrimaryButton title="Confirm Booking" onPress={confirmBooking} style={styles.confirmBtn} />
      </ScrollView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    container: {
      paddingBottom: moderateVerticalScale(40),
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: moderateVerticalScale(16),
    },
    headerTextWrap: {
      flex: 1,
    },
    title: {
      fontSize: TextStyles.heading,
      fontWeight: "600",
      color: colors.text,
    },
    sub: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginTop: moderateVerticalScale(2),
    },

    consultantCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
    },
    consultantInfo: {
      flex: 1,
      marginLeft: moderateScale(4),
    },
    consultantName: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    consultantRole: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    verifiedPill: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.lightGreen,
      borderRadius: radius.pill,
      paddingHorizontal: moderateScale(10),
      paddingVertical: moderateVerticalScale(4),
      gap: moderateScale(4),
    },
    verifiedIcon: {
      width: moderateScale(11),
      height: moderateScale(11),
      resizeMode: "contain",
      tintColor: colors.success,
    },
    verifiedText: {
      color: colors.success,
      fontSize: TextStyles.caption,
      fontWeight: "600",
    },

    summaryCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: moderateScale(14),
      marginTop: moderateVerticalScale(12),
    },
    summaryRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: moderateVerticalScale(13),
    },
    summaryRowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    summaryIconWrap: {
      width: moderateScale(34),
      height: moderateScale(34),
      borderRadius: moderateScale(17),
      backgroundColor: colors.lightPurple,
      alignItems: "center",
      justifyContent: "center",
      marginRight: moderateScale(12),
    },
    summaryIcon: {
      width: moderateScale(16),
      height: moderateScale(16),
      resizeMode: "contain",
      tintColor: colors.primary,
    },
    summaryLabel: {
      flex: 1,
      fontSize: TextStyles.stepCounts,
      color: colors.mutedText,
    },
    summaryValue: {
      fontSize: TextStyles.stepCounts,
      fontWeight: "600",
      color: colors.text,
    },

    blockTitle: {
      marginTop: moderateVerticalScale(20),
      marginBottom: moderateVerticalScale(10),
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    noteInput: {
      minHeight: moderateVerticalScale(90),
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(12),
      fontSize: TextStyles.stepCounts,
      color: colors.text,
    },

    notice: {
      flexDirection: "row",
      alignItems: "flex-start",
      backgroundColor: colors.lightGreen,
      borderRadius: radius.md,
      padding: moderateScale(14),
      marginTop: moderateVerticalScale(16),
      gap: moderateScale(10),
    },
    noticeIcon: {
      width: moderateScale(18),
      height: moderateScale(18),
      resizeMode: "contain",
      marginTop: moderateVerticalScale(2),
    },
    noticeText: {
      flex: 1,
      color: colors.success,
      fontSize: TextStyles.caption,
      lineHeight: scale(18),
    },

    confirmBtn: {
      marginTop: moderateVerticalScale(20),
    },
  });
