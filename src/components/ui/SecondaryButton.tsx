import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
  Image,
  ImageSourcePropType,
  View,
} from "react-native";
import { colors } from "../../theme/colors";
import { radius } from "../../theme/radius";
import { moderateScale, scale } from "react-native-size-matters";
import { TextStyles } from "../../theme/typography";

type Props = {
  title?: string;
  icon?: ImageSourcePropType;
  onPress: () => void;
  style?: ViewStyle;
};

export const SecondaryButton = ({
  title,
  icon,
  onPress,
  style,
}: Props) => {
  return (
    <Pressable onPress={onPress} style={[styles.button, style]}>
      <View style={styles.content}>
        {icon && <Image source={icon} style={styles.icon} />}
        {title && <Text style={styles.text}>{title}</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    height: moderateScale(58),
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.white,
    borderWidth: 0.5,
    borderColor: colors.border,

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
    color: colors.text,
    fontSize: TextStyles.body,
    fontWeight: "600",
  },
});