import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import imagePath from "../../constant/imagePath";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

export const LANGUAGE_STORAGE_KEY = "healingsathi:language";

// Display strings only for now — full i18n (react-i18next) is a post-launch task;
// the persisted choice here is what that system will boot from.
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "ne", label: "Nepali", native: "नेपाली" },
  { code: "bn", label: "Bengali", native: "বাংলা" },
  { code: "ta", label: "Tamil", native: "தமிழ்" },
  { code: "es", label: "Spanish", native: "Español" },
];

/** Settings → Language: picks and persists the app language on-device. */
export default function LanguageScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [selected, setSelected] = useState("en");

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_STORAGE_KEY).then((stored) => {
      if (stored) setSelected(stored);
    });
  }, []);

  const handleSelect = async (code: string) => {
    setSelected(code);
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, code);
  };

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.headerTitle}>Language</Text>
      </View>

      <Text style={styles.hint}>
        Your choice is saved on this device. Translated content is rolling out gradually.
      </Text>

      <ScrollView showsVerticalScrollIndicator={false}>
        {LANGUAGES.map((lang) => {
          const active = selected === lang.code;
          return (
            <Pressable
              key={lang.code}
              style={[styles.row, active && styles.rowActive]}
              onPress={() => handleSelect(lang.code)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{lang.label}</Text>
                <Text style={styles.native}>{lang.native}</Text>
              </View>
              {active ? (
                <Image source={imagePath.RightIcon} style={styles.check} />
              ) : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </ScreenWrapper>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
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
    hint: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginBottom: moderateVerticalScale(16),
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: moderateScale(14),
      marginBottom: moderateVerticalScale(8),
    },
    rowActive: {
      borderColor: colors.primary,
      borderWidth: 1,
    },
    label: {
      fontSize: TextStyles.body,
      fontWeight: "600",
      color: colors.text,
    },
    native: {
      fontSize: TextStyles.caption,
      color: colors.mutedText,
      marginTop: moderateVerticalScale(2),
    },
    check: {
      width: moderateScale(14),
      height: moderateScale(14),
      resizeMode: "contain",
      tintColor: colors.primary,
    },
  });
