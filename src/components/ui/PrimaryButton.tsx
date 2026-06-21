import React from "react";
import { Pressable, StyleSheet, Text, ViewStyle } from "react-native";
import LinearGradient from "react-native-linear-gradient";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";

type Props = {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  disabled?: boolean;
};

const PrimaryButton = ({ title, onPress, style, disabled }: Props) => {
  return (
    <Pressable onPress={onPress} disabled={disabled} style={style}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.button, disabled && { opacity: 0.6 }]}
      >
        <Text style={styles.text}>{title}</Text>
      </LinearGradient>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(58),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    color: colors.white,
    fontSize: scale(15),
    fontWeight: "600",
  },
}); 
export default PrimaryButton