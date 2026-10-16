import ChallengeFriendPopup, { ChallengeChoice } from '@/components/challengeFriendPopup';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// Fixed reward value for friend challenges
const FRIEND_CHALLENGE_CANDY_REWARD = 6;
const FRIEND_CHALLENGE_COIN_REWARD = 100;
//const FRIEND_CHALLENGE_XP_REWARD = ska det vara fast eller dynamiskt beroende på typ..?

// ---------------------------------------------------------------
// COLORS
// One fixed palette, so the screen looks the same whether the
// phone is in light or dark mode. Change the hex values freely.
// ---------------------------------------------------------------
const COLORS = {
  background: '#101318',
  card: '#1A1E25',
  border: '#2A303A',
  text: '#EEF1F5',
  muted: '#98A2B3',
  error: '#F97066',
tag: '#EDEDED',
};

type Friend = {
  id: string;
  username: string;
  	animal: { 
		name: string; 
		xp: number 
		species: { name: string; asset_key: string } | null
	} | null;
};

const SPRITES: Record<string, number> = {};
const FALLBACK_EMOJI = '🐾';

function Sprite({ assetKey, size = 56 }: { assetKey?: string; size?: number }) {
  const source = assetKey ? SPRITES[assetKey] : undefined;
  if (source) {
	return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
	<View style={[styles.spritePlaceholder, { width: size, height: size }]}>
	  <Text style={{ fontSize: size * 0.5 }}>{FALLBACK_EMOJI}</Text>
	</View>
  );
}

function FriendCard({
	  friend,
	  expanded,
	  onPress,
	  onChallenge,
	}: {
		friend : Friend;
		expanded: boolean;
		onPress: () => void;
		onChallenge: () => void;
	}) {
	  return (
		<Pressable onPress={onPress} style={styles.card}
		accessibilityRole="button"
		accessibilityLabel={friend.username}
		>
		<View style={styles.row}>
		<Sprite assetKey={friend.animal?.species?.asset_key} />
		  <View style={styles.info}>
			<Text style={styles.value}>{friend.username}</Text>
			{friend.animal ? (
				<Text style={styles.muted}>
					{friend.animal.name} {friend.animal.xp}
				</Text>
			) : (
				<Text style={styles.muted}>No animal yet</Text>
			)}
			</View>
		</View>
		  {expanded && (
			<View style={styles.details}>
			<Pressable style={styles.challengeButton} onPress={onChallenge}>
			  <Text style={styles.challengeButtonText}>Challenge</Text>
			</Pressable>
			</View>
		  )}
		</Pressable>
	  );
}

export default function FriendsScreen() {
	const {session} = useAuth();
	const router = useRouter();
	const userId = session?.user.id;
  // rows    = the data from the table (starts empty)
  // loading = true while waiting for Supabase
  // error   = error message if the request failed, otherwise null
  const [rows, setRows] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedFriendId, setExpandedFriendId] = useState<string | null>(null);

  const[challengeTarget, setChallengeTarget] = useState<Friend | null>(null);
  function challengeFriend(friend: Friend) {
	setChallengeTarget(friend);
  }

// GAMLA
//   function sendChallenge(choice: ChallengeChoice) {
// 	console.log('Challenge sent to', challengeTarget?.username, choice);
// 	setChallengeTarget(null);
// 	router.navigate('/challengeScreen');
//   }

