import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";

import HealthJourneyScreen from "../features/profileSetup/HealthJourneyScreen";
import PrivacySafetyScreen from "../features/profileSetup/PrivacySafetyScreen";
import ProfileNameScreen from "../features/profileSetup/ProfileNameScreen";
import OnboardingScreen from "../features/onboarding/OnboardingScreen";

import ChatRoomScreen from "../features/chat/ChatRoomScreen";
import BookingScreen from "../features/consultants/BookingScreen";
import ConsultantProfileScreen from "../features/consultants/ConsultantProfileScreen";
import CreatePostScreen from "../features/groups/CreatePostScreen";
import GroupDetailsScreen from "../features/groups/GroupDetailsScreen";
import RequestGroupScreen from "../features/groups/RequestGroupScreen";
import MainTabNavigator from "./MainTabNavigator";

import AuthScreen from "../features/auth/AuthScreen";
import HealingDiaryScreen from "../features/diary/HealingDiaryScreen";
import HealthTipsScreen from "../features/tips/HealthTipsScreen";
import PostDetailsScreen from "../features/posts/PostDetailsScreen";
import type { Post } from "../components/ui/PostCard";
import NotificationsScreen from "../features/notifications/NotificationsScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import SettingsScreen from "../features/profile/SettingsScreen";
import DirectoryScreen from "../components/ui/DirectoryScreen";
import SearchScreen from "../features/search/SearchScreen";


export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  ProfileSetup : undefined;
  HealthJourney: undefined;
  PrivacySafety: undefined;
  MainTabs: undefined;

  RequestGroup: undefined;
  CreatePost: undefined;
  PostDetails: { post: Post };
  GroupDetails: { name?: string } | undefined;
  Booking:
    | { consultant?: string; role?: string; sessionType?: string; date?: string; time?: string }
    | undefined;
  ConsultantProfile: { name?: string } | undefined;
  ChatRoom: { name?: string; initials?: string } | undefined;
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
  Directory: { type?: "Groups" | "Friends" } | undefined;
  Search: undefined;
  HealingDiary: undefined;
  HealthTips: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator({
  initialRouteName = "Onboarding",
}: {
  initialRouteName?: keyof RootStackParamList;
}) {
  return (
    <NavigationContainer>
      <Stack.Navigator
        // fullScreenGestureEnabled: swipe anywhere (not just the left edge) to go back on iOS —
        // pairs with the hidden swipe-right-to-compose gesture on the Home feed.
        screenOptions={{ headerShown: false, fullScreenGestureEnabled: true }}
        initialRouteName={initialRouteName}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        {/* <Stack.Screen name="Auth" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} /> */}
        <Stack.Screen name="ProfileSetup" component={ProfileNameScreen} />
        <Stack.Screen name="HealthJourney" component={HealthJourneyScreen} />
        <Stack.Screen name="PrivacySafety" component={PrivacySafetyScreen} />
        {/* <Stack.Screen name="ProfileSetup" component={ProfileSetupScreen}/> */}
        {/* <Stack.Screen name="ProfileSetupScreen" component={ProfileSetupScreen}/> */}
        <Stack.Screen name="MainTabs" component={MainTabNavigator} />

        <Stack.Screen name="RequestGroup" component={RequestGroupScreen} />
        <Stack.Screen name="CreatePost" component={CreatePostScreen} />
        <Stack.Screen name="PostDetails" component={PostDetailsScreen} />
        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="ConsultantProfile" component={ConsultantProfileScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Directory" component={DirectoryScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="HealingDiary" component={HealingDiaryScreen} />
        <Stack.Screen name="HealthTips" component={HealthTipsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}