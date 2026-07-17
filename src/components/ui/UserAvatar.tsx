import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { moderateScale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  initials: string;
  /** Profile photo (data-URI or URL). Falls back to initials when absent. */
  uri?: string | null;
  size?: number;
  bg?: string;
  color?: string;
  MarginRightSide?: number;
};

export default function UserAvatar({
  initials,
  uri,
  size = moderateScale(40),
  bg,
  color,
  MarginRightSide = moderateScale(8),
}: Props) {
  const { colors } = useTheme();
  const resolvedBg = bg ?? colors.lightPurple;
  const resolvedColor = color ?? colors.primary;

  return (
    <View
      style={[
        styles.avatar,
        {
          marginRight: moderateScale(MarginRightSide),
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: resolvedBg,
        },
      ]}
    >
      {uri ? (
        <Image source={{ uri }} style={{ width: size, height: size, borderRadius: size / 2 }} />
      ) : (
        <Text style={[styles.text, { color: resolvedColor, fontSize: size * 0.42 }]}>{initials}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  text: {
    fontWeight: "600",
  },
});
