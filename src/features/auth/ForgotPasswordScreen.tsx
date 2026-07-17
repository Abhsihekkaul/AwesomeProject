import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { AppInput } from "../../components/ui/AppInput";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { authApi } from "../../api/authApi";
import { apiErrorMessage } from "../../api/http";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

type Step = "email" | "code" | "done";

/**
 * Forgot-password flow: email → 6-digit code → new password.
 * The backend never reveals whether an email is registered; until an email service
 * is wired up, dev builds receive the code back and pre-fill it for testing.
 */
export default function ForgotPasswordScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState(route?.params?.email ?? "");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRequestCode = async () => {
    if (!email.trim()) {
      setErrorMessage("Enter the email you signed up with");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const result = await authApi.forgotPassword(email.trim());
      // Dev convenience only — production never returns the code.
      if (result.devCode) setCode(result.devCode);
      setInfoMessage(result.message);
      setStep("code");
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not request a reset code"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async () => {
    if (code.trim().length !== 6) {
      setErrorMessage("Enter the 6-digit code from your email");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await authApi.resetPassword(email.trim(), code.trim(), newPassword);
      setStep("done");
      Alert.alert("Password updated", "Sign in with your new password.", [
        { text: "Sign In", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not reset your password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <BackButton />
          </View>

          <Text style={styles.title}>Forgot password</Text>
          <Text style={styles.subtitle}>
            {step === "email"
              ? "Enter your email and we'll send you a reset code."
              : "Enter the code we sent you and choose a new password."}
          </Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          {!errorMessage && infoMessage ? <Text style={styles.infoText}>{infoMessage}</Text> : null}

          {step === "email" ? (
            <>
              <AppInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
              />
              <PrimaryButton
                title="Send Reset Code"
                onPress={handleRequestCode}
                disabled={isSubmitting}
              />
            </>
          ) : (
            <>
              <AppInput
                label="Reset Code"
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
              />
              <AppInput
                label="New Password"
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="At least 8 characters"
                secureTextEntry
              />
              <AppInput
                label="Confirm New Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />
              <PrimaryButton
                title="Reset Password"
                onPress={handleResetPassword}
                disabled={isSubmitting || step === "done"}
              />
            </>
          )}

          {isSubmitting ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}
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
    container: {
      flexGrow: 1,
    },
    headerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: moderateVerticalScale(10),
    },
    title: {
      fontSize: TextStyles.title,
      fontWeight: "800",
      color: colors.text,
      textAlign: "center",
      marginTop: moderateScale(8),
    },
    subtitle: {
      fontSize: TextStyles.body,
      color: colors.mutedText,
      textAlign: "center",
      marginTop: moderateScale(8),
      marginBottom: moderateScale(22),
    },
    errorText: {
      color: colors.danger,
      fontSize: TextStyles.body,
      textAlign: "center",
      marginBottom: moderateScale(12),
    },
    infoText: {
      color: colors.primary,
      fontSize: TextStyles.body,
      textAlign: "center",
      marginBottom: moderateScale(12),
    },
    spinner: {
      marginTop: moderateScale(10),
    },
  });
