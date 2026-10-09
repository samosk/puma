import { supabase } from '@/lib/supabase';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
	ActivityIndicator,
	Image,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	RefreshControl,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------
// INSTÄLLNINGAR – ändra här när gruppen bestämt
// ---------------------------------------------------------------
const MAX_ANIMALS = 4;

// PLACEHOLDER: 100 xp per nivå. Byt ut mot gruppens riktiga formel.
const XP_PER_LEVEL = 100;
const getLevel = (xp: number) => Math.floor(xp / XP_PER_LEVEL) + 1;
const getXpToNextLevel = (xp: number) => XP_PER_LEVEL - (xp % XP_PER_LEVEL);

// ---------------------------------------------------------------
// FÄRGER – tagna från designen i Figma (justera fritt)
// ---------------------------------------------------------------
const COLORS = {
	background: '#E8E8E8',
	card: '#FFFFFF',
	border: '#B5B5B5',
	selected: '#5FA33A',
	text: '#111111',
	muted: '#6B6B6B',
	tag: '#EDEDED',
	tagText: '#8A8A8A',
	emptySlot: '#666666',
	emptyRing: '#CFCFCF',
	accent: '#DD3CC4',
	error: '#D92D20',
};

// ---------------------------------------------------------------
// SPRITES
// React Native kan inte require() dynamiskt, så varje bild måste
// listas här. Nyckeln är species.asset_key i databasen.
// Tills bilderna finns visas en emoji istället.
//
// Exempel när ni har bilderna:
//   cat_black: require('../../../assets/animals/cat_black.png'),
// ---------------------------------------------------------------
const SPRITES: Record<string, number> = {};
const FALLBACK_EMOJI = '🐾';

// ---------------------------------------------------------------
// TYPER
// ---------------------------------------------------------------
type Animal = {
	id: string;
	name: string;
	xp: number | null;
	created_at: string | null;
	species: { name: string; asset_key: string } | null;
};

type Species = {
	id: string;
	name: string;
	coin_cost: number;
	asset_key: string;
};

type Stats = { distance_m: number };

// ---------------------------------------------------------------
// HJÄLPFUNKTIONER
// ---------------------------------------------------------------
function ageInDays(createdAt: string | null): number {
	if (!createdAt) return 0;
	const ms = Date.now() - new Date(createdAt).getTime();
	return Math.max(0, Math.floor(ms / 86_400_000));
}

function formatKm(meters: number): string {
	return `${(meters / 1000).toFixed(1).replace('.0', '')} km`;
}

// ---------------------------------------------------------------
// SPRITE – visar bild om den finns, annars en grå ruta med emoji
// ---------------------------------------------------------------
function Sprite({ assetKey, size = 56 }: { assetKey?: string; size?: number }) {
	const source = assetKey ? SPRITES[assetKey] : undefined;
	if (source) {
		return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
	}
	return (
		<View style={[styles.spritePlaceholder, { width: size, height: size }]}>
			<Text style={{ fontSize: size * 0.5 }}>{FALLBACK_EMOJI}</Text>
		</View>
	);
}

// ---------------------------------------------------------------
// ANIMAL CARD – ett djur. Tryck för att fälla ut detaljer.
// ---------------------------------------------------------------
function AnimalCard({
	animal,
	stats,
	selected,
	expanded,
	onPress,
	onSelect,
}: {
	animal: Animal;
	stats: Stats;
	selected: boolean;
	expanded: boolean;
	onPress: () => void;
	onSelect: () => void;
}) {
	const xp = animal.xp ?? 0;

	return (
		<View style={styles.cardWrapper}>
			{selected && (
				<View style={styles.selectedTab}>
					<Text style={styles.selectedTabText}>Selected</Text>
				</View>
			)}

			<Pressable
				onPress={onPress}
				style={[styles.card, selected && styles.cardSelected]}
				accessibilityRole="button"
				accessibilityLabel={`${animal.name}, level ${getLevel(xp)}`}
			>
				<View style={styles.cardHeader}>
					<Sprite assetKey={animal.species?.asset_key} />

					<View style={styles.cardInfo}>
						<View style={styles.nameRow}>
							<Text style={styles.animalName}>{animal.name}</Text>
							<View style={styles.levelBadge}>
								<Text style={styles.levelText}>{getLevel(xp)}</Text>
							</View>
						</View>
						<Text style={styles.small}>{getXpToNextLevel(xp)} xp until next level</Text>
					</View>

					<View style={styles.speciesTag}>
						<Text style={styles.speciesTagText}>{animal.species?.name ?? '?'}</Text>
					</View>
				</View>

				{expanded && (
					<View style={styles.details}>
						<Text style={styles.detailText}>Total distance: {formatKm(stats.distance_m)}</Text>
						{/* PLACEHOLDER: godis per djur finns inte i databasen än */}
						<Text style={styles.detailText}>Number of candies collected: –</Text>
						<Text style={styles.detailText}>Age: {ageInDays(animal.created_at)} days</Text>

						{!selected && (
							<Pressable style={styles.selectButton} onPress={onSelect}>
								<Text style={styles.selectButtonText}>Select {animal.name}</Text>
							</Pressable>
						)}
					</View>
				)}
			</Pressable>
		</View>
	);
}

