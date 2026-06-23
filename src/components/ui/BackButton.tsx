import { Image, Pressable, StyleSheet } from "react-native";
import imagePath from "../../constant/imagePath";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { moderateScale, moderateVerticalScale } from "react-native-size-matters";


export default function BackButton() {
    const navigation = useNavigation<any>();
  return (
      <Pressable onPress={() => navigation.goBack()}>
          <Image source={imagePath.LeftIcon} style={styles.backButton} />
      </Pressable>
  );
}

const styles = StyleSheet.create({
    backButton: {
        height: moderateVerticalScale(16),
        width: moderateVerticalScale(16),
        marginRight: moderateScale(16),
    }
})

