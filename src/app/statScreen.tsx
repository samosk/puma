import { Fonts } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// How many days of history to show
const HISTORY_DAYS = 7;

// Used if the user has no personal goal set (profiles.daily_step_goal)
const DEFAULT_STEP_GOAL = 5000;

// Sizes
const PROGRESS_BAR_HEIGHT = 44; // daily goal bar
const PROGRESS_ICON_SIZE = 40; // cat inside the daily goal bar
const ACTIVITY_BAR_HEIGHT = 150; // height of each pill in the activity chart
const ACTIVITY_BAR_WIDTH = 32;
const CANDY_CHART_HEIGHT = 120; // height of the tallest candy bar
// Size of the back arrow (the spacer on the right matches it)
const HEADER_ICON_SIZE = 34;

// ---------------------------------------------------------------
// COLORS (from the Figma design)
// ---------------------------------------------------------------
const COLORS = {
  background: '#EDEDED',
  card: '#FFFFFF',
  text: '#1E1E1E',
  muted: '#8A8A8A',
  icon: '#4A4A4A', // header icons (back arrow, settings)
  blue: '#5592E0', // progress fill, today, candy bars
  blueBorder: '#3F7AC8',
  track: '#D9D9D9', // empty part of the daily goal bar
  activityTrack: '#B8B8B8', // empty part of the activity pills
  activityFill: '#8F8F8F', // past days' steps
  activityBorder: '#6E6E6E',
  dash: '#9A9A9A', // dashed lines above/below the activity pills
  streakBg: '#FBE2C4',
  streakText: '#D0562A',
  error: '#D92D20',
};
// ---------------------------------------------------------------
// CARD ICONS (assets/icons/stats)
// ---------------------------------------------------------------
const CARD_ICON_SIZE = 24;

const ICONS = {
  dailyGoal: require('../../assets/stats/paw.png'),
  activity: require('../../assets/stats/activity.png'),
  candies: require('../../assets/stats/candy.png'),
  fire: require('../../assets/stats/fire.png'),
};
type Profile = {
  current_streak: number;
  daily_step_goal: number | null;
};

type ActivityDay = {
  date: string; // 'YYYY-MM-DD'
  steps: number;
  candies_collected: number;
};

type ChartDay = {
  label: string; // 'FRI'
  isToday: boolean;
  steps: number;
  candies: number;
};

export default function StatsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [profile, setProfile] = useState<Profile | null>(null);
  const [days, setDays] = useState<ActivityDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);

    const [profileResult, activityResult] = await Promise.all([
      // The logged-in user's profile (totals, streak, goal)
      supabase
        .from('profiles')
        .select('current_streak, daily_step_goal')
        .eq('id', userId)
        .single(),

      // The user's daily totals for the last HISTORY_DAYS days
      supabase
        .from('activity_days')
        .select('date, steps, candies_collected')
        .eq('id', userId)
        .gte('date', localDateString(-(HISTORY_DAYS - 1))),
    ]);

    const firstError = profileResult.error ?? activityResult.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setProfile(profileResult.data);
      setDays(activityResult.data ?? []);
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

  // One entry per day for the charts, oldest first (left) to today (right).
  // Days without a row in the database count as 0.
  const chartDays: ChartDay[] = Array.from({ length: HISTORY_DAYS }, (_, i) => {
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
  const averageCandies = Math.round(chartDays.reduce((sum, d) => sum + d.candies, 0) / HISTORY_DAYS);

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() && router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={HEADER_ICON_SIZE} color={COLORS.icon} />
        </Pressable>
        <Text style={styles.headerTitle}>My stats</Text>
        {/* Empty space as wide as the arrow, so the title stays centered */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadStats} tintColor={COLORS.text} />
        }
      >
        {error && <Text style={styles.error}>{error}</Text>}

        <StepProgressCard steps={stepsToday} goal={stepGoal} streak={profile?.current_streak ?? 0} />

        <ActivityCard days={chartDays} goal={stepGoal} averageSteps={averageSteps} />

        <CandyCard days={chartDays} averageCandies={averageCandies} />

      </ScrollView>
    </SafeAreaView>
  );
}
// One of the card icons as an image
function CardIcon({ source }: { source: number }) {
  return <Image source={source} style={styles.cardIcon} />;
}
// ---------------------------------------------------------------
// CARD HEADER
// Icon + grey label on the left, optional label + big number on the right.
// Shared by all three cards.
// ---------------------------------------------------------------
function CardHeader({
  icon,
  title,
  right,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.cardHeader}>
      <View style={styles.cardHeaderLeft}>
        {icon}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

// "Daily average steps   9800"
function AverageLabel({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.averageRow}>
      <Text style={styles.averageLabel}>{label}</Text>
      <Text style={styles.averageValue}>{value}</Text>
    </View>
  );
}

