import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
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
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from "../../api/config";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { useT } from "../../i18n";
import { TextStyles } from "../../theme/typography";

type AuthTab = "signin" | "signup";

// Each tab owns its own form state — typing on Sign In must never leak into Sign Up
// (shared fields silently carried a password across tabs before).
const emptySignIn = { email: "", password: "" };
const emptySignUp = { fullName: "", email: "", password: "", confirmPassword: "" };

const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<AuthTab>("signin");

  const [signInForm, setSignInForm] = useState(emptySignIn);
  const [signUpForm, setSignUpForm] = useState(emptySignUp);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { signIn, signUp, signInWithGoogle } = useAuth();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const t = useT();

  const isSignIn = tab === "signin";

  // A stale error from one tab shouldn't hang over the other.
  const switchTab = (next: AuthTab) => {
    setErrorMessage(null);
    setTab(next);
  };

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
      await signIn(signInForm.email.trim(), signInForm.password);
      goToMainTabs();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSignUpSubmit = async () => {
    if (signUpForm.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters");
      return;
    }
    if (signUpForm.password !== signUpForm.confirmPassword) {
      setErrorMessage("Passwords don't match");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await signUp(signUpForm.email.trim(), signUpForm.password, signUpForm.fullName.trim());
      navigation.navigate("ProfileSetup");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Demo contract (FinalCheckpoint.md): "Try the Demo" = signed-out browsing of the
  // built-in dummy data — no account, no backend, straight to the main tabs.
  const handleDemoSignIn = () => {
    goToMainTabs();
  };

  /**
   * Google sign-in: native account picker → id token → backend verify.
   * Requires OAuth client IDs (GoogleSignInSetup.md); until they're pasted into
   * src/api/config.ts the button explains what's missing instead of crashing.
   * The native module is require()d lazily so the app still runs before a rebuild.
   */
  const handleGoogleSignIn = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      setErrorMessage("Google sign-in isn't set up yet — see GoogleSignInSetup.md");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const { GoogleSignin } = require("@react-native-google-signin/google-signin");
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        ...(GOOGLE_IOS_CLIENT_ID ? { iosClientId: GOOGLE_IOS_CLIENT_ID } : {}),
      });
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const result = await GoogleSignin.signIn();
      const idToken: string | undefined = result?.data?.idToken ?? result?.idToken;
      if (!idToken) throw new Error("Google didn't return an id token");
      await signInWithGoogle(idToken);
      goToMainTabs();
    } catch (err: any) {
      // User closing the account picker isn't an error worth showing.
      if (err?.code !== "SIGN_IN_CANCELLED" && err?.code !== -5) {
        setErrorMessage(err instanceof Error ? err.message : "Google sign-in failed");
      }
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
          // Without this, the first tap on any button while the keyboard is open only
          // dismisses the keyboard on iOS — the sign-in button felt dead there.
          keyboardShouldPersistTaps="handled"
        >
          {/* Design-v2 brand lockup: the infinity mark above the title (same ∞ the web TopBar and splash use). */}
          <Image source={imagePath.InfinityMark} style={styles.brandMark} resizeMode="contain" />

          <Text style={styles.title}>
            {isSignIn ? t("welcomeBack") : "HealingSathi"}
          </Text>

          <Text style={styles.subtitle}>
            {isSignIn
              ? "Sign in to your safe space"
              : "Start your healing journey today"}
          </Text>

          <AuthTabSwitch value={tab} onChange={switchTab} />

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          {isSignIn ? (
            <>
              <AppInput
                label="Email Address"
                value={signInForm.email}
                onChangeText={(email) => setSignInForm((f) => ({ ...f, email }))}
                placeholder="your@email.com"
              />

              <AppInput
                label={t("password")}
                value={signInForm.password}
                onChangeText={(password) => setSignInForm((f) => ({ ...f, password }))}
                placeholder="••••••••"
                secureTextEntry
              />

              <Pressable
                style={styles.forgot}
                onPress={() => navigation.navigate("ForgotPassword", { email: signInForm.email.trim() })}
              >
                <Text style={styles.forgotText}>{t("forgotPassword")}</Text>
              </Pressable>

              <PrimaryButton
                title="Sign In Securely"
                onPress={handleSignInSubmit}
                disabled={isSubmitting}
              />

              <Pressable
                style={styles.emailCodeLink}
                onPress={() => navigation.navigate("EmailCode", { email: signInForm.email.trim() })}
                hitSlop={6}
              >
                <Text style={styles.forgotText}>Or email me a sign-in code</Text>
              </Pressable>
            </>
          ) : (
            <>
              <AppInput
                label="Full Name"
                value={signUpForm.fullName}
                onChangeText={(fullName) => setSignUpForm((f) => ({ ...f, fullName }))}
                placeholder="Your name"
              />

              <AppInput
                label="Email Address"
                value={signUpForm.email}
                onChangeText={(email) => setSignUpForm((f) => ({ ...f, email }))}
                placeholder="your@email.com"
              />

              <AppInput
                label="Password"
                value={signUpForm.password}
                onChangeText={(password) => setSignUpForm((f) => ({ ...f, password }))}
                placeholder="At least 8 characters"
                secureTextEntry
              />

              <AppInput
                label="Confirm Password"
                value={signUpForm.confirmPassword}
                onChangeText={(confirmPassword) => setSignUpForm((f) => ({ ...f, confirmPassword }))}
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
              onPress={handleGoogleSignIn}
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

  brandMark: {
    alignSelf: "center",
    width: moderateScale(44),
    height: moderateScale(44),
    marginTop: moderateScale(6),
    tintColor: colors.primary,
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
  emailCodeLink: {
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