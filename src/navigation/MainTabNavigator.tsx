import React from "react";
import { Platform, Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import HomeScreen from "../features/home/HomeScreen";
import GroupsScreen from "../features/groups/GroupsScreen";
import ChatsScreen from "../features/chat/ChatsScreen";
import PsychologicalHelpScreen from "../features/help/PsychologicalHelpScreen";
import ProfileScreen from "../features/profile/ProfileScreen";

import { colors } from "../theme/colors";
import { scale } from "react-native-size-matters";

const Tab = createBottomTabNavigator();

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
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={({ route }) => ({
        headerShown: false,
        
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#007AFF',
        tabBarStyle: {
          height: 70,
          paddingTop: 8,
          paddingBottom: 8,
          paddingHorizontal: 16,
          borderTopColor: "#E6ECF5",
          position: 'absolute',
          // backgroundColor: Platform.OS == 'ios' ? "transparent" : 'white' ,
          // make changes to above when i will be working onto building the glass ui 
          backgroundColor: "white"
        },

        tabBarLabelStyle: {
          fontSize: scale(12),
          fontWeight: "600",
        },

        // tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: "#8A9CB5",

        tabBarIcon: ({ focused }) => {
          if (route.name === "Home") return emoji("🏠", focused);
          if (route.name === "Groups") return emoji("👥", focused);
          if (route.name === "Chats") return emoji("💬", focused);
          if (route.name === "Help") return emoji("❤️", focused);
          if (route.name === "Profile") return emoji("👤", focused);

          return emoji("•", focused);
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
      />

      <Tab.Screen
        name="Groups"
        component={GroupsScreen}
      />

      <Tab.Screen
        name="Chats"
        component={ChatsScreen}
      />

      <Tab.Screen
        name="Help"
        component={PsychologicalHelpScreen}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
      />
    </Tab.Navigator>
  );
}