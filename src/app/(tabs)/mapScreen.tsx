import * as Location from 'expo-location';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Platform, StyleSheet, View } from 'react-native';
import MapView from 'react-native-maps';

import CandyInfoCard from '../../components/CandyInfoCard';
import CandyMarker from '../../components/CandyMarker';
import CenterMapButton from '../../components/CenterMapButton';

import { calculateDistance } from '../../functions/calculateDistance';
import { collectCandy } from '../../functions/collectCandy';
import { getUserProfile } from '../../functions/getUserProfile';

import { supabase } from '../../lib/supabase';

import type { Candy, User } from '../../types/types';

// Change depending on how close the user should be to collect a candy (in meters)
const COLLECTION_RADIUS = 5;

export default function MapScreen() {
	const mapRef = useRef<MapView | null>(null);
    const locationSubscription = useRef<Location.LocationSubscription | null>(null);
    const userRef = useRef<User | null>(null);
    const candiesRef = useRef<Candy[]>([]);
    const selectedCandyRef = useRef<Candy | null>(null);
    const [userLocation, setUserLocation] = useState<Location.LocationObjectCoords | null>(null);
    const [candies, setCandies] = useState<Candy[]>([]);
    const [user, setUser] = useState<User | null>(null);
    const [selectedCandy, setSelectedCandy] = useState<Candy | null>(null);
    const [selectedCandyDistance, setSelectedCandyDistance] = useState<number | null>(null);
    const [selectedCandyAddress, setSelectedCandyAddress] = useState('Finding address...');
    const [isCollectingCandy, setIsCollectingCandy] = useState(false);
    const [isFollowingUser, setIsFollowingUser] = useState(true);

    /*
     * Load the currently logged-in user.
     */
    async function loadUser() {
        const {
            data: { user: authUser },
            error,
        } = await supabase.auth.getUser();

        if (error) {
            console.error(
                'Failed to get current user:',
                error
            );
            return;
        }

        if (!authUser) {
            console.log(
                'ℹNo authenticated user currently'
            );
            return;
        }

        const profile =
            await getUserProfile(authUser.id);

        if (!profile) {
            console.log(
                'No user profile found'
            );
            return;
        }

        setUser(profile);
        userRef.current = profile;

        console.log(
            'User:',
            profile.username
        );

        console.log(
            'Users amount of candies collected:',
            profile.candies
        );
    }

    /*
	* Fetch active candies from Supabase.
	*
	* The database is the source of truth.
	*/
	async function fetchCandies() {
		console.log(
			'Fetching active candies from database...'
		);

		const { data, error } =
			await supabase
				.from('candy_spawns')
				.select(
					'id, user_id, latitude, longitude, expires_at, collected_at'
				)
				.is('collected_at', null);

		if (error) {
			console.error(
				'Failed to fetch candies'
			);

			console.error(
				'Supabase error:',
				error
			);

			return;
		}

		console.log(
			`Database says ${
				data?.length ?? 0
			} active candies on map`
		);

		if (!data || data.length === 0) {
			console.log(
				'No active candies found'
			);

			setCandies([]);
			candiesRef.current = [];

			return;
		}

		data.forEach((candy, index) => {
			console.log(
				`Candy nr: Candy #${index + 1}`
			);

			console.log(
				`   ID: ${candy.id}`
			);

			console.log(
				`   User ID: ${candy.user_id}`
			);

			console.log(
				`   Collected at: ${candy.collected_at}`
			);
		});

		setCandies(data);
		candiesRef.current = data;
	}

    /*
     * Get a fresh location when a candy is selected.
     *
     * This gives us a fresh distance immediately,
     * rather than relying only on the last watcher update.
     */
    async function handleCandyPress(
        candy: Candy
    ) {
        console.log(
            'Candy selected:',
            candy.id
        );

        selectedCandyRef.current = candy;

        setSelectedCandy(candy);

        setSelectedCandyDistance(null);

        setSelectedCandyAddress(
            'Finding address...'
        );

        try {
            console.log(
                'Getting new user location...'
            );

            const location =
                await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.High,
                });

            setUserLocation(location.coords);

            console.log(
                '📍 Fresh user location:',
                location.coords.latitude,
                location.coords.longitude
            );

            const distance =
                calculateDistance(
                    {
                        latitude:
                            location.coords.latitude,
                        longitude:
                            location.coords.longitude,
                    },
                    {
                        latitude: candy.latitude,
                        longitude: candy.longitude,
                    }
                );

            console.log(
                `Distance to selected candy: ${distance.toFixed(
                    2
                )} m`
            );

            setSelectedCandyDistance(
                distance
            );

            /*
             * Reverse geocode candy location.
             */
            try {
                const addresses =
                    await Location.reverseGeocodeAsync({
                        latitude: candy.latitude,
                        longitude: candy.longitude,
                    });

                if (
                    addresses.length > 0
                ) {
                    const address =
                        addresses[0];

                    const parts = [
                        address.street,
                        address.name,
                        address.city,
                    ].filter(Boolean);

                    if (parts.length > 0) {
                        setSelectedCandyAddress(
                            parts.join(', ')
                        );
                    } else {
                        setSelectedCandyAddress(
                            'Unknown location'
                        );
                    }
                } else {
                    setSelectedCandyAddress(
                        'Unknown location'
                    );
                }
            } catch (error) {
                console.error(
                    'Reverse geocoding failed:',
                    error
                );

                setSelectedCandyAddress(
                    'Unknown location'
                );
            }
        } catch (error) {
            console.error(
                'Failed to get current location:',
                error
            );

            setSelectedCandyDistance(null);

            Alert.alert(
                'Location unavailable',
                'Could not determine users current location.'
            );
        }
    }

    /*
     * Collect the currently selected candy.
     *
     * Nothing is removed locally.
     * Supabase must confirm the collection first.
     */
    async function handleCollectCandy() {
        const candy =
            selectedCandyRef.current;

        if (!candy) {
            console.log(
                'No candy selected'
            );
            return;
        }

        if (
            selectedCandyDistance === null
        ) {
            console.log(
                'Candy distance is unknown'
            );
            return;
        }

        if (
            selectedCandyDistance >
            COLLECTION_RADIUS
        ) {
            console.log(
                'Candy is too far away'
            );

            return;
        }

        if (isCollectingCandy) {
            return;
        }

        /*
         * We need the currently logged-in user's ID
         * so we can save who collected the candy.
         */
        if (!userRef.current) {
            console.log(
                'No user available, cannot collect candy'
            );
            return;
        }

        console.log(
            'User pressed COLLECT:',
            candy.id
        );

        console.log(
            'Candy collected by user:',
            userRef.current.id
        );

        setIsCollectingCandy(true);

        try {
            const collected =
                await collectCandy(
                    candy.id,
                    userRef.current.id
                );

            if (
                collected &&
                collected.collected_at
            ) {
                console.log(
                    'Database confirmed candy collection'
                );

                console.log(
                    '   Candy ID:',
                    collected.id
                );

                console.log(
                    '   Collected by user:',
                    userRef.current.id
                );

                console.log(
                    '   collected_at:',
                    collected.collected_at
                );

                /*
                 * Database is the source of truth.
                 *
                 * Refresh active candies from Supabase.
                 */
                await fetchCandies();

                /*
                 * Refresh user's candy count
                 * if authentication/profile exists.
                 */
                if (userRef.current) {
                    const updatedProfile =
                        await getUserProfile(
                            userRef.current.id
                        );

                    if (updatedProfile) {
                        setUser(updatedProfile);

                        userRef.current =
                            updatedProfile;
                    }
                }

                /*
                 * Only close the card after
                 * the database confirmed collection.
                 */
                selectedCandyRef.current =
                    null;

                setSelectedCandy(null);

                setSelectedCandyDistance(
                    null
                );
            } else {
                console.log(
                    'Candy collection was NOT confirmed'
                );
            }
        } catch (error) {
            console.error(
                'Error collecting candy:',
                error
            );
        } finally {
            setIsCollectingCandy(false);
        }
    }

    /*
     * Close candy card.
     */
    function handleCloseCandyCard() {
        selectedCandyRef.current =
            null;

        setSelectedCandy(null);

        setSelectedCandyDistance(
            null
        );
    }

    /*
     * Open native maps application.
     */
    function handleDirections() {
        const candy =
            selectedCandyRef.current;

        if (!candy) {
            return;
        }

        const latitude =
            candy.latitude;

        const longitude =
            candy.longitude;

        const label = encodeURIComponent(
            'Candy'
        );

        const url =
            Platform.OS === 'ios'
                ? `http://maps.apple.com/?ll=${latitude},${longitude}&q=${label}`
                : `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;

        Linking.openURL(url).catch(
            (error) => {
                console.error(
                    'Could not open maps:',
                    error
                );
            }
        );
    }

    /*
     * User manually moved the map.
     * Stop following the user.
     */
    function handleMapPan() {
        if (isFollowingUser) {
            setIsFollowingUser(false);
        }
    }

    /*
     * Center map on user and resume following.
     */
    function centerOnUser() {
        if (!userLocation) {
            return;
        }

        setIsFollowingUser(true);

        mapRef.current?.animateToRegion(
            {
                latitude:
                    userLocation.latitude,
                longitude:
                    userLocation.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            },
            500
        );
    }

    /*
     * Location tracking continuously.
     *
     * It only calculates candy distance
     * if a candy is currently selected.
     *
     * It never collects a candy automatically.
     */
    useEffect(() => {
        let mounted = true;

        async function startLocationTracking() {
            const {
                status,
            } =
                await Location.requestForegroundPermissionsAsync();

            if (
                status !==
                Location.PermissionStatus.GRANTED
            ) {
                console.log(
                    'Location permission denied'
                );

                return;
            }

            console.log(
                'Location permission granted'
            );

            locationSubscription.current =
                await Location.watchPositionAsync(
                    {
                        accuracy:
                            Location.Accuracy.High,

                        timeInterval: 5000,

                        distanceInterval: 1,
                    },
                    (location) => {
                        if (!mounted) {
                            return;
                        }

                        console.log(
                            'New location of user:',
                            location.coords.latitude,
                            location.coords.longitude
                        );

                        setUserLocation(
                            location.coords
                        );

                        /*
                         * Only calculate candy distance
                         * when a candy is selected.
                         */
                        const candy =
                            selectedCandyRef.current;

                        if (!candy) {
                            return;
                        }

                        const distance =
                            calculateDistance(
                                {
                                    latitude:
                                        location.coords
                                            .latitude,
                                    longitude:
                                        location.coords
                                            .longitude,
                                },
                                {
                                    latitude:
                                        candy.latitude,
                                    longitude:
                                        candy.longitude,
                                }
                            );

                        console.log(
                            `Distance to selected candy: ${distance.toFixed(
                                2
                            )} m`
                        );

                        setSelectedCandyDistance(
                            distance
                        );
                    }
                );
        }

        startLocationTracking();

        return () => {
            mounted = false;

            if (
                locationSubscription.current
            ) {
                locationSubscription.current.remove();

                locationSubscription.current =
                    null;
            }
        };
    }, []);

    /*
     * Initial data loading.
     */
    useFocusEffect(
        useCallback(() => {
            loadUser();
            fetchCandies();
        }, [])
    );

    return (
        <View style={styles.container}>
            {userLocation && (
                <MapView
                    ref={mapRef}
                    style={styles.map}
                    showsUserLocation={true}
                    followsUserLocation={
                        isFollowingUser
                    }
                    showsMyLocationButton={false}
                    showsCompass={true}
                    mapType="standard"
                    initialRegion={{
                        latitude:
                            userLocation.latitude,
                        longitude:
                            userLocation.longitude,
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
            )}

            <CenterMapButton
                onPress={centerOnUser}
                bottom={selectedCandy ? 318 : 700}
            />

            {selectedCandy && (
                <CandyInfoCard
                    candy={selectedCandy}
                    distance={
                        selectedCandyDistance
                    }
                    address={
                        selectedCandyAddress
                    }
                    onClose={
                        handleCloseCandyCard
                    }
                    onDirections={
                        handleDirections
                    }
                    onCollect={
                        handleCollectCandy
                    }
                    isCollecting={
                        isCollectingCandy
                    }
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
        flex: 1,
    },
});