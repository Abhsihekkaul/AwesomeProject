import React from "react";
import {
  StatusBar,
  StyleSheet,
  StyleProp,
  ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";

type Props = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  barStyle?: "light-content" | "dark-content";
  backgroundColor?: string;
};

const ScreenWrapper = ({
  children,
  style,
  barStyle = "dark-content",
  backgroundColor = "#F5F8FD",
}: Props) => {
  return (
    <>
      <StatusBar
        barStyle={barStyle}
        backgroundColor={backgroundColor}
      />

      <SafeAreaView
        style={[
          styles.container,
          { backgroundColor },
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