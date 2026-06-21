import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";

type Props = {
  value: "signin" | "signup";
  onChange: (value: "signin" | "signup") => void;
};

export const AuthTabSwitch = ({ value, onChange }: Props) => {
  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => onChange("signin")}
        style={[styles.tab, value === "signin" && styles.activeTab]}
      >
        <Text style={[styles.text, value === "signin" && styles.activeText]}>
          Sign In
        </Text>
      </Pressable>

      <Pressable
        onPress={() => onChange("signup")}
        style={[styles.tab, value === "signup" && styles.activeTab]}
      >
        <Text style={[styles.text, value === "signup" && styles.activeText]}>
          Sign Up
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    backgroundColor: "#EEF3FB",
    borderRadius: radius.pill,
    padding: moderateScale(4),
    marginBottom: moderateScale(24),
  },
  tab: {
    flex: 1,
    height: moderateScale(54),
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  activeTab: {
    backgroundColor: colors.white,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: moderateScale(12),
    elevation: 2,
  },
  text: {
    color: "#7E93B5",
    fontSize: TextStyles.body,
    fontWeight: "600",
  },
  activeText: {
    color: colors.primary,
  },
});