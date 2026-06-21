import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { moderateScale, scale } from "react-native-size-matters";
import { AppInput } from "../../components/ui/AppInput";
import { AuthTabSwitch } from "../../components/ui/AuthTabSwitch";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { SecondaryButton } from "../../components/ui/SecondaryButton";
import imagePath from "../../constant/imagePath";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";

type AuthTab = "signin" | "signup";

const AuthScreen = ({ navigation }: any) => {
  const [tab, setTab] = useState<AuthTab>("signin");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const isSignIn = tab === "signin";

  const handleSignInSubmit = () => {
    // You can replace this with real auth logic later
    navigation.reset({
      index: 0,
      routes: [{ name: "MainTabs" }],
    })
  };

  const handleSignUpSubmit = () => {
    // You can replace this with real auth logic later
    navigation.navigate("ProfileSetupScreen");
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
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
              />
            </>
          )}

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

const styles = StyleSheet.create({
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
    color: "#6F87A6",
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
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginVertical: moderateScale(20),
  },
  line: {
    flex: 1,
    height: moderateScale(1),
    backgroundColor: "#DDE5F2"
  },
  or: {
    color: "#6F87A6",
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
    backgroundColor: "#EBF1FB",
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