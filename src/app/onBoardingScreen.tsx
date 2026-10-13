
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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
    cat_white: require('../../assets/cat/cat_white.png'),
    cat_grey: require('../../assets/cat/cat_tabby.png'),
};

type Species = {
    id: string;
    name: string;
    asset_key: string;
};

const TUTORIAL_SCREENSHOTS = [
    {
        id: 'animal-state',
        title: 'Animal State',
        description:
            'Info about the animal state and how it works.',
        image: CAT_SPRITES.cat_tuxedo,
    },
    {
        id: 'map',
        title: 'Map',
        description:
            'Info about the map and how candies etc works',
        image: CAT_SPRITES.cat_orange,
    },
    {
        id: 'room',
        title: 'Room',
        description:
            'Info about the room and how to customize it.',
        image: CAT_SPRITES.cat_white,
    },
    {
        id: 'shop',
        title: 'Shop',
        description:
            'Info about the shop and how to purchase items.',
        image: CAT_SPRITES.cat_grey,
    },
];

const FIRST_TUTORIAL_STEP = 2;
const LAST_TUTORIAL_STEP = FIRST_TUTORIAL_STEP + TUTORIAL_SCREENSHOTS.length - 1;


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
    const [switchingAccount, setSwitchingAccount] = useState(false);
    const [message, setMessage] = useState('');

    const tutorialScrollRef = useRef<ScrollView>(null);

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
                .in('asset_key', [
                    'cat_tuxedo',
                    'cat_orange',
                    'cat_white',
                    'cat_grey',
                ])
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

    useEffect(() => {
        if (step >= FIRST_TUTORIAL_STEP && step <= LAST_TUTORIAL_STEP) {
            tutorialScrollRef.current?.scrollTo({
                x: (step - FIRST_TUTORIAL_STEP) * carouselWidth,
                animated: false,
            });
        }
    }, [step, carouselWidth]);

    async function handleSwitchAccount() {
        if (switchingAccount) return;

        setSwitchingAccount(true);
        setMessage('');

        try {
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Sign-out failed:', error);
                setMessage('Could not sign out. Please try again.');
                return;
            }
        } catch (error) {
            console.error('Unexpected sign-out error:', error);
            setMessage('Could not sign out. Please try again.');
        } finally {
            setSwitchingAccount(false);
        }
    }

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
                key={label}
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
                    keyboardDismissMode="on-drag"
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
                <View style={styles.stepContent}>
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
                                placeholder="e.g. Mittens"
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
                                        : 'Enter a name...'}
                                </Text>
                            </Pressable>
                        )}
                    </View>

                    <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Age</Text>
                            <Text style={styles.statValue}>0d</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Level</Text>
                            <Text style={styles.statValue}>0</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Xp</Text>
                            <Text style={styles.statValue}>0</Text>
                        </View>

                        <View style={styles.statItem}>
                            <Text style={styles.statLabel}>Km</Text>
                            <Text style={styles.statValue}>0</Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    function renderWelcomeBonus() {
        return (
            <View style={styles.stepContainer}>
                <View style={styles.stepContent}>
                    <Text style={styles.title}>
                        The new beginning of
                    </Text>

                    <Text style={styles.title}>
                        {animalName.trim()}
                    </Text>

                    {selectedCat && (
                        <View style={styles.extra}>
                            <Image
                                source={CAT_SPRITES[selectedCat.asset_key]}
                                style={styles.bonusCatImage}
                                resizeMode="contain"
                            />
                        </View>
                    )}

                    <View style={styles.bonusRow}>
                        <View style={styles.bonusItem}>
                            <View style={styles.bonusContent}>
                                <Text style={styles.bonusEmoji}>🍬</Text>
                                <Text style={styles.bonusAmount}>
                                    x5 Candy
                                </Text>
                            </View>

                            <Text style={styles.mutedText}>
                                Candy can be used to buy new pets, clothing,
                                and change cosmetics.
                            </Text>
                        </View>

                        <View style={styles.bonusItem}>
                            <View style={styles.bonusContent}>
                                <Text style={styles.bonusEmoji}>🪙</Text>
                                <Text style={styles.bonusAmount}>
                                    x100 Coins
                                </Text>
                            </View>

                            <Text style={styles.mutedText}>
                                Coins can be used to buy new furniture,
                                wallpaper and decorations to customize
                                your room.
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    function renderTutorial() {
        const tutorialIndex = step - FIRST_TUTORIAL_STEP;
        const tutorial = TUTORIAL_SCREENSHOTS[tutorialIndex];

        return (
            <View style={styles.stepContainer}>
                <View style={styles.stepContent}>
                    <Text style={styles.tutorialTitle}>
                        {tutorial.title}
                    </Text>
                    <Text style={styles.progressText}>
                        {`${tutorialIndex + 1} OF ${TUTORIAL_SCREENSHOTS.length}`}
                    </Text>

                    <ScrollView
                        ref={tutorialScrollRef}
                        horizontal
                        pagingEnabled
                        decelerationRate="fast"
                        snapToInterval={carouselWidth}
                        snapToAlignment="start"
                        showsHorizontalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        style={{ width: carouselWidth }}
                        contentContainerStyle={styles.carouselContent}
                        onMomentumScrollEnd={(event) => {
                            const index = Math.round(
                                event.nativeEvent.contentOffset.x /
                                    carouselWidth,
                            );

                            if (
                                index >= 0 &&
                                index < TUTORIAL_SCREENSHOTS.length &&
                                index + FIRST_TUTORIAL_STEP !== step
                            ) {
                                setStep(index + FIRST_TUTORIAL_STEP);
                                setMessage('');
                            }
                        }}
                    >
                        {TUTORIAL_SCREENSHOTS.map((slide) => (
                            <View
                                key={slide.id}
                                style={[
                                    styles.carouselPage,
                                    { width: carouselWidth },
                                ]}
                            >
                                <View style={styles.tutorialScreenshotCard}>
                                    <Image
                                        source={slide.image}
                                        style={styles.tutorialScreenshotImage}
                                        resizeMode="contain"
                                    />
                                </View>
                            </View>
                        ))}
                    </ScrollView>

                    <Text style={styles.tutorialDescription}>
                        {tutorial.description}
                    </Text>

                    <View style={styles.pagination}>
                        {TUTORIAL_SCREENSHOTS.map((slide, index) => (
                            <View
                                key={slide.id}
                                style={[
                                    styles.paginationDot,
                                    tutorialIndex === index &&
                                        styles.activePaginationDot,
                                ]}
                            />
                        ))}
                    </View>

					<View style={styles.tutorialTopRow}>
                        <View style={styles.tutorialTopSpacer} />

                        <Pressable
                            onPress={() => {
                                setMessage('');
                                setStep(LAST_TUTORIAL_STEP);
                            }}
                            style={styles.skipTutorialButton}
                        >
						<Text style={styles.skipTutorialText}>
							Skip tutorial
						</Text>
                        </Pressable>
                    </View>

                </View>
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
				style={styles.contentScroll}
				contentContainerStyle={styles.scrollContent}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
			>
				{step === 0 && renderCatSelection()}
				{step === 1 && renderWelcomeBonus()}
				{step >= FIRST_TUTORIAL_STEP &&
					step <= LAST_TUTORIAL_STEP &&
					renderTutorial()}

				{message !== '' && (
					<Text style={styles.errorText}>{message}</Text>
				)}
			</ScrollView>

			{!isEditingName && (
				<View style={styles.fixedFooter}>
					{step === 0 && (
						<>
							{button(
								'Continue',
								continueFromCatSelection,
								loadingCats ||
									cats.length === 0 ||
									switchingAccount,
							)}

							{button(
								switchingAccount
									? 'Signing out...'
									: '← Switch account',
								handleSwitchAccount,
								switchingAccount,
								true,
							)}
						</>
					)}

					{step === 1 && (
						<>
							{button('Continue', () => setStep(2))}
							{button('Go back', goBack, false, true)}
						</>
					)}

					{step >= FIRST_TUTORIAL_STEP &&
						step <= LAST_TUTORIAL_STEP && (
							<>
								{button(
									step === LAST_TUTORIAL_STEP
										? 'Start adventure!'
										: 'Next',
									() => {
										setMessage('');

										if (step === LAST_TUTORIAL_STEP) {
											handleFinishOnboarding();
										} else {
											setStep((currentStep) =>
												Math.min(
													currentStep + 1,
													LAST_TUTORIAL_STEP,
												),
											);
										}
									},
									step === LAST_TUTORIAL_STEP && busy,
								)}

								{button('Back', goBack, busy, true)}
							</>
						)}
				</View>
			)}
		</KeyboardAvoidingView>
	);
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    contentScroll: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 100,
        paddingBottom: 24,
    },
    stepContainer: {
        width: '100%',
        flexGrow: 1,
        alignItems: 'center',
    },
    stepContent: {
        width: '100%',
        alignItems: 'center',
    },
    fixedFooter: {
        width: '100%',
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 24,
        alignItems: 'center',
        backgroundColor: COLORS.background,
    },
    title: {
        width: '100%',
        paddingHorizontal: 20,
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
        lineHeight: 20,
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
    },
    selectedBadgeContainer: {
        height: 38,
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
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 7,
        marginTop: 12,
    },
    paginationDot: {
        width: 14,
        height: 14,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    activePaginationDot: {
        width:	14,
        backgroundColor: COLORS.accent,
    },
    nameContainer: {
        width: '80%',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 20,
    },
    nameEditButton: {
        width: '70%',
        minHeight: 50,
        marginTop: 10,
        backgroundColor: COLORS.card,
        borderRadius: 34,
        paddingHorizontal: 18,
        paddingVertical: 14,
        alignItems: 'center',
        justifyContent: 'center',
        borderColor: COLORS.accent,
        borderWidth: 1,
    },
    nameEditButtonText: {
        fontSize: 16,
        color: COLORS.text,
        fontWeight: '700',
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
        height: 50,
        borderRadius: 34,
        backgroundColor: COLORS.accent,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 18,
        marginTop: 0,
        marginBottom: 10,
        alignSelf: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    secondaryButton: {
        backgroundColor: COLORS.card,
        borderWidth: 2,
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
    bonusCatImage: {
        width: 200,
        height: 200,
        marginBottom: 8,
    },
    bonusRow: {
        width: '100%',
        gap: 12,
        marginBottom: 14,
    },
    bonusItem: {
        width: '100%',
        borderRadius: 18,
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bonusContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        gap: 12,
        marginBottom: 12,
    },
    bonusEmoji: {
        fontSize: 28,
    },
    bonusAmount: {
        fontSize: 28,
        fontWeight: '800',
        color: COLORS.text,
    },
    progressText: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 2,
        marginBottom: 32,
    },
	tutorialTopRow: {
		width: '100%',
		minHeight: 36,
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 20,
	},
	tutorialTopSpacer: {
		flex: 1,
	},
	skipTutorialButton: {
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		borderWidth: 1,
		borderColor: COLORS.border,
		backgroundColor: 'transparent',
	},
    skipTutorialText: {
        color: COLORS.muted,
        fontSize: 12,
        fontWeight: '600',
    },
    tutorialScreenshotCard: {
        width: '100%',
        height: 320,
        backgroundColor: 'transparent',
        borderWidth: 0,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tutorialScreenshotImage: {
        width: 270,
        height: 290,
    },
   	tutorialTitle: {
		fontSize: 28,
		fontWeight: 'bold',
		textAlign: 'center',
		alignSelf: 'stretch',
		marginTop: 0,
		marginBottom: 8,
	},
    tutorialDescription: {
        fontSize: 16,
        lineHeight: 25,
        textAlign: 'center',
        color: COLORS.muted,
        marginBottom: 28,
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
    extra: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        margin: 0,
    },
    statsContainer: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
        borderRadius: 20,
        paddingVertical: 8,
        paddingHorizontal: 8,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
    },
    statValue: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.text,
    },
});
