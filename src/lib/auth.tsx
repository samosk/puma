
import { supabase } from '@/lib/supabase';
import type { Session } from '@supabase/supabase-js';
import {
    createContext,
    type ReactNode,
    useContext,
    useEffect,
    useState,
} from 'react';
import { AppState } from 'react-native';

// What every screen can read via useAuth():
//   session          -> null when logged out
//   session.user.id  -> the logged-in user's id (same as profiles.id)
//   loading          -> true while checking the login
type AuthContextValue = {
    session: Session | null;
    loading: boolean;
};

const AuthContext = createContext<AuthContextValue>({
    session: null,
    loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // 1. On app start: is there a saved login from last time?
        async function loadSession() {
            const { data, error } = await supabase.auth.getSession();

            if (!mounted) return;

            if (error) {
                console.error('Could not load session:', error.message);
            }

            setSession(data.session);
            setLoading(false);
        }

        loadSession();

        // 2. Whenever someone logs in or out (email now, Google later),
        //    update the session. Profile creation happens during onboarding.
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            setLoading(false);
        });

        // 3. Keep the login fresh only while the app is open
        //    (recommended by Supabase for React Native).
        const appState = AppState.addEventListener('change', (state) => {
            if (state === 'active') {
                supabase.auth.startAutoRefresh();
            } else {
                supabase.auth.stopAutoRefresh();
            }
        });

        return () => {
            mounted = false;
            subscription.unsubscribe();
            appState.remove();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ session, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// Use in any screen: const { session } = useAuth();
export function useAuth() {
    return useContext(AuthContext);
}