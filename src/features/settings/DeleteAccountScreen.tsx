import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { AppInput } from "../../components/ui/AppInput";
import { authApi } from "../../api/authApi";
import { apiErrorMessage } from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

// Preset exit reasons — stored anonymously so the product can learn why people go.
const EXIT_REASONS = [
  "I got the support I needed",
  "Couldn't find people like me",
  "Privacy concerns",
  "Too many notifications",
  "The app was confusing or buggy",
  "Something else",
];

/**
 * Settings → "Delete my account". Asks WHY (preset reasons + optional feedback,
 * stored anonymously), verifies the password, one final confirm dialog, then the
 * backend erases the account and everything it touched. Irreversible.
 */
export default function DeleteAccountScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, signOut } = useAuth();

  const [reason, setReason] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const reallyDelete = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await authApi.deleteAccount(password, reason!, feedback.trim() || undefined);
      // The account is gone server-side; clear the local session and start over.
      await signOut();
      Alert.alert("Account deleted", "Your account and all its content have been erased. Take care. 💜");
      navigation.reset({ index: 0, routes: [{ name: "Onboarding" }] });
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not delete the account"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDelete = () => {
    if (!reason) {
      setErrorMessage("Please tell us why you're leaving — pick the closest option");
      return;
    }
    if (!password) {
      setErrorMessage("Enter your password to confirm it's you");
      return;
    }
    Alert.alert(
      "Delete forever?",
      "This permanently erases your profile, posts, comments and messages. There is no way back.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete Forever", style: "destructive", onPress: reallyDelete },
      ],
    );
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BackButton />
            <Text style={styles.headerTitle}>Delete account</Text>
          </View>

          <View style={styles.warningCard}>
            <Text style={styles.warningTitle}>This cannot be undone</Text>
            <Text style={styles.warningText}>
              Deleting {user?.email ? `the account for ${user.email}` : "your account"} permanently
              erases your profile, every post and comment you wrote, your reactions, your
              conversations (for both sides), sathi connections and group memberships. All your
              devices are signed out immediately.
            </Text>
            <Text style={styles.warningText}>
              Signed up with Google and never set a password? Use "Forgot password" on the sign-in
              screen first to create one — deletion needs your password as proof it's you.
            </Text>
          </View>

          {/* Why are you leaving? — required, stored anonymously */}
          <Text style={styles.sectionLabel}>Why are you leaving?</Text>
          <View style={styles.reasonWrap}>
            {EXIT_REASONS.map((option) => {
              const active = reason === option;
              return (
                <Pressable
                  key={option}
                  style={[styles.reasonChip, active && styles.reasonChipActive]}
                  onPress={() => setReason(option)}
                >
                  <Text style={[styles.reasonChipText, active && styles.reasonChipTextActive]}>
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Optional free-text — this is pure listening, never required */}
          <Text style={styles.sectionLabel}>Anything we could have done better?</Text>
          <TextInput
            style={styles.feedbackInput}
            value={feedback}
            onChangeText={setFeedback}
            placeholder="Optional — your words go to the team anonymously and help us improve."
            placeholderTextColor={colors.mutedText}
            multiline
            maxLength={2000}
          />

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <AppInput
            label="Your Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <PrimaryButton
            title={isSubmitting ? "Deleting..." : "Delete My Account Forever"}
            onPress={confirmDelete}
            disabled={isSubmitting}
          />
          <View style={styles.bottomSpace} />
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
      marginBottom: moderateVerticalScale(16),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    warningCard: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.danger,
      padding: moderateScale(16),
      marginBottom: moderateVerticalScale(16),
    },
    warningTitle: {
      color: colors.danger,
      fontSize: TextStyles.body,
      fontWeight: "700",
      marginBottom: moderateVerticalScale(8),
    },
    warningText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      lineHeight: moderateVerticalScale(18),
      marginBottom: moderateVerticalScale(8),
    },
    sectionLabel: {
      color: colors.text,
      fontSize: TextStyles.body,
      fontWeight: "600",
      marginBottom: moderateVerticalScale(8),
    },
    reasonWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      marginBottom: moderateVerticalScale(16),
    },
    reasonChip: {
      paddingHorizontal: moderateScale(14),
      paddingVertical: moderateVerticalScale(8),
      borderRadius: radius.xl,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    reasonChipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    reasonChipText: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      fontWeight: "600",
    },
    reasonChipTextActive: {
      color: colors.white,
    },
    feedbackInput: {
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      color: colors.text,
      fontSize: TextStyles.caption,
      padding: moderateScale(12),
      minHeight: moderateVerticalScale(90),
      textAlignVertical: "top",
      marginBottom: moderateVerticalScale(16),
    },
    errorText: {
      color: colors.danger,
      fontSize: TextStyles.body,
      marginBottom: moderateVerticalScale(12),
    },
    bottomSpace: {
      height: moderateVerticalScale(40),
    },
  });
