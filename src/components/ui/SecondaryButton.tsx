import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  Image,
  ImageSourcePropType,
  View,
} from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";

type Props = {
  title?: string;
  icon?: ImageSourcePropType;
  onPress: () => void;
  style?: ViewStyle;
  size?: "full" | "compact";
};

export const SecondaryButton = ({ title, icon, onPress, style, size = "full" }: Props) => {
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
        style={[
          styles.button,
          size === "compact" && styles.buttonCompact,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.content}>
          {icon && <Image source={icon} style={styles.icon} />}
          {title && (
            <Text
              style={[
                styles.text,
                size === "compact" && styles.textCompact,
                { color: colors.text },
              ]}
            >
              {title}
            </Text>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(58),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: StyleSheet.hairlineWidth,
  },
  buttonCompact: {
    height: moderateScale(40),
    borderRadius: radius.xl,
    alignSelf: "flex-start",
    paddingHorizontal: moderateScale(18),
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: moderateScale(24),
    height: moderateScale(24),
    resizeMode: "contain",
    marginRight: moderateScale(8),
  },
  text: {
    fontSize: TextStyles.body,
    fontWeight: "600",
  },
  textCompact: {
    fontSize: scale(13),
  },
});
