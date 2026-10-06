import LogoutButton from '@/components/logout-button';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// How many days of history to show
const HISTORY_DAYS = 7;

const COLORS = {
  background: '#101318',
  card: '#1A1E25',
  border: '#2A303A',
  text: '#EEF1F5',
  muted: '#98A2B3',
  accent: '#5B8DEF',
  error: '#F97066',
};

type Profile = {
  username: string;
  candies: number;
  coins: number;
  current_streak: number;
  active_animal_id: string | null;
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
        .select('username, candies, coins, current_streak, active_animal_id')
        .eq('id', userId)
        .single(),

      // The user's daily totals for the last HISTORY_DAYS days, newest first
      supabase
        .from('activity_days')
        .select('date, steps, candies_collected')
        .eq('id', userId)
        .gte('date', localDateString(-(HISTORY_DAYS - 1)))
        .order('date', { ascending: false }),

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

  // Reload every time this tab is opened, so the numbers stay current
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
        <View style={styles.row}>
          <StatCard label="Steps" value={stepsToday.toLocaleString()} />
          <StatCard label="Candies" value={String(candiesToday)} />
        </View>

        {/* ---------- STREAK & TOTALS ---------- */}
        <View style={styles.row}>
          <StatCard
            label="Step streak"
            value={`${profile?.current_streak ?? 0} ${profile?.current_streak === 1 ? 'day' : 'days'}`}
          />
        </View>
        <View style={styles.row}>
          <StatCard label="Candies total" value={String(profile?.candies ?? 0)} small />
          <StatCard label="Coins" value={String(profile?.coins ?? 0)} small />
        </View>

        {/* ---------- TODAY PER CAT ---------- */}
        <Text style={styles.sectionTitle}>Your cats today</Text>
        <View style={styles.card}>
          {catsToday.length === 0 ? (
            <Text style={styles.muted}>Your cats haven't walked yet today.</Text>
          ) : (
            catsToday.map((cat) => (
              <View key={cat.animal_id} style={styles.listRow}>
                <Text style={styles.listLabel}>
                  {cat.animals?.name ?? 'Unknown cat'}
                  {cat.animal_id === profile?.active_animal_id ? '  (active)' : ''}
                </Text>
                <Text style={styles.listValue}>{cat.steps.toLocaleString()} steps</Text>
              </View>
            ))
          )}
        </View>

        {/* ---------- LAST 7 DAYS ---------- */}
        <Text style={styles.sectionTitle}>Last {HISTORY_DAYS} days</Text>
        <View style={styles.card}>
          {days.length === 0 ? (
            <Text style={styles.muted}>No activity yet. Go for a walk!</Text>
          ) : (
            days.map((d) => (
              <View key={d.date} style={styles.listRow}>
                <Text style={styles.listLabel}>{formatDay(d.date)}</Text>
                <Text style={styles.listValue}>{d.steps.toLocaleString()} steps</Text>
                <Text style={styles.listValue}>{d.candies_collected} candies</Text>
              </View>
            ))
          )}
        </View>

        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

// One stat box: a big number with a small label above it
function StatCard({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <View style={[styles.card, styles.statCard]}>
      <Text style={styles.muted}>{label}</Text>
      <Text style={small ? styles.statValueSmall : styles.statValue}>{value}</Text>
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

// 'YYYY-MM-DD' -> 'Today', 'Yesterday' or e.g. 'Mon 28 Sep'
function formatDay(date: string) {
  if (date === localDateString(0)) return 'Today';
  if (date === localDateString(-1)) return 'Yesterday';
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
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
});