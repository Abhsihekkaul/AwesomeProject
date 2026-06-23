import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { moderateScale, scale } from "react-native-size-matters";
import { radius } from "../../theme/radius";
import { TextStyles } from "../../theme/typography";

type Props = {
  placeholder: string;
};

export default function SearchBar({ placeholder }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor="#90A1B8"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    height: moderateScale(44),
    borderRadius : radius.md,
    backgroundColor: "#edf2fa",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(12),
  },
  icon: {
    fontSize: scale(28),
    color: "#90A1B8",
    marginRight: moderateScale(6),
  },
  input: {
    fontSize: TextStyles.caption,
  },
});