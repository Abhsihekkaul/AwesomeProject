import { moderateScale } from "react-native-size-matters";

export const Typography = {
  xs: moderateScale(12),
  sm: moderateScale(14),
  md: moderateScale(16),
  lg: moderateScale(18),
  xl: moderateScale(20),
  xxl: moderateScale(26),
  xxxl: moderateScale(38),
};


export const TextStyles = {
  caption: Typography.xs,
  stepCounts : Typography.sm,
  body: Typography.md,
  subtitle: Typography.lg,
  heading: Typography.xl,
  title: Typography.xxl,
  hero: Typography.xxxl,
};