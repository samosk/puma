import { supabase } from '../lib/supabase';
import type { Candy } from '../types/types';

export async function collectCandy(
	candyId: string
): Promise<Candy | null> {
	console.log(
		'🍬 Trying to collect candy:',
		candyId
	);

	const timestamp = new Date().toISOString();

	const { data, error } = await supabase
		.from('candy_spawns')
		.update({
			collected_at: timestamp,
		})
		.eq('id', candyId)
		.select(
			'id, latitude, longitude, expires_at, collected_at'
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
		'   collected_at:',
		collectedCandy.collected_at
	);

	return collectedCandy;
}