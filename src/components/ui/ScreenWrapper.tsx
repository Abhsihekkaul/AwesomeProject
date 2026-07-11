import React from "react";
import {
  StatusBar,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  barStyle?: "light-content" | "dark-content";
  backgroundColor?: string;
  /** Tab screens pass edges without "bottom" — the floating tab bar already owns that zone. */
  edges?: ("top" | "left" | "right" | "bottom")[];
};

const ScreenWrapper = ({ children, style, barStyle, backgroundColor, edges }: Props) => {
  const { colors, resolvedScheme } = useTheme();
  const resolvedBg = backgroundColor ?? colors.background;
  const resolvedBarStyle = barStyle ?? (resolvedScheme === "dark" ? "light-content" : "dark-content");

  return (
    <>
      <StatusBar
        barStyle={resolvedBarStyle}
        backgroundColor={resolvedBg}
      />

      <SafeAreaView
        edges={edges ?? ['top', 'left', 'right', 'bottom']}
        style={[
          styles.container,
          { backgroundColor: resolvedBg },
          style,
        ]}
      >
        {children}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: moderateScale(14),
  },
});

export default ScreenWrapper;