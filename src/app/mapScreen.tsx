import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import {
	Alert,
	Linking,
	Platform,
	StyleSheet,
	View,
} from 'react-native';
import MapView from 'react-native-maps';

import CandyInfoCard from '../components/CandyInfoCard';
import CandyMarker from '../components/CandyMarker';
import CenterMapButton from '../components/CenterMapButton';
import { supabase } from '../lib/supabase';
import type { Candy } from '../types/types';

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);

  const [candies, setCandies] = useState<Candy[]>([]);
  const [selectedCandy, setSelectedCandy] =
    useState<Candy | null>(null);

  const [candyAddress, setCandyAddress] = useState(
    'Finding location...'
  );

  useEffect(() => {
    requestLocationPermission();
    fetchCandies();
  }, []);

  // --------------------------------
  // LOCATION PERMISSION
  // --------------------------------

  async function requestLocationPermission() {
    const { status } =
      await Location.requestForegroundPermissionsAsync();

    if (status !== 'granted') {
      console.log('❌ Location permission was denied');
      return;
    }

    console.log('📍 Location permission granted');
  }

  // --------------------------------
  // FETCH CANDIES
  // --------------------------------

  async function fetchCandies() {
    console.log(
      '🍬 Fetching candy spawns from Supabase...'
    );

    const { data, error } = await supabase
      .from('candy_spawns')
      .select(
        'id, latitude, longitude, expires_at, collected_at'
      )
      .is('collected_at', null);

    if (error) {
      console.error(
        '❌ Error fetching candy spawns:',
        error
      );
      return;
    }

    console.log(
      '🍬 Number of candies:',
      data?.length ?? 0
    );

    setCandies(data ?? []);
  }

  // --------------------------------
  // CENTER MAP ON USER
  // --------------------------------

  async function centerOnUser() {
    console.log('📍 Centering map on user...');

    try {
      const location =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });

      const { latitude, longitude } = location.coords;

      mapRef.current?.animateToRegion(
        {
          latitude,
          longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        },
        500
      );
    } catch (error) {
      console.log(
        '❌ Could not get current location:',
        error
      );
    }
  }

  // --------------------------------
  // CANDY PRESSED
  // --------------------------------

  async function handleCandyPress(candy: Candy) {
    console.log('Candy pressed!');
    console.log('Candy ID:', candy.id);

    setSelectedCandy(candy);

    mapRef.current?.animateToRegion(
      {
        latitude: candy.latitude,
        longitude: candy.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      500
    );

    try {
      const result =
        await Location.reverseGeocodeAsync({
          latitude: candy.latitude,
          longitude: candy.longitude,
        });

      if (result.length > 0) {
        const address = result[0];

        const formattedAddress = [
          address.street,
          address.streetNumber,
          address.postalCode,
          address.city,
        ]
          .filter(Boolean)
          .join(' ');

        setCandyAddress(
          formattedAddress || 'Candy location'
        );
      } else {
        setCandyAddress('Candy location');
      }
    } catch (error) {
      console.log(
        '❌ Could not find candy address:',
        error
      );

      setCandyAddress('Candy location');
    }
  }

  // --------------------------------
  // CLOSE CANDY CARD
  // --------------------------------

  function closeCandyPopup() {
    setSelectedCandy(null);
  }

  // --------------------------------
  // OPEN DIRECTIONS
  // --------------------------------

  async function openDirections() {
    if (!selectedCandy) {
      return;
    }

    const latitude = selectedCandy.latitude;
    const longitude = selectedCandy.longitude;

    console.log('🧭 Opening directions...');
    console.log(
      '📍 Destination:',
      latitude,
      longitude
    );

    const appleMapsUrl =
      `http://maps.apple.com/?daddr=` +
      `${latitude},${longitude}`;

    const googleMapsUrl =
      `https://www.google.com/maps/dir/?api=1` +
      `&destination=${latitude},${longitude}` +
      `&travelmode=walking`;

    try {
      if (Platform.OS === 'ios') {
        const appleSupported =
          await Linking.canOpenURL(appleMapsUrl);

        if (appleSupported) {
          await Linking.openURL(appleMapsUrl);
          return;
        }
      }

      await Linking.openURL(googleMapsUrl);
    } catch (error) {
      console.error(
        '❌ Could not open maps:',
        error
      );

      Alert.alert(
        'Could not open Maps',
        'No supported maps application could be opened.'
      );
    }
  }

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        showsUserLocation
        showsMyLocationButton={false}
        showsCompass
        mapType="standard"
        initialRegion={{
          latitude: 63.8258,
          longitude: 20.2630,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {candies.map((candy) => (
          <CandyMarker
            key={candy.id}
            candy={candy}
            onPress={handleCandyPress}
          />
        ))}
      </MapView>

      <CenterMapButton
        onPress={centerOnUser}
      />

      {selectedCandy && (
        <CandyInfoCard
          candy={selectedCandy}
          address={candyAddress}
          onClose={closeCandyPopup}
          onDirections={openDirections}
        />
      )}
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