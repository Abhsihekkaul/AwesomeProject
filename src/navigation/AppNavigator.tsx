import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { navigationRef } from "./navigationRef";

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
import EmailCodeScreen from "../features/auth/EmailCodeScreen";
import ForgotPasswordScreen from "../features/auth/ForgotPasswordScreen";
import AdminReviewScreen from "../features/admin/AdminReviewScreen";
import BecomeConsultantScreen from "../features/consultants/BecomeConsultantScreen";
import BlockedUsersScreen from "../features/settings/BlockedUsersScreen";
import ChangeEmailScreen from "../features/settings/ChangeEmailScreen";
import ChangePasswordScreen from "../features/settings/ChangePasswordScreen";
import DeleteAccountScreen from "../features/settings/DeleteAccountScreen";
import EditProfileScreen from "../features/settings/EditProfileScreen";
import LanguageScreen from "../features/settings/LanguageScreen";
import HealingDiaryScreen from "../features/diary/HealingDiaryScreen";
import HealthTipsScreen from "../features/tips/HealthTipsScreen";
import EditPostScreen from "../features/posts/EditPostScreen";
import PostDetailsScreen from "../features/posts/PostDetailsScreen";
import type { Post } from "../components/ui/PostCard";
import NotificationsScreen from "../features/notifications/NotificationsScreen";
import ProfileScreen from "../features/profile/ProfileScreen";
import UserProfileScreen from "../features/profile/UserProfileScreen";
import SettingsScreen from "../features/profile/SettingsScreen";
import DirectoryScreen from "../components/ui/DirectoryScreen";
import SearchScreen from "../features/search/SearchScreen";


export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  ForgotPassword: { email?: string } | undefined;
  EmailCode: { email?: string } | undefined;
  EditProfile: undefined;
  ChangeEmail: undefined;
  ChangePassword: undefined;
  DeleteAccount: undefined;
  BlockedUsers: undefined;
  Language: undefined;
  BecomeConsultant: undefined;
  AdminReview: undefined;
  ProfileSetup : undefined;
  HealthJourney: undefined;
  PrivacySafety: undefined;
  MainTabs: { tab?: "Home" | "Groups" | "Chats" | "Help" | "Profile" } | undefined;

  RequestGroup: undefined;
  CreatePost: { groupId?: string } | undefined;
  PostDetails: { post: Post };
  EditPost: { post: Post };
  GroupDetails:
    | {
        id?: string;
        name?: string;
        members?: string;
        tag?: string;
        moderator?: string;
        description?: string;
        joined?: boolean;
      }
    | undefined;
  Booking:
    | { consultant?: string; role?: string; sessionType?: string; date?: string; time?: string }
    | undefined;
  ConsultantProfile: { name?: string } | undefined;
  ChatRoom: { name?: string; initials?: string; chatId?: string; userId?: string } | undefined;
  Settings: undefined;
  Notifications: undefined;
  Profile: undefined;
  UserProfile: { userId: string; name?: string };
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
    <NavigationContainer ref={navigationRef}>
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
        <Stack.Screen name="EditPost" component={EditPostScreen} />
        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
        <Stack.Screen name="Booking" component={BookingScreen} />
        <Stack.Screen name="ConsultantProfile" component={ConsultantProfileScreen} />
        <Stack.Screen name="ChatRoom" component={ChatRoomScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="EmailCode" component={EmailCodeScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangeEmail" component={ChangeEmailScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="DeleteAccount" component={DeleteAccountScreen} />
        <Stack.Screen name="BlockedUsers" component={BlockedUsersScreen} />
        <Stack.Screen name="Language" component={LanguageScreen} />
        <Stack.Screen name="BecomeConsultant" component={BecomeConsultantScreen} />
        <Stack.Screen name="AdminReview" component={AdminReviewScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} />
        <Stack.Screen name="Directory" component={DirectoryScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="HealingDiary" component={HealingDiaryScreen} />
        <Stack.Screen name="HealthTips" component={HealthTipsScreen} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}