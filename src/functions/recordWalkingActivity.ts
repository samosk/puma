
import { supabase } from '../lib/supabase';

type ActivityDay = {
    id: string;
    date: string;
    distance_m: number;
    steps: number;
    candies_collected: number;
};

type AnimalActivityDay = {
    animal_id: string;
    owner_id: string;
    date: string;
    distance_m: number;
    steps: number;
};

const METRES_PER_STEP = 0.7;

function getLocalDate(timestamp: number): string {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
}

export async function recordWalkingActivity(
    userId: string,
    distanceM: number,
    timestamp: number,
): Promise<boolean> {
    if (!Number.isFinite(distanceM) || distanceM <= 0) {
        return false;
    }

    const date = getLocalDate(timestamp);

    try {
        // Get the active animal for this user.
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('active_animal_id')
            .eq('id', userId)
            .single();

        if (profileError || !profile) {
            console.error('Could not fetch active animal:', profileError);
            return false;
        }

        // Update or create the user's activity for this date.
        const { data: activity, error: activityError } = await supabase
            .from('activity_days')
            .select('id, date, distance_m, steps, candies_collected')
            .eq('id', userId)
            .eq('date', date)
            .maybeSingle();

        if (activityError) {
            console.error('Could not fetch daily activity:', activityError);
            return false;
        }

        const newDistance =
            (activity?.distance_m ?? 0) + distanceM;

        const newSteps = Math.floor(newDistance / METRES_PER_STEP);

        const activityRow: ActivityDay = {
            id: userId,
            date,
            distance_m: newDistance,
            steps: newSteps,
            candies_collected: activity?.candies_collected ?? 0,
        };

        const { error: saveActivityError } = await supabase
            .from('activity_days')
            .upsert(activityRow, {
                onConflict: 'id,date',
            });

        if (saveActivityError) {
            console.error('Could not save daily activity:', saveActivityError);
            return false;
        }

        // Update the selected animal's activity, if an animal is selected.
        if (profile.active_animal_id) {
            const animalId = profile.active_animal_id as string;

            const { data: animalActivity, error: animalReadError } =
                await supabase
                    .from('animal_activity_days')
                    .select('animal_id, owner_id, date, distance_m, steps')
                    .eq('animal_id', animalId)
                    .eq('date', date)
                    .maybeSingle();

            if (animalReadError) {
                console.error(
                    'Could not fetch animal daily activity:',
                    animalReadError,
                );
                return false;
            }

            const animalDistance =
                (animalActivity?.distance_m ?? 0) + distanceM;

            const animalRow: AnimalActivityDay = {
                animal_id: animalId,
                owner_id: userId,
                date,
                distance_m: animalDistance,
                steps: Math.floor(animalDistance / METRES_PER_STEP),
            };

            const { error: saveAnimalError } = await supabase
                .from('animal_activity_days')
                .upsert(animalRow, {
                    onConflict: 'animal_id,date',
                });

            if (saveAnimalError) {
                console.error(
                    'Could not save animal daily activity:',
                    saveAnimalError,
                );
                return false;
            }
        }

        // Update the user's last active date.
        const { error: updateProfileError } = await supabase
            .from('profiles')
            .update({ last_active_date: date })
            .eq('id', userId);

        if (updateProfileError) {
            console.error(
                'Could not update last active date:',
                updateProfileError,
            );
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to record walking activity:', error);
        return false;
    }
}