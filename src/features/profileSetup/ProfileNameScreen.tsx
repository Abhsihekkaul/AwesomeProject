import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";
import { AppInput } from "../../components/ui/AppInput";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { StepIndicator } from "../../components/ui/StepIndicator";
import UserAvatar from "../../components/ui/UserAvatar";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";

const ProfileNameScreen = ({ navigation }: any) => {
  const [name, setName] = useState("Sarah");
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Avatar color pairs pulled from the theme so they adapt to dark mode
  const avatarColors = [
    { key: "purple", bg: colors.lightPurple, fg: colors.primary },
    { key: "blue", bg: colors.lightBlue, fg: colors.info },
    { key: "green", bg: colors.lightGreen, fg: colors.success },
    { key: "orange", bg: colors.lightOrange, fg: colors.warning },
  ];
  const [avatarColorKey, setAvatarColorKey] = useState("purple");
  const activeColor = avatarColors.find((c) => c.key === avatarColorKey) ?? avatarColors[0];

  return (
    <ScreenWrapper>
      <StepIndicator total={3} current={0} />
      <Text style={styles.step}>Step 1 of 3</Text>
      <Text style={styles.title}>Create your profile</Text>
      <Text style={styles.subtitle}>This is how others in your circles will know you.</Text>

      <View style={styles.avatarWrap}>
        <UserAvatar
          initials={name.trim() ? name.trim()[0].toUpperCase() : "S"}
          size={140}
          bg={activeColor.bg}
          color={activeColor.fg}
        />
      </View>

      <Text style={styles.colorLabel}>Choose your color</Text>

      <View style={styles.swatchRow}>
        {avatarColors.map((c) => {
          const selected = c.key === avatarColorKey;
          return (
            <Pressable
              key={c.key}
              onPress={() => setAvatarColorKey(c.key)}
              style={[styles.swatch, { backgroundColor: c.bg }, selected && { borderColor: c.fg }]}
            >
              <View style={[styles.swatchDot, { backgroundColor: c.fg }]} />
            </Pressable>
          );
        })}
      </View>

      <AppInput
        label="Display Name"
        value={name}
        onChangeText={setName}
        placeholder="Your name"
      />

      <Text style={styles.helper}>
        This can be a nickname — your real name is never required.
      </Text>

      <View style={{ flex: 1 }} />
      <PrimaryButton title="Continue" onPress={() => navigation.navigate("HealthJourney")} />
    </ScreenWrapper>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    step: {
      color: colors.mutedText,
      fontSize: TextStyles.stepCounts,
      marginTop: moderateVerticalScale(18),
    },

    title: {
      fontSize: TextStyles.title,
      fontWeight: "600",
      color: colors.text,
      marginTop: moderateVerticalScale(6),
    },

    subtitle: {
      fontSize: TextStyles.body,
      color: colors.mutedText,
      marginTop: 8,
    },

    avatarWrap: {
      alignSelf: "center",
      marginTop: moderateVerticalScale(32),
    },

    colorLabel: {
      textAlign: "center",
      color: colors.mutedText,
      fontSize: TextStyles.body,
      marginTop: moderateVerticalScale(18),
      marginBottom: moderateVerticalScale(8),
    },

    swatchRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: moderateScale(14),
      marginBottom: moderateVerticalScale(20),
    },

    swatch: {
      width: moderateScale(44),
      height: moderateScale(44),
      borderRadius: moderateScale(22),
      alignItems: "center",
      justifyContent: "center",
      borderWidth: 2,
      borderColor: "transparent",
    },

    swatchDot: {
      width: moderateScale(18),
      height: moderateScale(18),
      borderRadius: moderateScale(9),
    },

    helper: {
      color: colors.mutedText,
      fontSize: TextStyles.stepCounts,
      marginTop: moderateVerticalScale(8),
    },
  });


export default ProfileNameScreen