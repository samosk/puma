export const CAT_ASSETS = {
  cat_black: require("../../../assets/cat/cat_black.png"),
  cat_orange: require("../../../assets/cat/cat_orange.png"),
  cat_tabby: require("../../../assets/cat/cat_tabby.png"),
  cat_tuxedo: require("../../../assets/cat/cat_tuxedo.png"),
  cat_white: require("../../../assets/cat/cat_white.png"),
} as const;

export const BODY_ASSETS = {
  body_astro_suit: require("../../../assets/cosmetics/body_astro_suit.png"),
  body_black_shirt: require("../../../assets/cosmetics/body_black_shirt.png"),
  body_blue_shirt: require("../../../assets/cosmetics/body_blue_shirt.png"),
  body_green_shirt: require("../../../assets/cosmetics/body_green_shirt.png"),
  body_red_shirt: require("../../../assets/cosmetics/body_red_shirt.png"),
} as const;

export const ACC_ASSETS = {
  acc_gold_chain: require("../../../assets/cosmetics/acc_gold_chain.png"),
  acc_silver_chain: require("../../../assets/cosmetics/acc_silver_chain.png"),
  acc_snorkel: require("../../../assets/cosmetics/acc_snorkel.png"),
  acc_sunglasses: require("../../../assets/cosmetics/acc_sunglasses.png"),
} as const;

export const HAT_ASSETS = {
  hat_astro_helmet: require("../../../assets/cosmetics/hat_astro_helmet.png"),
  hat_cap: require("../../../assets/cosmetics/hat_cap.png"),
  hat_cowboy_hat: require("../../../assets/cosmetics/hat_cowboy_hat.png"),
  hat_crown: require("../../../assets/cosmetics/hat_crown.png"),
  hat_race_helmet: require("../../../assets/cosmetics/hat_race_helmet.png"),
  hat_tophat: require("../../../assets/cosmetics/hat_tophat.png"),
} as const;

export type CatBaseKey = keyof typeof CAT_ASSETS;
export type CatBodyKey = keyof typeof BODY_ASSETS;
export type CatAccessoryKey = keyof typeof ACC_ASSETS;
export type CatHatKey = keyof typeof HAT_ASSETS;

export type CatAppearance = {
  base: CatBaseKey;
  body?: CatBodyKey | null;
  acc?: CatAccessoryKey | null;
  hat?: CatHatKey | null;
};