async function sendChallenge (choice: ChallengeChoice) {
	if (!challengeTarget || !userId) return;

	const isDay = choice.duration === '24h'
	const metric = choice.type === 'steps' ? 'steps' : 'candies_collected'

	const {error} = await supabase.from('challenges').insert({
		title: `${choice.goal} ${choice.type === 'steps' ? 'steps' : 'candies'} vs ${challengeTarget.username}`,
		period: isDay ? 'daily' : 'weekly',
		metric,
		target: choice.goal,
		friend_challenge: true,
		challenger_id: userId,
		challenged_id: challengeTarget.id,
		ends_at: new Date(Date.now() + (isDay ? 24 : 24 * 7) * 60 * 60 * 1000).toISOString(),
		status: 'accepted',
		candy_reward: FRIEND_CHALLENGE_CANDY_REWARD,
		coin_reward: FRIEND_CHALLENGE_COIN_REWARD,
	});

	if(error) {
		Alert.alert('Could not send challenge', error.message);
		return;
	}

	Alert.alert('Challenge sent to ', `${challengeTarget.username}!`);
	setChallengeTarget(null);
	router.navigate('/challengeScreen');
}


  // Fetches the data from Supabase.
  // useCallback just keeps this function stable so useEffect below
  // doesn't re-run it on every render.
  const loadRows = useCallback(async () => {
	if(!userId) return;
	setLoading(true);
	setError(null);

	const { data: friendships, error: friendshipsError} = await supabase
	  .from('friendships')
	  .select('requester_id, adresser_id')
	  .or(`requester_id.eq.${userId},adresser_id.eq.${userId}`)
	  .eq('status', 'accepted');
	
	if (friendshipsError) {
		setError(friendshipsError.message);
		setLoading(false);
		return;
	}

	const friendIds = (friendships ?? []).map((friendship) => friendship.requester_id === userId ? friendship.adresser_id : friendship.requester_id);

	if (friendIds.length === 0) {
		setRows([]);
		setLoading(false);
		return;
	}

	const { data: profiles, error: profileError } = await supabase
	  .from('profiles')
	  .select('id, username')
	  .in('id', friendIds);

	if (profileError) {
		setError(profileError.message);
		setLoading(false);
		return;
	}

	const {data: animals, error: animalError} = await supabase
		.from('animals')
		.select('owner_id, name, xp, species(name, asset_key)')
		.in('owner_id', friendIds);

	if (animalError) {
		setError(animalError.message);
		setLoading(false);
		return;
	}

	const friends = (profiles ?? []).map((profile) => ({
		...profile,
		animal: animals?.find((animal) => animal.owner_id === profile.id) || null
	})) as unknown as Friend[];

	setRows(friends);
	setLoading(false);
  }, [userId]);

  // Run loadRows once when the screen first opens
  useEffect(() => {
	loadRows();
  }, [loadRows]);

  // Spinner on the very first load (before any rows have arrived)
  if (loading && rows.length === 0) {
	return (
	  <View style={[styles.center, { backgroundColor: COLORS.background }]}>
		<ActivityIndicator color={COLORS.text} />
	  </View>
	);
  };

  return (
	<SafeAreaView style={styles.screen} edges={['top']}>
	  {/* Page title: shows the table name and how many rows came back */}
	  <Text style={styles.title}>Friends</Text>

	  <FlatList
		data={rows}
		// Each row needs a unique key; most tables have an "id" column
		keyExtractor={(item) => item.id}
		contentContainerStyle={styles.list}
		// Pull down on the list to reload the data
		refreshing={loading}
		onRefresh={loadRows}
		// Shown when there are no rows: either the error, or a hint
		ListEmptyComponent={
		  <Text style={error ? styles.error : styles.muted}>
			{error ?? 'No friends yet LOL'}
		  </Text>
		}
		// ---------------------------------------------------------------
		// HOW EACH ROW LOOKS
		// Right now it lists every column automatically. To design your
		// own layout, replace the inside of the card with specific
		// columns, for example:
		//
		// ---------------------------------------------------------------
		renderItem={({ item }) => (
			<FriendCard
				friend={item}
				expanded={expandedFriendId === item.id}
				onPress={() => setExpandedFriendId(expandedFriendId === item.id ? null : item.id)}
				onChallenge={() => challengeFriend(item)}
			/>
		)}
	  />
	  <ChallengeFriendPopup
		visible={challengeTarget !== null}
		friendName={challengeTarget?.username ?? ''}
		onClose={() => setChallengeTarget(null)}
		onConfirm={sendChallenge}
	  />
	</SafeAreaView>
  );
}

// Turns any database value into text: empty values become a dash,
// objects (like joined tables) become JSON
function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// ---------------------------------------------------------------
// STYLES — sizes, spacing and layout for everything above
// ---------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 16 },
  muted: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
  error: { fontSize: 14, color: COLORS.error },
  list: { paddingVertical: 16, gap: 12 },
  card: {
	backgroundColor: COLORS.card,
	borderColor: COLORS.border,
	borderWidth: 1,
	borderRadius: 12,
	padding: 14,
	gap: 8,
  },
  field: { flexDirection: 'row', gap: 12 },
  key: { width: 110, fontSize: 13, color: COLORS.muted },
  value: { flex: 1, fontSize: 15, color: COLORS.text },

  //Styling grejer
  details: {
	marginTop: 12,
	paddingTop: 12,
	borderTopWidth: 1,
	borderTopColor: COLORS.border,
	gap: 10,
  },
  	row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
	info: { flex: 1 },
  challengeButton: {
	alignSelf: 'flex-start',
	backgroundColor: COLORS.muted,
	borderRadius: 14,
	paddingHorizontal: 16,
	paddingVertical: 8,
  },
  challengeButtonText: { color: '#FFFFFF', fontWeight: '600' },
  spritePlaceholder: {
    backgroundColor: COLORS.tag,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});