import React from "react";
import { Switch } from "react-native";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function AppToggle({ value, onValueChange }: Props) {
  const { colors } = useTheme();
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: colors.border, true: colors.primary }}
      thumbColor="#FFFFFF"
    />
  );
}