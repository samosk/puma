/**
 * Map Screen
 * 
 * A map for the user to see where candies are located.
 * The user can click on a candy to get directions.
 */

import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CandyInfoCard from '../../components/CandyInfoCard';
import CandyMarker from '../../components/CandyMarker';
import CenterMapButton from '../../components/CenterMapButton';
import { supabase } from '../../lib/supabase';
import type { Candy } from '../../types/types';

export default function Index() {
	const insets = useSafeAreaInsets();
  	const router = useRouter();

  	const mapRef = useRef<MapView>(null);

  	const [candies, setCandies] = useState<Candy[]>([]);
  	const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);

  	const [isFollowingUser, setIsFollowingUser] = useState(true);

  	const [selectedCandy, setSelectedCandy] = useState<Candy | null>(null);

  	const [selectedCandyAddress, setSelectedCandyAddress] = useState('Finding address...');

  	useEffect(() => {
    	getUserLocation();
    	fetchCandies();
  	}, []);

  	async function getUserLocation() {
		console.log('📍 Requesting location permission...');

		const { status } = await Location.requestForegroundPermissionsAsync();

		if (status !== 'granted') {
			console.log('Location permission denied');
			return;
		}

		const location = await Location.getCurrentPositionAsync({
			accuracy: Location.Accuracy.High,
		});

		setUserLocation(location.coords);
  	}

  	async function fetchCandies() {
    	const { data, error } = await supabase
		.from('candy_spawns')
		.select('id, latitude, longitude, expires_at, collected_at')
		.is('collected_at', null);

		if (error) {
			console.error('Failed to fetch candies');
			console.error('Supabase error:', error);
			return;
		}

    	console.log(`Found ${data?.length ?? 0} active candies`);

		if (!data || data.length === 0) {
			console.log('⚠️ No candies found');
			setCandies([]);
			return;
		}

    	data.forEach((candy, index) => {
			console.log(`🍭 Candy #${index + 1}`);
			console.log(`   ID: ${candy.id}`);
    	});

    	setCandies(data);
  	}

  	function handleMapPan() {
		if (isFollowingUser) {
			setIsFollowingUser(false);
		}
  	}

	function centerOnUser() {
		if (!userLocation) {
			return;
		}
		setIsFollowingUser(true);
		mapRef.current?.animateToRegion(
			{
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
			},
			500
		);
	}

  	async function handleCandyPress(candy: Candy) {
		setSelectedCandy(candy);
		setSelectedCandyAddress('Finding address...');

		try {
			const addresses =
				await Location.reverseGeocodeAsync({
					latitude: candy.latitude,
					longitude: candy.longitude,
				});

			if (addresses.length === 0) {
				setSelectedCandyAddress('Address unavailable');
				return;
			}

			const address = addresses[0];

			const addressParts = [
				address.street,
				address.streetNumber,
				address.postalCode,
				address.city,
			].filter(Boolean);

			const formattedAddress = addressParts.join(' ') || 'Address unavailable';

			setSelectedCandyAddress(formattedAddress);
		} catch (error) {
			console.error(
				'Failed to find candy address:',
				error
			);

			setSelectedCandyAddress('Address unavailable');
		}
  	}

	function closeCandyCard() {
		setSelectedCandy(null);
		setSelectedCandyAddress('');
	}

  async function openDirections() {
    if (!selectedCandy) {
      return;
    }

    const { latitude, longitude } = selectedCandy;

    const label = encodeURIComponent('Candy');

    let url: string;

    if (Platform.OS === 'ios') {
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&destination_place_id=${label}`;
    }

    try {
      const supported = await Linking.canOpenURL(url);

      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log('Cannot open maps');
      }
    } catch (error) {
      console.error(
        'Failed to open maps:',
        error
      );
    }
  }

  if (!userLocation) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>
          Getting your location...
        </Text>
      </View>
    );
  }

	return (
		<View style={styles.container}>
			<MapView
				ref={mapRef}
				style={styles.map}
				showsUserLocation={true}
				followsUserLocation={isFollowingUser}
				showsMyLocationButton={false}
				mapType="standard"
				initialRegion={{
				latitude: userLocation.latitude,
				longitude: userLocation.longitude,
				latitudeDelta: 0.05,
				longitudeDelta: 0.05,
				}}
				onPanDrag={handleMapPan}
			>
			{candies.map((candy) => (
				<CandyMarker
					key={candy.id}
					candy={candy}
					onPress={handleCandyPress}
				/>
			))}
			</MapView>

			<Pressable
				style={[
					styles.statsButton,
					{ top: insets.top + 12 },
				]}
				onPress={() => router.push('/statScreen')}
			>
			<MaterialCommunityIcons
				name="chart-bar"
				size={20}
				color="#FFFFFF"
			/>

			<Text style={styles.statsButtonText}>
				Stats
			</Text>
			</Pressable>

				<CenterMapButton
					onPress={centerOnUser}
					bottom={selectedCandy ? 340 : 200}
				/>

				{selectedCandy && (
					<CandyInfoCard
						candy={selectedCandy}
						address={selectedCandyAddress}
						onClose={closeCandyCard}
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

  	loadingContainer: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
  	},

  	loadingText: {
    	fontSize: 16,
  	},

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