import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import PrimaryButton from "../../components/ui/PrimaryButton";
import { AppInput } from "../../components/ui/AppInput";
import { authApi } from "../../api/authApi";
import { apiErrorMessage } from "../../api/http";
import { tokenStorage } from "../../api/tokenStorage";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

/**
 * Settings → Change password. Verifies the current password, then signs out every
 * OTHER device/session — this one keeps working (its refresh token is preserved).
 */
export default function ChangePasswordScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("New passwords don't match");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      await authApi.changePassword(currentPassword, newPassword, refreshToken);
      Alert.alert("Password updated", "Any other devices have been signed out.", [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not change your password"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BackButton />
            <Text style={styles.headerTitle}>Change password</Text>
          </View>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <AppInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="••••••••"
            secureTextEntry
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

          <PrimaryButton title="Update Password" onPress={handleSubmit} disabled={isSubmitting} />
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
    errorText: {
      color: colors.danger,
      fontSize: TextStyles.body,
      marginBottom: moderateVerticalScale(12),
    },
  });
