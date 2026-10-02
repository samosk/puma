import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Drop <LogoutButton /> into any screen.
// Logging out clears the session, and AuthGate in _layout.tsx
// automatically switches back to the login screen.
export default function LogoutButton() {
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.email}>Logged in as {session?.user.email}</Text>
      <Pressable style={styles.button} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, alignItems: 'center', padding: 16 },
  email: { fontSize: 14, color: '#98A2B3' },
  button: {
    backgroundColor: '#F97066',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});