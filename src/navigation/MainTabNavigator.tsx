import React, { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import PagerView from "react-native-pager-view";

import HomeScreen from "../features/home/HomeScreen";
import GroupsScreen from "../features/groups/GroupsScreen";
import ChatsScreen from "../features/chat/ChatsScreen";
import PsychologicalHelpScreen from "../features/help/PsychologicalHelpScreen";
import ProfileScreen from "../features/profile/ProfileScreen";

import { colors } from "../theme/colors";
import {
  moderateScale,
  moderateVerticalScale,
  scale,
} from "react-native-size-matters";
import imagePath from "../constant/imagePath";

const tabs = [
  { key: "Home", label: "Home", icon: imagePath.HomeIcon, component: HomeScreen },
  { key: "Groups", label: "Groups", icon: imagePath.GroupIcon, component: GroupsScreen },
  { key: "Chats", label: "Chats", icon: imagePath.ChatIcon, component: ChatsScreen },
  { key: "Help", label: "Help", icon: imagePath.HelpIcon, component: PsychologicalHelpScreen },
  { key: "Profile", label: "Profile", icon: imagePath.User, component: ProfileScreen },
];

const emoji = (label: string, focused: boolean) => (
  <Text
    style={{
      fontSize: scale(18),
      color: focused ? colors.primary : "#8A9CB5",
    }}
  >
    {label}
  </Text>
);

export default function MainTabNavigator() {
  const pagerRef = useRef<PagerView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const { width } = useWindowDimensions();

  const onTabPress = (index: number) => {
    setActiveIndex(index);
    pagerRef.current?.setPage(index);
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

      <View style={styles.tabBar}>
        {tabs.map((tab, index) => {
          const focused = activeIndex === index;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabPress(index)}
              style={[styles.tabItem, focused && styles.tabItemFocused]}
            >
              <Image
                source={tab.icon}
                style={[
                  styles.tabIcon,
                  { opacity: focused ? 1 : 0.7 },
                ]}
              />
              <Text
                style={[
                  styles.tabLabel,
                  { color: focused ? "#007AFF" : "#8A9CB5" },
                ]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  pager: {
    flex: 1,
  },
  tabBar: {
    height: 70,
    paddingTop: 8,
    paddingBottom: 8,
    paddingHorizontal: 16,
    borderTopColor: "#E6ECF5",
    borderTopWidth: 1,
    backgroundColor: "white",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: moderateVerticalScale(8),
    borderRadius: moderateScale(14),
    marginHorizontal: moderateScale(4),
  },
  tabItemFocused: {
    backgroundColor: "#EEF1F5",
  },
  tabIcon: {
    height: moderateVerticalScale(20),
    width: moderateScale(20),
    resizeMode: "contain",
    marginBottom: 4,
  },
  tabLabel: {
    fontSize: scale(12),
    fontWeight: "600",
  },
});