import { supabase } from '../lib/supabase';
import type { Candy } from '../types/types';

export async function collectCandy(
    candyId: string,
    userId: string
): Promise<Candy | null> {
    console.log('🍬 Trying to collect candy:', candyId);
    console.log('👤 Collector:', userId);

    const timestamp = new Date().toISOString();

    const { data, error } = await supabase
        .from('candy_spawns')
        .update({
            user_id: userId,
            collected_at: timestamp,
        })
        .eq('id', candyId)
        .select(
            'id, user_id, latitude, longitude, expires_at, collected_at'
        );

    console.log('🍬 Update result:', data);
    console.log('🍬 Update error:', error);

    if (error) {
        console.error(
            '❌ Failed to collect candy:',
            error
        );
        return null;
    }

    if (!data || data.length === 0) {
        console.log(
            '⚠️ Update returned 0 rows'
        );
        return null;
    }

    const collectedCandy = data[0];

    console.log(
        '✅ Candy updated in database'
    );

    console.log(
        '   ID:',
        collectedCandy.id
    );

    console.log(
        '   user_id:',
        collectedCandy.user_id
    );

    console.log(
        '   collected_at:',
        collectedCandy.collected_at
    );

    return collectedCandy;
}