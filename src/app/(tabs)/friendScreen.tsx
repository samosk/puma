import ChallengeFriendPopup, { ChallengeChoice } from '@/components/challengeFriendPopup';
import { Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';


// Fixed reward value for friend challenges
const FRIEND_CHALLENGE_CANDY_REWARD = 6;
const FRIEND_CHALLENGE_COIN_REWARD = 100;
//const FRIEND_CHALLENGE_XP_REWARD = ska det vara fast eller dynamiskt beroende på typ..?
// Max ammount of friends allowed
const MAX_FRIENDS = 99; // 
// Size of the back arrow (the spacer on the right matches it)
const HEADER_ICON_SIZE = 34;

// Placeholder för leveluträkning, samma som lovisa
const XP_PER_LEVEL = 100;
const getLevel = (xp : number) => Math.floor(xp / XP_PER_LEVEL) + 1;
const getXpToNextLevel = (xp: number) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);

// Function to calculate and show when the animal was made
function ageInDays(createdAt: string | null): number {
	if (!createdAt) return 0;
	return Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 86_400_000));
}

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
		created_at: string | null
		species: { name: string; asset_key: string } | null
	} | null;
};

// Someone who has sent you a friend request
type FriendRequest = {
  id: string;
  username: string;
};

const SPRITES: Record<string, number> = {
	cat_black: require('../../../assets/cat/cat_head_black.png'),
	cat_orange: require('../../../assets/cat/cat_head_orange.png'),
	cat_grey: require('../../../assets/cat/cat_head_tabby.png'),
	cat_tuxedo: require('../../../assets/cat/cat_head_tuxedo.png'),
	cat_white: require('../../../assets/cat/cat_head_white.png'),
};
const FALLBACK_EMOJI = '🐾';

