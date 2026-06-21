import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
};

export const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  rightElement,
}: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrap}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#9AAAC2"
          secureTextEntry={secureTextEntry}
          style={styles.input}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: moderateScale(16),
  },
  label: {
    color: colors.text,
    fontSize: TextStyles.body,
    fontWeight: "600",
    marginBottom: moderateScale(10),
  },
  inputWrap: {
    minHeight: moderateScale(58),
    borderRadius: radius.xl,
    backgroundColor: colors.lightBlue,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: moderateScale(18),
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: TextStyles.body,
  },
  right: {
    marginLeft: moderateScale(10),
  },
});