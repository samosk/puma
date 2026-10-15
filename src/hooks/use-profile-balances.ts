import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { ProfileBalances } from '@/types/profile';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

type UseProfileBalancesResult = {
  balances: ProfileBalances | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

// Fetches the logged-in user's candies and coins from the profiles table.
// A screen can use this hook without needing to know how the Supabase query works.
export function useProfileBalances(): UseProfileBalancesResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [balances, setBalances] = useState<ProfileBalances | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadBalances = useCallback(async () => {
    if (!userId) {
      setBalances(null);
      setError('No authenticated user.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('candies, coins')
        .eq('id', userId)
        .single();

      if (queryError) {
        setError(queryError.message);
        return;
      }

      setBalances({
        candies: data.candies,
        coins: data.coins,
      });
    } catch (unexpectedError) {
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'Could not load profile balances.',
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Reload when the screen using this hook becomes active again.
  // This keeps the values fresh after collecting candies or spending coins.
  useFocusEffect(
    useCallback(() => {
      void loadBalances();
    }, [loadBalances]),
  );

  return {
    balances,
    loading,
    error,
    reload: loadBalances,
  };
}
