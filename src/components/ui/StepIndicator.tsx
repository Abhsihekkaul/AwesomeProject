import React from "react";
import { View, StyleSheet } from "react-native";
import { colors } from "../../theme/colors";
import { moderateScale } from "react-native-size-matters";

type Props = {
  total: number;
  current: number;
};

export const StepIndicator = ({ total, current }: Props) => {
  return (
    <View style={styles.row}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            index === current ? styles.active : styles.inactive,
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "center",
    gap: moderateScale(8),
  },
  dot: {
    height: moderateScale(8),
    borderRadius: moderateScale(999),
  },
  active: {
    width: moderateScale(36),
    backgroundColor: colors.primary,
  },
  inactive: {
    width: moderateScale(8),
    backgroundColor: "#DDE5F2",
  },
});