function Sprite({ assetKey, size = 56 }: { assetKey?: string; size?: number }) {
  const source = assetKey ? SPRITES[assetKey] : undefined;
  if (source) {
	return <Image source={source} style={{ width: size, height: size }} contentFit="contain" />;
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
		const xp = friend.animal?.xp ?? 0;
	  return (
		<Pressable onPress={onPress} style={[styles.card, expanded && styles.cardExpanded]}
		accessibilityRole="button"
		accessibilityLabel={friend.username}
		>
		<View style={styles.row}>
		{/*Animal picture*/}
		<Sprite assetKey={friend.animal?.species?.asset_key} />
		{/*Name and xp*/}
		  <View style={styles.info}>
			<Text style={styles.name}>{friend.username}</Text>
			<Text style={styles.small}>
				{friend.animal ? `${getXpToNextLevel(xp)} xp until next level` : 'No animals yet'}
			</Text>
			</View>

		{/*Level and age*/}
		{friend.animal && (
			<View style={styles.right}>
				<View style={styles.levelRow}>
					{/*Om vi vill att det ska stå "level" brevid leveln, blev lite uggo*/}
					<Text style={styles.small}>Level</Text> 

					<View style={styles.level}>
						<Text style={styles.levelText}>{getLevel(xp)}</Text>
					</View>
				</View>
				<Text style={styles.small}>Age: {ageInDays(friend.animal.created_at)} days</Text>
			</View>
		)}
		</View>

		  {expanded && (
			<Pressable
				style={({pressed}) => [styles.challengeButton, pressed && {opacity: 0.7}]}
				onPress={onChallenge}
			>
			<Text style={styles.challengeButtonText}>Challenge</Text>
			</Pressable>
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

  // Adding friends by username + requests waiting for your answer
  const [addName, setAddName] = useState('');
  const [adding, setAdding] = useState(false);
  const [requests, setRequests] = useState<FriendRequest[]>([]);

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


  // Send a friend request to the username in the text field.
  // If that person already asked you, you become friends right away.
  async function addFriend() {
	const name = addName.trim();
	if (!name || adding) return;

	setAdding(true);
	const { data, error } = await supabase.rpc('send_friend_request', { p_username: name });
	setAdding(false);

	if (error) {
		Alert.alert('Could not add friend', error.message);
		return;
	}

	setAddName('');
	Keyboard.dismiss();
	Alert.alert(data === 'accepted' ? `You and ${name} are now friends!` : `Friend request sent to ${name}`);
	loadRows();
  }

  // Accept or decline a request someone sent you
  async function respondToRequest(request: FriendRequest, accept: boolean) {
	const { error } = await supabase.rpc('respond_friend_request', {
		p_requester_id: request.id,
		p_accept: accept,
	});

	if (error) {
		Alert.alert('Something went wrong', error.message);
		return;
	}
	loadRows();
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
	  .select('requester_id, adresser_id, status')
	  .or(`requester_id.eq.${userId},adresser_id.eq.${userId}`);
	
	if (friendshipsError) {
		setError(friendshipsError.message);
		setLoading(false);
		return;
	}

	const friendIds = (friendships ?? [])
		.filter((friendship) => friendship.status === 'accepted')
		.map((friendship) => friendship.requester_id === userId ? friendship.adresser_id : friendship.requester_id);

	// Requests other users have sent to you, waiting for Accept / Decline
	const requesterIds = (friendships ?? [])
		.filter((friendship) => friendship.status === 'pending' && friendship.adresser_id === userId)
		.map((friendship) => friendship.requester_id);

	if (friendIds.length === 0 && requesterIds.length === 0) {
		setRows([]);
		setRequests([]);
		setLoading(false);
		return;
	}

	// Usernames for both friends and requesters, in one request
	const { data: profiles, error: profileError } = await supabase
	  .from('profiles')
	  .select('id, username')
	  .in('id', [...friendIds, ...requesterIds]);

	if (profileError) {
		setError(profileError.message);
		setLoading(false);
		return;
	}

	const {data: animals, error: animalError} = await supabase
		.from('animals')
		.select('owner_id, name, xp, created_at, species(name, asset_key)')
		.in('owner_id', friendIds);

	if (animalError) {
		setError(animalError.message);
		setLoading(false);
		return;
	}

	setRequests((profiles ?? []).filter((profile) => requesterIds.includes(profile.id)));

	const friends = (profiles ?? []).filter((profile) => friendIds.includes(profile.id)).map((profile) => ({
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
	  {/*Header*/}
	  <View style={styles.header}>
		{/* Empty space as wide as the arrow, so the title stays centered */}
				<View style={styles.headerSpacer} />

		<Text style={styles.headerTitle}>
			Friends ({rows.length} of {MAX_FRIENDS})
		</Text>
		<View style={{width:32}}/>
	  </View>

	  <FlatList
		data={rows}
		// Each row needs a unique key; most tables have an "id" column
		keyExtractor={(item) => item.id}
		contentContainerStyle={styles.list}
		// Lets the Add button work while the keyboard is open
		keyboardShouldPersistTaps="handled"
		// Above the friends: add by username + incoming requests
		ListHeaderComponent={
			<View style={styles.listHeader}>
				<View style={styles.addRow}>
					<TextInput
						value={addName}
						onChangeText={setAddName}
						placeholder="Add a friend by username"
						placeholderTextColor="#919191"
						autoCapitalize="none"
						autoCorrect={false}
						returnKeyType="send"
						onSubmitEditing={addFriend}
						style={styles.addInput}
					/>
					<Pressable
						style={[styles.addButton, (adding || !addName.trim()) && { opacity: 0.5 }]}
						disabled={adding || !addName.trim()}
						onPress={addFriend}
					>
						{adding ? (
							<ActivityIndicator color="#FFFFFF" />
						) : (
							<Text style={styles.addButtonText}>Add</Text>
						)}
					</Pressable>
				</View>

				{requests.length > 0 && (
					<View style={styles.requests}>
						<Text style={styles.sectionLabel}>Friend requests</Text>
						{requests.map((request) => (
							<View key={request.id} style={styles.requestCard}>
								<Text style={styles.name}>{request.username}</Text>
								<View style={styles.requestButtons}>
									<Pressable style={styles.declineButton} onPress={() => respondToRequest(request, false)}>
										<Text style={styles.declineText}>Decline</Text>
									</Pressable>
									<Pressable style={styles.acceptButton} onPress={() => respondToRequest(request, true)}>
										<Text style={styles.acceptText}>Accept</Text>
									</Pressable>
								</View>
							</View>
						))}
					</View>
				)}
			</View>
		}
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
  screen: { flex: 1, backgroundColor: '#EDEDED', paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: Fonts.regular, fontSize: 28, fontWeight: '700', color: '#2c2c2c', marginTop: 16 },
  muted: { fontFamily: Fonts.regular, fontSize: 14, color: COLORS.muted, marginTop: 4 },
  error: { fontFamily: Fonts.regular, fontSize: 14, color: COLORS.error },
  list: { paddingVertical: 16, gap: 12 },

  header: {
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginTop: 12,
  },
  headerIcon: {fontFamily: Fonts.regular, fontSize: 32, color: '#2c2c2c', width: 32},
  headerTitle: {fontFamily: Fonts.regular, fontSize: 15, fontWeight: '600', color: '#2C2C2C'},

  card: {
	backgroundColor: '#FFFFFF',
	borderRadius: 20,
	paddingHorizontal: 18,
	paddingVertical: 14,
	borderWidth: 2,
	borderColor: 'transparent',
	shadowColor: '#000000',
	shadowOpacity: 0.08,
	shadowRadius: 1,
	shadowOffset: {width: 0, height: 2},
  },
  cardExpanded: {borderColor: '#3DCB2A'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 14},
  info: {flex: 1},
  name: {fontFamily: Fonts.regular, fontSize: 18, fontWeight: '600', color: '#2C2C2C'},
  small: {fontFamily: Fonts.regular, fontSize: 11, color: '#919191', marginTop: 2},

  right: {alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between'},
  levelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

  level: {
	minWidth: 26,
	height: 26,
	borderRadius: 8,
	borderWidth: 1,
	borderColor: '#2C2C2C',
	alignItems: 'center',
	justifyContent: 'center',
	paddingHorizontal: 4,
  },
  levelText: {fontFamily: Fonts.regular, fontSize: 15, fontWeight: '600', color: '#2C2C2C'},

  challengeButton: {
	alignSelf: 'center',
	marginTop: 14,
	backgroundColor: '#E6E6E6',
	borderRadius: 24,
	paddingHorizontal: 22,
	paddingVertical: 10,
	shadowColor: '#000000',
	shadowOpacity: 0.12,
	shadowRadius: 1,
	shadowOffset: {width: 0, height: 2},
  },
  challengeButtonText: { fontFamily: Fonts.regular, fontSize: 16, color: '#2C2C2C', fontWeight: '600' },

  spritePlaceholder: {
    backgroundColor: COLORS.tag,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
	headerSpacer: { width: HEADER_ICON_SIZE },

  // Add friend + friend requests
  listHeader: { gap: 16 },
  addRow: { flexDirection: 'row', gap: 10 },
  addInput: {
	flex: 1,
	backgroundColor: '#FFFFFF',
	borderRadius: 20,
	paddingHorizontal: 16,
	paddingVertical: 12,
	fontFamily: Fonts.regular,
	fontSize: 16,
	color: '#2C2C2C',
  },
  addButton: {
	backgroundColor: '#3DCB2A',
	borderRadius: 20,
	paddingHorizontal: 20,
	alignItems: 'center',
	justifyContent: 'center',
	minWidth: 72,
  },
  addButtonText: { fontFamily: Fonts.regular, color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  requests: { gap: 8 },
  sectionLabel: { fontFamily: Fonts.regular, fontSize: 15, fontWeight: '600', color: '#2C2C2C' },
  requestCard: {
	backgroundColor: '#FFFFFF',
	borderRadius: 20,
	paddingHorizontal: 18,
	paddingVertical: 12,
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
  },
  requestButtons: { flexDirection: 'row', gap: 8 },
  declineButton: {
	backgroundColor: '#E6E6E6',
	borderRadius: 16,
	paddingHorizontal: 14,
	paddingVertical: 8,
  },
  declineText: { fontFamily: Fonts.regular, fontSize: 14, color: '#2C2C2C', fontWeight: '600' },
  acceptButton: {
	backgroundColor: '#3DCB2A',
	borderRadius: 16,
	paddingHorizontal: 14,
	paddingVertical: 8,
  },
  acceptText: { fontFamily: Fonts.regular, fontSize: 14, color: '#FFFFFF', fontWeight: '600' },

});