// =====================================================================
// SPRITES FÖR KOSMETIK
// Läggs i: src/constants/cosmeticSprites.ts
//
// React Native kan inte require() dynamiskt, så varje bild måste listas här.
// Nyckeln är cosmetics.asset_key i databasen = filnamnet utan ".png".
// Då måste databasen innehålla t.ex. asset_key = 'hat_cap' (inte 'party_hat').
//
// OBS: Jag såg inte vad mappen med kläderna heter (verktygstipset
// skymde den). Jag har skrivit "cosmetics". Byt ut den mot rätt
// mappnamn (sök och ersätt "assets/cosmetics/" i den här filen).
//
// Sökvägen är relativ från src/constants/ upp till projektets assets/.
// Interiörbilder läggs till här när de finns, t.ex.:
//   cat_bed: require('../../assets/interior/cat_bed.png'),
// =====================================================================

export const COSMETIC_SPRITES: Record<string, number> = {
  // Accessories
  acc_gold_chain: require('../../assets/cosmetics/acc_gold_chain.png'),
  acc_race_helmet: require('../../assets/cosmetics/acc_race_helmet.png'),
  acc_silver_chain: require('../../assets/cosmetics/acc_silver_chain.png'),
  acc_snorkel: require('../../assets/cosmetics/acc_snorkel.png'),
  acc_sunglasses: require('../../assets/cosmetics/acc_sunglasses.png'),

  // Body
  body_Astro_suit: require('../../assets/cosmetics/body_Astro_suit.png'),
  body_black_shirt: require('../../assets/cosmetics/body_black_shirt.png'),
  body_blue_shirt: require('../../assets/cosmetics/body_blue_shirt.png'),
  body_green_shirt: require('../../assets/cosmetics/body_green_shirt.png'),
  body_red_shirt: require('../../assets/cosmetics/body_red_shirt.png'),

  // Hats
  hat_astro_helmet: require('../../assets/cosmetics/hat_astro_helmet.png'),
  hat_cap: require('../../assets/cosmetics/hat_cap.png'),
  hat_cowboy_hat: require('../../assets/cosmetics/hat_cowboy_hat.png'),
  hat_crown: require('../../assets/cosmetics/hat_crown.png'),
  hat_tophat: require('../../assets/cosmetics/hat_tophat.png'),
};
