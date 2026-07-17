import React from "react";
import { View, StyleSheet } from "react-native";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "./src/components/SplashScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CallProvider } from "./src/context/CallContext";
import { ChatNotificationsProvider } from "./src/context/ChatNotificationsContext";
import { SavedPostsProvider } from "./src/context/SavedPostsContext";
import { ThemeProvider } from "./src/theme/ThemeContext";
import CallOverlay from "./src/features/call/CallOverlay";
import ChatMessageBanner from "./src/components/ui/ChatMessageBanner";

const RootNavigator = () => {
  const { isBootstrapping, isAuthenticated } = useAuth();

  if (isBootstrapping) return <SplashScreen />;

  return <AppNavigator initialRouteName={isAuthenticated ? "MainTabs" : "Onboarding"} />;
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SavedPostsProvider>
          <CallProvider>
            <ChatNotificationsProvider>
              <View style={styles.flex}>
                <RootNavigator />
                {/* Message popups + calls render above everything — any screen */}
                <ChatMessageBanner />
                <CallOverlay />
              </View>
            </ChatNotificationsProvider>
          </CallProvider>
        </SavedPostsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
