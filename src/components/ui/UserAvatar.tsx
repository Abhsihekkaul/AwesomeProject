import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";

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
  bg,
  color,
  MarginRightSide = moderateScale(8),
}: Props) {
  const { colors } = useTheme();
  const resolvedBg = bg ?? colors.lightPurple;
  const resolvedColor = color ?? colors.primary;

  return (
    <View style={[styles.avatar, { marginRight: moderateScale(MarginRightSide), width: size, height: size, borderRadius: size / 2, backgroundColor: resolvedBg }]}>
      <Text style={[styles.text, { color: resolvedColor, fontSize: size * 0.42 }]}>{initials}</Text>
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