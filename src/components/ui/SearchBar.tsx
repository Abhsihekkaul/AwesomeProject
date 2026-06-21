import React from "react";
import { StyleSheet, TextInput, View, Text } from "react-native";
import { colors } from "../../theme/colors";
import { moderateScale, scale } from "react-native-size-matters";

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
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    backgroundColor: "#EEF3FB",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(16),
  },
  icon: {
    fontSize: scale(20),
    color: "#90A1B8",
    marginRight: moderateScale(10),
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: scale(16),
  },
});