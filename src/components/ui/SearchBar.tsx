import React from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { moderateScale, scale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";
import { useTheme } from "../../theme/ThemeContext";

type Props = {
  placeholder: string;
  value?: string;
  onChangeText?: (text: string) => void;
  /** When provided, the bar becomes read-only and taps navigate away (e.g. Home -> Search). */
  onPress?: () => void;
};

export default function SearchBar({ placeholder, value, onChangeText, onPress }: Props) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const content = (
    <View style={styles.wrap}>
      <Text style={styles.icon}>⌕</Text>
      <TextInput
        placeholder={placeholder}
        placeholderTextColor={colors.mutedText}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        editable={!onPress}
        pointerEvents={onPress ? "none" : "auto"}
      />
    </View>
  );

  if (onPress) {
    return <Pressable onPress={onPress}>{content}</Pressable>;
  }
  return content;
}

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) =>
  StyleSheet.create({
    wrap: {
      height: moderateScale(44),
      borderRadius: 999,
      backgroundColor: colors.lightBlue,
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: moderateScale(12),
    },
    icon: {
      fontSize: scale(20),
      color: colors.mutedText,
      marginRight: moderateScale(6),
    },
    input: {
      flex: 1,
      fontSize: TextStyles.caption,
      color: colors.text,
    },
  });