// "FRI SAT SUN ... THU" with today highlighted in blue
function DayLabels({ days }: { days: ChartDay[] }) {
  return (
    <View style={styles.dayLabelsRow}>
      {days.map((d, i) => (
        <View key={i} style={styles.dayLabelCell}>
          <Text style={[styles.dayLabel, d.isToday && styles.dayLabelToday]}>{d.label}</Text>
        </View>
      ))}
    </View>
  );
}

// ---------------------------------------------------------------
// DAILY GOAL CARD
// Today's steps as a progress bar towards the daily goal, with the
// cat riding at the end of the filled part. The streak sits in the
// peach pill at the top right.
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

  return (
    <View style={styles.card}>
      <CardHeader
        icon={<CardIcon source={ICONS.dailyGoal} />}
        title="Daily goal"
        right={
          <View style={styles.streakBadge}>
            <Text style={styles.streakText}>{streak} day streak</Text>
            {<CardIcon source={ICONS.fire} />}
          </View>
        }
      />

      <View style={styles.progressValueRow}>
        <Text style={styles.stepsValue}>
          {steps.toLocaleString()}
          <Text style={styles.stepsLabel}> Steps today</Text>
        </Text>
        <Text style={styles.progressPercent}>{percent}%</Text>
      </View>

      {/* The bar: a filled part and an empty part, sized by flex.
          The fill never gets narrower than the cat, so the cat is
          always fully inside it. */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { flex: progress }]}>
          <View style={styles.progressIcon}>
            <Image
              source={require('@/assets/misc/cat_progress_bar.png')}
              style={{ width: PROGRESS_ICON_SIZE, height: PROGRESS_ICON_SIZE }}
            />
          </View>
        </View>
        <View style={{ flex: 1 - progress }} />
      </View>

      <Text style={styles.progressFooter}>out of {goal.toLocaleString()} steps</Text>
    </View>
  );
}

// ---------------------------------------------------------------
// ACTIVITY CARD
// One pill per day. The full pill is the daily goal; the darker
// fill inside is how far the user got (full = goal reached).
// Today's fill is blue.
// ---------------------------------------------------------------
function ActivityCard({
  days,
  goal,
  averageSteps,
}: {
  days: ChartDay[];
  goal: number;
  averageSteps: number;
}) {
  return (
    <View style={styles.card}>
      <CardHeader
        icon={<CardIcon source={ICONS.activity} />}
        title="Activity"
        right={<AverageLabel label="Daily average steps" value={averageSteps.toLocaleString()} />}
      />

      <DayLabels days={days} />

      <View style={styles.activityRow}>
        {days.map((d, i) => {
          const progress = Math.min(d.steps / Math.max(goal, 1), 1);
          // At least as tall as it is wide when there are steps, so it stays a pill
          const fillHeight =
            d.steps > 0 ? Math.max(ACTIVITY_BAR_WIDTH, progress * ACTIVITY_BAR_HEIGHT) : 0;

          return (
            <View key={i} style={styles.activityColumn}>
              <Dashes />
              <View style={styles.activityTrack}>
                {fillHeight > 0 && (
                  <View
                    style={[
                      styles.activityFill,
                      { height: fillHeight },
                      d.isToday && { backgroundColor: COLORS.blue, borderColor: COLORS.blueBorder },
                    ]}
                  />
                )}
              </View>
              <Dashes />
            </View>
          );
        })}
      </View>
    </View>
  );
}

// The short dashed line above and below each activity pill
function Dashes() {
  return (
    <View style={styles.dashes}>
      <View style={styles.dash} />
      <View style={styles.dash} />
    </View>
  );
}

