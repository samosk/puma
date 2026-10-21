// =====================================================================
// SPRITES FÖR SPECIES
// =====================================================================


/* export const SPECIES_SPRITES: Record<string, number> = {
 // Cats
 cat_black: require('../../assets/cat/cat_black.png'),
 cat_orange: require('../../assets/cat/cat_orange.png'),
 cat_tabby: require('../../assets/cat/cat_tabby.png'),
 cat_tuxedo: require('../../assets/cat/cat_tuxedo.png'),
 cat_white: require('../../assets/cat/cat_white.png')
}; */


import { CAT_ASSETS } from '@/components/cat/cat-assets';


export const SPECIES_SPRITES: Record<string, number> = {
 ...CAT_ASSETS,
};