// ---------------------------------------------------------------
// EMPTY SLOT – den grå "Empty +"-knappen
// ---------------------------------------------------------------
function EmptySlot({ onPress }: { onPress: () => void }) {
	return (
		<Pressable onPress={onPress} style={styles.emptyRing} accessibilityRole="button">
			<View style={styles.emptySlot}>
				<Text style={styles.emptyText}>Empty</Text>
				<Text style={styles.plus}>+</Text>
			</View>
		</Pressable>
	);
}

// ---------------------------------------------------------------
// SKÄRMEN
// ---------------------------------------------------------------
export default function AnimalScreen() {
	const [userId, setUserId] = useState<string | null>(null);
	const [animals, setAnimals] = useState<Animal[]>([]);
	const [statsByAnimal, setStatsByAnimal] = useState<Record<string, Stats>>({});
	const [activeAnimalId, setActiveAnimalId] = useState<string | null>(null);
	const [coins, setCoins] = useState(0);
	const [expandedId, setExpandedId] = useState<string | null>(null);

	const [loading, setLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Popup för att köpa djur
	const [modalVisible, setModalVisible] = useState(false);
	const [speciesList, setSpeciesList] = useState<Species[]>([]);
	const [chosenSpecies, setChosenSpecies] = useState<Species | null>(null);
	const [newName, setNewName] = useState('');
	const [saving, setSaving] = useState(false);
	const [modalError, setModalError] = useState<string | null>(null);

	// -------------------------------------------------------------
	// Hämta allt skärmen behöver
	// -------------------------------------------------------------
	const loadData = useCallback(async () => {
		const {
			data: { user },
		} = await supabase.auth.getUser();

		if (!user) {
			setError('You are not logged in.');
			setLoading(false);
			setRefreshing(false);
			return;
		}
		setUserId(user.id);

		const [animalsRes, profileRes, statsRes] = await Promise.all([
			supabase
				.from('animals')
				.select('id, name, xp, created_at, species(name, asset_key)')
				.eq('owner_id', user.id)
				.order('created_at'),
			supabase.from('profiles').select('active_animal_id, coins').eq('id', user.id).single(),
			supabase.from('animal_activity_days').select('animal_id, distance_m').eq('owner_id', user.id),
		]);

		const firstError = animalsRes.error ?? profileRes.error ?? statsRes.error;
		setError(firstError ? firstError.message : null);

		setAnimals((animalsRes.data ?? []) as unknown as Animal[]);
		setActiveAnimalId(profileRes.data?.active_animal_id ?? null);
		setCoins(profileRes.data?.coins ?? 0);

		// Summera distans per djur
		const totals: Record<string, Stats> = {};
		for (const row of statsRes.data ?? []) {
			const current = totals[row.animal_id] ?? { distance_m: 0 };
			current.distance_m += row.distance_m ?? 0;
			totals[row.animal_id] = current;
		}
		setStatsByAnimal(totals);

		setLoading(false);
		setRefreshing(false);
	}, []);

	// Ladda om varje gång fliken visas (t.ex. efter att man gått en promenad)
	useFocusEffect(
		useCallback(() => {
			loadData();
		}, [loadData])
	);

	// -------------------------------------------------------------
	// Välj aktivt djur
	// -------------------------------------------------------------
	async function selectAnimal(id: string) {
		if (!userId) return;
		const { error: updateError } = await supabase
			.from('profiles')
			.update({ active_animal_id: id })
			.eq('id', userId);

		if (updateError) {
			setError(updateError.message);
			return;
		}
		setActiveAnimalId(id);
	}

	// -------------------------------------------------------------
	// Popup: öppna, köp, stäng
	// -------------------------------------------------------------
	async function openModal() {
		setChosenSpecies(null);
		setNewName('');
		setModalError(null);
		setModalVisible(true);

		const { data, error: speciesError } = await supabase
			.from('species')
			.select('id, name, coin_cost, asset_key')
			.order('coin_cost');

		if (speciesError) setModalError(speciesError.message);
		setSpeciesList((data ?? []) as Species[]);
	}

	async function buyAnimal() {
		if (!chosenSpecies) return;

		const name = newName.trim();
		if (!name) {
			setModalError('Give your animal a name.');
			return;
		}

		setSaving(true);
		setModalError(null);

		const { error: buyError } = await supabase.rpc('buy_animal', {
			p_species_id: chosenSpecies.id,
			p_name: name,
		});

		setSaving(false);

		if (buyError) {
			setModalError(buyError.message); // t.ex. "You can have at most 4 animals"
			return;
		}

		setModalVisible(false);
		loadData();
	}

	// -------------------------------------------------------------
	// Rendering
	// -------------------------------------------------------------
	if (loading) {
		return (
			<View style={[styles.center, { backgroundColor: COLORS.background }]}>
				<ActivityIndicator color={COLORS.text} />
			</View>
		);
	}

	// Alltid exakt MAX_ANIMALS platser: djuren + tomma platser
	const slots = Array.from({ length: MAX_ANIMALS }, (_, i) => animals[i] ?? null);

	return (
		<SafeAreaView style={styles.screen} edges={['top']}>
			<Text style={styles.title}>Animals</Text>

			{error && <Text style={styles.error}>{error}</Text>}

			<ScrollView
				contentContainerStyle={styles.list}
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={() => {
							setRefreshing(true);
							loadData();
						}}
					/>
				}
			>
				{slots.map((animal, i) =>
					animal ? (
						<AnimalCard
							key={animal.id}
							animal={animal}
							stats={statsByAnimal[animal.id] ?? { distance_m: 0 }}
							selected={animal.id === activeAnimalId}
							expanded={expandedId === animal.id}
							onPress={() => setExpandedId(expandedId === animal.id ? null : animal.id)}
							onSelect={() => selectAnimal(animal.id)}
						/>
					) : (
						<EmptySlot key={`empty-${i}`} onPress={openModal} />
					)
				)}
			</ScrollView>

			{/* ---------- POPUP: köp och namnge ett djur ---------- */}
			<Modal
				visible={modalVisible}
				transparent
				animationType="fade"
				onRequestClose={() => setModalVisible(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === 'ios' ? 'padding' : undefined}
					style={styles.modalBackdrop}
				>
					<View style={styles.modalBox}>
						<Text style={styles.modalTitle}>Get a new animal</Text>
						<Text style={styles.small}>You have {coins} coins</Text>

						<ScrollView style={styles.speciesScroll} contentContainerStyle={{ gap: 8 }}>
							{speciesList.map((s) => {
								const active = chosenSpecies?.id === s.id;
								const tooExpensive = coins < s.coin_cost;
								return (
									<Pressable
										key={s.id}
										onPress={() => setChosenSpecies(s)}
										style={[styles.speciesRow, active && styles.speciesRowActive]}
									>
										<Sprite assetKey={s.asset_key} size={40} />
										<Text style={styles.speciesName}>{s.name}</Text>
										<Text style={[styles.price, tooExpensive && { color: COLORS.error }]}>
											{s.coin_cost} coins
										</Text>
									</Pressable>
								);
							})}
						</ScrollView>

						<TextInput
							value={newName}
							onChangeText={setNewName}
							placeholder="Name your animal"
							placeholderTextColor={COLORS.muted}
							maxLength={20}
							style={styles.input}
						/>

						{modalError && <Text style={styles.error}>{modalError}</Text>}

						<View style={styles.modalButtons}>
							<Pressable style={styles.cancelButton} onPress={() => setModalVisible(false)}>
								<Text style={styles.cancelText}>Cancel</Text>
							</Pressable>
							<Pressable
								style={[styles.buyButton, (!chosenSpecies || saving) && { opacity: 0.5 }]}
								disabled={!chosenSpecies || saving}
								onPress={buyAnimal}
							>
								<Text style={styles.buyText}>{saving ? 'Saving…' : 'Get animal'}</Text>
							</Pressable>
						</View>
					</View>
				</KeyboardAvoidingView>
			</Modal>
		</SafeAreaView>
	);
}

// ---------------------------------------------------------------
// STYLES
// Handskrivet typsnitt från designen: lägg till fontFamily i
// title, animalName, small, detailText när ni laddat in fonten.
// ---------------------------------------------------------------
const styles = StyleSheet.create({
	screen: { flex: 1, backgroundColor: COLORS.background, paddingHorizontal: 16 },
	center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
	title: {
		fontSize: 32,
		fontWeight: '700',
		color: COLORS.text,
		textAlign: 'center',
		marginTop: 12,
		marginBottom: 8,
	},
	list: { paddingVertical: 12, paddingBottom: 140, gap: 10 }, // extra botten för navbaren
	error: { fontSize: 14, color: COLORS.error, marginVertical: 6 },
	small: { fontSize: 12, color: COLORS.muted, marginTop: 2 },

	// Kort
	cardWrapper: { paddingTop: 14 },
	card: {
		backgroundColor: COLORS.card,
		borderColor: COLORS.border,
		borderWidth: 1.5,
		borderRadius: 28,
		paddingHorizontal: 16,
		paddingVertical: 12,
	},
	cardSelected: { borderColor: COLORS.selected, borderWidth: 3 },
	selectedTab: {
		position: 'absolute',
		top: 0,
		right: 36,
		backgroundColor: COLORS.selected,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		paddingHorizontal: 12,
		paddingVertical: 3,
		zIndex: 1,
	},
	selectedTabText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
	cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 14 },
	cardInfo: { flex: 1 },
	nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
	animalName: { fontSize: 18, fontWeight: '700', color: COLORS.text },
	levelBadge: {
		minWidth: 22,
		height: 22,
		borderRadius: 6,
		borderWidth: 1,
		borderColor: COLORS.text,
		backgroundColor: '#F5F5F5',
		alignItems: 'center',
		justifyContent: 'center',
		paddingHorizontal: 4,
	},
	levelText: { fontSize: 13, fontWeight: '700', color: COLORS.text },
	speciesTag: {
		backgroundColor: COLORS.tag,
		borderColor: COLORS.border,
		borderWidth: 1,
		borderRadius: 8,
		paddingHorizontal: 10,
		paddingVertical: 3,
	},
	speciesTagText: { fontSize: 15, color: COLORS.tagText },
	spritePlaceholder: {
		backgroundColor: COLORS.tag,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},

	// Utfällt kort
	details: {
		marginTop: 12,
		paddingTop: 12,
		borderTopWidth: 1,
		borderTopColor: COLORS.border,
		gap: 10,
	},
	detailText: { fontSize: 14, color: COLORS.text },
	selectButton: {
		alignSelf: 'flex-start',
		backgroundColor: COLORS.selected,
		borderRadius: 14,
		paddingHorizontal: 16,
		paddingVertical: 8,
		marginTop: 4,
	},
	selectButtonText: { color: '#FFFFFF', fontWeight: '600' },

	// Tom plats
	emptyRing: {
		backgroundColor: COLORS.emptyRing,
		borderRadius: 40,
		padding: 6,
		marginTop: 14,
	},
	emptySlot: {
		backgroundColor: COLORS.emptySlot,
		borderRadius: 34,
		paddingHorizontal: 28,
		paddingVertical: 20,
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
	},
	emptyText: { color: '#FFFFFF', fontSize: 18 },
	plus: { color: '#FFFFFF', fontSize: 28, lineHeight: 30 },

	// Popup
	modalBackdrop: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'center',
		padding: 20,
	},
	modalBox: {
		backgroundColor: COLORS.card,
		borderRadius: 24,
		padding: 20,
		gap: 12,
	},
	modalTitle: { fontSize: 22, fontWeight: '700', color: COLORS.text },
	speciesScroll: { maxHeight: 240 },
	speciesRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 12,
		borderWidth: 1.5,
		borderColor: COLORS.border,
		borderRadius: 16,
		padding: 10,
	},
	speciesRowActive: { borderColor: COLORS.selected, borderWidth: 3 },
	speciesName: { flex: 1, fontSize: 16, color: COLORS.text },
	price: { fontSize: 14, color: COLORS.muted },
	input: {
		borderWidth: 1.5,
		borderColor: COLORS.border,
		borderRadius: 14,
		paddingHorizontal: 14,
		paddingVertical: 10,
		fontSize: 16,
		color: COLORS.text,
	},
	modalButtons: { flexDirection: 'row', gap: 10, justifyContent: 'flex-end' },
	cancelButton: { paddingHorizontal: 16, paddingVertical: 10 },
	cancelText: { color: COLORS.muted, fontSize: 16 },
	buyButton: {
		backgroundColor: COLORS.accent,
		borderRadius: 14,
		paddingHorizontal: 18,
		paddingVertical: 10,
	},
	buyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});