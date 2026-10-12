import { Image } from "expo-image";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { CatAvatar } from "@/components/cat/CatAvatar";
import type { CatAppearance } from "@/components/cat/cat-assets";

import {
  FLOOR_ASSETS,
  HOME_1_ASSETS,
  HOME_2_ASSETS,
  HOME_3_ASSETS,
  HOME_4_ASSETS,
  ORNAMENT_1_ASSETS,
  ORNAMENT_2_ASSETS,
  ROOM_SHADING_IMAGE,
  ROOM_WINDOW_IMAGE,
  WALL_ASSETS,
  type HomeAppearance,
} from "./home-assets";

type HomeSceneCat = {
  appearance: CatAppearance;
  accessibilityLabel?: string;
};

export type HomeSceneProps = {
  home: HomeAppearance;
  cat: HomeSceneCat | null;
  style?: StyleProp<ViewStyle>;
};

export function HomeScene({ home, cat, style }: HomeSceneProps) {
  const ornament1Source = home.ornament_1
    ? ORNAMENT_1_ASSETS[home.ornament_1]
    : null;
  const ornament2Source = home.ornament_2
    ? ORNAMENT_2_ASSETS[home.ornament_2]
    : null;
  const home1Source = home.home_1 ? HOME_1_ASSETS[home.home_1] : null;
  const home2Source = home.home_2 ? HOME_2_ASSETS[home.home_2] : null;
  const home3Source = home.home_3 ? HOME_3_ASSETS[home.home_3] : null;
  const home4Source = home.home_4 ? HOME_4_ASSETS[home.home_4] : null;

  return (
    <View style={[styles.scene, style]}>
      <Image
        accessible={false}
        contentFit="contain"
        pointerEvents="none"
        source={WALL_ASSETS[home.wall]}
        style={[styles.layer, styles.wallLayer]}
      />
      <Image
        accessible={false}
        contentFit="contain"
        pointerEvents="none"
        source={FLOOR_ASSETS[home.floor]}
        style={[styles.layer, styles.floorLayer]}
      />

      <View pointerEvents="none" style={[styles.layer, styles.shadingLayer]}>
        <Image
          accessible={false}
          contentFit="contain"
          source={ROOM_SHADING_IMAGE}
          style={styles.layer}
        />
      </View>

      <Image
        accessible={false}
        contentFit="contain"
        pointerEvents="none"
        source={ROOM_WINDOW_IMAGE}
        style={[styles.layer, styles.windowLayer]}
      />

      {ornament1Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={ornament1Source}
          style={[styles.layer, styles.ornament1Layer]}
        />
      ) : null}
      {ornament2Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={ornament2Source}
          style={[styles.layer, styles.ornament2Layer]}
        />
      ) : null}
      {home4Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={home4Source}
          style={[styles.layer, styles.home4Layer]}
        />
      ) : null}
      {home1Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={home1Source}
          style={[styles.layer, styles.home1Layer]}
        />
      ) : null}
      {home2Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={home2Source}
          style={[styles.layer, styles.home2Layer]}
        />
      ) : null}
      {home3Source ? (
        <Image
          accessible={false}
          contentFit="contain"
          pointerEvents="none"
          source={home3Source}
          style={[styles.layer, styles.home3Layer]}
        />
      ) : null}

      {cat ? (
        <CatAvatar
          accessibilityLabel={cat.accessibilityLabel}
          appearance={cat.appearance}
          style={styles.cat}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  scene: {
    position: "relative",
    width: "185%",
    aspectRatio: 1,
    isolation: "isolate",
    overflow: "hidden",
    top: "5%",
  },
  layer: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  wallLayer: {
    zIndex: 0,
  },
  floorLayer: {
    zIndex: 10,
  },
  shadingLayer: {
    zIndex: 20,
    mixBlendMode: "multiply",
  },
  windowLayer: {
    zIndex: 30,
  },
  ornament1Layer: {
    zIndex: 40,
  },
  ornament2Layer: {
    zIndex: 41,
  },
  home4Layer: {
    zIndex: 50,
  },
  home3Layer: {
    zIndex: 60,
  },
  home1Layer: {
    zIndex: 61,
  },
  home2Layer: {
    zIndex: 62,
  },

  cat: {
    position: "absolute",
    top: "55%",
    left: "37.5%",
    width: "25%",
    zIndex: 70,
  },
});
