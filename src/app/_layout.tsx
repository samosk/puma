import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import AuthScreen from '@/components/auth-screen';
import { AuthProvider, useAuth } from '@/lib/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <AnimatedSplashOverlay />
        <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
        <AuthGate />
      </AuthProvider>
    </ThemeProvider>
  );
}

// Decides what to show: nothing while checking for a saved login,
// the login screen when logged out, and the tabs when logged in.
function AuthGate() {
  const { session, loading } = useAuth();

  if (loading) return null;
  if (!session) return <AuthScreen />;
  return <AppTabs />;
}