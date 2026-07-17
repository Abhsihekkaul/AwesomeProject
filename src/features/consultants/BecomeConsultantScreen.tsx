import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import TagChip from "../../components/ui/TagChip";
import { AppInput } from "../../components/ui/AppInput";
import { resourcesApi } from "../../api/resourcesApi";
import { apiErrorMessage } from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import { useLiveOrDemo } from "../../hooks/useLiveOrDemo";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

const LANGUAGE_OPTIONS = ["English", "Hindi", "Nepali", "Bengali", "Tamil", "Spanish"];

/**
 * "Join as a consultant" — doctors/therapists apply here; the medical team reviews
 * before a public Consultant profile is created (mirrors the group-proposal pattern).
 */
export default function BecomeConsultantScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, isAuthenticated } = useAuth();

  // An existing application replaces the form with its review status.
  const { data: application, setData: setApplication } = useLiveOrDemo<any>(
    () => resourcesApi.getMyConsultantApplication(),
    null,
  );

  const [fullName, setFullName] = useState(user?.name ?? "");
  const [specialty, setSpecialty] = useState("");
  const [credentials, setCredentials] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [yearsExperience, setYearsExperience] = useState("");
  const [bio, setBio] = useState("");
  const [languages, setLanguages] = useState<string[]>(["English"]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleLanguage = (lang: string) =>
    setLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang],
    );

  const handleSubmit = async () => {
    if (!isAuthenticated) {
      Alert.alert("Sign in first", "Create an account or sign in to apply as a consultant.");
      return;
    }
    if (!fullName.trim() || !specialty.trim() || !credentials.trim()) {
      Alert.alert("Almost there", "Name, specialty and credentials are required.");
      return;
    }
    setIsSubmitting(true);
    try {
      const submitted = await resourcesApi.applyAsConsultant({
        fullName: fullName.trim(),
        specialty: specialty.trim(),
        credentials: credentials.trim(),
        licenseNumber: licenseNumber.trim() || undefined,
        yearsExperience: Number(yearsExperience) || 0,
        bio: bio.trim() || undefined,
        languages,
      });
      setApplication(submitted);
      Alert.alert(
        "Application received 🩺",
        "Our medical team will review your application within 3–5 days. You'll get a notification either way.",
      );
    } catch (err) {
      Alert.alert("Couldn't submit", apiErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusCopy: Record<string, string> = {
    pending: "Your application is with our medical team. We review within 3–5 days.",
    approved: "You're approved! Your consultant profile is being set up.",
    rejected: "Your previous application wasn't approved. You can update and resubmit below.",
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BackButton />
            <Text style={styles.headerTitle}>Join as a consultant</Text>
          </View>

          <Text style={styles.sub}>
            Help people living with chronic illness. Every consultant is verified by our
            medical team before appearing in the directory.
          </Text>

          {application ? (
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>
                Application status: {application.status.toUpperCase()}
              </Text>
              <Text style={styles.statusBody}>{statusCopy[application.status] ?? ""}</Text>
            </View>
          ) : null}

          {/* Pending/approved applications lock the form; rejected ones can resubmit. */}
          {!application || application.status === "rejected" ? (
            <>
              <AppInput label="Full Name" value={fullName} onChangeText={setFullName} placeholder="Dr. Your Name" />
              <AppInput
                label="Specialty"
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="e.g. Clinical Psychologist"
              />
              <AppInput
                label="Credentials"
                value={credentials}
                onChangeText={setCredentials}
                placeholder="Degrees, certifications (e.g. MBBS, MD Psychiatry)"
              />
              <AppInput
                label="License Number (optional)"
                value={licenseNumber}
                onChangeText={setLicenseNumber}
                placeholder="Medical council registration no."
              />
              <AppInput
                label="Years of Experience"
                value={yearsExperience}
                onChangeText={setYearsExperience}
                placeholder="e.g. 8"
              />
              <AppInput
                label="Short Bio (optional)"
                value={bio}
                onChangeText={setBio}
                placeholder="What you focus on and how you work with patients"
                multiline
              />

              <Text style={styles.sectionLabel}>Languages you consult in</Text>
              <View style={styles.chipsRow}>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <TagChip
                    key={lang}
                    label={lang}
                    active={languages.includes(lang)}
                    onPress={() => toggleLanguage(lang)}
                  />
                ))}
              </View>

              <PrimaryButton
                title={application ? "Resubmit Application" : "Submit Application"}
                onPress={handleSubmit}
                disabled={isSubmitting}
              />
            </>
          ) : (
            <Pressable onPress={() => navigation.goBack()} style={styles.backLink} hitSlop={8}>
              <Text style={styles.backLinkText}>← Back to Psychological Help</Text>
            </Pressable>
          )}

          <View style={{ height: moderateVerticalScale(40) }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    flex: {
      flex: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
      marginBottom: moderateVerticalScale(12),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    sub: {
      color: colors.mutedText,
      fontSize: TextStyles.body,
      lineHeight: moderateVerticalScale(20),
      marginBottom: moderateVerticalScale(16),
    },
    statusCard: {
      backgroundColor: colors.lightBlue,
      borderRadius: radius.md,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(16),
    },
    statusTitle: {
      color: colors.primary,
      fontWeight: "700",
      fontSize: TextStyles.body,
      marginBottom: moderateVerticalScale(4),
    },
    statusBody: {
      color: colors.primary,
      fontSize: TextStyles.caption,
      lineHeight: moderateVerticalScale(18),
    },
    sectionLabel: {
      color: colors.text,
      fontSize: TextStyles.body,
      fontWeight: "600",
      marginBottom: moderateVerticalScale(10),
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      marginBottom: moderateVerticalScale(20),
    },
    backLink: {
      marginTop: moderateVerticalScale(8),
    },
    backLinkText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: TextStyles.body,
    },
  });
