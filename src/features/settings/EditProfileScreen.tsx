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
import UserAvatar from "../../components/ui/UserAvatar";
import { AppInput } from "../../components/ui/AppInput";
import { authApi } from "../../api/authApi";
import { apiErrorMessage } from "../../api/http";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

// Named avatar colors — the backend stores the key; every client maps it to a hue.
const AVATAR_COLORS: { key: string; hex: string }[] = [
  { key: "purple", hex: "#7C6FE8" },
  { key: "blue", hex: "#4A90D9" },
  { key: "green", hex: "#3FA47A" },
  { key: "orange", hex: "#E8955C" },
  { key: "pink", hex: "#D96BA0" },
  { key: "teal", hex: "#3AA6A6" },
];

/** Settings → Edit profile: name, avatar color and health conditions. */
export default function EditProfileScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [avatarColor, setAvatarColor] = useState(user?.avatarColor ?? "purple");
  const [conditions, setConditions] = useState<string[]>(user?.conditions ?? []);
  const [conditionDraft, setConditionDraft] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const initials = (name.trim() || "?")
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const addCondition = () => {
    const value = conditionDraft.trim();
    if (value && !conditions.includes(value)) setConditions([...conditions, value]);
    setConditionDraft("");
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Your profile needs a display name.");
      return;
    }
    setIsSaving(true);
    try {
      const updated = await authApi.updateMe({ name: name.trim(), avatarColor, conditions });
      updateUser(updated);
      Alert.alert("Profile updated", "", [{ text: "Done", onPress: () => navigation.goBack() }]);
    } catch (err) {
      Alert.alert("Couldn't save", apiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  const selectedHex = AVATAR_COLORS.find((c) => c.key === avatarColor)?.hex ?? AVATAR_COLORS[0].hex;

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <View style={styles.headerRow}>
            <BackButton />
            <Text style={styles.headerTitle}>Edit profile</Text>
          </View>

          <View style={styles.avatarRow}>
            <UserAvatar initials={initials} size={moderateScale(72)} bg={selectedHex} color="#FFFFFF" />
          </View>

          <AppInput label="Display Name" value={name} onChangeText={setName} placeholder="Your name" />

          <Text style={styles.sectionLabel}>Avatar color</Text>
          <View style={styles.colorRow}>
            {AVATAR_COLORS.map((c) => (
              <Pressable
                key={c.key}
                onPress={() => setAvatarColor(c.key)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c.hex },
                  avatarColor === c.key && styles.colorDotActive,
                ]}
              />
            ))}
          </View>

          <Text style={styles.sectionLabel}>My conditions</Text>
          <Text style={styles.sectionHint}>Tap a condition to remove it.</Text>
          <View style={styles.chipsRow}>
            {conditions.map((c) => (
              <TagChip
                key={c}
                label={c}
                active
                onPress={() => setConditions(conditions.filter((x) => x !== c))}
              />
            ))}
          </View>
          <AppInput
            label="Add a condition"
            value={conditionDraft}
            onChangeText={setConditionDraft}
            placeholder="e.g. Fibromyalgia"
            rightElement={
              <Pressable onPress={addCondition} hitSlop={8}>
                <Text style={styles.addText}>Add</Text>
              </Pressable>
            }
          />

          <PrimaryButton title="Save Changes" onPress={handleSave} disabled={isSaving} />
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
      marginBottom: moderateVerticalScale(16),
    },
    headerTitle: {
      fontSize: TextStyles.heading,
      fontWeight: "500",
      color: colors.text,
    },
    avatarRow: {
      alignItems: "center",
      marginBottom: moderateVerticalScale(20),
    },
    sectionLabel: {
      color: colors.text,
      fontSize: TextStyles.body,
      fontWeight: "600",
      marginBottom: moderateVerticalScale(10),
    },
    sectionHint: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(8),
    },
    colorRow: {
      flexDirection: "row",
      gap: moderateScale(12),
      marginBottom: moderateVerticalScale(20),
    },
    colorDot: {
      width: moderateScale(36),
      height: moderateScale(36),
      borderRadius: radius.xl,
    },
    colorDotActive: {
      borderWidth: moderateScale(3),
      borderColor: colors.text,
    },
    chipsRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: moderateScale(8),
      marginBottom: moderateVerticalScale(12),
    },
    addText: {
      color: colors.primary,
      fontWeight: "600",
      fontSize: TextStyles.body,
    },
  });
