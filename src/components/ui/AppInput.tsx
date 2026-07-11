import React from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { moderateScale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";

type Props = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  rightElement?: React.ReactNode;
  multiline?: boolean;
};

export const AppInput = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  rightElement,
  multiline,
}: Props) => {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      <View style={[styles.inputWrap, multiline && styles.inputWrapMultiline]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedText}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline]}
        />
        {rightElement ? <View style={styles.right}>{rightElement}</View> : null}
      </View>
    </View>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
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
  inputWrapMultiline: {
    minHeight: moderateScale(110),
    alignItems: "flex-start",
    paddingVertical: moderateScale(14),
  },
  input: {
    flex: 1,
    color: colors.text,
    fontSize: TextStyles.body,
  },
  inputMultiline: {
    textAlignVertical: "top",
    alignSelf: "stretch",
  },
  right: {
    marginLeft: moderateScale(10),
  },
});