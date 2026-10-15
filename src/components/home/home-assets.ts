export const ROOM_SHADING_IMAGE = require("../../../assets/home/room_shading.png");
export const ROOM_WINDOW_IMAGE = require("../../../assets/home/room_window.png");

export const WALL_ASSETS = {
  wall_beige: require("../../../assets/home/wall/wall_beige.png"),
  wall_blue: require("../../../assets/home/wall/wall_blue.png"),
  wall_green: require("../../../assets/home/wall/wall_green.png"),
} as const;

export const FLOOR_ASSETS = {
  floor_oak: require("../../../assets/home/floor/floor_oak.png"),
  floor_walnut: require("../../../assets/home/floor/floor_walnut.png"),
} as const;

export const ORNAMENT_1_ASSETS = {
  ornament_1_curtains: require("../../../assets/home/ornament_1/ornament_1_curtains.png"),
} as const;

export const ORNAMENT_2_ASSETS = {
  ornament_2_painting: require("../../../assets/home/ornament_2/ornament_2_painting.png"),
} as const;

export const HOME_1_ASSETS = {
  home_1_leather_sofa: require("../../../assets/home/home_1/home_1_leather_sofa.png"),
} as const;

export const HOME_2_ASSETS = {
  home_2_cardboard_box: require("../../../assets/home/home_2/home_2_cardboard_box.png"),
} as const;

export const HOME_3_ASSETS = {
  home_3_floor_plant: require("../../../assets/home/home_3/home_3_floor_plant.png"),
} as const;

export const HOME_4_ASSETS = {
  home_4_rug: require("../../../assets/home/home_4/home_4_rug.png"),
} as const;

export type HomeWallKey = keyof typeof WALL_ASSETS;
export type HomeFloorKey = keyof typeof FLOOR_ASSETS;
export type HomeOrnament1Key = keyof typeof ORNAMENT_1_ASSETS;
export type HomeOrnament2Key = keyof typeof ORNAMENT_2_ASSETS;
export type HomeSlot1Key = keyof typeof HOME_1_ASSETS;
export type HomeSlot2Key = keyof typeof HOME_2_ASSETS;
export type HomeSlot3Key = keyof typeof HOME_3_ASSETS;
export type HomeSlot4Key = keyof typeof HOME_4_ASSETS;

export type HomeAppearance = {
  wall: HomeWallKey;
  floor: HomeFloorKey;
  ornament_1?: HomeOrnament1Key | null;
  ornament_2?: HomeOrnament2Key | null;
  home_1?: HomeSlot1Key | null;
  home_2?: HomeSlot2Key | null;
  home_3?: HomeSlot3Key | null;
  home_4?: HomeSlot4Key | null;
};
