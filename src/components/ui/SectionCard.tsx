import React from "react";
import { View, StyleSheet } from "react-native";
import { moderateScale } from "react-native-size-matters";

export default function SectionCard({
  children,
}: {
  children: React.ReactNode;
}) {
  return <View style={styles.card}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFF",
    borderRadius: moderateScale(24),
    padding: moderateScale(20),
    marginBottom: moderateScale(20),
    borderWidth: moderateScale(1),
    borderColor: "#E7EDF5",
  },
});