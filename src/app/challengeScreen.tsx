import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';



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
};

type Metric = 'steps' | 'candies';

type Challenge = {
  id: string;
  title: string;
  period: 'daily' | 'weekly';
  metric: Metric;
  target: number;
  xp_reward: number;
  candy_reward: number;
  coin_reward: number;
};

type FriendChallenge = {
  id: string;
  metric: Metric;
  endTime: string;
  target: number;
  isSent: boolean;
  progress: number;
  friendsName: string;
  candyReward: number;
  coinReward: number;
};

// Används för att slumpa daily och weekly challenges
// Alla användare får samma daily och weekly (vet inte om vi vill ha det så)
function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
	hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Väljer en challenge ur databasen 
function pickFor(list: Challenge[], key: string): Challenge | null {
  if (list.length === 0) return null;
  return list[hashString(key) % list.length];
}

// Datum från mobilens lokala tid
function date(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Nyckel för dagens daily challenge
const today = () => date(new Date());

// Räkna ut starten på veckan (måndag) för att kunna hämta weekly challenges
function weekStart() : string {
	const d = new Date();
	const daySinceMonday = (d.getDay() + 6) % 7; // 0=Monday, 6=Sunday
	d.setDate(d.getDate() - daySinceMonday);
	return `week-${date(d)}`;
}


// ---------------------------------------------------------------
// endOfDay(), endOfWeek() and timeLeft() are helpfunctions
// for displaying time left for each challenge in challenge screen
// ---------------------------------------------------------------
function endOfDay() : Date {
	const d = new Date();
	d.setHours(24,0,0,0);
	return d;
}

function endOfWeek() : Date {
	const d = new Date();
	const daysUntilMonday = 7 - ((d.getDay() + 6) % 7);
	d.setDate(d.getDate() + daysUntilMonday);
	d.setHours(0,0,0,0);
	return d;
}

function timeLeft(end: Date): string {
	const minutesLeft = end.getTime() - Date.now();
	if (minutesLeft <= 0) return 'Ended';

	const minutes = Math.floor(minutesLeft/60_000);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours/24);

	if (days >= 1) return `${days} ${days === 1 ? 'day' : 'days'} left`;
	if (hours >= 1) return `${hours} h left`;
	return `${minutes} min left`;

}


const metricLabel = (m: Metric) => (m === 'steps' ? 'Steps' : 'Candies');


