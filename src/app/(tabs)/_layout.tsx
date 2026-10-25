import { CustomTabBar } from '@/components/navigation/custom-tab-bar';
import { Itim_400Regular } from '@expo-google-fonts/itim';
import { useFonts } from 'expo-font';
import { Tabs } from 'expo-router';


export default function TabLayout() {
  const [fontsLoaded] = useFonts({
    Itim_400Regular,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="friendScreen" options={{ title: 'Friends' }} />
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="mapScreen" options={{ title: 'Map' }} />
      <Tabs.Screen name="animalScreen" options={{ title: 'Animals' }} />
    </Tabs>
  );
}
