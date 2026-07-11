import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function CategoryChip({ label, active, onPress }: Props) {
  const { colors } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.card, borderColor: colors.border },
        active && { backgroundColor: colors.primary, borderColor: colors.primary },
        pressed && { opacity: 0.7, transform: [{ scale: 0.97 }] },
      ]}
    >
      <Text style={[styles.text, { color: colors.mutedText }, active && { color: colors.white }]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: moderateScale(42),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(999),
    borderWidth: moderateScale(1),
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    fontSize: scale(15),
    fontWeight: "700",
  },
});