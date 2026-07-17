import React, { useEffect, useState } from "react";
import { Image } from "react-native";

/**
 * An image that keeps the photo's real proportions instead of cropping it into a
 * fixed box — the complete picture is always visible. Extremely tall portraits are
 * capped at 4:5 so a single photo can't take over the screen.
 *
 * Used by chat bubbles, shared-post cards and the post detail view. Give it a
 * width via `style`; the height follows from the measured aspect ratio.
 */
export default function AutoHeightImage({ uri, style }: { uri: string; style?: any }) {
  const [ratio, setRatio] = useState(4 / 3);

  useEffect(() => {
    Image.getSize(
      uri,
      (w, h) => {
        if (w > 0 && h > 0) setRatio(Math.max(w / h, 0.8));
      },
      () => {},
    );
  }, [uri]);

  return <Image source={{ uri }} style={[style, { aspectRatio: ratio }]} resizeMode="cover" />;
}