// ---------------------------------------------------------------
// CANDY CARD
// Blue bars on a blue baseline, with the number inside each bar.
// ---------------------------------------------------------------
function CandyCard({ days, averageCandies }: { days: ChartDay[]; averageCandies: number }) {
  const max = Math.max(...days.map((d) => d.candies), 1);

  return (
    <View style={styles.card}>
      <CardHeader
        icon={<CardIcon source={ICONS.candies} />}
        title="Candies"
        right={<AverageLabel label="Daily average collected" value={String(averageCandies)} />}
      />

      <DayLabels days={days} />

      <View style={styles.candyBarsArea}>
        {days.map((d, i) => {
          // Tall enough to fit the number when there are candies
          const height = d.candies > 0 ? Math.max(28, (d.candies / max) * CANDY_CHART_HEIGHT) : 0;
          return (
            <View key={i} style={styles.candyColumn}>
              {height > 0 && (
                <View style={[styles.candyBar, { height }]}>
                  <Text style={styles.candyValue}>{d.candies}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>
      <View style={styles.candyBaseline} />
    </View>
  );
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

// 'YYYY-MM-DD' -> 'FRI' (English, to match the rest of the app)
function shortDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 20 },
  error: { fontFamily: Fonts.regular, fontSize: 14, color: COLORS.error },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontFamily: Fonts.regular, fontSize: 28, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: HEADER_ICON_SIZE },

  // Cards
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 18,
    gap: 10,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  cardTitle: { fontFamily: Fonts.regular, fontSize: 17, fontWeight: '500', color: COLORS.muted },
  iconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  averageRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  averageLabel: { fontFamily: Fonts.regular, fontSize: 14, color: COLORS.muted },
  averageValue: { fontFamily: Fonts.regular, fontSize: 24, fontWeight: '700', color: COLORS.text },

  // Day labels
  dayLabelsRow: { flexDirection: 'row', marginTop: 4 },
  dayLabelCell: { flex: 1, alignItems: 'center' },
  dayLabel: {
    fontFamily: Fonts.regular,
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  dayLabelToday: {
    backgroundColor: COLORS.blue,
    color: COLORS.card,
    borderRadius: 4,
    overflow: 'hidden', // needed for the rounded background on iOS
  },

  // Daily goal
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.streakBg,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  streakText: { fontFamily: Fonts.regular, color: COLORS.streakText, fontSize: 16, fontWeight: '600' },
  progressValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  stepsValue: { fontFamily: Fonts.regular, fontSize: 30, fontWeight: '800', color: COLORS.text },
  stepsLabel: { fontFamily: Fonts.regular, fontSize: 18, fontWeight: '600', color: COLORS.text },
  progressPercent: { fontFamily: Fonts.regular, fontSize: 24, fontWeight: '700', color: COLORS.text },
  progressTrack: {
    flexDirection: 'row',
    height: PROGRESS_BAR_HEIGHT,
    borderRadius: PROGRESS_BAR_HEIGHT / 2, // fully rounded ends
    backgroundColor: COLORS.track,
    overflow: 'hidden', // clips the cat's feet at the bottom edge
  },
  progressFill: {
    backgroundColor: COLORS.blue,
    minWidth: PROGRESS_ICON_SIZE + PROGRESS_BAR_HEIGHT / 2,
    borderRadius: PROGRESS_BAR_HEIGHT / 2,
  },
  progressIcon: {
    position: 'absolute',
    right: PROGRESS_BAR_HEIGHT / 4,
    bottom: -6, // pushes the cat slightly below the bar, like it's walking along it
  },
  progressFooter: { fontFamily: Fonts.regular, fontSize: 14, color: COLORS.muted },

  // Activity chart
  activityRow: { flexDirection: 'row', marginTop: 2 },
  activityColumn: { flex: 1, alignItems: 'center' },
  activityTrack: {
    width: ACTIVITY_BAR_WIDTH,
    height: ACTIVITY_BAR_HEIGHT,
    borderRadius: ACTIVITY_BAR_WIDTH / 2,
    backgroundColor: COLORS.activityTrack,
    justifyContent: 'flex-end', // fill grows from the bottom
    overflow: 'hidden',
  },
  activityFill: {
    width: '100%',
    borderRadius: ACTIVITY_BAR_WIDTH / 2,
    backgroundColor: COLORS.activityFill,
    borderWidth: 1,
    borderColor: COLORS.activityBorder,
  },
  dashes: { gap: 3, paddingVertical: 3 },
  dash: { width: 2, height: 5, backgroundColor: COLORS.dash, borderRadius: 1 },

  // Candy chart
  candyBarsArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CANDY_CHART_HEIGHT,
    marginTop: 12,
  },
  candyColumn: { flex: 1, alignItems: 'center' },
  candyBar: {
    width: '70%',
    backgroundColor: COLORS.blue,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    alignItems: 'center',
    paddingTop: 6,
  },
  candyValue: { fontFamily: Fonts.regular, color: COLORS.card, fontSize: 15, fontWeight: '700' },
  candyBaseline: { height: 4, backgroundColor: COLORS.blue, borderRadius: 2 },
  cardIcon: { width: CARD_ICON_SIZE, height: CARD_ICON_SIZE },
});