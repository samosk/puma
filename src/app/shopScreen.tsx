import { COSMETIC_SPRITES } from '@/constants/cosmeticSprites';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// ---------------------------------------------------------------
// SEKTIONER – styr hur shoppen delas in
// Sektionerna bygger på cosmetics.type i databasen (inte på filnamn).
// Typ som inte finns här visas inte i shoppen. Lägg till den i en sektion.
// Ändra titlar och indelning fritt när ni bestämt.
// ---------------------------------------------------------------
type Tab = 'clothing' | 'interior';

const SECTIONS: Record<Tab, { title: string; types: string[] }[]> = {
  clothing: [
    { title: 'Hats', types: ['hat'] },
    { title: 'Accessories', types: ['neck'] },
    { title: 'Body', types: ['body'] },
  ],
  interior: [
    { title: 'Furniture', types: ['home_1', 'home_2', 'home_3', 'home_4'] },
    { title: 'Ornaments', types: ['ornament_1', 'ornament_2'] },
    { title: 'Walls & floor', types: ['wall', 'floor'] },
  ],
};

// ---------------------------------------------------------------
// FÄRGER – från designen i Figma (justera fritt)
// ---------------------------------------------------------------
const COLORS = {
  background: '#E8E8E8',
  header: '#FFFFFF',
  card: '#FFFFFF',
  text: '#111111',
  muted: '#6B6B6B',
  border: '#D0D0D0',
  orange: '#EBA843',
  orangeBorder: '#D8942B',
  candyBadge: '#F7DDA5',
  candyBorder: '#E5A23A',
  coinBadge: '#CFE0FB',
  coinBorder: '#5B8FE0',
  ownedBadge: '#E4E4E4',
  error: '#D92D20',
};

const SCREEN_PADDING = 16;
const GAP = 10;

// ---------------------------------------------------------------
// TYPER
// ---------------------------------------------------------------
type Cosmetic = {
  id: string;
  name: string;
  type: string;
  candy_cost: number | null;
  coin_cost: number | null;
  asset_key: string;
};

// ---------------------------------------------------------------
// SPRITE – bild om den finns, annars en ruta med emoji
// ---------------------------------------------------------------
function Sprite({ assetKey, size = 56 }: { assetKey: string; size?: number }) {
  const source = COSMETIC_SPRITES[assetKey];
  if (source) {
    return <Image source={source} style={{ width: size, height: size }} resizeMode="contain" />;
  }
  return (
    <View style={[styles.spritePlaceholder, { width: size, height: size }]}>
      <Text style={{ fontSize: size * 0.45 }}>🎁</Text>
    </View>
  );
}

// ---------------------------------------------------------------
// PRISLAPP – godis (orange), coins (blå) eller "Owned" (grå)
// Candy-ikonen i Figma är en svg; tills vidare används emojis.
// ---------------------------------------------------------------
function PriceBadge({ cosmetic, owned }: { cosmetic: Cosmetic; owned: boolean }) {
  if (owned) {
    return (
      <View style={[styles.badge, { backgroundColor: COLORS.ownedBadge, borderColor: COLORS.ownedBadge }]}>
        <Text style={[styles.badgeText, { color: COLORS.muted }]}>Owned</Text>
      </View>
    );
  }
  if (cosmetic.candy_cost != null) {
    return (
      <View style={[styles.badge, { backgroundColor: COLORS.candyBadge, borderColor: COLORS.candyBorder }]}>
        <Text style={styles.badgeText}>🍬 {cosmetic.candy_cost}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.badge, { backgroundColor: COLORS.coinBadge, borderColor: COLORS.coinBorder }]}>
      <Text style={styles.badgeText}>🪙 {cosmetic.coin_cost}</Text>
    </View>
  );
}

