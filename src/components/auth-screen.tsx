import { supabase } from '@/lib/supabase';
import { Image } from 'expo-image';
import { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator,
    Animated,
    Keyboard,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
    bottomBar: '#F2F3F5',
};

const LOGIN_BACKGROUND = require('../../assets/images/onboarding/Onboarding_background.png');

// 3–20 characters: lowercase letters, numbers and underscores
const USERNAME_RULE = /^[a-z0-9_]{3,20}$/;

// The header is placed from the top of the safe area (below the notch or
// Dynamic Island) and the form from the bottom (above the home indicator), so
// both sit in the same spot on every iPhone. The picture fills the space between.
// Tuned to match the previous layout on an iPhone 13.
const HEADER_TOP_OFFSET = 10;
const FORM_BOTTOM_OFFSET = 24;

// Inner padding of the form; the first field starts this far below its top.
const CARD_PADDING = 20;

// Gray space between the top of the bottom bar and the first field.
const BAR_TOP_PADDING = 20;

// Space kept between the bottom of the form and the top of the keyboard.
const KEYBOARD_GAP = 16;

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

    const insets = useSafeAreaInsets();

    // Where the gray bottom bar starts: just above the first field (email when
    // logging in, username when registering). The form grows upward from the
    // bottom, so this follows the form's top edge.
    const [cardY, setCardY] = useState<number | null>(null);
    const barTop =
        cardY === null ? null : cardY + CARD_PADDING - BAR_TOP_PADDING;
    // The picture keeps the login screen's height in both modes; when
    // registering, the bar simply slides up over its bottom edge.
    const [imageHeight, setImageHeight] = useState<number | null>(null);

    function handleCardLayout(y: number, height: number) {
        setCardY(y);
        if (!isSignUp) {
            setImageHeight(
                (current) => current ?? y + CARD_PADDING - BAR_TOP_PADDING
            );
        }
        formBottom.current = y + height;
    }

    // When the keyboard opens, slide the whole screen (picture, bar and form)
    // up together, just enough for the form to clear the keyboard. This keeps
    // the fields on the gray bar instead of pushing them over the picture.
    // The form's bottom is the same in both modes, so one value works for both.
    // The lift is a transform, so it doesn't change the measured layout.
    const formBottom = useRef(0);
    const [lift] = useState(() => new Animated.Value(0));

    useEffect(() => {
        const showEvent =
            Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
        const hideEvent =
            Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

        function slideTo(value: number, duration?: number) {
            Animated.timing(lift, {
                toValue: value,
                duration: duration || 250,
                useNativeDriver: true,
            }).start();
        }

        const showSub = Keyboard.addListener(showEvent, (e) => {
            const overlap =
                formBottom.current + KEYBOARD_GAP - e.endCoordinates.screenY;
            slideTo(-Math.max(0, overlap), e.duration);
        });
        const hideSub = Keyboard.addListener(hideEvent, (e) => {
            slideTo(0, e?.duration);
        });

        return () => {
            showSub.remove();
            hideSub.remove();
        };
    }, [lift]);

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
        <View style={styles.background}>
          <Animated.View
              style={[styles.background, { transform: [{ translateY: lift }] }]}
          >
            {/* Background picture: fixed height, doesn't move between modes */}
            <Image
                source={LOGIN_BACKGROUND}
                style={
                    imageHeight === null
                        ? StyleSheet.absoluteFill
                        : [styles.backgroundImage, { height: imageHeight }]
                }
                contentFit="cover"
            />

            {/* Gray bar from the first field down, drawn on top of the picture */}
            {barTop !== null && (
                <View style={[styles.bottomBar, { top: barTop }]} />
            )}

            <View
                style={[
                    styles.screen,
                    { paddingBottom: insets.bottom + FORM_BOTTOM_OFFSET },
                ]}
            >

			<View
				style={[
					styles.headerBox,
					{ top: insets.top + HEADER_TOP_OFFSET },
				]}
			>
				<Text style={styles.title}>
					{mode === 'signIn' ? 'Log in' : 'Create account'}
				</Text>

				<Text style={styles.subtitle}>
					{mode === 'signIn'
						? 'Welcome back!'
						: 'Join the adventure!'}
				</Text>
			</View>

                <View
                    style={styles.card}
                    onLayout={(e) => {
                        const { y, height } = e.nativeEvent.layout;
                        handleCardLayout(y, height);
                    }}
                >
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
            </View>
          </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    background: {
        flex: 1,
        backgroundColor: COLORS.bottomBar,
    },
    backgroundImage: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    bottomBar: {
        position: 'absolute',
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: COLORS.bottomBar,
    },
	screen: {
		flex: 1,
		justifyContent: 'flex-end',
		paddingHorizontal: 24,
	},
    card: {
        width: '100%',
        alignSelf: 'center',
        gap: 12,
        padding: CARD_PADDING,
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
        fontSize: 22,
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
		position: 'absolute',
		left: 0,
		right: 0,
		alignItems: 'center',
	},
});