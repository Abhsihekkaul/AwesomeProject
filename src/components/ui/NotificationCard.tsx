import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import { colors } from "../../theme/colors";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

export type NotificationType = {
  type: string;
  title: string;
  message: string;
  time: string;
  color: string;
};

type Props = {
  notification: NotificationType;
};

export default function NotificationCard({ notification }: Props) {

  // Dynamically assign an icon based on the category
  const getIcon = () => {
    switch (notification.type) {
      case "Groups": return "👥";
      case "Chats": return "💬";
      case "System": return "⚙️";
      default: return "🔔";
    }
  };

  return (
    <View style={styles.container}>
      {/* Icon with a slight opacity background based on its primary color */}
      <View style={[styles.iconBox, { backgroundColor: notification.color + "15" }]}>
        <Text style={styles.iconText}>{getIcon()}</Text>
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: moderateScale(16),
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: 0.2,
    borderColor: "#b8bbc0",
    marginBottom: moderateVerticalScale(8),
    marginHorizontal: moderateScale(16),
  },
  iconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(14),
  },
  iconText: {
    fontSize: scale(20),
  },
  textContainer: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    fontSize: TextStyles.body,
    fontWeight: "700",
    color: colors.text,
  },
  message: {
    marginTop: moderateVerticalScale(4),
    color: "#6F87A6",
    fontSize: TextStyles.caption,
    lineHeight: scale(18),
  },
  time: {
    marginTop: moderateVerticalScale(8),
    color: "#A2B0C4",
    fontSize: scale(11),
    fontWeight: "600",
  },
});