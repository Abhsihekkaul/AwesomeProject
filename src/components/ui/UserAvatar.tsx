import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";

type Props = {
  initials: string;
  size?: number;
  bg?: string;
  color?: string;
  MarginRightSide?: number;
};

export default function UserAvatar({
  initials,
  size = moderateScale(40),
  bg = "#E9E3FB",
  color = "#7453C8",
  MarginRightSide = moderateScale(8),
}: Props) {
  return (
    <View style={[styles.avatar, { marginRight: moderateScale(MarginRightSide), width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <Text style={[styles.text, { color, fontSize: size * 0.42 }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontWeight: "600",
  },
});