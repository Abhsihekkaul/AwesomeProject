import React from "react";
import { View, Text, Switch, StyleSheet } from "react-native";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  title: string;
  subtitle: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export default function SettingRow({
  title,
  subtitle,
  value,
  onValueChange,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>

      <Switch value={value} onValueChange={onValueChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: moderateScale(18),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#EDF1F7",
  },
  left: {
    flex: 1,
    marginRight: moderateScale(12),
  },
  title: {
    fontSize: scale(17),
    fontWeight: "700",
    color: "#1F314A",
  },
  subtitle: {
    marginTop: moderateScale(1),
    color: "#6F87A6",
    fontSize: scale(14),
  },
});