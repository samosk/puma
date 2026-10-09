
import {
	DarkTheme,
	DefaultTheme,
	Stack,
	ThemeProvider,
	useRouter,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AuthScreen from '@/components/auth-screen';
import { AuthProvider, useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
    const colorScheme = useColorScheme();

    return (
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <AuthProvider>
                <AnimatedSplashOverlay />
                <AuthGate />
            </AuthProvider>
        </ThemeProvider>
    );
}

// Decides what to show: nothing while checking a saved login,
// the login screen when logged out, and the app or onboarding when logged in.
function AuthGate() {
    const { session, loading } = useAuth();
    const router = useRouter();

    const [checkingProfile, setCheckingProfile] = useState(false);
    const [profileError, setProfileError] = useState(false);
    const [retryCount, setRetryCount] = useState(0);
    const [checkedUserId, setCheckedUserId] = useState<string | null>(null);

    useEffect(() => {
        if (loading || !session) {
            setCheckingProfile(false);
            setProfileError(false);
            setCheckedUserId(null);
            return;
        }

        const userId = session.user.id;
        let cancelled = false;

        async function checkProfile() {
            setCheckingProfile(true);
            setProfileError(false);
            setCheckedUserId(null);

            const { data, error } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', userId)
                .maybeSingle();

            if (cancelled) return;

            setCheckingProfile(false);

            if (error) {
                console.error('Failed to check profile:', error.message);
                setProfileError(true);
                return;
            }

            if (!data) {
                console.error(
                    'No profile found for authenticated user:',
                    userId,
                );
                setProfileError(true);
                return;
            }

            setCheckedUserId(userId);

            if (data.onboarding_completed) {
                router.replace('/(tabs)');
            } else {
                router.replace('/onBoardingScreen');
            }
        }

        checkProfile();

        return () => {
            cancelled = true;
        };
    }, [session?.user.id, loading, retryCount]);

    // Wait until Supabase has checked for a saved login.
    if (loading) return null;

    // Show the login screen when signed out.
    if (!session) return <AuthScreen />;

    // Show an error and let the user retry if the profile check failed.
    if (profileError) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#101318',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 24,
                }}
            >
                <Text
                    style={{
                        color: '#EEF1F5',
                        marginBottom: 16,
                        textAlign: 'center',
                    }}
                >
                    Could not check your profile. Please try again.
                </Text>

                <Pressable
                    onPress={() => setRetryCount((count) => count + 1)}
                >
                    <Text style={{ color: '#5B8DEF' }}>Try again</Text>
                </Pressable>
            </View>
        );
    }

    // Don't show the app until this user's profile check has completed.
    if (checkingProfile || checkedUserId !== session.user.id) {
        return (
            <View
                style={{
                    flex: 1,
                    backgroundColor: '#101318',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            />
        );
    }

    // Display the app's routes. AuthGate's check above decides the initial route.
    return (
        <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="onBoardingScreen" />
        </Stack>
    );
}