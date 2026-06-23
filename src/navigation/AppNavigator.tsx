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
import NotificationsScreen from "../features/notifications/NotificationsScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import SettingsScreen from "../features/profile/SettingsScreen";


export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  ProfileSetup : undefined;
  HealthJourney: undefined;
  PrivacySafety: undefined;
  MainTabs: undefined;

  RequestGroup: undefined;
  CreatePost: undefined;
  GroupDetails: { name?: string } | undefined;
  Booking: undefined;
  ConsultantProfile: undefined;
  ChatRoom: undefined;
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
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
        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="ConsultantProfile" component={ConsultantProfileScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}