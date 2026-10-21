import { ACC_ASSETS, BODY_ASSETS, CAT_ASSETS, HAT_ASSETS } from '@/components/cat/cat-assets';
import { CatAvatar } from '@/components/cat/CatAvatar';
import { COSMETIC_SPRITES } from '@/constants/cosmeticSprites';
import { supabase } from '@/lib/supabase';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// ---------------------------------------------------------------
// PLATSER – vad man kan ta på sig
// ---------------------------------------------------------------
type SlotKey = 'hat' | 'neck' | 'body';


const SLOTS: { key: SlotKey; label: string }[] = [
 { key: 'hat', label: 'Hats' },
 { key: 'neck', label: 'Accessories' },
 { key: 'body', label: 'Body' },
];


// Flikarna högst upp: "All" först, sedan en per plats
type TabKey = 'all' | SlotKey;


const TABS: { key: TabKey; label: string }[] = [{ key: 'all', label: 'All' }, ...SLOTS];


// ---------------------------------------------------------------
// FÄRGER
// ---------------------------------------------------------------
const COLORS = {
 background: '#E8E8E8',
 header: '#FFFFFF',
 card: '#FFFFFF',
 text: '#111111',
 muted: '#6B6B6B',
 border: '#D0D0D0',
 selected: '#5FA33A',
 empty: '#D9D9D9',
 accent: '#DD3CC4',
 error: '#D92D20',
};


const SCREEN_PADDING = 16;
const GAP = 10;


// ---------------------------------------------------------------
// TYPER
// ---------------------------------------------------------------
type OwnedItem = {
 cosmeticId: string;
 name: string;
 type: string;
 assetKey: string;
 equippedAnimalId: string | null;
};


type ActiveAnimal = {
 id: string;
 name: string;
 species: { name: string; asset_key: string } | null;
};


// ---------------------------------------------------------------
// Returnerar nyckeln om den finns i kartan, annars
// null (då ritas inget lager). Det ger också rätt typ åt TypeScript.
// ---------------------------------------------------------------
function pick<T extends object>(map: T, key?: string | null): keyof T | null {
 return key && key in map ? (key as keyof T) : null;
}


