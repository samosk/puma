import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

// What every screen can read via useAuth():
//   session          -> null when logged out
//   session.user.id  -> the logged-in user's id (same as profiles.id)
//   loading          -> true while checking the login / creating the profile
type AuthContextValue = {
  session: Session | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({ session: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [creatingProfile, setCreatingProfile] = useState(false);

  useEffect(() => {
    // 1. On app start: is there a saved login from last time?
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setCheckingSession(false);
    });

    // 2. Whenever someone logs in or out (email now, Google later),
    //    update the session. This switches between login screen and tabs.
    //    (Don't call other Supabase functions inside this callback;
    //    that's why the profile is created in a separate effect below.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    // 3. Keep the login fresh only while the app is open
    //    (recommended by Supabase for React Native).
    const appState = AppState.addEventListener('change', (state) => {
      if (state === 'active') supabase.auth.startAutoRefresh();
      else supabase.auth.stopAutoRefresh();
    });

    return () => {
      subscription.unsubscribe();
      appState.remove();
    };
  }, []);

  // 4. Every time a user logs in, make sure they have a profile.
  //    Covers new email signups now and first-time Google logins later.
  const userId = session?.user.id;
  useEffect(() => {
    if (!session?.user) return;
    setCreatingProfile(true);
    ensureProfile(session.user).finally(() => setCreatingProfile(false));
    // Only re-run when a different user logs in, not on token refreshes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const loading = checkingSession || creatingProfile;

  return <AuthContext.Provider value={{ session, loading }}>{children}</AuthContext.Provider>;
}

// Use in any screen:  const { session } = useAuth();
export function useAuth() {
  return useContext(AuthContext);
}

// Creates a profile for this user if they don't have one yet.
// Username: the one chosen at signup, otherwise the start of their
// email (e.g. anna.berg@gmail.com -> annaberg), plus digits if taken.
async function ensureProfile(user: User) {
  const { data: existing } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', user.id)
    .maybeSingle();
  if (existing) return;

  const raw = user.user_metadata?.username ?? user.email?.split('@')[0] ?? '';
  const base = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const start = base.length >= 3 ? base : 'player';

  let username = start;
  for (let attempt = 0; attempt < 5; attempt++) {
    const { error } = await supabase.from('profiles').insert({ id: user.id, username });
    if (!error) return;

    // 23505 = "already exists": the username was taken, try another
    if (error.code !== '23505') {
      console.error('Could not create profile:', error.message);
      return;
    }
    username = start + Math.floor(Math.random() * 10000);
  }
}