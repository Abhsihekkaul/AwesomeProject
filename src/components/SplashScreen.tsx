import React from "react";
import { Image, StyleSheet, View } from "react-native";
import imagePath from "../constant/imagePath";
import { useTheme } from "../theme/ThemeContext";

// Shown once at launch while AuthContext checks for a stored session, centered on the
// brand color like Instagram/WhatsApp show a glyph while the app loads.
const SplashScreen = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.primary }]}>
      <Image source={imagePath.InfinityMark} style={styles.mark} resizeMode="contain" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  mark: {
    width: 120,
    height: 120,
  },
});

export default SplashScreen;
