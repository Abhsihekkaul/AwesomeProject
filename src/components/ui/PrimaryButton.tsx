import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
  size?: "full" | "compact";
};

const PrimaryButton = ({ title, onPress, style, disabled, size = "full" }: Props) => {
  const { colors } = useTheme();
  const scaleValue = useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, { toValue: 0.96, useNativeDriver: true, speed: 40 }).start();
  };
  const onPressOut = () => {
    Animated.spring(scaleValue, { toValue: 1, useNativeDriver: true, speed: 40 }).start();
  };

  return (
    <Animated.View style={[style, { transform: [{ scale: scaleValue }] }]}>
      <Pressable
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
      >
        <LinearGradient
          colors={[colors.primary, colors.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            size === "compact" && styles.buttonCompact,
            disabled && { opacity: 0.6 },
          ]}
        >
          <Text style={[styles.text, size === "compact" && styles.textCompact]}>{title}</Text>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  // Design v2: pill buttons — the web app's Button went full-pill and the app follows.
  button: {
    height: moderateScale(58),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: moderateScale(20),
  },
  buttonCompact: {
    height: moderateScale(40),
    borderRadius: radius.pill,
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(18),
  },
  text: {
    color: "#FFFFFF",
    fontSize: scale(15),
    fontWeight: "600",
  },
  textCompact: {
    fontSize: scale(13),
  },
});
export default PrimaryButton;
