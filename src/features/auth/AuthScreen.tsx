import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { moderateScale } from "react-native-size-matters";
import { AppInput } from "../../components/ui/AppInput";
import { AuthTabSwitch } from "../../components/ui/AuthTabSwitch";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import imagePath from "../../constant/imagePath";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

type AuthTab = "signin" | "signup";

const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<AuthTab>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const isSignIn = tab === "signin";

  const goToMainTabs = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    });
  };

  const handleSignInSubmit = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signIn(email.trim(), password);
      goToMainTabs();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signUp(email.trim(), password, fullName.trim());
      navigation.navigate("ProfileSetup");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const handleDemoSignIn = async () => {
  //   setErrorMessage(null);
  //   setIsSubmitting(true);
  //   try {
  //     await signInDemo();
  //     goToMainTabs();
  //   } catch (err) {
  //     setErrorMessage(err instanceof Error ? err.message : "Demo sign-in failed");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // };

  const handleDemoSignIn = () => {
    navigation.navigate("ProfileSetup");
  }

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          // Without this, the first tap on any button while the keyboard is open only
          // dismisses the keyboard on iOS — the sign-in button felt dead there.
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isSignIn ? "Welcome back" : "HealingSathi"}
          </Text>

          <Text style={styles.subtitle}>
            {isSignIn
              ? "Sign in to your safe space"
              : "Start your healing journey today"}
          </Text>

          <AuthTabSwitch value={tab} onChange={setTab} />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {isSignIn ? (
            <>
              <AppInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
              />

              <AppInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <Pressable style={styles.forgot}>
                <Text style={styles.forgotText}>Forgot password?</Text>
              </Pressable>

              <PrimaryButton
                title="Sign In Securely"
                onPress={handleSignInSubmit}
                disabled={isSubmitting}
              />
            </>
          ) : (
            <>
              <AppInput
                label="Full Name"
                value={fullName}
                onChangeText={setFullName}
                placeholder="Your name"
              />

              <AppInput
                label="Email Address"
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
              />

              <AppInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <AppInput
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                secureTextEntry
              />

              <PrimaryButton
                title="Create My Account"
                onPress={handleSignUpSubmit}
                disabled={isSubmitting}
              />
            </>
          )}

          <PrimaryButton
            title="Try the Demo"
            onPress={handleDemoSignIn}
            disabled={isSubmitting}
            size="compact"
            style={styles.demoButton}
          />

          {isSubmitting ? <ActivityIndicator color={colors.primary} style={styles.spinner} /> : null}

          <View style={styles.dividerRow}>
            <View style={styles.line} />
            <Text style={styles.or}>or continue with</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialRow}>
            <SecondaryButton
              icon={imagePath.googleIcon}
              title="Google"
              onPress={() => { }}
              style={styles.socialBtn}
            />

            <SecondaryButton
              icon={imagePath.appleIcons}
              title="Apple"
              onPress={() => { }}
              style={styles.socialBtn}
            />
          </View>

          {isSignIn ? (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                Your data is encrypted and never sold. We follow strict medical-grade
                privacy standards.
              </Text>
            </View>
          ) : (
            <View style={styles.note}>
              <Text style={styles.noteText}>
                By creating an account, you agree to keep your information secure and
                private.
              </Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
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
  forgot: {
    alignSelf: "flex-end",
    marginTop: moderateScale(2),
    marginBottom: moderateScale(18)
  },
  forgotText: {
    color: colors.primary,
    fontSize: TextStyles.body,
    fontWeight: "600"
  },
  errorText: {
    color: colors.danger,
    fontSize: TextStyles.body,
    textAlign: "center",
    marginBottom: moderateScale(12),
  },
  demoButton: {
    alignSelf: "center",
    marginTop: moderateScale(14),
  },
  spinner: {
    marginTop: moderateScale(10),
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: moderateScale(20),
  },
  line: {
    flex: 1,
    height: moderateScale(1),
    backgroundColor: colors.border
  },
  or: {
    color: colors.mutedText,
    fontSize: TextStyles.body,
  },
  
  socialRow: {
    flexDirection: "row",
    gap: moderateScale(12)
  },
  socialBtn: {
   flex: 1
  },
  note: {
    marginTop: moderateScale(18),
    backgroundColor: colors.lightBlue,
    borderRadius: moderateScale(20),
    padding: moderateScale(8),
    paddingHorizontal: moderateScale(12),
  },
  noteText: {
    color: colors.primary,
    fontSize: TextStyles.caption,
    lineHeight: moderateScale(22),
  },
});

export default AuthScreen;