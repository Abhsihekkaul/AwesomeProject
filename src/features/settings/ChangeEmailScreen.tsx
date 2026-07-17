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
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

/** Settings → Change email. Requires the current password (session ≠ proof of identity). */
export default function ChangeEmailScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, updateUser } = useAuth();

  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!newEmail.trim() || !password) {
      setErrorMessage("Enter your new email and current password");
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const updated = await authApi.changeEmail(newEmail.trim(), password);
      updateUser(updated);
      Alert.alert("Email updated", `You'll sign in as ${updated.email} from now on.`, [
        { text: "Done", onPress: () => navigation.goBack() },
      ]);
    } catch (err) {
      setErrorMessage(apiErrorMessage(err, "Could not change your email"));
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
            <Text style={styles.headerTitle}>Change email</Text>
          </View>

          <Text style={styles.current}>Current email: {user?.email ?? "—"}</Text>

          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

          <AppInput
            label="New Email Address"
            value={newEmail}
            onChangeText={setNewEmail}
            placeholder="new@email.com"
          />
          <AppInput
            label="Current Password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
          />

          <PrimaryButton title="Update Email" onPress={handleSubmit} disabled={isSubmitting} />
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
    current: {
      color: colors.mutedText,
      fontSize: TextStyles.body,
      marginBottom: moderateVerticalScale(16),
    },
    errorText: {
      color: colors.danger,
      fontSize: TextStyles.body,
      marginBottom: moderateVerticalScale(12),
    },
  });
