import React from "react";
import { Switch } from "react-native";

type Props = {
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function AppToggle({ value, onValueChange }: Props) {
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{ false: "#DDE5F2", true: "#4E79C7" }}
      thumbColor="#FFFFFF"
    />
  );
}