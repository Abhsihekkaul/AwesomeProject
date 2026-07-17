import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import UserAvatar from "./UserAvatar";
import { useChatNotifications } from "../../context/ChatNotificationsContext";
import { navigateFromAnywhere } from "../../navigation/navigationRef";
import { useTheme } from "../../theme/ThemeContext";
import { TextStyles } from "../../theme/typography";
import { radius } from "../../theme/radius";

const initialsOf = (name: string) =>
  name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

/**
 * In-app "new message" popup — slides down from the top on any screen (it lives
 * above the navigator, like the call overlay). Tap it to jump into the chat;
 * it dismisses itself after a few seconds or on the ✕.
 */
export default function ChatMessageBanner() {
  const { banner, dismissBanner } = useChatNotifications();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const slide = useRef(new Animated.Value(-120)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: banner ? 0 : -120,
      useNativeDriver: true,
      speed: 16,
      bounciness: 6,
    }).start();
  }, [banner, slide]);

  if (!banner) return null;

  const openChat = () => {
    dismissBanner();
    navigateFromAnywhere("ChatRoom", {
      chatId: banner.chatId,
      name: banner.fromName,
      initials: initialsOf(banner.fromName),
      userId: banner.fromUserId,
    });
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.host} pointerEvents="box-none">
      <Animated.View style={[styles.card, { transform: [{ translateY: slide }] }]}>
        <Pressable style={styles.body} onPress={openChat}>
          <UserAvatar initials={initialsOf(banner.fromName)} size={38} />
          <View style={styles.textWrap}>
            <Text style={styles.name} numberOfLines={1}>{banner.fromName}</Text>
            <Text style={styles.preview} numberOfLines={1}>{banner.preview}</Text>
          </View>
        </Pressable>
        <Pressable hitSlop={10} onPress={dismissBanner}>
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </Animated.View>
    </SafeAreaView>
  );
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    host: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
    },
    card: {
      flexDirection: "row",
      alignItems: "center",
      marginHorizontal: moderateScale(12),
      marginTop: moderateVerticalScale(6),
      paddingHorizontal: moderateScale(12),
      paddingVertical: moderateVerticalScale(10),
      backgroundColor: colors.card,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.16,
      shadowRadius: 12,
      elevation: 10,
    },
    body: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
    },
    textWrap: {
      flex: 1,
      marginLeft: moderateScale(10),
      marginRight: moderateScale(8),
    },
    name: {
      color: colors.text,
      fontSize: TextStyles.body,
      fontWeight: "700",
    },
    preview: {
      color: colors.mutedText,
      fontSize: TextStyles.caption,
      marginTop: moderateVerticalScale(2),
    },
    close: {
      color: colors.mutedText,
      fontSize: scale(14),
      fontWeight: "600",
      paddingHorizontal: moderateScale(4),
    },
  });
