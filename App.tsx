import React from "react";
import AppNavigator from "./src/navigation/AppNavigator";
import SplashScreen from "./src/components/SplashScreen";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { SavedPostsProvider } from "./src/context/SavedPostsContext";
import { ThemeProvider } from "./src/theme/ThemeContext";

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
          <RootNavigator />
        </SavedPostsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
