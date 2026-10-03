import { Tabs } from 'expo-router';

import { CustomTabBar } from '@/components/navigation/custom-tab-bar';

export default function TabLayout() {
  return (
    <Tabs
      initialRouteName="index"
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="friendScreen" options={{ title: 'Friends' }} />
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="mapScreen" options={{ title: 'Map' }} />
      <Tabs.Screen name="animalScreen" options={{ title: 'Animals' }} />
    </Tabs>
  );
}
