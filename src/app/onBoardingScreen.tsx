
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	type ImageSourcePropType,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
	useWindowDimensions,
} from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { completeOnBoarding } from '../functions/completeOnBoarding';

const COLORS = {
    background: '#F2F3F5',
    card: '#FFFFFF',
    border: '#DDE1E7',
    text: '#252A34',
    muted: '#737B89',
    accent: '#6685D8',
    error: '#C74646',
};

const CAT_SPRITES: Record<string, ImageSourcePropType> = {
    cat_tuxedo: require('../../assets/cat/cat_tuxedo.png'),
    cat_orange: require('../../assets/cat/cat_orange.png'),
};

type Species = {
    id: string;
    name: string;
    asset_key: string;
};

const TUTORIALS = [
    {
        title: 'Explore the world',
        description:
            'Explore the map, discover candy spawns, and collect rewards as you move around.',
        icon: '🗺️',
    },
    {
        title: 'Grow with your cat',
        description:
            'Collect candies, earn coins, and build your progress with your animal.',
        icon: '🐾',
    },
];

export default function OnBoardingScreen() {
    const router = useRouter();
    const { session } = useAuth();
    const { width: screenWidth } = useWindowDimensions();

    const [step, setStep] = useState(0);
    const [cats, setCats] = useState<Species[]>([]);
    const [selectedSpeciesId, setSelectedSpeciesId] = useState('');
    const [animalName, setAnimalName] = useState('');
    const [isEditingName, setIsEditingName] = useState(false);
    const [loadingCats, setLoadingCats] = useState(true);
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const selectedCat = cats.find(
        (cat) => cat.id === selectedSpeciesId,
    );

    const carouselWidth = Math.min(screenWidth - 40, 340);

    useEffect(() => {
        async function fetchCats() {
            setLoadingCats(true);
            setMessage('');

            const { data, error } = await supabase
                .from('species')
                .select('id, name, asset_key')
                .in('asset_key', ['cat_tuxedo', 'cat_orange'])
                .order('name');

            if (error) {
                console.error('Error loading cat species:', error);
                setMessage('Could not load the cats. Please try again.');
                setLoadingCats(false);
                return;
            }

            const availableCats = (data ?? []).filter(
                (cat: Species) => Boolean(CAT_SPRITES[cat.asset_key]),
            );

            setCats(availableCats);

            if (availableCats.length > 0) {
                setSelectedSpeciesId((currentId) => {
                    if (
                        availableCats.some(
                            (cat) => cat.id === currentId,
                        )
                    ) {
                        return currentId;
                    }

                    return availableCats[0].id;
                });
            } else {
                setMessage(
                    'No cats were found. Please check the species table.',
                );
            }

            setLoadingCats(false);
        }

        fetchCats();
    }, []);

    function goBack() {
        setMessage('');
        setStep((currentStep) => Math.max(0, currentStep - 1));
    }

    function continueFromCatSelection() {
        if (!selectedCat) {
            setMessage('Please select a cat first.');
            return;
        }

        if (!animalName.trim()) {
            setMessage('Please give your cat a name.');
            setIsEditingName(true);
            return;
        }

        setMessage('');
        setIsEditingName(false);
        setStep(1);
    }

    async function handleFinishOnboarding() {
        if (busy) return;

        if (!session?.user?.id) {
            setMessage('Your session has expired. Please log in again.');
            return;
        }

        if (!selectedCat) {
            setMessage('Please select a cat.');
            setStep(0);
            return;
        }

        if (!animalName.trim()) {
            setMessage('Please enter a name for your cat.');
            setStep(0);
            setIsEditingName(true);
            return;
        }

        setBusy(true);
        setMessage('');

        try {
            await completeOnBoarding({
                userId: session.user.id,
                animalName: animalName.trim(),
                speciesId: selectedCat.id,
            });

            router.replace('/(tabs)');
        } catch (error) {
            console.error('Onboarding failed:', error);

            setMessage(
                error instanceof Error
                    ? error.message
                    : 'Could not complete onboarding. Please try again.',
            );
        } finally {
            setBusy(false);
        }
    }

    function button(
        label: string,
        onPress: () => void,
        disabled = false,
        secondary = false,
    ) {
        return (
            <Pressable
                onPress={onPress}
                disabled={disabled}
                style={[
                    styles.button,
                    secondary && styles.secondaryButton,
                    disabled && styles.disabledButton,
                ]}
            >
                <Text
                    style={[
                        styles.buttonText,
                        secondary && styles.secondaryButtonText,
                    ]}
                >
                    {label}
                </Text>
            </Pressable>
        );
    }

    function catCarousel() {
        if (loadingCats) {
            return (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator
                        size="large"
                        color={COLORS.accent}
                    />
                    <Text style={styles.mutedText}>
                        Finding your companions...
                    </Text>
                </View>
            );
        }

        if (cats.length === 0) {
            return (
                <Text style={styles.errorText}>
                    No cats are available right now.
                </Text>
            );
        }

        return (
            <>
                <ScrollView
                    horizontal
                    pagingEnabled
                    decelerationRate="fast"
                    snapToInterval={carouselWidth}
                    snapToAlignment="start"
                    showsHorizontalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                    onMomentumScrollEnd={(event) => {
                        const index = Math.round(
                            event.nativeEvent.contentOffset.x /
                                carouselWidth,
                        );

                        const cat = cats[index];

                        if (cat) {
                            setSelectedSpeciesId(cat.id);
                            setMessage('');
                        }
                    }}
                    style={{ width: carouselWidth }}
                    contentContainerStyle={styles.carouselContent}
                >
                    {cats.map((cat) => (
                        <View
                            key={cat.id}
                            style={[
                                styles.carouselPage,
                                { width: carouselWidth },
                            ]}
                        >
                            <Pressable
                                onPress={() => {
                                    setSelectedSpeciesId(cat.id);
                                    setMessage('');
                                }}
                                style={styles.catCard}
                            >
                                <Image
                                    source={CAT_SPRITES[cat.asset_key]}
                                    style={styles.catImage}
                                    resizeMode="contain"
                                />
                            </Pressable>
                        </View>
                    ))}
                </ScrollView>

                {/* The name and badge are outside the cat's carousel area. */}
                <Text style={styles.catName} numberOfLines={1}>
					{animalName.trim() || selectedCat?.name}
				</Text>

                <View style={styles.selectedBadgeContainer}>
                    {selectedSpeciesId !== '' && (
                        <View style={styles.selectedBadge}>
                            <Text style={styles.selectedBadgeText}>
                                ✓ Selected
                            </Text>
                        </View>
                    )}
                </View>
                <View style={styles.pagination}>
                    {cats.map((cat) => (
                        <View
                            key={cat.id}
                            style={[
                                styles.paginationDot,
                                selectedSpeciesId === cat.id &&
                                    styles.activePaginationDot,
                            ]}
                        />
                    ))}
                </View>
            </>
        );
    }

    function renderCatSelection() {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.title}>
                    Choose your companion
                </Text>

                <Text style={styles.subtitle}>
                    Swipe between the different cats to select yours
                </Text>

                {catCarousel()}

                <View style={styles.nameContainer}>
                    {isEditingName ? (
                        <TextInput
                            value={animalName}
                            onChangeText={setAnimalName}
                            placeholder="Enter name..."
                            placeholderTextColor={COLORS.muted}
                            maxLength={20}
                            autoCapitalize="words"
                            autoFocus
                            returnKeyType="done"
                            onSubmitEditing={() => setIsEditingName(false)}
                            onBlur={() => setIsEditingName(false)}
                            style={styles.input}
                        />
                    ) : (
                        <Pressable
                            onPress={() => setIsEditingName(true)}
                            style={styles.nameEditButton}
                        >
                            <Text style={styles.nameEditButtonText}>
                                {animalName.trim()
                                    ? `${animalName.trim()} · Edit name`
                                    : 'Enter name...'}
                            </Text>
                        </Pressable>
                    )}
                </View>

                {button(
                    'Continue',
                    continueFromCatSelection,
                    loadingCats || cats.length === 0,
                )}
            </View>
        );
    }

    function renderWelcomeBonus() {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.emoji}>🎉</Text>

                <Text style={styles.title}>
                    Welcome to puma!
                </Text>

                <Text style={styles.subtitle}>
                    Your adventure with {animalName.trim()} is about to begin.
                </Text>

                {selectedCat && (
                    <View style={styles.bonusCatCard}>
                        <Image
                            source={CAT_SPRITES[selectedCat.asset_key]}
                            style={styles.bonusCatImage}
                            resizeMode="contain"
                        />
                        <Text style={styles.catName}>
                            {animalName.trim()}
                        </Text>
                    </View>
                )}

                <View style={styles.bonusRow}>
                    <View style={styles.bonusItem}>
                        <Text style={styles.bonusEmoji}>🍬</Text>
                        <Text style={styles.bonusAmount}>+5</Text>
                        <Text style={styles.mutedText}>Candies</Text>
                    </View>

                    <View style={styles.bonusItem}>
                        <Text style={styles.bonusEmoji}>🪙</Text>
                        <Text style={styles.bonusAmount}>+100</Text>
                        <Text style={styles.mutedText}>Coins</Text>
                    </View>
                </View>

                {button('Let’s go!', () => setStep(2))}
                {button('Back', goBack, false, true)}
            </View>
        );
    }

    function renderTutorial() {
        const tutorialIndex = step - 2;
        const tutorial = TUTORIALS[tutorialIndex];

        return (
            <View style={styles.stepContainer}>
                <Text style={styles.progressText}>
                    TUTORIAL {tutorialIndex + 1} OF {TUTORIALS.length}
                </Text>

                <Text style={styles.emoji}>{tutorial.icon}</Text>

                <Text style={styles.title}>{tutorial.title}</Text>

                <Text style={styles.tutorialDescription}>
                    {tutorial.description}
                </Text>

                <View style={styles.tutorialProgress}>
                    {TUTORIALS.map((item, index) => (
                        <View
                            key={item.title}
                            style={[
                                styles.progressDot,
                                tutorialIndex === index &&
                                    styles.activeProgressDot,
                            ]}
                        />
                    ))}
                </View>

                {button(
                    tutorialIndex === TUTORIALS.length - 1
                        ? 'Continue'
                        : 'Next',
                    () => setStep((currentStep) => currentStep + 1),
                )}

                {button(
                    'Skip tutorial',
                    () => setStep(4),
                    false,
                    true,
                )}

                {button('Back', goBack, false, true)}
            </View>
        );
    }

    function renderConfirmation() {
        return (
            <View style={styles.stepContainer}>
                <Text style={styles.title}>
                    Meet your new companion
                </Text>

                <Text style={styles.subtitle}>
                    Make sure everything looks right before you begin.
                </Text>

                {selectedCat && (
                    <View style={styles.confirmationCard}>
                        <Image
                            source={CAT_SPRITES[selectedCat.asset_key]}
                            style={styles.confirmationImage}
                            resizeMode="contain"
                        />

                        <Text style={styles.catName}>
                            {animalName.trim()}
                        </Text>
                    </View>
                )}

                {button(
                    'Change cat or name',
                    () => {
                        setIsEditingName(false);
                        setStep(0);
                    },
                    busy,
                    true,
                )}

                {button(
                    busy ? 'Setting things up...' : 'Start exploring',
                    handleFinishOnboarding,
                    busy,
                )}

                {busy && (
                    <ActivityIndicator
                        style={styles.spinner}
                        color={COLORS.accent}
                    />
                )}

                {button('Back', goBack, busy, true)}
            </View>
        );
    }

    return (
        <KeyboardAvoidingView
            style={styles.screen}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={0}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                {step > 0 && (
                    <View style={styles.header}>
                        <Text style={styles.logo}>puma</Text>
                        <Text style={styles.stepLabel}>
                            {step === 1
                                ? 'WELCOME'
                                : step < 4
                                  ? `STEP ${step - 1} OF 2`
                                  : 'READY TO GO'}
                        </Text>
                    </View>
                )}

                {step === 0 && renderCatSelection()}
                {step === 1 && renderWelcomeBonus()}
                {(step === 2 || step === 3) && renderTutorial()}
                {step === 4 && renderConfirmation()}

                {message !== '' && (
                    <Text style={styles.errorText}>{message}</Text>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingTop: 32,
        paddingBottom: 32,
    },
    header: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 28,
    },
    logo: {
        fontSize: 30,
        fontWeight: '800',
        color: COLORS.accent,
        letterSpacing: 1,
    },
    stepLabel: {
        marginTop: 6,
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 2,
        color: COLORS.muted,
    },
    stepContainer: {
        width: '100%',
        alignItems: 'center',
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    loadingContainer: {
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    mutedText: {
        fontSize: 14,
        color: COLORS.muted,
        textAlign: 'center',
    },
    carouselContent: {
        alignItems: 'center',
    },
    carouselPage: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
    },
    catCard: {
        width: '100%',
        height: 320,
        backgroundColor: 'transparent',
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 8,
    },
    catImage: {
        width: 270,
        height: 290,
    },
    catName: {
        width: '100%',
        minHeight: 30,
        lineHeight: 30,
        fontSize: 21,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginTop: 4,
    },
    selectedBadgeContainer: {
        height: 38,
        marginTop: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedBadge: {
        backgroundColor: '#E8EEFF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    selectedBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },
    carouselHint: {
        color: COLORS.muted,
        fontSize: 13,
        marginTop: 14,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 7,
        marginTop: 12,
    },
    paginationDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    activePaginationDot: {
        width: 20,
        backgroundColor: COLORS.accent,
    },
    nameContainer: {
        width: '80%',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 20,
    },
    nameEditButton: {
        marginTop: 10,
        minWidth: 170,
        maxWidth: 280,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.border,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 12,
        alignItems: 'center',
    },
    nameEditButtonText: {
        fontSize: 14,
        color: COLORS.accent,
        fontWeight: '600',
        textAlign: 'center',
    },
    input: {
        width: '100%',
        maxWidth: 280,
        marginTop: 10,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 16,
        color: COLORS.text,
        textAlign: 'center',
    },
    button: {
        width: '70%',
        minHeight: 50,
        borderRadius: 34,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        marginTop: 10,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    secondaryButtonText: {
        color: COLORS.text,
    },
    disabledButton: {
        opacity: 0.5,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 20,
        textAlign: 'center',
    },
    bonusCatCard: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderRadius: 20,
        alignItems: 'center',
        padding: 18,
        marginBottom: 20,
    },
    bonusCatImage: {
        width: 140,
        height: 140,
        marginBottom: 8,
    },
    bonusRow: {
        flexDirection: 'row',
        width: '100%',
        gap: 12,
        marginBottom: 24,
    },
    bonusItem: {
        flex: 1,
        backgroundColor: COLORS.card,
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
    },
    bonusEmoji: {
        fontSize: 28,
        marginBottom: 8,
    },
    bonusAmount: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 4,
    },
    progressText: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 32,
    },
    tutorialDescription: {
        fontSize: 16,
        lineHeight: 25,
        textAlign: 'center',
        color: COLORS.muted,
        marginBottom: 28,
    },
    tutorialProgress: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 20,
    },
    progressDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: COLORS.border,
    },
    activeProgressDot: {
        width: 24,
        backgroundColor: COLORS.accent,
    },
    confirmationCard: {
        width: '100%',
        backgroundColor: COLORS.card,
        borderRadius: 22,
        alignItems: 'center',
        padding: 24,
        marginBottom: 20,
    },
    confirmationImage: {
        width: 200,
        height: 200,
        marginBottom: 12,
    },
    spinner: {
        marginTop: 16,
    },
    errorText: {
        width: '100%',
        color: COLORS.error,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 16,
    },
});