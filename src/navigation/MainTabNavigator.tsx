import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "@react-native-community/blur";
import { useRoute } from "@react-navigation/native";
import PagerView from "react-native-pager-view";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ChatsScreen from "../features/chat/ChatsScreen";
import GroupsScreen from "../features/groups/GroupsScreen";
import PsychologicalHelpScreen from "../features/help/PsychologicalHelpScreen";
import HomeScreen from "../features/home/HomeScreen";
import ProfileScreen from "../features/profile/ProfileScreen";

import {
  moderateScale,
  moderateVerticalScale,
} from "react-native-size-matters";

import imagePath from "../constant/imagePath";
import { TextStyles } from "../theme/typography";
import { useTheme } from "../theme/ThemeContext";
import { useChatNotifications } from "../context/ChatNotificationsContext";

const TAB_BAR_HEIGHT = moderateVerticalScale(70);

const tabs = [
  { key: "Home", label: "Home", icon: imagePath.HomeIcon, component: HomeScreen },
  { key: "Groups", label: "Groups", icon: imagePath.GroupIcon, component: GroupsScreen },
  { key: "Chats", label: "Chats", icon: imagePath.ChatIcon, component: ChatsScreen },
  { key: "Help", label: "Help", icon: imagePath.HelpIcon, component: PsychologicalHelpScreen },
  { key: "Profile", label: "Profile", icon: imagePath.User, component: ProfileScreen },
];

const TabItem = ({
  tab,
  focused,
  onPress,
  badge = 0,
}: {
  tab: (typeof tabs)[number];
  focused: boolean;
  onPress: () => void;
  /** Unread count pill on the icon (the Chats tab's message badge). */
  badge?: number;
}) => {
  const { colors, resolvedScheme } = useTheme();
  const styles = makeStyles(colors, resolvedScheme);
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(progress, {
      toValue: focused ? 1 : 0,
      duration: 160,
      useNativeDriver: false,
    }).start();
  }, [focused, progress]);

  const backgroundColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ["transparent", colors.lightPurple],
  });
  const labelColor = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.mutedText, colors.primary],
  });
  const iconTint = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.mutedText, colors.primary],
  });
  const iconOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.7, 1],
  });

  return (
    <Pressable onPress={onPress} style={styles.tabItem}>
      <Animated.View style={[styles.tabItemBg, { backgroundColor }]}>
        <View>
          <Animated.Image
            source={tab.icon}
            style={[styles.tabIcon, { opacity: iconOpacity, tintColor: iconTint }]}
          />
          {badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? "99+" : badge}</Text>
            </View>
          ) : null}
        </View>
        <Animated.Text style={[styles.tabLabel, { color: labelColor }]}>{tab.label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
};

export default function MainTabNavigator() {
  const { colors, resolvedScheme } = useTheme();
  const styles = makeStyles(colors, resolvedScheme);
  const insets = useSafeAreaInsets();
  const route = useRoute<any>();
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();
  // Total unread messages → count pill on the Chats tab (0 when signed out).
  const { unreadTotal } = useChatNotifications();

  // Deep-link into a tab: navigate("MainTabs", { tab: "Chats" }) selects it
  // (used by the share sheet's "See all in Chats").
  useEffect(() => {
    const tabKey = route.params?.tab;
    if (!tabKey) return;
    const index = tabs.findIndex((t) => t.key === tabKey);
    if (index >= 0) {
      setActiveIndex(index);
      pagerRef.current?.setPageWithoutAnimation(index);
    }
  }, [route.params?.tab]);

  const onTabPress = (index: number) => {
    setActiveIndex(index);
    // Animate only between adjacent tabs; jumping across several pages
    // makes the intermediate screens flash past, which feels worse.
    if (Math.abs(index - activeIndex) === 1) {
      pagerRef.current?.setPage(index);
    } else {
      pagerRef.current?.setPageWithoutAnimation(index);
    }
  };

  return (
    <View style={styles.container}>
      <PagerView
        ref={pagerRef}
        style={styles.pager}
        initialPage={0}
        onPageSelected={(e) => setActiveIndex(e.nativeEvent.position)}
      >
        {tabs.map((tab) => {
          const ScreenComponent = tab.component;
          return (
            <View key={tab.key} style={{ flex: 1, width }}>
              <ScreenComponent />
            </View>
          );
        })}
      </PagerView>

      {/* Truly floating pill: absolutely positioned so it reserves no layout space —
          the pager fills the whole screen and content scrolls behind the bar.
          On iOS the pill is frosted glass (BlurView) so the content shows through. */}
      <View style={[styles.tabBarWrap, { bottom: Math.max(insets.bottom, moderateVerticalScale(10)) }]}>
        <View style={styles.tabBar}>
          {Platform.OS === "ios" ? (
            <BlurView
              style={StyleSheet.absoluteFill}
              blurType={resolvedScheme === "dark" ? "chromeMaterialDark" : "chromeMaterialLight"}
              blurAmount={18}
            />
          ) : null}
          {tabs.map((tab, index) => (
            <TabItem
              key={tab.key}
              tab={tab}
              focused={activeIndex === index}
              onPress={() => onTabPress(index)}
              badge={tab.key === "Chats" ? unreadTotal : 0}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const makeStyles = (
  colors: ReturnType<typeof useTheme>["colors"],
  resolvedScheme: ReturnType<typeof useTheme>["resolvedScheme"],
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    pager: {
      flex: 1,
    },
    // Outer wrapper carries position + shadow; the inner pill clips the blur to its shape
    // (shadow and overflow:hidden can't live on the same view without artifacts).
    tabBarWrap: {
      position: "absolute",
      left: moderateScale(12),
      right: moderateScale(12),
      borderRadius: TAB_BAR_HEIGHT / 2,
      shadowColor: colors.black,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
      elevation: 8,
      backgroundColor: "transparent",
    },
    tabBar: {
      height: TAB_BAR_HEIGHT,
      paddingVertical: moderateVerticalScale(8),
      paddingHorizontal: moderateScale(10),
      borderRadius: TAB_BAR_HEIGHT / 2,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: "hidden",
      // iOS: translucent tint over the blur = frosted glass. Android: solid card (no BlurView).
      backgroundColor: Platform.select({
        ios: resolvedScheme === "dark" ? "rgba(29,31,41,0.45)" : "rgba(255,255,255,0.45)",
        default: colors.card,
      }),
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    tabItem: {
      flex: 1,
      marginHorizontal: moderateScale(4),
    },
    tabItemBg: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: moderateVerticalScale(8),
      borderRadius: moderateScale(14),
    },
    tabIcon: {
      height: moderateVerticalScale(20),
      width: moderateScale(20),
      resizeMode: "contain",
      marginBottom: 4,
    },
    tabLabel: {
      fontSize: TextStyles.caption,
      fontWeight: "500",
    },
    badge: {
      position: "absolute",
      top: -moderateVerticalScale(5),
      right: -moderateScale(10),
      minWidth: moderateScale(16),
      height: moderateScale(16),
      borderRadius: moderateScale(8),
      backgroundColor: colors.danger,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: moderateScale(3),
    },
    badgeText: {
      color: colors.white,
      fontSize: moderateScale(9),
      fontWeight: "700",
      fontVariant: ["tabular-nums"],
    },
  });
