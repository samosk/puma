import { supabase } from '../lib/supabase';
import type { User } from '../types/types';

export async function getUserProfile(
    userId: string
): Promise<User | null> {
    const { data, error } = await supabase
        .from('profiles')
        .select('id, username, candies')
        .eq('id', userId)
        .single();

    if (error) {
        console.error(
            'Failed to get user profile:',
            error
        );

        return null;
    }

    return data;
}