// =====================================================================
// SPRITES FÖR KOSMETIK
// Läggs i: src/constants/cosmeticSprites.ts
//
// Den här filen skapar inga egna require() längre. Den återanvänder
// gruppens kartor i cat-assets.ts, så att varje bild bara listas på ETT
// ställe. Lägger ni till en ny keps gör ni det i cat-assets.ts, så dyker
// den upp i både shop, garderob och CatAvatar.
//
// Nyckeln är cosmetics.asset_key i databasen, t.ex. 'hat_cap'.
// OBS: nyckeln för astrodräkten är med litet a: 'body_astro_suit'.
//
// Interiörbilder läggs till här när de finns, t.ex.:
//   cat_bed: require('../../assets/interior/cat_bed.png'),
// =====================================================================


import { ACC_ASSETS, BODY_ASSETS, HAT_ASSETS } from '@/components/cat/cat-assets';


export const COSMETIC_SPRITES: Record<string, number> = {
 ...BODY_ASSETS,
 ...ACC_ASSETS,
 ...HAT_ASSETS,
};
