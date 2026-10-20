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
  background: '#EDEDED',
  block: '#FFFFFF',
  cardBorder: '#E0E0E0',
  text: '#2C2C2C',
  small: '#919191',
  barEmpty: '#E3E3E3',
  barFill: '#5BB318',
  button: '#4195E8',
  error: '#D92D20',
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
  target: number;
  endTime: string;
  startDate: string; 
  friendsName: string;
  candyReward: number;
  coinReward: number;
};

type ActivityDay = {
	date: string;
	steps: number;
	candies_collected: number;
}

// Changes text into a number. Used for picking challenges at random.
// all users get the same daily and weekly challenges (bit boring)
function hashString(text: string): number {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
	hash = (hash * 31 + text.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

// Picks a challenge from the database
function pickFor(list: Challenge[], key: string): Challenge | null {
  if (list.length === 0) return null;
  return list[hashString(key) % list.length];
}

// Date from the phones local time
function date(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Todays date used as a key for daily challenges and progress
const today = () => date(new Date());

// Calculates start of the week (monday)
function mondayDate(): string {
	const d = new Date();
	d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
	return date(d);
}

const weekStart = () => `week-${mondayDate()}`;


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

// Calculates time left for challenges
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

// ---------------------------------------------------------------
// sumSince() and taskText() are used for progress
// ---------------------------------------------------------------

function sumSince(days: ActivityDay[], fromDate: string, metric: Metric): number {
	return days.filter((d) => d.date >= fromDate).reduce((sum, d) => sum + (metric === 'steps' ? d.steps : d.candies_collected), 0);
}
// Text for friend challenges
function taskText(metric: Metric, target: number): string {
	return metric === 'steps' ? `Walk ${target.toLocaleString()} steps` : `Collect ${target.toLocaleString()} candies`;
}

// const metricLabel = (m: Metric) => (m === 'steps' ? 'Steps' : 'Candies');


export default function ChallengeScreen() {
	const {session}	= useAuth();
	const router = useRouter();
	const userId = session?.user.id;
	const [daily, setDaily] = useState<Challenge | null>(null);
	const [days, setDays] = useState<ActivityDay[]>([]);
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

	// Calculates the date from 8 days ago so that the app only gets data from the past 8 days
	const eightDaysAgo = date(new Date(Date.now() - 8 * 86_400_000));

const [challengesResult, friendChallengesResult, activityResult	] = await Promise.all([
	// Daily/weekly challenges
	supabase.from('challenges').select('id, title, period, metric, target, xp_reward, candy_reward, coin_reward')
	.eq('friend_challenge', false).order('id'),

	// Friend challenges
	supabase.from('challenges').select('id, metric, period, target, ends_at, status, challenger_id, challenged_id, candy_reward, coin_reward')
	.eq('friend_challenge', true)
	.or(`challenger_id.eq.${userId},challenged_id.eq.${userId}`)
	.neq('status', 'declined')
	.gt('ends_at', new Date().toISOString())
	.order('ends_at', { ascending: true }),

	// PRogress 
	supabase.from('activity_days')
	.select('date, steps, candies_collected')
	.eq('id', userId)
	.gte('date', eightDaysAgo),

]);
	const firstError = challengesResult.error ?? friendChallengesResult.error ?? activityResult.error;
	if(firstError) setError(firstError.message);

	// Daily and weekly challenges
	const challenges = (challengesResult.data ?? []) as Challenge[];
	setDaily(pickFor(challenges.filter((c) => c.period === 'daily'), today()));
	setWeekly(pickFor(challenges.filter(c => c.period === 'weekly'), weekStart()));


	setDays((activityResult.data ?? []) as ActivityDay[]);

	// Friend challenges
	const rows = friendChallengesResult.data ?? [];
	const otherIds = rows.map(row => row.challenger_id === userId ? row.challenged_id : row.challenger_id);

	const names: Record<string, string> = {};
	if (otherIds.length > 0) {
		const { data: profiles } = await supabase.from('profiles').select('id, username').in('id', otherIds);
		for(const profile of profiles ?? []) {
			names[profile.id] = profile.username;
		}
	}

	// Formats database stuff to the card format in the screen
	setFriendChallenges(
	  rows.map((r) => {
		const otherId = r.challenger_id === userId ? r.challenged_id : r.challenger_id;
		const lengthDays = r.period === 'daily' ? 1 : 7;
		const start = new Date(new Date(r.ends_at).getTime() - lengthDays * 86_400_000);
		return {
		  id: r.id,
		  metric: r.metric,
		  target: r.target,
		  endTime: r.ends_at,
		  startDate: date(start),
		  friendsName: names[otherId] ?? 'Unknown',
		  candyReward: r.candy_reward ?? 0,
		  coinReward: r.coin_reward ?? 0,
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

	// Progress for daily and weekly challenges
	const dailyCurrent = daily ? sumSince(days, today(), daily.metric) : 0;
	const weeklyCurrent = weekly ? sumSince(days, mondayDate(), weekly.metric) : 0;
	// Challenge completed or not completed
	const dailyDone = daily && dailyCurrent >= daily.target ? 1 : 0;
	const weeklyDone = weekly && weeklyCurrent >= weekly.target? 1 : 0;

	
	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
		<View style={styles.header}>
			<Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Back">
			<Text style={styles.headerIcon}>←</Text>
			</Pressable>
			<Text style={styles.headerTitle}>Challenges</Text>
			<View style={{ width: 32 }} />
		</View>

		<ScrollView
			contentContainerStyle={styles.content}
			refreshControl={<RefreshControl refreshing={loading} onRefresh={loadData} tintColor={COLORS.text} />}
		>
        {error && <Text style={styles.error}>{error}</Text>}

		{/*Daily*/}
		<Section
			icon = "🎖️"
			title = "Daily challenges"
			subtitle = {timeLeft(endOfDay())}
			right = {`${dailyDone}/${daily ? 1 : 0} completed`}
		>
			{daily ? (
				<ChallengeCard
					title = {daily.title}
					current = {dailyCurrent}
					target = {daily.target}
					candyReward = {daily.candy_reward}
					coinReward = {daily.coin_reward}
				/>
			) : (
				<Text style = {styles.small}>No daily challenge</Text>
			)}
		</Section>
		
		{/*Weekly*/}
		<Section
			icon="🏅"
			title="Weekly challenges"
			subtitle={timeLeft(endOfWeek())}
			right={`${weeklyDone}/${weekly ? 1 : 0} completed`}
		>
		{weekly ? (
			<ChallengeCard
				title={weekly.title}
				current={weeklyCurrent}
				target={weekly.target}
				candyReward={weekly.candy_reward}
				coinReward={weekly.coin_reward}
				/>
		) : (
				<Text style={styles.small}>No weekly challenge.</Text>
		  	)}
		</Section>

		{/*Friends*/}
        <Section icon="🐾" title="Friend challenges" right={`${friendChallenges.length} active`}>
		 	{friendChallenges.length === 0 ? (
				<Text style={styles.small}>No friend challenges active!</Text>
		  	) : (
			friendChallenges.map((fc) => (
				<ChallengeCard
					key={fc.id}
					title={`${fc.friendsName}: ${taskText(fc.metric, fc.target)}`}
					current={sumSince(days, fc.startDate, fc.metric)}
					target={fc.target}
					candyReward={fc.candyReward}
					coinReward={fc.coinReward}
					timeText={timeLeft(new Date(fc.endTime))}
			  />
			))
		  )}

		  <Pressable
			style={({ pressed }) => [styles.button, pressed && { opacity: 0.7 }]}
			onPress={() => router.push('/friendScreen')}
		  >
			<Text style={styles.buttonText}>Challenge a friend!</Text>
		  </Pressable>
		</Section>
	  </ScrollView>
	</SafeAreaView>
  );
}

// The white blocks the challenges are inside (daily, weekly and friends)
function Section({
	icon,
	title,
	subtitle,
	right,
	children,
}: {
	icon: string;
	title: string;
	subtitle?: string;
	right: string;
	children: React.ReactNode;
}) {
	return (
		<View style={styles.block}>
			<View style={styles.blockHeader}>
				<View>
					<Text style={styles.blockTitle}>{icon} {title}</Text>
					{subtitle && <Text style={styles.small}>{subtitle}</Text>}
				</View>
				<Text style={styles.small}>{right}</Text>
			</View>
			{children}
		</View>
	);
}

// Challenge card
function ChallengeCard({
	title,
	current,
	target,
	candyReward,
	coinReward,
	timeText,
	}: {
	title: string;
	current: number;
	target: number;
	candyReward: number;
	coinReward: number;
	timeText?: string;
	}) {
	// Progress bar calculations
	const percent = Math.min(100, target > 0 ? (current / target) * 100 : 0);

	return (
		<View style={styles.card}>
		<View style={styles.cardRow}>
			<Text style={styles.cardTitle}>{title}</Text>
			<Text style={styles.rewardLabel}>Reward</Text>
		</View>

		<View style={styles.cardRow}>
			<Text style={styles.small}>
			{timeText ? `${timeText}  |  ` : ''}
			{Math.min(current, target).toLocaleString()} / {target.toLocaleString()}
			</Text>
			<Text style={styles.reward}>
			🍬 x{candyReward}   🪙 x{coinReward}
			</Text>
		</View>

		<View style={styles.barEmpty}>
			<View style={[styles.barFill, { width: `${percent}%` }]} />
		</View>
		</View>
	);
}

// function FriendChallengeCard({ challenge }: { challenge: FriendChallenge }) {
// 	const task = challenge.metric === 'steps'
// 		? `Walk ${challenge.target.toLocaleString()} steps`
// 		: `Collect ${challenge.target.toLocaleString()} candies`;

// 	return (
// 	<View style={styles.card}>
// 		<Text style={styles.cardTitle}>
// 			{challenge.friendsName}: {task}
// 		</Text>
// 		<Text style={styles.muted}>
// 			Progress: {challenge.progress}%
// 			Reward: {challenge.candyReward} candies,  {challenge.coinReward} coins
// 		</Text>
// 		<Text style={styles.muted}>{timeLeft(new Date(challenge.endTime))}</Text>
// 	</View>
// 	);
// }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingVertical: 16, paddingBottom: 140, gap: 18 },
  error: { fontSize: 14, color: COLORS.error },
  small: { fontSize: 12, color: COLORS.small },

  // Title
  header: {
	flexDirection: 'row',
	alignItems: 'center',
	justifyContent: 'space-between',
	marginTop: 12,
  },
  headerIcon: { fontSize: 32, color: COLORS.text, width: 32 },
  headerTitle: { fontSize: 26, fontWeight: '700', color: COLORS.text },

  // Blocks (Daily / Weekly / Friends)
  block: {
	backgroundColor: COLORS.block,
	borderRadius: 24,
	padding: 14,
	gap: 10,
	shadowColor: '#000000',
	shadowOpacity: 0.06,
	shadowRadius: 2,
	shadowOffset: { width: 0, height: 2 },
  },
  blockHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  blockTitle: { fontSize: 15, fontWeight: '600', color: COLORS.small },

  // Card inside blocks
  card: {
	borderWidth: 1,
	borderColor: COLORS.cardBorder,
	borderRadius: 16,
	padding: 12,
	gap: 6,
  },
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: COLORS.text },
  rewardLabel: { fontSize: 13, fontWeight: '600', color: COLORS.text },
  reward: { fontSize: 13, color: COLORS.small },

  // Progress-bar
  barEmpty: {
	height: 12,
	borderRadius: 6,
	backgroundColor: COLORS.barEmpty,
	overflow: 'hidden',
	marginTop: 4,
  },
  barFill: { height: '100%', backgroundColor: COLORS.barFill, borderRadius: 6 },

  // Button
  button: {
	backgroundColor: COLORS.button,
	borderColor: '#AED5FB',
	borderWidth: 1,
	borderRadius: 24,
	paddingVertical: 12,
	alignItems: 'center',
	marginTop: 4,
  },
  buttonText: { fontSize: 17, fontWeight: '600', color: '#FFFFFF' },
});