export default function ChallengeScreen() {
	const {session}	= useAuth();
	const router = useRouter();
	const userId = session?.user.id;
	const [daily, setDaily] = useState<Challenge | null>(null);
	const [weekly, setWeekly] = useState<Challenge | null>(null);
	const [friendChallenges, setFriendChallenges] = useState<FriendChallenge[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const loadData = useCallback(async () => {
		if (!userId){
			setLoading(false);
			return;
		}

	setLoading(true);
	setError(null);

const [challengesResult, friendChallengesResult] = await Promise.all([
	// Daily/weekly challenges
	supabase.from('challenges').select('id, title, period, metric, target, xp_reward, candy_reward, coin_reward')
	.eq('friend_challenge', false).order('id'),

	// Friend challenges
	supabase.from('challenges').select('id, metric, target, ends_at, status, challenger_id, challenged_id, candy_reward, coin_reward')
	.eq('friend_challenge', true)
	.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
	.neq('status', 'declined')
	.gt('ends_at', new Date().toISOString())
	.order('ends_at', { ascending: true }),
]);
	const challengesError = challengesResult.error;
	const friendChallengesError = friendChallengesResult.error;

	if (challengesError) {
		setError(challengesError.message);
		setLoading(false);
		return;
	}

	if(friendChallengesError) console.log('friend_challenges:', friendChallengesError.message);

	// Daily and weekly challenges
	const challenges = challengesResult.data ?? [];
	setDaily(pickFor(challenges.filter(c => c.period === 'daily'), today()));
	setWeekly(pickFor(challenges.filter(c => c.period === 'weekly'), weekStart()));

	// Friend challenges
	const rows = friendChallengesResult.data ?? [];
	const otherIds = rows.map(row => row.challenger_id === userId ? row.challenged_id : row.challenger_id);

	let names: Record<string, string> = {};
	if (otherIds.length > 0) {
		const { data: profiles, error: profilesError } = await supabase.from('profiles').select('id, username').in('id', otherIds);
		for(const profile of profiles ?? []) {
			names[profile.id] = profile.username;
		}
	}

	setFriendChallenges(
		rows.map((row) => {
			const isSent = row.challenger_id === userId;
			const otherId = isSent ? row.challenged_id : row.challenger_id;
			return {
				id: row.id,
				metric: row.metric,
				target: row.target,
				status: row.status,
				endTime: row.ends_at,
				isSent,
				friendsName: names[otherId] ?? 'Unknown',
				candyReward: row.candy_reward ?? 0,
				coinReward: row.coin_reward ?? 0,
				progress: 0, // Placeholer tills vi har räknat ut progress
			};
		}),
	);

	setLoading(false);
	}, [userId]);


	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	if (loading && !daily && !weekly && friendChallenges.length === 0) {
		return (
			<View style={styles.center}>
				<ActivityIndicator size="large" color={COLORS.text} />
			</View>
		);
	}

	return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={COLORS.text} />}
      >
        <Text style={styles.title}>Challenges</Text>
        {error && <Text style={styles.error}>{error}</Text>}

		{/*Daily*/}
        <Text style={styles.sectionTitle}>Daily</Text>
        {daily ? <ChallengeCard challenge={daily} endsAt={endOfDay()}/> : <Text style={styles.muted}>No daily challenge.</Text>}
		
		{/*Weekly*/}
        <Text style={styles.sectionTitle}>Weekly</Text>
        {weekly ? <ChallengeCard challenge={weekly} endsAt={endOfWeek()}/> : <Text style={styles.muted}>No weekly challenge.</Text>}

		{/*Friends*/}
        <Text style={styles.sectionTitle}>Friends</Text>
        {friendChallenges.length === 0 ? (
          <Text style={styles.muted}>No friend challenges active!</Text>
        ) : (
          friendChallenges.map((fc) => <FriendChallengeCard key={fc.id} challenge={fc} />)
        )}
		<Pressable
			style={({pressed}) => [styles.button, pressed && {opacity:0.7}]}
			onPress={() => router.push('/friendScreen')}
		>
			<Text style={styles.buttonText}>Challenge a friend!</Text>
		</Pressable>

      </ScrollView>
    </SafeAreaView>
  );
}

function ChallengeCard({ challenge, endsAt }: { challenge: Challenge; endsAt: Date }) {
	return (
	<View style={styles.card}>
		<Text style={styles.cardTitle}>{challenge.title}</Text>
		<Text style={styles.muted}>
			Goal: {challenge.target.toLocaleString()} {metricLabel(challenge.metric)} 
			 Reward: {challenge.xp_reward} XP, {challenge.candy_reward} Candies, 
			{challenge.coin_reward} Coins
		</Text>
		<Text style={styles.muted}>{timeLeft(endsAt)}</Text>
	</View>
	);
}

function FriendChallengeCard({ challenge }: { challenge: FriendChallenge }) {
	const task = challenge.metric === 'steps'
		? `Walk ${challenge.target.toLocaleString()} steps`
		: `Collect ${challenge.target.toLocaleString()} candies`;

	return (
	<View style={styles.card}>
		<Text style={styles.cardTitle}>
			{challenge.friendsName}: {task}
		</Text>
		<Text style={styles.muted}>
			Progress: {challenge.progress}%
			Reward: {challenge.candyReward} candies,  {challenge.coinReward} coins
		</Text>
		<Text style={styles.muted}>{timeLeft(new Date(challenge.endTime))}</Text>
	</View>
	);
}

const styles = StyleSheet.create ({
	screen: {flex: 1, backgroundColor: COLORS.background},
	center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
	content: {padding: 16, gap: 12},
	title: {fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 8},
	sectionTitle: {fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 8},
	card: {
		backgroundColor: COLORS.card,
		borderColor: COLORS.border,
		borderWidth: 1, 
		borderRadius: 12,
		padding: 14, 
		gap: 4,
	},
	cardTitle: {fontSize: 16, fontWeight: '600', color: COLORS.text},
	muted: {fontSize: 14, color: COLORS.muted},
	error: {fontSize: 14, color: COLORS.error},
	button: {
		alignSelf: 'flex-start',
		backgroundColor: '#4195E8',
		borderColor: '#AED5FB',
		borderWidth: 1,
		borderRadius: 12,
		paddingHorizontal: 16,
		paddingVertical: 10,
	},
	buttonText: {fontSize: 15, fontWeight: '600', color: COLORS.text},
});