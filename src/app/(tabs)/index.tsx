// import * as Device from 'expo-device';
// import { Platform, StyleSheet } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';

// // ---------------------------------------------------------------
// // WHICH TABLE TO SHOW
// // Any table with a read policy works, e.g.:
// // 'animals', 'species', 'profiles', 'cosmetics', 'challenges'
// // ---------------------------------------------------------------
// const TABLE_NAME = 'animals';

// // ---------------------------------------------------------------
// // COLORS
// // One fixed palette, so the screen looks the same whether the
// // phone is in light or dark mode. Change the hex values freely.
// // ---------------------------------------------------------------
// const COLORS = {
//   background: '#101318',
//   card: '#1A1E25',
//   border: '#2A303A',
//   text: '#EEF1F5',
//   muted: '#98A2B3',
//   error: '#F97066',
// };

// export default function HomeScreen() {
//   // rows    = the data from the table (starts empty)
//   // loading = true while waiting for Supabase
//   // error   = error message if the request failed, otherwise null
//   const [rows, setRows] = useState<Record<string, unknown>[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   // Fetches the data from Supabase.
//   // useCallback just keeps this function stable so useEffect below
//   // doesn't re-run it on every render.
//   const loadRows = useCallback(async () => {
//     setLoading(true);

//     // ---------------------------------------------------------------
//     // THE QUERY — this is the part you'll change most often.
//     // Add or swap lines to change what data comes back:
//     //
//     //   .select('name, xp')                  only these columns
//     //   .select('*, species(name)')          also include the related species' name
//     //   .eq('owner_id', 'some-uuid')         only rows where owner_id matches
//     //   .gt('xp', 100)                       only rows where xp is greater than 100
//     //   .order('xp', { ascending: false })   sort by xp, highest first
//     //   .limit(10)                           at most 10 rows
//     // ---------------------------------------------------------------
//     const { data, error } = await supabase
//       .from(TABLE_NAME)
//       .select('*');

//     setRows(data ?? []);
//     setError(error ? error.message : null);
//     setLoading(false);
//   }, []);

//   // Run loadRows once when the screen first opens
//   useEffect(() => {
//     loadRows();
//   }, [loadRows]);

//   // Spinner on the very first load (before any rows have arrived)
//   if (loading && rows.length === 0) {
//     return (
//       <View style={[styles.center, { backgroundColor: COLORS.background }]}>
//         <ActivityIndicator color={COLORS.text} />
//       </View>
//     );
//   }

//   return (
//     <SafeAreaView style={styles.screen} edges={['top']}>
//       {/* Page title: shows the table name and how many rows came back */}
//       <Text style={styles.title}>{TABLE_NAME}</Text>
//       <Text style={styles.muted}>{rows.length} rows</Text>

//         <ThemedText type="code" style={styles.code}>
//           get started
//         </ThemedText>

		

//         <ThemedView type="backgroundElement" style={styles.stepContainer}>
//           <HintRow
//             title="Try editing"
//             hint={<ThemedText type="code">src/app/index.tsx</ThemedText>}
//           />
//           <HintRow title="Dev tools" hint={getDevMenuHint()} />
//           <HintRow
//             title="Fresh start"
//             hint={<ThemedText type="code">npm run reset-project</ThemedText>}
//           />
//         </ThemedView>

//         {Platform.OS === 'web' && <WebBadge />}
//       </SafeAreaView>
//     </ThemedView>
//   );
// }

// // Turns any database value into text: empty values become a dash,
// // objects (like joined tables) become JSON
// function formatValue(value: unknown): string {
//   if (value === null || value === undefined) return '—';
//   if (typeof value === 'object') return JSON.stringify(value);
//   return String(value);
// }

// // ---------------------------------------------------------------
// // STYLES — sizes, spacing and layout for everything above
// // ---------------------------------------------------------------
// const styles = StyleSheet.create({
//   screen: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
//   center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
//   title: { fontSize: 28, fontWeight: '700', color: COLORS.text, marginTop: 16 },
//   muted: { fontSize: 14, color: COLORS.muted, marginTop: 4 },
//   error: { fontSize: 14, color: COLORS.error },
//   list: { paddingVertical: 16, gap: 12 },
//   card: {
//     backgroundColor: COLORS.card,
//     borderColor: COLORS.border,
//     borderWidth: 1,
//     borderRadius: 12,
//     padding: 14,
//     gap: 8,
//   },
//   safeArea: {
//     flex: 1,
//     paddingHorizontal: Spacing.four,
//     alignItems: 'center',
//     gap: Spacing.three,
//     paddingBottom: BottomTabInset + Spacing.three,
//     maxWidth: MaxContentWidth,
//   },
//   heroSection: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     flex: 1,
//     paddingHorizontal: Spacing.four,
//     gap: Spacing.four,
//   },
//   title: {
//     textAlign: 'center',
//   },
//   code: {
//     textTransform: 'uppercase',
//   },
//   stepContainer: {
//     gap: Spacing.three,
//     alignSelf: 'stretch',
//     paddingHorizontal: Spacing.three,
//     paddingVertical: Spacing.four,
//     borderRadius: Spacing.four,
//   },
// });


import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

export default function Index() {
  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        
        // Show the user's current position
        showsUserLocation={true}

        // Keep the map centered on the user as they move
        followsUserLocation={true}

        // Allow the user to manually move around the map
        showsMyLocationButton={true}

        // Apple Maps
        mapType="standard"

        // Initial position before iOS gets the user's actual location
        initialRegion={{
          latitude: 63.8258,
          longitude: 20.2630,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker
          coordinate={{
            latitude: 63.8258,
            longitude: 20.2630,
          }}
        >
          <MaterialCommunityIcons
            name="candy"
            size={50}
            color="magenta"
          />
        </Marker>
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  map: {
    width: '100%',
    height: '100%',
  },
});