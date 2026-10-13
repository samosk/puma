import LogoutButton from '@/components/logout-button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// How many days of history to show
const HISTORY_DAYS = 7;

// Height of the bar charts in pixels
const CHART_HEIGHT = 140;

// Used if the user has no personal goal set (profiles.daily_step_goal)
const DEFAULT_STEP_GOAL = 5000;

const COLORS = {
  background: '#101318',
  card: '#1A1E25',
  border: '#2A303A',
  text: '#EEF1F5',
  muted: '#98A2B3',
  accent: '#5B8DEF',
  error: '#F97066',
  barSteps: '#3B4A66', // past days in the steps chart (today uses accent)
  barCandies: '#6B3B66', // past days in the candies chart (today uses candyToday)
  candyToday: '#E05FD0',
  goal: '#3FB37F', // the goal line, and bars that reached the goal
  streak: '#F28C28', // the streak badge in the step progress card
};

type Profile = {
  username: string;
  candies: number;
  coins: number;
  current_streak: number;
  active_animal_id: string | null;
  daily_step_goal: number | null;
};

type ActivityDay = {
  date: string; // 'YYYY-MM-DD'
  steps: number;
  candies_collected: number;
};

type CatToday = {
  animal_id: string;
  steps: number;
  animals: { name: string } | null; // the cat's name, joined from animals
};

export default function StatsScreen() {
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [catsToday, setCatsToday] = useState<CatToday[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const [profileResult, activityResult, catsResult] = await Promise.all([
      // The logged-in user's profile (totals, streak, active cat)
      supabase
        .from('profiles')
        .select('username, candies, coins, current_streak, active_animal_id, daily_step_goal')
        .eq('id', userId)
        .single(),

      // The user's daily totals for the last HISTORY_DAYS days
      supabase
        .from('activity_days')
        .select('date, steps, candies_collected')
        .eq('id', userId)
        .gte('date', localDateString(-(HISTORY_DAYS - 1))),

      // Today's steps per cat, most steps first.
      // "animals(name)" pulls in each cat's name from the animals table.
      supabase
        .from('animal_activity_days')
        .select('animal_id, steps, animals(name)')
        .eq('owner_id', userId)
        .eq('date', localDateString(0))
        .order('steps', { ascending: false }),
    ]);

    const firstError = profileResult.error ?? activityResult.error ?? catsResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setProfile(profileResult.data);
      setDays(activityResult.data ?? []);
      setCatsToday((catsResult.data as unknown as CatToday[]) ?? []);
    }
    setLoading(false);
  }, [userId]);

  // Reload every time this screen is opened, so the numbers stay current
  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [loadStats]),
  );

  // First load: spinner
  if (loading && !profile) {
    return (
      <View style={[styles.center, { backgroundColor: COLORS.background }]}>
        <ActivityIndicator color={COLORS.text} />
      </View>
    );
  }

  // Today's row, if the user has been active today
  const today = days.find((d) => d.date === localDateString(0));
  const stepsToday = today?.steps ?? 0;
  const candiesToday = today?.candies_collected ?? 0;

  // One entry per day for the charts, oldest first (left) to today (right).
  // Days without a row in the database count as 0.
  const chartDays = Array.from({ length: HISTORY_DAYS }, (_, i) => {
    const date = localDateString(i - (HISTORY_DAYS - 1));
    const row = days.find((d) => d.date === date);
    return {
      label: shortDay(date),
      isToday: i === HISTORY_DAYS - 1,
      steps: row?.steps ?? 0,
      candies: row?.candies_collected ?? 0,
    };
  });

  const stepGoal = profile?.daily_step_goal ?? DEFAULT_STEP_GOAL;

  const averageSteps = Math.round(chartDays.reduce((sum, d) => sum + d.steps, 0) / HISTORY_DAYS);
  const totalCandies = chartDays.reduce((sum, d) => sum + d.candies, 0);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={COLORS.text} />
        }
      >
        <Text style={styles.title}>{profile ? `Hi, ${profile.username}` : 'Your stats'}</Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {/* ---------- TODAY ---------- */}
        <Text style={styles.sectionTitle}>Today</Text>
        <StepProgressCard
          steps={stepsToday}
          goal={stepGoal}
          streak={profile?.current_streak ?? 0}
        />

        {/* ---------- LAST 7 DAYS: BAR CHARTS ---------- */}
        <Text style={styles.sectionTitle}>Last {HISTORY_DAYS} days</Text>

        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Steps</Text>
            <Text style={styles.muted}>avg {averageSteps.toLocaleString()} / day</Text>
          </View>
          <BarChart
            data={chartDays.map((d) => ({ label: d.label, value: d.steps, highlight: d.isToday }))}
            color={COLORS.barSteps}
            highlightColor={COLORS.accent}
            goal={stepGoal}
          />
        </View>

        <View style={styles.card}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Candies</Text>
            <Text style={styles.muted}>{totalCandies} this week</Text>
          </View>
          <BarChart
            data={chartDays.map((d) => ({ label: d.label, value: d.candies, highlight: d.isToday }))}
            color={COLORS.barCandies}
            highlightColor={COLORS.candyToday}
          />
        </View>

        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------
