import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { colors } from "../../theme/colors";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  label: string;
  active?: boolean;
  onPress?: () => void;
};

export default function CategoryChip({ label, active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.active]}>
      <Text style={[styles.text, active && styles.activeText]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: moderateScale(42),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(999),
    backgroundColor: colors.white,
    borderWidth: moderateScale(1),
    borderColor: "#DCE5F3",
    justifyContent: "center",
    alignItems: "center",
  },
  active: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  text: {
    color: "#6F87A6",
    fontSize: scale(15),
    fontWeight: "700",
  },
  activeText: {
    color: colors.white,
  },
});