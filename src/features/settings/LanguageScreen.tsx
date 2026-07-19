import React from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import BackButton from "../../components/ui/BackButton";
import imagePath from "../../constant/imagePath";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import { useLanguage, useT, LANGUAGE_STORAGE_KEY } from "../../i18n";

export { LANGUAGE_STORAGE_KEY };

// Only languages with real dictionaries (src/i18n) are offered — no options
// that silently fall back to English.
const LANGUAGES = [
  { code: "en", label: "English", native: "English" },
  { code: "hi", label: "Hindi", native: "हिन्दी" },
  { code: "es", label: "Spanish", native: "Español" },
];

/** Settings → Language: picks and persists the app language on-device. */
export default function LanguageScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const t = useT();

  // The provider persists the choice and re-renders the whole app's chrome live.
  const { language: selected, setLanguage: handleSelect } = useLanguage();

  return (
    <ScreenWrapper>
      <View style={styles.headerRow}>
        <BackButton />
        <Text style={styles.headerTitle}>{t("language")}</Text>
      </View>

      <Text style={styles.hint}>{t("languageScreenHint")}</Text>

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
