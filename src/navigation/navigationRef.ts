import { createNavigationContainerRef } from "@react-navigation/native";
import type { RootStackParamList } from "./AppNavigator";

/**
 * Navigation handle for UI that lives OUTSIDE the NavigationContainer — the
 * app-wide overlays (chat message popup, call overlay) can't call useNavigation,
 * so they navigate through this ref instead.
 */
export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export const navigateFromAnywhere = (name: keyof RootStackParamList, params?: any) => {
  if (navigationRef.isReady()) navigationRef.navigate(name as any, params);
};
