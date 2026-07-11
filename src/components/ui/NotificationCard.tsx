import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";
import imagePath from "../../constant/imagePath";

export type NotificationType = {
  type: string;
  title: string;
  message: string;
  time: string;
  color: string;
  unread?: boolean;
};

type Props = {
  notification: NotificationType;
};

export default function NotificationCard({ notification }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  // Dynamically assign an icon based on the category
  const getIcon = () => {
    switch (notification.type) {
      case "Groups": return imagePath.GroupIcon;
      case "Chats": return imagePath.ChatIcon;
      case "System": return imagePath.ShieldIcon;
      default: return imagePath.NotificationIcon;
    }
  };

  return (
    <View style={[styles.container, notification.unread && styles.containerUnread]}>
      {/* Icon with a slight opacity background based on its primary color */}
      <View style={[styles.iconBox, { backgroundColor: notification.color + "15" }]}>
        <Image
          source={getIcon()}
          style={[styles.icon, { tintColor: notification.color }]}
        />
      </View>

      <View style={styles.textContainer}>
        <Text style={styles.title}>{notification.title}</Text>
        <Text style={styles.message}>{notification.message}</Text>
        <Text style={styles.time}>{notification.time}</Text>
      </View>

      {notification.unread ? <View style={styles.unreadDot} /> : null}
    </View>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  container: {
    flexDirection: "row",
    padding: moderateScale(16),
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginBottom: moderateVerticalScale(8),
  },
  iconBox: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    alignItems: "center",
    justifyContent: "center",
    marginRight: moderateScale(14),
  },
  icon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
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
    color: colors.mutedText,
    fontSize: TextStyles.caption,
    lineHeight: scale(18),
  },
  time: {
    marginTop: moderateVerticalScale(8),
    color: colors.mutedText,
    fontSize: scale(11),
    fontWeight: "600",
  },
  containerUnread: {
    borderColor: colors.primary + "40",
    backgroundColor: colors.lightPurple + "55",
  },
  unreadDot: {
    width: moderateScale(9),
    height: moderateScale(9),
    borderRadius: moderateScale(5),
    backgroundColor: colors.primary,
    alignSelf: "center",
    marginLeft: moderateScale(8),
  },
});