// STEP PROGRESS
// Today's steps as a progress bar towards the daily goal.
// The bar fills from left to right and turns green when the goal
// is reached. Steps beyond the goal keep counting, but the bar
// stays full.
// The orange badge next to the percentage shows the step streak.
// ---------------------------------------------------------------
function StepProgressCard({
  steps,
  goal: rawGoal,
  streak,
}: {
  steps: number;
  goal: number;
  streak: number;
}) {
  const goal = Math.max(rawGoal, 1); // avoid dividing by 0
  const progress = Math.min(steps / goal, 1); // 0 to 1
  const percent = Math.round((steps / goal) * 100);
  const fillColor = COLORS.accent;

  return (
    <View style={styles.card}>
      <View style={styles.progressHeader}>
        <Text style={styles.muted}>Daily goal</Text>
        <View style={styles.progressHeaderRight}>
          {/* Streak badge */}
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>
              {streak} {'day streak'}
            </Text>
            <MaterialCommunityIcons name="fire" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <View style={styles.progressValueRow}>
        <Text style={styles.statValue}>
          {steps.toLocaleString()}
          <Text style={styles.progressGoal}> Steps today</Text>
        </Text>
        <Text style={[styles.progressPercent, { color: fillColor }]}>{percent}%</Text>
      </View>

      {/* The bar: a filled part and an empty part, sized by flex */}
      <View style={styles.progressTrack}>
        <View style={{ flex: progress, backgroundColor: fillColor, borderRadius: 6 }} />
        <View style={{ flex: 1 - progress }} />
      </View>

      <Text style={styles.muted}>
        {'out of'} {(goal).toLocaleString()} {'steps'}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------
// BAR CHART
// Built from plain Views, so no extra package is needed.
// Each bar's height is its value compared to the highest value.
// The highlighted bar (today) gets highlightColor.
// Optional goal: draws a line at the goal, and bars that reached
// it turn COLORS.goal. The chart scales so the line always fits.
// ---------------------------------------------------------------
type Bar = { label: string; value: number; highlight?: boolean };

// Space above the tallest bar for its value text
const VALUE_TEXT_SPACE = 18;

function BarChart({
  data,
  color,
  highlightColor,
  goal,
}: {
  data: Bar[];
  color: string;
  highlightColor: string;
  goal?: number;
}) {
  // The highest value on the chart: the biggest bar, or the goal if higher
  const max = Math.max(...data.map((d) => d.value), goal ?? 0, 1);
  const maxBarHeight = CHART_HEIGHT - VALUE_TEXT_SPACE;
  const toHeight = (value: number) => (value / max) * maxBarHeight;

  return (
    <View>
      {/* Bars (with the goal line drawn over them) */}
      <View style={styles.barsArea}>
        {data.map((bar, i) => {
          const reachedGoal = goal !== undefined && bar.value >= goal;
          const barColor = reachedGoal ? COLORS.goal : bar.highlight ? highlightColor : color;
          const height = bar.value > 0 ? Math.max(4, toHeight(bar.value)) : 0;
          return (
            <View key={i} style={styles.barColumn}>
              <Text style={[styles.barValue, bar.highlight && { color: COLORS.text }]}>
                {compactNumber(bar.value)}
              </Text>
              <View style={[styles.bar, { height, backgroundColor: barColor }]} />
            </View>
          );
        })}

        {goal !== undefined && (
          <View style={[styles.goalLine, { bottom: toHeight(goal) }]}>
            <Text style={styles.goalLabel}>Goal {compactNumber(goal)}</Text>
          </View>
        )}
      </View>

      {/* Day labels */}
      <View style={styles.labelsRow}>
        {data.map((bar, i) => (
          <Text
            key={i}
            style={[styles.barLabel, bar.highlight && { color: COLORS.text, fontWeight: '600' }]}
          >
            {bar.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// 5230 -> '5.2k', 42 -> '42'
function compactNumber(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

// Date as 'YYYY-MM-DD' in the phone's local time.
// offsetDays: 0 = today, -1 = yesterday, and so on.
function localDateString(offsetDays: number) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// 'YYYY-MM-DD' -> short weekday, e.g. 'Mon'
function shortDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: 'short' });
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text, marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 4,
  },
  statCard: { flex: 1 },
  statValue: { fontSize: 30, fontWeight: '700', color: COLORS.text },
  statValueSmall: { fontSize: 20, fontWeight: '600', color: COLORS.text },
  muted: { fontSize: 14, color: COLORS.muted },
  error: { fontSize: 14, color: COLORS.error },
  listRow: { flexDirection: 'row', paddingVertical: 6 },
  listLabel: { flex: 1.2, fontSize: 15, color: COLORS.text },
  listValue: { flex: 1, fontSize: 15, color: COLORS.muted, textAlign: 'right' },

  // Step progress
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  progressHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.streak,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  streakText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  progressPercent: { fontSize: 16, fontWeight: '700' },
  progressGoal: { fontSize: 18, fontWeight: '500', color: COLORS.muted },
  progressTrack: {
    flexDirection: 'row',
    height: 24,
    borderRadius: 6,
    backgroundColor: COLORS.border,
    overflow: 'hidden',
    marginVertical: 6,
  },
  progressValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },

  // Charts
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  chartTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  goalReached: { fontSize: 14, color: COLORS.goal, fontWeight: '600' },
  barsArea: {
    height: CHART_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginTop: 8,
  },
  barColumn: { flex: 1, alignItems: 'center', gap: 4 },
  barValue: { fontSize: 11, color: COLORS.muted },
  bar: { width: '100%', borderRadius: 6 },
  goalLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.goal,
    opacity: 0.8,
    pointerEvents: 'none',
  },
  goalLabel: {
    position: 'absolute',
    right: 0,
    bottom: 4,
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.goal,
    backgroundColor: COLORS.card,
    paddingHorizontal: 4,
  },
  labelsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  barLabel: { flex: 1, textAlign: 'center', fontSize: 12, color: COLORS.muted },
});