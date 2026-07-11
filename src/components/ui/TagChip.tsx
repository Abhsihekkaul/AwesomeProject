import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function TagChip({ label, active, onPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  chip: {
    height: moderateScale(36),
    paddingHorizontal: moderateScale(14),
    borderRadius: moderateScale(999),
    backgroundColor: colors.lightBlue,
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    backgroundColor: colors.primary,
  },
  text: {
    color: colors.text,
    fontSize: scale(14),
    fontWeight: "700",
  },
  activeText: {
    color: colors.white,
  },
});