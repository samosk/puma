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
import {
 FLOOR_ASSETS,
 HOME_1_ASSETS,
 HOME_2_ASSETS,
 HOME_3_ASSETS,
 HOME_4_ASSETS,
 ORNAMENT_1_ASSETS,
 ORNAMENT_2_ASSETS,
 WALL_ASSETS,
} from '@/components/home/home-assets';


export const COSMETIC_SPRITES: Record<string, number> = {
 ...BODY_ASSETS,
 ...ACC_ASSETS,
 ...HAT_ASSETS,
 // Interiör: samma bilder som rummet på hemskärmen ritar
 ...WALL_ASSETS,
 ...FLOOR_ASSETS,
 ...ORNAMENT_1_ASSETS,
 ...ORNAMENT_2_ASSETS,
 ...HOME_1_ASSETS,
 ...HOME_2_ASSETS,
 ...HOME_3_ASSETS,
 ...HOME_4_ASSETS,
};