// ---------------------------------------------------------------
// SKÄRMEN
// ---------------------------------------------------------------
export default function ShopScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const cardWidth = (width - SCREEN_PADDING * 2 - GAP * 2) / 3; // 3 kolumner

  const [tab, setTab] = useState<Tab>('clothing');
  const [items, setItems] = useState<Cosmetic[]>([]);
  const [ownedIds, setOwnedIds] = useState<Set<string>>(new Set());
  const [candies, setCandies] = useState(0);
  const [coins, setCoins] = useState(0);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Köp-popup
  const [pending, setPending] = useState<Cosmetic | null>(null);
  const [buying, setBuying] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);

  // -------------------------------------------------------------
  // Hämta det shoppen behöver
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

    const [cosmeticsRes, ownedRes, profileRes] = await Promise.all([
      // Bara det som säljs = har minst ett pris
      supabase
        .from('cosmetics')
        .select('id, name, type, candy_cost, coin_cost, asset_key')
        .or('candy_cost.not.is.null,coin_cost.not.is.null')
        .order('name'),
      supabase.from('user_cosmetics').select('cosmetic_id').eq('owner_id', user.id),
      supabase.from('profiles').select('candies, coins').eq('id', user.id).single(),
    ]);

    const firstError = cosmeticsRes.error ?? ownedRes.error ?? profileRes.error;
    setError(firstError ? firstError.message : null);

    setItems((cosmeticsRes.data ?? []) as Cosmetic[]);
    setOwnedIds(new Set((ownedRes.data ?? []).map((row) => row.cosmetic_id as string)));
    setCandies(profileRes.data?.candies ?? 0);
    setCoins(profileRes.data?.coins ?? 0);

    setLoading(false);
    setRefreshing(false);
  }, []);

  // Ladda om varje gång skärmen visas
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // -------------------------------------------------------------
  // Dela in varorna i sektioner för vald flik
  // -------------------------------------------------------------
  const sections = useMemo(
    () =>
      SECTIONS[tab]
        .map((section) => ({
          title: section.title,
          items: items.filter((item) => section.types.includes(item.type)),
        }))
        .filter((section) => section.items.length > 0),
    [items, tab]
  );

  // -------------------------------------------------------------
  // Köp
  // -------------------------------------------------------------
  function askToBuy(item: Cosmetic) {
    setBuyError(null);
    setPending(item);
  }

  async function confirmPurchase() {
    if (!pending) return;

    setBuying(true);
    setBuyError(null);

    const { error: rpcError } = await supabase.rpc('buy_cosmetic', {
      p_cosmetic_id: pending.id,
    });

    setBuying(false);

    if (rpcError) {
      setBuyError(rpcError.message); // t.ex. "Not enough coins (need 100, have 40)"
      return;
    }

    setPending(null);
    loadData(); // hämta om, så "Owned" och saldot stämmer med databasen
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

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      {/* Dölj standardhuvudet från Expo Router, vi har ett eget */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* ---------- HEADER ---------- */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
          <MaterialCommunityIcons name="arrow-left" size={34} color={COLORS.text} />
        </Pressable>

        <View style={styles.pill}>
          <Text style={styles.pillText}>🍬 {candies}</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillText}>🪙 {coins}</Text>
        </View>
        {/* Filter-knappen från designen är utelämnad tills ni bestämt vad den ska filtrera */}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* ---------- VAROR ---------- */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
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
        {sections.length === 0 && !error && (
          <Text style={styles.empty}>Nothing for sale here yet.</Text>
        )}

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>

            <View style={styles.grid}>
              {section.items.map((item) => {
                const owned = ownedIds.has(item.id);
                return (
                  <Pressable
                    key={item.id}
                    disabled={owned}
                    onPress={() => askToBuy(item)}
                    style={[styles.itemCard, { width: cardWidth }]}
                    accessibilityRole="button"
                    accessibilityLabel={owned ? `${item.name}, owned` : `Buy ${item.name}`}
                  >
                    <Text style={styles.itemName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Sprite assetKey={item.asset_key} />
                    <PriceBadge cosmetic={item} owned={owned} />
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ---------- FLIKAR: Clothing / Interior ---------- */}
      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tabButton, tab === 'clothing' && styles.tabButtonActive]}
          onPress={() => setTab('clothing')}
        >
          <MaterialCommunityIcons
            name="tshirt-crew"
            size={24}
            color={tab === 'clothing' ? '#FFFFFF' : COLORS.text}
          />
          <Text style={[styles.tabText, tab === 'clothing' && styles.tabTextActive]}>Clothing</Text>
        </Pressable>

        <Pressable
          style={[styles.tabButton, tab === 'interior' && styles.tabButtonActive]}
          onPress={() => setTab('interior')}
        >
          <MaterialCommunityIcons
            name="sofa"
            size={24}
            color={tab === 'interior' ? '#FFFFFF' : COLORS.text}
          />
          <Text style={[styles.tabText, tab === 'interior' && styles.tabTextActive]}>Interior</Text>
        </Pressable>
      </View>

      {/* ---------- POPUP: bekräfta köp ---------- */}
      <Modal
        visible={pending !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setPending(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Are you sure you want to purchase this item?</Text>

            {pending && (
              <View style={styles.modalItem}>
                <Sprite assetKey={pending.asset_key} size={48} />
                <Text style={styles.modalItemName}>{pending.name}</Text>
                <PriceBadge cosmetic={pending} owned={false} />
              </View>
            )}

            {buyError && <Text style={styles.error}>{buyError}</Text>}

            <View style={styles.modalButtons}>
              <Pressable
                style={styles.noButton}
                onPress={() => setPending(null)}
                disabled={buying}
              >
                <Text style={styles.noText}>No</Text>
              </Pressable>
              <Pressable
                style={[styles.yesButton, buying && { opacity: 0.5 }]}
                onPress={confirmPurchase}
                disabled={buying}
              >
                <Text style={styles.yesText}>{buying ? 'Buying…' : 'Yes'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------
// STYLES
// Handskrivet typsnitt från designen: lägg till fontFamily i
// itemName, sectionTitle, pillText, tabText, badgeText när fonten är inladdad.
// ---------------------------------------------------------------
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: COLORS.header,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 12,
  },
  pill: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
  },
  pillText: { fontSize: 18, fontWeight: '600', color: COLORS.text },

  // Lista
  scroll: { flex: 1 },
  content: { padding: SCREEN_PADDING, gap: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
  empty: { fontSize: 16, color: COLORS.muted, textAlign: 'center', marginTop: 40 },
  error: { fontSize: 14, color: COLORS.error, marginHorizontal: SCREEN_PADDING, marginVertical: 6 },

  // Varukort
  itemCard: {
    backgroundColor: COLORS.card,
    borderRadius: 18,
    paddingVertical: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 150,
  },
  itemName: { fontSize: 14, color: COLORS.text, textAlign: 'center', minHeight: 34 },
  spritePlaceholder: {
    backgroundColor: '#F0F0F0',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    borderWidth: 1.5,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 3,
    minWidth: 76,
    alignItems: 'center',
  },
  badgeText: { fontSize: 15, fontWeight: '600', color: COLORS.text },

  // Flikar längst ner
  tabBar: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: COLORS.header,
    paddingHorizontal: SCREEN_PADDING,
    paddingVertical: 12,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderRadius: 30,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  tabButtonActive: { backgroundColor: COLORS.orange, borderColor: COLORS.orangeBorder },
  tabText: { fontSize: 20, color: COLORS.text },
  tabTextActive: { color: '#FFFFFF', fontWeight: '600' },

  // Popup
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    gap: 16,
    alignItems: 'center',
  },
  modalTitle: { fontSize: 20, color: COLORS.text, textAlign: 'center' },
  modalItem: { alignItems: 'center', gap: 8 },
  modalItemName: { fontSize: 16, color: COLORS.text },
  modalButtons: { flexDirection: 'row', gap: 16 },
  noButton: {
    backgroundColor: '#EBEBEB',
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  noText: { fontSize: 20, color: COLORS.text },
  yesButton: {
    backgroundColor: COLORS.orange,
    borderColor: COLORS.orangeBorder,
    borderWidth: 2,
    borderRadius: 20,
    paddingHorizontal: 28,
    paddingVertical: 6,
  },
  yesText: { fontSize: 20, color: '#FFFFFF', fontWeight: '600' },
});