// ---------------------------------------------------------------
// ITEM SPRITE
// ---------------------------------------------------------------
function ItemSprite({ assetKey, size }: { assetKey: string; size: number }) {
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
// SKÄRMEN
// ---------------------------------------------------------------
export default function WardrobeScreen() {
 const router = useRouter();
 const insets = useSafeAreaInsets();
 const { width } = useWindowDimensions();
 const cellSize = (width - SCREEN_PADDING * 2 - GAP * 2) / 3; // 3 kolumner
 const avatarSize = Math.min(width * 0.62, 260);


 const [animal, setAnimal] = useState<ActiveAnimal | null>(null);
 const [items, setItems] = useState<OwnedItem[]>([]);
 const [tab, setTab] = useState<TabKey>('all');


 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [busyId, setBusyId] = useState<string | null>(null);
 const [error, setError] = useState<string | null>(null);


 // -------------------------------------------------------------
 // Hämta aktivt djur + allt man äger
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


   const [profileRes, itemsRes] = await Promise.all([
     supabase.from('profiles').select('active_animal_id').eq('id', user.id).single(),
     supabase
       .from('user_cosmetics')
       .select('cosmetic_id, equipped_animal_id, cosmetics(name, type, asset_key)')
       .eq('owner_id', user.id),
   ]);


   let firstError = profileRes.error ?? itemsRes.error;


   // Det aktiva djuret (om man har ett)
   const activeId = profileRes.data?.active_animal_id ?? null;
   let activeAnimal: ActiveAnimal | null = null;
   if (activeId) {
     const animalRes = await supabase
       .from('animals')
       .select('id, name, species(name, asset_key)')
       .eq('id', activeId)
       .single();
     firstError = firstError ?? animalRes.error;
     activeAnimal = (animalRes.data ?? null) as unknown as ActiveAnimal | null;
   }


   // Behåll bara kläder (sakerna som passar in i någon plats)
   const rows = (itemsRes.data ?? []) as unknown as {
     cosmetic_id: string;
     equipped_animal_id: string | null;
     cosmetics: { name: string; type: string; asset_key: string } | null;
   }[];


   const owned: OwnedItem[] = rows
     .filter((row) => row.cosmetics && SLOTS.some((slot) => slot.key === row.cosmetics!.type))
     .map((row) => ({
       cosmeticId: row.cosmetic_id,
       name: row.cosmetics!.name,
       type: row.cosmetics!.type,
       assetKey: row.cosmetics!.asset_key,
       equippedAnimalId: row.equipped_animal_id,
     }))
     .sort((a, b) => a.name.localeCompare(b.name));


   setError(firstError ? firstError.message : null);
   setAnimal(activeAnimal);
   setItems(owned);
   setLoading(false);
   setRefreshing(false);
 }, []);


 // Ladda om varje gång skärmen visas (t.ex. efter köp i shoppen)
 useFocusEffect(
   useCallback(() => {
     loadData();
   }, [loadData])
 );


 // -------------------------------------------------------------
 // Vad djuret har på sig just nu, per plats
 // -------------------------------------------------------------
 const wornBySlot = useMemo(() => {
   const map: Partial<Record<SlotKey, OwnedItem>> = {};
   if (!animal) return map;
   for (const item of items) {
     if (item.equippedAnimalId === animal.id) {
       map[item.type as SlotKey] = item;
     }
   }
   return map;
 }, [items, animal]);


 // -------------------------------------------------------------
 // Det som visas i rutnätet: allt, eller bara vald typ
 // -------------------------------------------------------------
 const visibleItems = useMemo(
   () => (tab === 'all' ? items : items.filter((item) => item.type === tab)),
   [items, tab]
 );


 // -------------------------------------------------------------
 // Ta på / ta av. Databasen ser till att bara en sak per plats sitter på.
 // -------------------------------------------------------------
 async function toggleItem(item: OwnedItem) {
   if (!animal || busyId) return;


   const wearing = item.equippedAnimalId === animal.id;


   setBusyId(item.cosmeticId);
   setError(null);


   const { error: rpcError } = await supabase.rpc('set_cosmetic_equipped', {
     p_cosmetic_id: item.cosmeticId,
     p_animal_id: wearing ? null : animal.id,
   });


   setBusyId(null);


   if (rpcError) {
     setError(rpcError.message);
     return;
   }
   await loadData();
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
   <View style={styles.screen}>
     {/* Dölj standardhuvudet från Expo Router, vi har ett eget */}
     <Stack.Screen options={{ headerShown: false }} />


     {/* ---------- HEADER: vit hela vägen upp bakom statusfältet ---------- */}
     <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
       <Pressable onPress={() => router.back()} hitSlop={12} accessibilityLabel="Go back">
         <MaterialCommunityIcons name="arrow-left" size={34} color={COLORS.text} />
       </Pressable>
       <Text style={styles.title}>Wardrobe</Text>
       <View style={{ width: 34 }} />
     </View>


     <ScrollView
       contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
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
       {error && <Text style={styles.error}>{error}</Text>}


       {!animal ? (
         // Inget aktivt djur: det går inte att klä på något
         <View style={styles.noAnimal}>
           <Text style={styles.noAnimalText}>
             You need a selected animal to dress up. Pick one on the Animals screen.
           </Text>
         </View>
       ) : (
         <>
           {/* ---------- DJURET MED KLÄDER ---------- */}
           <View style={styles.preview}>
             <CatAvatar
               appearance={{
                 // Okänd art visas som svart katt tills asset_key i species rättats
                 base: pick(CAT_ASSETS, animal.species?.asset_key) ?? 'cat_black',
                 hat: pick(HAT_ASSETS, wornBySlot.hat?.assetKey),
                 acc: pick(ACC_ASSETS, wornBySlot.neck?.assetKey),
                 body: pick(BODY_ASSETS, wornBySlot.body?.assetKey),
               }}
               width={avatarSize}
               accessibilityLabel={animal.name}
             />
             <View style={[styles.shadow, { width: avatarSize * 0.55 }]} />
             <Text style={styles.animalName}>{animal.name}</Text>
           </View>


           {/* ---------- FLIKAR: All + en per typ ---------- */}
           <View style={styles.tabRow}>
             {TABS.map((t) => {
               const selected = tab === t.key;
               return (
                 <Pressable
                   key={t.key}
                   onPress={() => setTab(t.key)}
                   style={[styles.tabButton, selected && styles.tabButtonSelected]}
                   accessibilityRole="tab"
                   accessibilityState={{ selected }}
                 >
                   <Text
                     style={[styles.tabText, selected && styles.tabTextSelected]}
                     numberOfLines={1}
                     adjustsFontSizeToFit
                   >
                     {t.label}
                   </Text>
                 </Pressable>
               );
             })}
           </View>
           <Text style={styles.hint}>Tap an item to wear it. Tap it again to take it off.</Text>
         </>
       )}


       {/* ---------- RUTNÄT: bara det man äger, växer med antalet ---------- */}
       <View style={styles.grid}>
         {visibleItems.map((item) => {
           const wearing = animal !== null && item.equippedAnimalId === animal.id;
           return (
             <Pressable
               key={item.cosmeticId}
               disabled={!animal || busyId !== null}
               onPress={() => toggleItem(item)}
               style={[
                 styles.cell,
                 wearing && styles.cellWearing,
                 busyId === item.cosmeticId && { opacity: 0.5 },
                 { width: cellSize, height: cellSize },
               ]}
               accessibilityRole="button"
               accessibilityLabel={wearing ? `Take off ${item.name}` : `Wear ${item.name}`}
             >
               <ItemSprite assetKey={item.assetKey} size={cellSize * 0.5} />
               <Text style={styles.cellName} numberOfLines={1}>
                 {item.name}
               </Text>
             </Pressable>
           );
         })}
       </View>


       {visibleItems.length === 0 && (
         <View style={styles.noItems}>
           <Text style={styles.noAnimalText}>
             {items.length === 0
               ? "You haven't bought any clothes yet."
               : "You don't own anything in this category yet."}
           </Text>
           <Pressable style={styles.shopButton} onPress={() => router.push('/shopScreen')}>
             <Text style={styles.shopButtonText}>Go to the shop</Text>
           </Pressable>
         </View>
       )}
     </ScrollView>
   </View>
 );
}


