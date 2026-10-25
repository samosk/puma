// TODO: fixa bilder till alla sidor
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
    ActivityIndicator,
    Image,
    KeyboardAvoidingView,
    Platform,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
    useWindowDimensions,
    type ImageSourcePropType,
} from 'react-native';

import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { Fonts } from '../constants/theme';
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

const ITEM_SPRITES = {
    candy: require('../../assets/images/candy.png'),
    coin: require('../../assets/images/coin.png'),
};

const TUTORIAL_PAGES = {
	page1: require('../../assets/images/TutorialPage1.png'),
    page2: require('../../assets/images/TutorialPage2.png'),
};

type Species = {
    id: string;
    name: string;
    asset_key: string;
};

const TUTORIAL_SCREENSHOTS = [
    {
        id: 'bottom-menu',
        title: 'Bottom menu',
        description:
            'The bottom menu holds navigation to; Home, Map, your Friends and your Animals',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'top-menu',
        title: 'Top menu',
        description:
            'The top menu holds navigation to your; Stats, Challenges, Settings, Shop, Wardrbobe, Cat state and the amount of Candies and Coins you have collected while using the app.',
        image: TUTORIAL_PAGES.page2,
    },
    {
        id: 'Map',
        title: 'Map',
        description:
            'To collect Candies you have to walk close enough to a candy on the map. To collect, you click on the candy and then click "Collect" If the button instead says "Too far away", you have to walk closer.',
        image: TUTORIAL_PAGES.page1,
    },
    {
        id: 'Animals',
        title: 'Animals',
        description:
            'You can own multiple cats apart from the starter cat. To buy a new you click "Empty +", and to select a cat from already owned, you click on the "cat card" and then "Select cat".',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Shop',
        title: 'Shop',
        description:
            'The shop is where you can spend your collected candies and coins. The shops offers new items for your room and animals.',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Wardrobe',
        title: 'Wardrobe',
        description:
            'Here is where you select clothing, furniture and decoration to you room and animal. Only owned items will be shown. ',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Friends',
        title: 'Friends',
        description:
            'To add a new friend you click "Add new friend". You can also challenge a friend by clicking on the "friend card" and then "Challenge". The "friend cards" shows the friends name, their xp level, age and level of their animal.',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Stats',
        title: 'Stats',
        description:
            'This is where your all time statistics is shown as well as your daily steps and step-goal. The personal step-goal is pre-set to 5000 steps/day but can be changed in settings. ',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Challenges',
        title: 'Challenges',
        description:
            'This is where the daily, weekly and personal challenges are shown. Daily and weekly are always activated and will reward you with candies and coins instantly when reached.',
        image: TUTORIAL_PAGES.page1,
    },
	{
        id: 'Settings',
        title: 'Settings',
        description:
            'This is settings...',
        image: TUTORIAL_PAGES.page1,
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

    const tutorialScrollRef = useRef<ComponentRef<typeof ScrollView>>(null);

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

	function goBackButton(
		label: string,
		onPress: () => void,
		disabled = false,
	) {
		return (
			<Pressable
				onPress={onPress}
				disabled={disabled}
				style={[
					styles.goBackButton,
					disabled && styles.disabledButton,
				]}
			>
				<Text style={styles.goBackButtonText}>
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
                    	Welcome!
                    </Text>

                    <Text style={styles.subtitle}>
                        Swipe between the different cats and choose yours
                    </Text>

                    {catCarousel()}

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

					{/* enter name for cat button */}

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
                </View>
            </View>
        );
    }

    function renderWelcomeBonus() {
        return (
            <View style={styles.stepContainer}>
                <View style={styles.stepContent}>
                    <Text style={styles.title}>
                        The start of
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
                                <Image
									source={ITEM_SPRITES.candy}
									style={styles.bonusItemImage}
									resizeMode="contain"
								/>
                                <Text style={styles.bonusAmount}>
                                    x5 Candy
                                </Text>
                            </View>

                            <Text style={styles.bonusText}>
                                Candy can be used to buy new pets, clothing,
                                and change cosmetics.
                            </Text>
                        </View>

                        <View style={styles.bonusItem}>
                            <View style={styles.bonusContent}>
                                <Image
									source={ITEM_SPRITES.coin}
									style={styles.bonusItemImage}
									resizeMode="contain"
								/>
                                <Text style={styles.bonusAmount}>
                                    x100 Coins
                                </Text>
                            </View>

                            <Text style={styles.bonusText}>
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
                    <Text style={styles.title}>
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

                    <Text style={styles.tutorialDescription}>
                        {tutorial.description}
                    </Text>

                    

					

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

							{goBackButton(
								switchingAccount
									? 'Signing out...'
									: 'go back',
								handleSwitchAccount,
								switchingAccount,
							)}
						</>
					)}

					{step === 1 && (
						<>
							{button('Continue', () => setStep(2))}
							{goBackButton('Go back', goBack, false)}
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

								{goBackButton('Back', goBack, busy)}
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
		fontFamily: Fonts.regular,
        width: '100%',
        paddingHorizontal: 20,
        paddingBottom: 40,
        alignItems: 'center',

    },
    title: {
		fontFamily: Fonts.regular,
        width: '100%',
        paddingHorizontal: 20,
        fontSize: 46,
        fontWeight: '700',
        color: COLORS.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
		fontFamily: Fonts.regular,
        fontSize: 26,
        color: COLORS.muted,
        textAlign: 'center',
        lineHeight: 30,
		paddingHorizontal: 20,
    },
    loadingContainer: {
        minHeight: 300,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 12,
    },
    mutedText: {
		fontFamily: Fonts.regular,
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
        height: 280,
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
		fontFamily: Fonts.regular,
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
		fontFamily: Fonts.regular,
        fontSize: 12,
        fontWeight: '700',
        color: COLORS.accent,
    },
    pagination: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    paginationDot: {
        width: 14,
        height: 14,
        borderRadius: 8,
        backgroundColor: COLORS.border,
    },
    activePaginationDot: {
        width:	14,
        backgroundColor: COLORS.muted,
    },
    nameContainer: {
		fontFamily: Fonts.regular,
        width: '80%',
        alignItems: 'center',
        marginTop: 0,
        marginBottom: 20,
    },
    nameEditButton: {
		fontFamily: Fonts.regular,
        width: '70%',
        minHeight: 50,
        marginTop: 10,
        backgroundColor: COLORS.card,
        borderRadius: 34,
        paddingHorizontal: 18,
        alignItems: 'center',
        justifyContent: 'center',
		// Drop shadow
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 4,
		elevation: 4,
    },
    nameEditButtonText: {
		fontFamily: Fonts.regular,
        fontSize: 20,
        color: COLORS.muted,
        fontWeight: '700',
        textAlign: 'center',
    },
    input: {
		fontFamily: Fonts.regular,
        width: '100%',
        maxWidth: 280,
        marginTop: 10,
        backgroundColor: COLORS.card,
        borderWidth: 1,
        borderColor: COLORS.accent,
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 12,
        fontSize: 20,
        color: COLORS.text,
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
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 4,
		elevation: 4,
    },
    buttonText: {
		fontFamily: Fonts.regular,
        color: COLORS.text,
        fontSize: 27,
        fontWeight: '900',
    },
    secondaryButton: {
        backgroundColor: COLORS.card,
        borderWidth: 2,
        borderColor: COLORS.border,
    },
    secondaryButtonText: {
        color: COLORS.text,
    },
	goBackButton: {
		width: '35%',
		height: 40,
		borderRadius: 34,
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 18,
		marginTop: 10,
		marginBottom: 10,
		alignSelf: 'center',
		backgroundColor: COLORS.card,
		// Drop shadow
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 4,
		elevation: 4,
	},

	goBackButtonText: {
		fontFamily: Fonts.regular,
		color: COLORS.text,
		fontSize: 20,
		fontWeight: '900',
	},
    disabledButton: {
        opacity: 0.5,
    },
	bonusItemImage: {
		width: 42,
		height: 42,
		resizeMode: 'contain',
	},
    bonusCatImage: {
        width: 180,
        height: 180,
        marginBottom: 5,
    },
    bonusRow: {
        width: '100%',
        gap: 12,
        marginBottom: 10,
    },
    bonusItem: {
        width: '100%',
        borderRadius: 18,
        padding: 10,
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
		fontFamily: Fonts.regular,
        fontSize: 36,
        fontWeight: '600',
        color: COLORS.text,
    },
	bonusText:{
		fontFamily: Fonts.regular,
        fontSize: 16,
        fontWeight: '600',
        color: COLORS.text,
        alignItems: 'center',
        justifyContent: 'center',
	},
    progressText: {
		fontFamily: Fonts.regular,
        color: COLORS.muted,
        fontSize: 20,
        fontWeight: '600',
        letterSpacing: 2,
    },
	tutorialTopRow: {
		fontFamily: Fonts.regular,
		height: 36,
		alignItems: 'center',
		justifyContent: 'space-between',
		flexDirection: 'row',
		textAlign: 'center',
		marginTop: 6,
	},
	tutorialTopSpacer: {
		flex: 1,
	},
	skipTutorialButton: {
		fontFamily: Fonts.regular,
		paddingHorizontal: 14,
		paddingVertical: 7,
		borderRadius: 20,
		backgroundColor: COLORS.card,
		// Drop shadow
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 3 },
		shadowOpacity: 0.10,
		shadowRadius: 4,
		elevation: 4,
	},
    skipTutorialText: {
		fontFamily: Fonts.regular,
        color: COLORS.text,
        fontSize: 14,
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
        width: '100%',
        height: 280,
    },
    tutorialDescription: {
		fontFamily: Fonts.regular,
        fontSize: 16,
        lineHeight: 25,
        textAlign: 'center',
        color: COLORS.muted,
		marginTop: 5,
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
		fontFamily: Fonts.regular,
        width: '100%',
        color: COLORS.error,
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
        marginTop: 16,
    },
    extra: {
		fontFamily: Fonts.regular,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'transparent',
        borderWidth: 0,
        padding: 0,
        margin: 0,
    },
    statsContainer: {
		fontFamily: Fonts.regular,
        width: '80%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: 'transparent',
        paddingVertical: 20,
        paddingHorizontal: 20,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    statLabel: {
		fontFamily: Fonts.regular,
        fontSize: 20,
        fontWeight: '600',
        color: COLORS.text,
    },
    statValue: {
		fontFamily: Fonts.regular,
        fontSize: 18,
        fontWeight: '600',
        color: COLORS.text,
    },
});
