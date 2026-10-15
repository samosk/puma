
import { supabase } from '../lib/supabase';

export async function recordCandyActivity(
    userId: string,
    timestamp: number = Date.now(),
): Promise<boolean> {
    const now = new Date(timestamp);
    const date =
        `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    try {
        const { data: activity, error: readError } = await supabase
            .from('activity_days')
            .select('distance_m, steps, candies_collected')
            .eq('id', userId)
            .eq('date', date)
            .maybeSingle();

        if (readError) {
            console.error('Could not fetch daily candy activity:', readError);
            return false;
        }

        const { error: saveError } = await supabase
            .from('activity_days')
            .upsert(
                {
                    id: userId,
                    date,
                    distance_m: activity?.distance_m ?? 0,
                    steps: activity?.steps ?? 0,
                    candies_collected: (activity?.candies_collected ?? 0) + 1,
                },
                { onConflict: 'id,date' },
            );

        if (saveError) {
            console.error('Could not save daily candy activity:', saveError);
            return false;
        }

        const { error: profileError } = await supabase
            .from('profiles')
            .update({ last_active_date: date })
            .eq('id', userId);

        if (profileError) {
            console.error('Could not update last active date:', profileError);
            return false;
        }

        return true;
    } catch (error) {
        console.error('Failed to record candy activity:', error);
        return false;
    }
}
