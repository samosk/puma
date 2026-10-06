import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Index() {
  // Space taken by the notch/status bar, so the button isn't hidden under it
  const insets = useSafeAreaInsets();
  const router = useRouter();

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

      {/* TEMPORARY: button to reach the stats screen while it's not in the tab bar.
          Placed after the map so it floats on top of it. */}
      <Pressable
        style={[styles.statsButton, { top: insets.top + 12 }]}
        onPress={() => router.push('/statScreen')}
      >
        <MaterialCommunityIcons name="chart-bar" size={20} color="#FFFFFF" />
        <Text style={styles.statsButtonText}>Stats</Text>
      </Pressable>
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

  // Floating button in the top-left corner of the map
  statsButton: {
    position: 'absolute',
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1A1E25',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 20,
  },

  statsButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});