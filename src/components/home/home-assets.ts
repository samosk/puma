export const ROOM_SHADING_IMAGE = require("../../../assets/home/room_shading.png");
export const ROOM_WINDOW_IMAGE = require("../../../assets/home/room_window.png");

export const WALL_ASSETS = {
  wall_beige: require("../../../assets/home/wall/wall_beige.png"),
  wall_blue: require("../../../assets/home/wall/wall_blue.png"),
  wall_green: require("../../../assets/home/wall/wall_green.png"),
} as const;

export const FLOOR_ASSETS = {
  floor_oak: require("../../../assets/home/floor/floor_oak.png"),
  floor_concrete: require("../../../assets/home/floor/floor_concrete.png"),
  floor_walnut: require("../../../assets/home/floor/floor_walnut.png"),
} as const;

export const ORNAMENT_1_ASSETS = {
  ornament_1_curtains: require("../../../assets/home/ornament_1/ornament_1_curtains.png"),
  ornament_1_curtains_wide: require("../../../assets/home/ornament_1/ornament_1_curtains_wide.png"),
  ornament_1_red_curtains: require("../../../assets/home/ornament_1/ornament_1_red_curtains.png"),
} as const;

export const ORNAMENT_2_ASSETS = {
  ornament_2_painting: require("../../../assets/home/ornament_2/ornament_2_painting.png"),
} as const;

export const HOME_1_ASSETS = {
  home_1_leather_sofa: require("../../../assets/home/home_1/home_1_leather_sofa.png"),
  home_1_fabric_couch: require("../../../assets/home/home_1/home_1_fabric_couch.png"),
} as const;

export const HOME_2_ASSETS = {
  home_2_cardboard_box: require("../../../assets/home/home_2/home_2_cardboard_box.png"),
  home_2_oak_table: require("../../../assets/home/home_2/home_2_oak_table.png"),
} as const;

export const HOME_3_ASSETS = {
  home_3_floor_plant: require("../../../assets/home/home_3/home_3_floor_plant.png"),
  home_3_floor_lamp: require("../../../assets/home/home_3/home_3_floor_lamp.png"),
} as const;

export const HOME_4_ASSETS = {
  home_4_rug: require("../../../assets/home/home_4/home_4_rug.png"),
  home_4_grid_carpet: require("../../../assets/home/home_4/home_4_grid_carpet.png"),
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

// cosmetics.type values that belong to the room (one item per type).
export const HOME_SLOT_TYPES = [
  "wall",
  "floor",
  "ornament_1",
  "ornament_2",
  "home_1",
  "home_2",
  "home_3",
  "home_4",
] as const;

export type HomeSlotType = (typeof HOME_SLOT_TYPES)[number];

export function isHomeSlotType(value: string): value is HomeSlotType {
  return (HOME_SLOT_TYPES as readonly string[]).includes(value);
}

function pick<T extends object>(map: T, key?: string | null): keyof T | null {
  return key && key in map ? (key as keyof T) : null;
}

// Builds the room from the asset keys equipped per slot type. Wall and
// floor are always drawn, so they fall back to a default when nothing is
// equipped; the other slots are simply left empty.
export function buildHomeAppearance(
  assetKeyByType: Partial<Record<HomeSlotType, string>>,
): HomeAppearance {
  return {
    wall: pick(WALL_ASSETS, assetKeyByType.wall) ?? "wall_beige",
    floor: pick(FLOOR_ASSETS, assetKeyByType.floor) ?? "floor_oak",
    ornament_1: pick(ORNAMENT_1_ASSETS, assetKeyByType.ornament_1),
    ornament_2: pick(ORNAMENT_2_ASSETS, assetKeyByType.ornament_2),
    home_1: pick(HOME_1_ASSETS, assetKeyByType.home_1),
    home_2: pick(HOME_2_ASSETS, assetKeyByType.home_2),
    home_3: pick(HOME_3_ASSETS, assetKeyByType.home_3),
    home_4: pick(HOME_4_ASSETS, assetKeyByType.home_4),
  };
}
