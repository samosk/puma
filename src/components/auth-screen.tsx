import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import {
	ActivityIndicator,
	ImageBackground,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { Fonts } from '../constants/theme';

// Match the onboarding screen styling
const COLORS = {
    background: '#F2F3F5',
    card: '#FFFFFF',
    border: '#DDE1E7',
    text: '#252A34',
    muted: '#737B89',
    accent: '#6685D8',
    error: '#C74646',
};

const LOGIN_BACKGROUND = require('../../assets/images/BackgroundLogin.png');

// 3–20 characters: lowercase letters, numbers and underscores
const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;

export default function AuthScreen() {
    const [mode, setMode] = useState<'signIn' | 'signUp'>('signIn');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState<{
        text: string;
        isError: boolean;
    } | null>(null);

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
        } catch (error) {
            setMessage({
                text: error instanceof Error
                    ? error.message
                    : 'Something went wrong. Please try again.',
                isError: true,
            });
        } finally {
            setBusy(false);
        }
    }

    async function signIn() {
        const { error } = await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
        });

        if (error) {
            setMessage({
                text: error.message,
                isError: true,
            });
        }
    }

    async function signUp() {
        const name = username.trim().toLowerCase();

        if (!USERNAME_RULE.test(name)) {
            setMessage({
                text: 'Username must be 3–20 characters: a-z, 0-9 or _',
                isError: true,
            });
            return;
        }

        // Check whether the username is already taken.
        const { data: existing, error: checkError } = await supabase
            .from('profiles')
            .select('id')
            .eq('username', name)
            .maybeSingle();

        if (checkError) {
            setMessage({
                text: checkError.message,
                isError: true,
            });
            return;
        }

        if (existing) {
            setMessage({
                text: 'That username is taken.',
                isError: true,
            });
            return;
        }

        // Create the account and pass the username to Supabase.
        const { data, error } = await supabase.auth.signUp({
            email: email.trim(),
            password,
            options: {
                data: {
                    username: name,
                },
            },
        });

        if (error) {
            setMessage({
                text: error.message,
                isError: true,
            });
        } else if (!data.session) {
            setMessage({
                text: 'Check your email to confirm your account, then log in.',
                isError: false,
            });
            setMode('signIn');
        }
    }

    return (
        <ImageBackground
            source={LOGIN_BACKGROUND}
            style={styles.background}
            resizeMode="cover"
        >
            <KeyboardAvoidingView
                style={styles.screen}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >

			<View style={styles.headerBox}>
				<Text style={styles.title}>
					{mode === 'signIn' ? 'Log in' : 'Create account'}
				</Text>

				<Text style={styles.subtitle}>
					{mode === 'signIn'
						? 'Welcome back!'
						: 'Join the adventure!'}
				</Text>
			</View>

                <View style={styles.card}>
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
                            editable={!busy}
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
                        editable={!busy}
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        placeholderTextColor={COLORS.muted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                        textContentType={
                            isSignUp ? 'newPassword' : 'password'
                        }
                        editable={!busy}
                    />

                    {message && (
                        <Text
                            style={[
                                styles.message,
                                {
                                    color: message.isError
                                        ? COLORS.error
                                        : COLORS.text,
                                },
                            ]}
                        >
                            {message.text}
                        </Text>
                    )}

                    <Pressable
                        style={[
                            styles.button,
                            busy && styles.buttonDisabled,
                        ]}
                        onPress={handleSubmit}
                        disabled={busy}
                    >
                        {busy ? (
                            <ActivityIndicator color={COLORS.text} />
                        ) : (
                            <Text style={styles.buttonText}>
                                {isSignUp
                                    ? 'Create account'
                                    : 'Log in'}
                            </Text>
                        )}
                    </Pressable>

                    <Pressable
                        onPress={() => {
                            setMode(isSignUp ? 'signIn' : 'signUp');
                            setMessage(null);
                        }}
                        disabled={busy}
                        style={styles.switchButton}
                    >
                        <Text style={styles.switchText}>
                            {isSignUp
                                ? 'Already have an account? Log in'
                                : 'New here? Create an account'}
                        </Text>
                    </Pressable>
                </View>
            </KeyboardAvoidingView>
        </ImageBackground>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
    },
	screen: {
		flex: 1,
		justifyContent: 'center',
		paddingHorizontal: 24,
		paddingVertical: 30,
		paddingTop: 380,
	},
    card: {
        width: '100%',
        alignSelf: 'center',
        gap: 12,
        padding: 20,
        borderRadius: 24,
    },

    title: {
		fontFamily: Fonts.regular,
        fontSize: 40,
        fontWeight: '600',
        color: COLORS.text,
        textAlign: 'center',
    },

    subtitle: {
		fontFamily: Fonts.regular,
        fontSize: 20,
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },

    input: {
        height: 55,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 34,
        paddingHorizontal: 20,
		fontFamily: Fonts.regular,
        fontSize: 18,
        color: COLORS.text,
        backgroundColor: COLORS.card,
    },

    message: {
		fontFamily: Fonts.regular,
        fontSize: 15,
        textAlign: 'center',
    },

    button: {
        width: '70%',
        height: 55,
        borderRadius: 34,
        backgroundColor: COLORS.card,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        marginTop: 0,
        marginBottom: 10,
        alignSelf: 'center',

        // Drop shadow
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.10,
        shadowRadius: 4,
        elevation: 4,
    },

    buttonDisabled: {
        opacity: 0.6,
    },

    buttonText: {
		fontFamily: Fonts.regular,
        color: COLORS.text,
        fontSize: 27,
        fontWeight: '900',
    },

    switchButton: {
        paddingVertical: 8,
    },

    switchText: {
		fontFamily: Fonts.regular,
        color: COLORS.muted,
        fontSize: 16,
        textAlign: 'center',
    },
	headerBox: {
		alignItems: 'center',
		marginBottom: 8,
		transform: [{ translateY: -330 }],
	},
});