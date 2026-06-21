import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  title: string;
  subtitle: string;
  time: string;
};

export default function NotificationCard({
  title,
  subtitle,
  time,
}: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.icon} />

      <View style={{ flex: 1 }}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <Text style={styles.time}>{time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: moderateScale(18),
    borderBottomWidth: moderateScale(1),
    borderBottomColor: "#EDF1F7",
  },
  icon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: "#EEE7FF",
    marginRight: moderateScale(12),
  },
  title: {
    fontSize: scale(18),
    fontWeight: "700",
    color: "#1F314A",
  },
  subtitle: {
    marginTop: moderateScale(4),
    color: "#6F87A6",
  },
  time: {
    marginTop: moderateScale(6),
    color: "#6F87A6",
    fontSize: scale(13),
  },
});