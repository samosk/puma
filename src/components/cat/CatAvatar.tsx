import { Image } from "expo-image";
import {
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import {
  ACC_ASSETS,
  BODY_ASSETS,
  CAT_ASSETS,
  HAT_ASSETS,
  type CatAppearance,
} from "./cat-assets";

const CAT_ASPECT_RATIO = 32 / 34;

export type CatAvatarProps = {
  appearance: CatAppearance;
  width?: number;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function CatAvatar({
  appearance,
  width = 224,
  accessibilityLabel = "Cat",
  style,
}: CatAvatarProps) {
  const bodySource = appearance.body
    ? BODY_ASSETS[appearance.body]
    : null;
  const accSource = appearance.acc ? ACC_ASSETS[appearance.acc] : null;
  const hatSource = appearance.hat ? HAT_ASSETS[appearance.hat] : null;

  return (
    <View
      accessible
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
      style={[styles.container, { width }, style]}
    >
      <Image
        accessible={false}
        contentFit="contain"
        pointerEvents="none"
        source={CAT_ASSETS[appearance.base]}
        style={[styles.layer, styles.baseLayer]}
      />

      {bodySource ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={bodySource}
          style={[styles.layer, styles.bodyLayer]}
        />
      ) : null}

      {accSource ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={accSource}
          style={[styles.layer, styles.accLayer]}
        />
      ) : null}

      {hatSource ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={hatSource}
          style={[styles.layer, styles.hatLayer]}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    aspectRatio: CAT_ASPECT_RATIO,
  },
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  baseLayer: {
    zIndex: 0,
  },
  bodyLayer: {
    zIndex: 1,
  },
  accLayer: {
    zIndex: 2,
  },
  hatLayer: {
    zIndex: 3,
  },
});
