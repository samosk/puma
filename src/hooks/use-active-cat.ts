import {
  CAT_ASSETS,
  type CatAppearance,
  type CatBaseKey,
} from '@/components/cat/cat-assets';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export type ActiveCat = {
  id: string;
  name: string;
  xp: number;
  appearance: CatAppearance;
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
};

function isCatBaseKey(value: unknown): value is CatBaseKey {
  return (
    typeof value === 'string' &&
    Object.prototype.hasOwnProperty.call(CAT_ASSETS, value)
  );
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

      const { data, error: animalError } = await supabase
        .from('animals')
        .select('id, name, xp, species(asset_key)')
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

      setActiveCat({
        id: animal.id,
        name: animal.name,
        xp: animal.xp ?? 0,
        appearance: { base },
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
