import React, { useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { moderateScale, scale } from "react-native-size-matters";
import PrimaryButton from "../../components/ui/PrimaryButton";
import ScreenWrapper from "../../components/ui/ScreenWrapper";
import { StepIndicator } from "../../components/ui/StepIndicator";
import imagePath from "../../constant/imagePath";
import { useTheme } from "../../theme/ThemeContext";
import { radius } from "../../theme/radius";
import { onboardingSlides } from "./data";
import { TextStyles } from "../../theme/typography";

const OnboardingScreen = ({ navigation }: any) => {
  const [index, setIndex] = useState(0);
  const slide = onboardingSlides[index];

  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const next = () => {
    if (index < onboardingSlides.length - 1) setIndex((p) => p + 1);
    else navigation.navigate("Auth");
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <Pressable style={styles.skip} onPress={() => navigation.navigate("Auth")}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        <View style={styles.iconBox}>
          <View style={[styles.iconCircle, slide.accent === "blue" && { backgroundColor: colors.lightBlue }]} />
            <Image
              source={
                slide.icon === "users"
                  ? imagePath.UserIcon
                  : slide.icon === "heart"
                    ? imagePath.HeartIcon
                    : imagePath.ShieldIcon
              }
              style={styles.iconImage}
              resizeMode="contain"
            />
        </View>

        <View style={styles.center}>
          <Text style={styles.title}>{slide.title}</Text>
          <Text style={styles.desc}>{slide.description}</Text>
        </View>

        <View style={styles.footer}>
          <StepIndicator total={3} current={index} />
          <PrimaryButton title={index === 2 ? "Get Started" : "Next"} onPress={next} style={styles.button} />
        </View>
      </View>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>["colors"]) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  skip: {
    alignSelf: "flex-end",
    paddingRight : moderateScale(8),
  },
  skipText: {
    color: colors.mutedText,
    fontSize: scale(14),
    fontWeight: "600",
  },
  iconBox: {
    alignSelf: "center",
    width: moderateScale(220),
    height: moderateScale(220),
    borderRadius: radius.lg,
    backgroundColor: colors.lightBlue,
    alignItems: "center",
    justifyContent: "center",
    marginTop: moderateScale(40),
  },
  iconImage: {
    width: moderateScale(90),
    height: moderateScale(90),
    tintColor: colors.primary,
  },
  iconCircle: {
    position: "absolute",
    width: moderateScale(220),
    height: moderateScale(220),
    borderRadius: radius.xl,
    opacity: 0.25,
  },
  center: {
    paddingHorizontal: moderateScale(8),
  },
  title: {
    fontSize: TextStyles.title,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
    marginBottom: moderateScale(14),
  },
  desc: {
    fontSize: TextStyles.body,
    color: colors.mutedText,
    lineHeight: moderateScale(24),
    textAlign : "center",
  },
  footer: {
    paddingBottom: moderateScale(20),
  },
  button: {
    marginTop: moderateScale(22),
  },
});

export default OnboardingScreen