import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

/**
 * Passwordless sign-in: enter your email → a 6-digit code arrives in your inbox →
 * the code signs you in. (Dev builds without SMTP configured get the code back
 * from the server and pre-fill it.)
 */
export default function EmailCodeScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { signInWithEmailCode } = useAuth();

  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState(route?.params?.email ?? "");
  const [code, setCode] = useState("");
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
      const result = await authApi.requestEmailCode(email.trim());
      if (result.devCode) setCode(result.devCode); // dev builds only
      setInfoMessage(result.message);
      setStep("code");
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not send a sign-in code"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (code.trim().length !== 6) {
      setErrorMessage("Enter the 6-digit code from your email");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signInWithEmailCode(email.trim(), code.trim());
      navigation.reset({ index: 0, routes: [{ name: "MainTabs" }] });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not sign in");
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

          <Text style={styles.title}>Sign in with email</Text>
          <Text style={styles.subtitle}>
            {step === "email"
              ? "No password needed — we'll email you a one-time code."
              : `Enter the 6-digit code we sent to ${email.trim()}.`}
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
              <PrimaryButton title="Email Me a Code" onPress={handleRequestCode} disabled={isSubmitting} />
            </>
          ) : (
            <>
              <AppInput
                label="Sign-in Code"
                value={code}
                onChangeText={setCode}
                placeholder="6-digit code"
              />
              <PrimaryButton title="Sign In" onPress={handleVerify} disabled={isSubmitting} />
              <PrimaryButton
                title="Resend Code"
                onPress={handleRequestCode}
                disabled={isSubmitting}
                size="compact"
                style={styles.resend}
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
    resend: {
      alignSelf: "center",
      marginTop: moderateScale(14),
    },
    spinner: {
      marginTop: moderateScale(10),
    },
  });
