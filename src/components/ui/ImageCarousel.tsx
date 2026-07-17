import React, { useState } from "react";
import { Image, ScrollView, StyleSheet, Text, View } from "react-native";
import { moderateScale, moderateVerticalScale, scale } from "react-native-size-matters";
import AutoHeightImage from "./AutoHeightImage";

/**
 * Instagram-style photo pager: swipe left/right through a post's photos, with a
 * "2/7" counter and position dots. A single photo skips the pager entirely and
 * renders at its full proportions (AutoHeightImage).
 */
export default function ImageCarousel({
  images,
  height,
  style,
}: {
  images: string[];
  /** Page height for multi-photo posts (uniform pages swipe cleanly). */
  height: number;
  /** Outer styling: width/margins/borderRadius. */
  style?: any;
}) {
  const [width, setWidth] = useState(0);
  const [index, setIndex] = useState(0);

  if (images.length === 0) return null;
  if (images.length === 1) return <AutoHeightImage uri={images[0]} style={style} />;

  return (
    <View
      style={[style, styles.container]}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
    >
      {width > 0 ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setIndex(Math.round(e.nativeEvent.contentOffset.x / width))
          }
        >
          {images.map((uri, i) => (
            <Image key={i} source={{ uri }} style={{ width, height }} resizeMode="cover" />
          ))}
        </ScrollView>
      ) : (
        // Reserve the height while the first layout pass measures the width.
        <View style={{ height }} />
      )}

      {/* "2/7" counter */}
      <View style={styles.counterPill}>
        <Text style={styles.counterText}>
          {index + 1}/{images.length}
        </Text>
      </View>

      {/* Position dots */}
      <View style={styles.dotsRow}>
        {images.map((_, i) => (
          <View key={i} style={[styles.dot, i === index && styles.dotActive]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  counterPill: {
    position: "absolute",
    top: moderateScale(10),
    right: moderateScale(10),
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: moderateScale(12),
    paddingHorizontal: moderateScale(9),
    paddingVertical: moderateVerticalScale(3),
  },
  counterText: {
    color: "#FFFFFF",
    fontSize: scale(11),
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
  },
  dotsRow: {
    position: "absolute",
    bottom: moderateVerticalScale(8),
    alignSelf: "center",
    flexDirection: "row",
    gap: moderateScale(5),
  },
  // Dots sit over the photo, so white-on-image works in both themes.
  dot: {
    width: moderateScale(6),
    height: moderateScale(6),
    borderRadius: moderateScale(3),
    backgroundColor: "rgba(255,255,255,0.45)",
  },
  dotActive: {
    backgroundColor: "#FFFFFF",
  },
});
