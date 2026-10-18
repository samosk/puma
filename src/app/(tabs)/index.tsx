import { HomeFloatingActions } from "@/components/home/HomeFloatingActions";
import { HomeAnimalStatus } from "@/components/home/HomeAnimalStatus";
import { HomeScene } from "@/components/home/HomeScene";
import { HomeTopBar } from "@/components/home/HomeTopBar";
import type { HomeAppearance } from "@/components/home/home-assets";
import { useActiveCat } from "@/hooks/use-active-cat";
import { useAnimalMood } from "@/hooks/use-animal-mood";
import { useProfileBalances } from "@/hooks/use-profile-balances";
import { calculateLevelProgress } from "@/lib/animal-level";
import { router } from "expo-router";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HOME_SCENE_SCALE = 1.85;

const PREVIEW_HOME: HomeAppearance = {
  wall: "wall_beige",
  floor: "floor_oak",
  ornament_1: "ornament_1_curtains",
  ornament_2: "ornament_2_painting",
  home_1: "home_1_leather_sofa",
  home_2: "home_2_cardboard_box",
  home_3: "home_3_floor_plant",
  home_4: "home_4_rug",
};

export default function HomeScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const safeAreaInsets = useSafeAreaInsets();
  const { balances, loading: balancesLoading } = useProfileBalances();
  const { activeCat, loading: catLoading } = useActiveCat();
  const { mood } = useAnimalMood(activeCat?.id);
  const level = activeCat ? calculateLevelProgress(activeCat.xp) : null;
  const viewportWidth = windowWidth;
  const sceneWidth = viewportWidth * HOME_SCENE_SCALE;
  const initialScrollX = (sceneWidth - viewportWidth) / 2;

  return (
    <View style={styles.screen}>
      <HomeTopBar
        candies={balances?.candies ?? null}
        coins={balances?.coins ?? null}
        loading={balancesLoading}
      />

      {activeCat && level && mood ? (
        <View
          pointerEvents="none"
          style={[
            styles.statusOverlay,
            { top: safeAreaInsets.top + 90 },
          ]}
        >
          <HomeAnimalStatus
            animalName={activeCat.name}
            level={level}
            mood={mood}
            style={styles.animalStatus}
          />
        </View>
      ) : null}

      <View style={styles.content}>
        <ScrollView
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          contentOffset={{ x: initialScrollX, y: 0 }}
          directionalLockEnabled
          horizontal
          overScrollMode="never"
          showsHorizontalScrollIndicator={false}
          style={styles.homeScroll}
        >
          <HomeScene
            cat={
              activeCat
                ? {
                    accessibilityLabel: activeCat.name,
                    appearance: activeCat.appearance,
                  }
                : null
            }
            home={PREVIEW_HOME}
            style={{ width: sceneWidth }}
          />
        </ScrollView>
        {catLoading ? (
          <ActivityIndicator color="#494949" style={styles.catLoading} />
        ) : null}
      </View>
      

      <HomeFloatingActions
        onShopPress={() => router.push("../shopScreen")}
        onWardrobePress={() => router.push("../wardrobeScreen")}
        style={styles.floatingActions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#E8E8E8",
  },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  homeScroll: {
    width: "100%",
  },
  catLoading: {
    position: "absolute",
  },
  statusOverlay: {
    position: "absolute",
    right: 24,
    left: 24,
    zIndex: 950,
    alignItems: "flex-start",
  },
  animalStatus: {
    transform: [{ scale: 0.556 }],
    transformOrigin: "left top",
  },
  floatingActions: {
    position: "absolute",
    top: "20%",
    right: 24,
    zIndex: 900,
    transform: [{ translateY: -20 }],
  },
});