// ---------------------------------------------------------------
// STYLES
// Handskrivet typsnitt från designen: lägg till fontFamily i
// title, animalName, tabText, cellName när fonten är inladdad.
// ---------------------------------------------------------------
const styles = StyleSheet.create({
 screen: { flex: 1, backgroundColor: COLORS.background },
 center: { flex: 1, alignItems: 'center', justifyContent: 'center' },


 // Header
 header: {
   flexDirection: 'row',
   alignItems: 'center',
   justifyContent: 'space-between',
   backgroundColor: COLORS.header,
   paddingHorizontal: SCREEN_PADDING,
   paddingBottom: 12, // paddingTop läggs till i koden (statusfältet)
 },
 title: { fontSize: 26, fontWeight: '700', color: COLORS.text },


 content: { padding: SCREEN_PADDING, gap: 16, paddingBottom: 40 },
 error: { fontSize: 14, color: COLORS.error },


 // Djuret
 preview: { alignItems: 'center', paddingTop: 8 },
 shadow: {
   height: 14,
   borderRadius: 999,
   backgroundColor: 'rgba(0,0,0,0.12)',
   marginTop: -18,
 },
 animalName: { fontSize: 20, fontWeight: '700', color: COLORS.text, marginTop: 12 },


 // Flikar
 tabRow: { flexDirection: 'row', gap: 8 },
 tabButton: {
   flex: 1,
   height: 40,
   borderRadius: 20,
   backgroundColor: COLORS.empty,
   borderWidth: 2,
   borderColor: 'transparent',
   paddingHorizontal: 4,
   alignItems: 'center',
   justifyContent: 'center',
 },
 tabButtonSelected: { backgroundColor: COLORS.card, borderColor: COLORS.selected },
 tabText: { fontSize: 15, fontWeight: '600', color: COLORS.muted },
 tabTextSelected: { color: COLORS.text },
 hint: { fontSize: 12, color: COLORS.muted, textAlign: 'center', marginTop: -6 },


 // Rutnät
 grid: { flexDirection: 'row', flexWrap: 'wrap', gap: GAP },
 cell: {
   backgroundColor: COLORS.card,
   borderRadius: 14,
   borderWidth: 2,
   borderColor: 'transparent',
   alignItems: 'center',
   justifyContent: 'center',
   gap: 4,
   paddingHorizontal: 4,
 },
 cellWearing: { borderColor: COLORS.selected, borderWidth: 3 },
 cellName: { fontSize: 12, color: COLORS.muted, textAlign: 'center' },
 spritePlaceholder: {
   backgroundColor: '#F0F0F0',
   borderRadius: 10,
   alignItems: 'center',
   justifyContent: 'center',
 },


 // Tomma lägen
 noAnimal: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 20 },
 noAnimalText: { fontSize: 16, color: COLORS.muted, textAlign: 'center' },
 noItems: { alignItems: 'center', gap: 12, paddingTop: 8 },
 shopButton: {
   backgroundColor: COLORS.accent,
   borderRadius: 14,
   paddingHorizontal: 18,
   paddingVertical: 10,
 },
 shopButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
