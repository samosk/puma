import { supabase } from '@/lib/supabase';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------
// WHICH TABLE TO SHOW
// Any table with a read policy works, e.g.:
// 'animals', 'species', 'profiles', 'cosmetics', 'challenges'
// ---------------------------------------------------------------
const TABLE_NAME = 'animals';

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

export default function HomeScreen() {
  // rows    = the data from the table (starts empty)
  // loading = true while waiting for Supabase
  // error   = error message if the request failed, otherwise null
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetches the data from Supabase.
  // useCallback just keeps this function stable so useEffect below
  // doesn't re-run it on every render.
  const loadRows = useCallback(async () => {
    setLoading(true);

    // ---------------------------------------------------------------
    // THE QUERY — this is the part you'll change most often.
    // Add or swap lines to change what data comes back:
    //
    //   .select('name, xp')                  only these columns
    //   .select('*, species(name)')          also include the related species' name
    //   .eq('owner_id', 'some-uuid')         only rows where owner_id matches
    //   .gt('xp', 100)                       only rows where xp is greater than 100
    //   .order('xp', { ascending: false })   sort by xp, highest first
    //   .limit(10)                           at most 10 rows
    // ---------------------------------------------------------------
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*');

    setRows(data ?? []);
    setError(error ? error.message : null);
    setLoading(false);
  }, []);

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
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* Page title: shows the table name and how many rows came back */}
      <Text style={styles.title}>{TABLE_NAME}</Text>
      <Text style={styles.muted}>{rows.length} rows</Text>

      <FlatList
        data={rows}
        // Each row needs a unique key; most tables have an "id" column
        keyExtractor={(item, index) => String(item.id ?? index)}
        contentContainerStyle={styles.list}
        // Pull down on the list to reload the data
        refreshing={loading}
        onRefresh={loadRows}
        // Shown when there are no rows: either the error, or a hint
        ListEmptyComponent={
          <Text style={error ? styles.error : styles.muted}>
            {error ?? 'No rows. Check the table has data and a read policy.'}
          </Text>
        }
        // ---------------------------------------------------------------
        // HOW EACH ROW LOOKS
        // Right now it lists every column automatically. To design your
        // own layout, replace the inside of the card with specific
        // columns, for example:
        //
        //   <Text style={styles.value}>{String(item.name)}</Text>
        //   <Text style={styles.muted}>XP: {String(item.xp)}</Text>
        // ---------------------------------------------------------------
        renderItem={({ item }) => (
          <View style={styles.card}>
            {Object.entries(item).map(([column, value]) => (
              <View key={column} style={styles.field}>
                <Text style={styles.key}>{column}</Text>
                <Text style={styles.value}>{formatValue(value)}</Text>
              </View>
            ))}
          </View>
        )}
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
});