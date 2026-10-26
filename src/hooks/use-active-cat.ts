import {
  ACC_ASSETS,
  BODY_ASSETS,
  CAT_ASSETS,
  HAT_ASSETS,
  type CatAppearance,
  type CatBaseKey,
} from '@/components/cat/cat-assets';
import {
  buildHomeAppearance,
  isHomeSlotType,
  type HomeAppearance,
  type HomeSlotType,
} from '@/components/home/home-assets';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type ActiveCat = {
  id: string;
  name: string;
  xp: number;
  appearance: CatAppearance;
  // The cat's room, built from the interior items equipped on it
  home: HomeAppearance;
};

type UseActiveCatResult = {
  activeCat: ActiveCat | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

type ActiveAnimalRow = {
  id: string;
  name: string;
  xp: number | null;
  species: { asset_key: string | null } | null;
  // Everything equipped on this cat, with the cosmetic's slot and asset key
  user_cosmetics: {
    cosmetics: { type: string; asset_key: string } | null;
  }[];
};

function isCatBaseKey(value: unknown): value is CatBaseKey {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(CAT_ASSETS, value)
  );
}

// Same helper as in the wardrobe screen: returns the key if it exists in
// the asset map, otherwise null (then that layer isn't drawn).
function pick<T extends object>(map: T, key?: string | null): keyof T | null {
  return key && key in map ? (key as keyof T) : null;
}

export function useActiveCat(): UseActiveCatResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [activeCat, setActiveCat] = useState<ActiveCat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActiveCat = useCallback(async () => {
    if (!userId) {
      setActiveCat(null);
      setError('No authenticated user.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('active_animal_id')
        .eq('id', userId)
        .single();

      if (profileError) {
        setActiveCat(null);
        setError(profileError.message);
        return;
      }

      if (!profile.active_animal_id) {
        setActiveCat(null);
        return;
      }

      // The cat, its species, and the cosmetics equipped on it, in one request.
      // user_cosmetics is joined through user_cosmetics.equipped_animal_id.
      const { data, error: animalError } = await supabase
        .from('animals')
        .select('id, name, xp, species(asset_key), user_cosmetics(cosmetics(type, asset_key))')
        .eq('id', profile.active_animal_id)
        .eq('owner_id', userId)
        .maybeSingle();

      if (animalError) {
        setActiveCat(null);
        setError(animalError.message);
        return;
      }

      if (!data) {
        setActiveCat(null);
        setError('The selected cat could not be found.');
        return;
      }

      const animal = data as unknown as ActiveAnimalRow;
      const assetKey = animal.species?.asset_key;
      const base = isCatBaseKey(assetKey) ? assetKey : 'cat_black';

      // What the cat is wearing, and what is placed in its room, per slot
      // (same as the wardrobe screen).
      const wornBySlot: Partial<Record<'hat' | 'neck' | 'body', string>> = {};
      const roomBySlot: Partial<Record<HomeSlotType, string>> = {};
      for (const item of animal.user_cosmetics ?? []) {
        const cosmetic = item.cosmetics;
        if (!cosmetic) continue;
        if (cosmetic.type === 'hat' || cosmetic.type === 'neck' || cosmetic.type === 'body') {
          wornBySlot[cosmetic.type] = cosmetic.asset_key;
        } else if (isHomeSlotType(cosmetic.type)) {
          roomBySlot[cosmetic.type] = cosmetic.asset_key;
        }
      }

      setActiveCat({
        id: animal.id,
        name: animal.name,
        xp: animal.xp ?? 0,
        // Built exactly like the wardrobe preview, so the cat looks the
        // same on both screens. Note: the "neck" slot is drawn as "acc".
        appearance: {
          base,
          hat: pick(HAT_ASSETS, wornBySlot.hat),
          acc: pick(ACC_ASSETS, wornBySlot.neck),
          body: pick(BODY_ASSETS, wornBySlot.body),
        } as CatAppearance,
        home: buildHomeAppearance(roomBySlot),
      });

      if (assetKey && !isCatBaseKey(assetKey)) {
        setError(`Unknown cat asset key: ${assetKey}`);
      }
    } catch (unexpectedError) {
      setActiveCat(null);
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'Could not load the selected cat.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void loadActiveCat();
    }, [loadActiveCat]),
  );

  return {
    activeCat,
    loading,
    error,
    reload: loadActiveCat,
  };
}