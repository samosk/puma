import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

// Same palette as the index screen; change freely
const COLORS = {
  background: '#101318',
  card: '#1A1E25',
  border: '#2A303A',
  text: '#EEF1F5',
  muted: '#98A2B3',
  accent: '#5B8DEF',
  error: '#F97066',
};

// 3-20 characters: lowercase letters, numbers and underscores
const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;

export default function AuthScreen() {
  // 'signIn' = log in to an existing account, 'signUp' = register
  const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  const isSignUp = mode === 'signUp';

  async function handleSubmit() {
    setMessage(null);
    setBusy(true);
    try {
      if (isSignUp) {
        await signUp();
      } else {
        await signIn();
      }
    } finally {
      setBusy(false);
    }
  }

  async function signIn() {
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    // On success there's nothing to do here: AuthProvider notices the
    // new session and the app switches to the tabs automatically.
    if (error) setMessage({ text: error.message, isError: true });
  }

  async function signUp() {
    const name = username.trim().toLowerCase();

    if (!USERNAME_RULE.test(name)) {
      setMessage({ text: 'Username must be 3-20 characters: a-z, 0-9 or _', isError: true });
      return;
    }

    // Check the username is free.
    // Needs read access to profiles (the "Dev: anyone can read profiles" policy).
    const { data: existing, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', name)
      .maybeSingle();
    if (checkError) {
      setMessage({ text: checkError.message, isError: true });
      return;
    }
    if (existing) {
      setMessage({ text: 'That username is taken', isError: true });
      return;
    }

    // Create the account. The username is stored on the account, and
    // AuthProvider (src/lib/auth.tsx) uses it to create the profile.
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { username: name } },
    });

    if (error) {
      setMessage({ text: error.message, isError: true });
    } else if (!data.session) {
      // Happens when "Confirm email" is turned on in Supabase
      setMessage({ text: 'Check your email to confirm your account, then log in.', isError: false });
      setMode('signIn');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>{isSignUp ? 'Create account' : 'Log in'}</Text>

        {/* Username only matters when registering */}
        {isSignUp && (
          <TextInput
            style={styles.input}
            placeholder="Username"
            placeholderTextColor={COLORS.muted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="username"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={COLORS.muted}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
        />

        <TextInput
          style={styles.input}
          placeholder="Password (at least 6 characters)"
          placeholderTextColor={COLORS.muted}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType={isSignUp ? 'newPassword' : 'password'}
        />

        {message && (
          <Text style={[styles.message, { color: message.isError ? COLORS.error : COLORS.muted }]}>
            {message.text}
          </Text>
        )}

        <Pressable style={styles.button} onPress={handleSubmit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{isSignUp ? 'Create account' : 'Log in'}</Text>
          )}
        </Pressable>

        {/* -----------------------------------------------------------
            FUTURE: "Continue with Google" button goes here.
            It will call supabase.auth.signInWithIdToken(...). Nothing
            else in the app needs to change: AuthProvider picks up the
            session and creates the profile on first login.
           ----------------------------------------------------------- */}

        <Pressable
          onPress={() => {
            setMode(isSignUp ? 'signIn' : 'signUp');
            setMessage(null);
          }}
        >
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? Log in' : "New here? Create an account"}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: COLORS.background,
  },
  card: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  title: { fontSize: 26, fontWeight: '700', color: COLORS.text, marginBottom: 4 },
  input: {
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  message: { fontSize: 14 },
  button: {
    backgroundColor: COLORS.accent,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  switchText: { color: COLORS.muted, textAlign: 'center', marginTop: 4 },
});