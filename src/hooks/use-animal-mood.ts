import { useAuth } from '@/lib/auth';
import { calculateMood, type MoodResult } from '@/lib/animal-mood';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

const DEFAULT_DAILY_STEP_GOAL = 5000;

type UseAnimalMoodResult = {
  mood: MoodResult | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

function getLocalDateString(date: Date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${date.getFullYear()}-${month}-${day}`;
}

export function useAnimalMood(
  animalId: string | null | undefined,
): UseAnimalMoodResult {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [mood, setMood] = useState<MoodResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadMood = useCallback(async () => {
    if (!userId) {
      setMood(null);
      setError('No authenticated user.');
      setLoading(false);
      return;
    }

    if (!animalId) {
      setMood(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const now = new Date();
      const [profileResult, activityResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('daily_step_goal')
          .eq('id', userId)
          .single(),
        supabase
          .from('animal_activity_days')
          .select('steps')
          .eq('owner_id', userId)
          .eq('animal_id', animalId)
          .eq('date', getLocalDateString(now))
          .maybeSingle(),
      ]);

      const queryError = profileResult.error ?? activityResult.error;

      if (queryError) {
        setMood(null);
        setError(queryError.message);
        return;
      }

      if (!profileResult.data) {
        setMood(null);
        setError('The user profile could not be found.');
        return;
      }

      const storedGoal = profileResult.data.daily_step_goal;
      const dailyStepGoal =
        typeof storedGoal === 'number' && storedGoal > 0
          ? storedGoal
          : DEFAULT_DAILY_STEP_GOAL;

      setMood(
        calculateMood({
          animalSteps: activityResult.data?.steps ?? 0,
          dailyStepGoal,
          now,
        }),
      );
    } catch (unexpectedError) {
      setMood(null);
      setError(
        unexpectedError instanceof Error
          ? unexpectedError.message
          : 'Could not load the animal mood.',
      );
    } finally {
      setLoading(false);
    }
  }, [animalId, userId]);

  useFocusEffect(
    useCallback(() => {
      void loadMood();
    }, [loadMood]),
  );

  return {
    mood,
    loading,
    error,
    reload: loadMood,
  };
}
