import { HomeFloatingActions } from "@/components/home/HomeFloatingActions";
import { HomeScene } from "@/components/home/HomeScene";
import { HomeTopBar } from "@/components/home/HomeTopBar";
import type { HomeAppearance } from "@/components/home/home-assets";
import { useActiveCat } from "@/hooks/use-active-cat";
import { useProfileBalances } from "@/hooks/use-profile-balances";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from "react-native";

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
  const { balances, loading: balancesLoading } = useProfileBalances();
  const { activeCat, loading: catLoading } = useActiveCat();
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
      {/* Temp, remove code block and un-comment below */}
      <HomeFloatingActions style={styles.floatingActions} />

      {/* <HomeFloatingActions
        onShopPress={() => router.push("/shopScreen")}
        onWardrobePress={() => router.push("/wardrobeScreen")}
        style={styles.floatingActions}
      /> */}
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
  floatingActions: {
    position: "absolute",
    top: "20%",
    left: 24,
    zIndex: 900,
    transform: [{ translateY: -20 }],
  },
});
