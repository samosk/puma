import LogoutButton from '@/components/logout-button';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Same colors as the stats screen
const COLORS = {
  background: '#EDEDED',
  text: '#1E1E1E',
  icon: '#4A4A4A', // back arrow
};

// Size of the back arrow (the spacer on the right matches it)
const HEADER_ICON_SIZE = 34;

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.canGoBack() && router.back()}
          hitSlop={12}
          accessibilityLabel="Go back"
        >
          <MaterialCommunityIcons name="arrow-left" size={HEADER_ICON_SIZE} color={COLORS.icon} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        {/* Empty space as wide as the arrow, so the title stays centered */}
        <View style={styles.headerSpacer} />
      </View>

      {/* ---------- CONTENT ---------- */}
      <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={styles.content}>
        <LogoutButton />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 20 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: COLORS.text },
  headerSpacer: { width: HEADER_ICON_SIZE },
});