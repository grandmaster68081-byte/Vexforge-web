import { Feather } from '@/components/ForgeIcon';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { ProgressBar } from '@/components/ProgressBar';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import type { PlayerCard, PublicCard } from '@/lib/supabase';
import { FACTION_ICONS } from '@/constants/visual';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;
const FACTIONS = ['Guerrero', 'Mago', 'Paladín', 'Pícaro'] as const;
type Rarity = (typeof RARITIES)[number];

function rarityLabel(rarity: string | null | undefined) {
  return {
    Common: 'Común',
    Uncommon: 'Infrecuente',
    Rare: 'Rara',
    Epic: 'Épica',
    Legendary: 'Legendaria',
    Mythic: 'Mítica',
  }[rarity ?? ''] ?? rarity ?? 'Sin rareza';
}

function rarityColor(rarity: string | null | undefined, colors: ReturnType<typeof useColors>) {
  return {
    Common: colors.rarityCommon,
    Uncommon: colors.rarityUncommon,
    Rare: colors.rarityRare,
    Epic: colors.rarityEpic,
    Legendary: colors.rarityLegendary,
    Mythic: colors.rarityMythic,
  }[rarity ?? ''] ?? colors.mutedForeground;
}

function CardArt({
  card,
  colors,
  detail = false,
}: {
  card: PublicCard;
  colors: ReturnType<typeof useColors>;
  detail?: boolean;
}) {
  const accent = rarityColor(card.rarity, colors);
  return (
    <View style={[styles.art, detail && styles.artDetail, { borderColor: accent, backgroundColor: colors.panelStrong }]}>
      {card.image_url ? (
        <Image
          source={{ uri: card.image_url }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          accessibilityLabel={`Arte de ${card.name}`}
        />
      ) : (
        <View style={styles.artFallback}>
          <View style={[styles.rune, { borderColor: `${accent}88` }]}>
            {FACTION_ICONS[card.faction ?? ''] ? (
              <Image source={{ uri: FACTION_ICONS[card.faction ?? ''] }} style={detail ? styles.factionIconDetail : styles.factionIcon} resizeMode="contain" accessibilityLabel={`Emblema oficial de ${card.faction ?? 'la facción'}`} />
            ) : (
              <Feather name="compass" size={detail ? 46 : 28} color={accent} />
            )}
          </View>
          <Text style={[styles.fallbackName, { color: accent }]} numberOfLines={2}>
            {card.name}
          </Text>
        </View>
      )}
      <View style={[styles.artShade, { backgroundColor: `${colors.ink}66` }]} />
      <View style={[styles.artRule, { backgroundColor: accent }]} />
    </View>
  );
}

function Stat({
  label,
  value,
  max,
  color,
  colors,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <View style={styles.stat}>
      <View style={styles.statTop}>
        <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.statValue, { color }]}>{value}</Text>
      </View>
      <ProgressBar value={max > 0 ? (value / max) * 100 : 0} color={color} />
    </View>
  );
}

function CardTile({
  card,
  owned,
  onPress,
  colors,
}: {
  card: PublicCard;
  owned?: PlayerCard;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = rarityColor(card.rarity, colors);
  return (
    <Pressable
      testID={`card-${card.code}`}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${card.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        { backgroundColor: colors.panel, borderColor: accent, opacity: pressed ? 0.78 : 1 },
      ]}
    >
      <CardArt card={card} colors={colors} />
      <View style={styles.tileBody}>
        <Text style={[styles.tileName, { color: colors.foreground }]} numberOfLines={1}>
          {card.name}
        </Text>
        <View style={styles.tileMeta}>
          <Text style={[styles.rarity, { color: accent }]}>{rarityLabel(card.rarity)}</Text>
          <Text style={[styles.dot, { color: colors.border }]}>·</Text>
          {FACTION_ICONS[card.faction ?? ''] ? (
            <Image source={{ uri: FACTION_ICONS[card.faction ?? ''] }} style={styles.factionIconMeta} resizeMode="contain" accessibilityLabel={`Emblema oficial de ${card.faction ?? 'la facción'}`} />
          ) : <Feather name="compass" size={11} color={colors.mutedForeground} />}
        </View>
        <View style={styles.tileStats}>
          <Text style={[styles.tileStat, { color: colors.danger }]}>PWR {card.power ?? 0}</Text>
          <Text style={[styles.tileStat, { color: colors.primary }]}>AFF {card.affinity ?? 0}</Text>
        </View>
      </View>
      {owned && (
        <View style={[styles.ownedBadge, { backgroundColor: colors.accent }]}>
          <Feather name="check" size={10} color={colors.accentForeground} />
          <Text style={[styles.ownedText, { color: colors.accentForeground }]}>x{owned.quantity}</Text>
        </View>
      )}
      {card.is_founder && (
        <View style={[styles.founderBadge, { backgroundColor: colors.panelStrong, borderColor: colors.rarityEpic }]}>
          <Text style={[styles.founderText, { color: colors.rarityEpic }]}>FOUNDER</Text>
        </View>
      )}
    </Pressable>
  );
}

function CardDetail({
  card,
  owned,
  colors,
  onClose,
}: {
  card: PublicCard;
  owned?: PlayerCard;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
}) {
  const accent = rarityColor(card.rarity, colors);
  const keywords = Array.isArray(card.synergy_json?.keywords)
    ? card.synergy_json.keywords.filter((keyword): keyword is string => typeof keyword === 'string')
    : [];
  return (
    <Modal animationType="slide" transparent statusBarTranslucent visible onRequestClose={onClose}>
      <View style={[styles.modal, { backgroundColor: `${colors.ink}E8` }]}>
        <View style={[styles.detailPanel, { backgroundColor: colors.background, borderColor: accent }]}>
          <View style={styles.detailHeader}>
            <View style={styles.detailHeading}>
              <Text style={[styles.eyebrow, { color: accent }]}>
                {rarityLabel(card.rarity)} · {card.faction ?? 'Sin facción'}
              </Text>
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>{card.name}</Text>
              <Text style={[styles.code, { color: colors.mutedForeground }]}>
                {card.code}{card.card_tier ? ` · T${card.card_tier}` : ''}
              </Text>
            </View>
            <Pressable
              testID="close-card-detail"
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalles de la carta"
              onPress={onClose}
              hitSlop={12}
              style={[styles.closeButton, { borderColor: colors.border, backgroundColor: colors.panel }]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.detailScroll} showsVerticalScrollIndicator={false}>
            <View style={styles.detailTop}>
              <View style={styles.detailArtColumn}>
                <CardArt card={card} colors={colors} detail />
                <View style={[styles.ownership, { borderColor: owned ? `${colors.accent}66` : colors.border, backgroundColor: owned ? `${colors.accent}14` : colors.panel }]}>
                  <Text style={[styles.ownershipLabel, { color: owned ? colors.accent : colors.mutedForeground }]}>
                    {owned ? `TIENES x${owned.quantity}` : 'No la tienes'}
                  </Text>
                  {owned && (owned.locked || owned.listed) && (
                    <Text style={[styles.ownershipMeta, { color: colors.mutedForeground }]}>
                      {owned.locked ? 'Bloqueada' : 'Disponible'}{owned.listed ? ' · En mercado' : ''}
                    </Text>
                  )}
                </View>
              </View>
              <View style={styles.statsColumn}>
                <Stat label="Poder" value={card.power ?? 0} max={Math.max(card.power ?? 0, 80)} color={colors.danger} colors={colors} />
                <Stat label="Afinidad" value={card.affinity ?? 0} max={Math.max(card.affinity ?? 0, 30)} color={colors.primary} colors={colors} />
                <Stat label="Prestigio" value={card.prestige ?? 0} max={Math.max(card.prestige ?? 0, 15)} color={colors.accent} colors={colors} />
                <Stat label="Carga" value={card.charge ?? 0} max={Math.max(card.charge ?? 0, 10)} color={colors.success} colors={colors} />
              </View>
            </View>
            <View style={[styles.infoPanel, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>IDENTIDAD</Text>
              <Text style={[styles.infoText, { color: colors.foreground }]}>
                {card.specialization ?? card.card_domain ?? 'Carta registrada en el compendio oficial de VEXFORGE.'}
              </Text>
            </View>
            {keywords.length > 0 && (
              <View style={styles.keywordSection}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>HABILIDADES</Text>
                <View style={styles.keywordWrap}>
                  {keywords.map((keyword) => (
                    <View key={keyword} style={[styles.keyword, { borderColor: `${colors.rarityEpic}66`, backgroundColor: `${colors.rarityEpic}1A` }]}>
                      <Text style={[styles.keywordText, { color: colors.rarityEpic }]}>{keyword}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
            {(card.fusion_enabled || card.marketable || card.lore) && (
              <View style={styles.detailRows}>
                <View style={[styles.detailRow, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SISTEMAS</Text>
                  <Text style={[styles.infoText, { color: colors.foreground }]}>
                    {[card.fusion_enabled ? 'Fusión' : null, card.marketable ? 'Mercado' : null].filter(Boolean).join(' · ') || 'Compendio'}
                  </Text>
                </View>
                {card.lore && (
                  <View style={styles.lore}>
                    <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LORE</Text>
                    <Text style={[styles.loreText, { color: colors.mutedForeground }]}>{card.lore}</Text>
                  </View>
                )}
              </View>
            )}
            <View style={styles.supplyRow}>
              <View>
                <Text style={[styles.supplyValue, { color: colors.foreground }]}>{(card.supply ?? 0).toLocaleString()}</Text>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPPLY</Text>
              </View>
              <View>
                <Text style={[styles.supplyValue, { color: colors.accent }]}>{(card.minted ?? 0).toLocaleString()}</Text>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MINTED</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function CollectionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { featuredCards, cardsTotal, collection, collectionLoading, syncState, syncError, refresh } = useGame();
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [faction, setFaction] = useState<(typeof FACTIONS)[number] | 'all'>('all');
  const [sort, setSort] = useState<'rarity' | 'name' | 'power'>('rarity');
  const [selected, setSelected] = useState<PublicCard | null>(null);
  const ownedById = useMemo(() => new Map(collection.map((card) => [card.card_id, card])), [collection]);
  const completion = cardsTotal > 0 ? Math.round((ownedById.size / cardsTotal) * 100) : 0;

  const filtered = useMemo(() => {
    const rarityOrder = Object.fromEntries(RARITIES.map((name, index) => [name, index]));
    const query = search.trim().toLowerCase();
    return featuredCards
      .filter((card) => {
        if (rarity !== 'all' && card.rarity !== rarity) return false;
        if (faction !== 'all' && card.faction !== faction) return false;
        return !query || card.name.toLowerCase().includes(query) || card.code.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'power') return (b.power ?? 0) - (a.power ?? 0);
        return (rarityOrder[a.rarity ?? 'Common'] ?? 0) - (rarityOrder[b.rarity ?? 'Common'] ?? 0) || a.name.localeCompare(b.name);
      });
  }, [featuredCards, faction, rarity, search, sort]);

  const renderCard = useCallback(
    ({ item }: { item: PublicCard }) => (
      <CardTile card={item} owned={ownedById.get(item.id)} onPress={() => setSelected(item)} colors={colors} />
    ),
    [colors, ownedById],
  );

  const hasFilters = Boolean(search || rarity !== 'all' || faction !== 'all');
  return (
    <ScreenShell surface="collection">
      <View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        numColumns={2}
        renderItem={renderCard}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        refreshControl={<RefreshControl refreshing={syncState === 'loading'} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104, paddingHorizontal: 16 }}
        ListHeaderComponent={
          <View>
            <View style={styles.header}>
              <View style={styles.headerTop}>
                <View style={[styles.mark, { borderColor: colors.primary }]}>
                  <Feather name="layers" size={17} color={colors.primary} />
                </View>
                <Text style={[styles.eyebrow, { color: colors.primary }]}>COMPENDIO DE VEXFORGE</Text>
              </View>
              <Text style={[styles.title, { color: colors.foreground }]}>Cartas</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {collectionLoading ? 'Sincronizando tu colección…' : `${ownedById.size}/${cardsTotal} cartas · ${completion}% completado`}
              </Text>
              <ProgressBar value={completion} color={colors.primary} />
            </View>
            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInputCompat value={search} onChangeText={setSearch} colors={colors} />
              {search ? (
                <Pressable testID="clear-search" accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}>
                  <Feather name="x-circle" size={17} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Todas" active={rarity === 'all'} onPress={() => setRarity('all')} colors={colors} />
              {RARITIES.map((value) => (
                <Chip key={value} label={rarityLabel(value)} active={rarity === value} onPress={() => setRarity(rarity === value ? 'all' : value)} colors={colors} accent={rarityColor(value, colors)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <Chip label="Todas" active={faction === 'all'} onPress={() => setFaction('all')} colors={colors} />
              {FACTIONS.map((value) => (
                <Chip key={value} label={value} active={faction === value} onPress={() => setFaction(faction === value ? 'all' : value)} colors={colors} />
              ))}
            </ScrollView>
            <View style={styles.resultsBar}>
              <Text style={[styles.results, { color: colors.mutedForeground }]}>
                {syncState === 'loading' && featuredCards.length === 0 ? 'Cargando compendio…' : `${filtered.length} resultado${filtered.length === 1 ? '' : 's'}`}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sorts}>
                {(['rarity', 'name', 'power'] as const).map((value) => (
                  <Pressable key={value} testID={`sort-${value}`} onPress={() => setSort(value)} accessibilityRole="button" accessibilityLabel={`Ordenar por ${value === 'rarity' ? 'rareza' : value === 'name' ? 'nombre' : 'poder'}`}>
                    <Text style={[styles.sortText, { color: sort === value ? colors.primary : colors.mutedForeground }]}>{value === 'rarity' ? 'Rareza' : value === 'name' ? 'Nombre' : 'Poder'}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            {syncState === 'offline' && (
              <View style={[styles.error, { borderColor: `${colors.danger}66`, backgroundColor: `${colors.danger}12` }]}>
                <Feather name="alert-circle" size={18} color={colors.danger} />
                <Text style={[styles.errorText, { color: colors.danger }]}>{syncError ?? 'No se pudo sincronizar el compendio.'}</Text>
              </View>
            )}
            {syncState === 'loading' && featuredCards.length === 0 && (
              <View style={styles.loading}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>CONECTANDO CON SUPABASE</Text>
              </View>
            )}
            {hasFilters && filtered.length === 0 && featuredCards.length > 0 && (
              <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.panel }]}>
                <Feather name="target" size={32} color={colors.primary} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin coincidencias</Text>
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Ninguna carta coincide con tus filtros actuales.</Text>
                <Pressable testID="clear-filters" onPress={() => { setSearch(''); setRarity('all'); setFaction('all'); }} style={[styles.clearButton, { borderColor: colors.primary }]}>
                  <Text style={[styles.clearButtonText, { color: colors.primary }]}>LIMPIAR FILTROS</Text>
                </Pressable>
              </View>
            )}
          </View>
        }
        ListEmptyComponent={
          !hasFilters && syncState !== 'loading' ? (
            <View style={[styles.empty, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Feather name="layers" size={34} color={colors.primary} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Compendio sin cartas</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No hay cartas activas disponibles en Supabase en este momento.</Text>
            </View>
          ) : null
        }
      />
      {selected && <CardDetail card={selected} owned={ownedById.get(selected.id)} colors={colors} onClose={() => setSelected(null)} />}
      </View>
    </ScreenShell>
  );
}

function TextInputCompat({ value, onChangeText, colors }: { value: string; onChangeText: (value: string) => void; colors: ReturnType<typeof useColors> }) {
  return <TextInput testID="cards-search" accessibilityLabel="Buscar carta por nombre o código" value={value} onChangeText={onChangeText} placeholder="Buscar nombre o código" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} autoCorrect={false} />;
}

function Chip({ label, active, onPress, colors, accent }: { label: string; active: boolean; onPress: () => void; colors: ReturnType<typeof useColors>; accent?: string }) {
  const color = accent ?? colors.primary;
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, { borderColor: active ? color : colors.border, backgroundColor: active ? `${color}1C` : colors.panel }]}>
      <Text style={[styles.chipText, { color: active ? color : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 18 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 32, fontWeight: '800', letterSpacing: -0.8, marginTop: 14 },
  subtitle: { fontSize: 13, marginTop: 5, marginBottom: 12 },
  searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
  chips: { gap: 8, paddingVertical: 12 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 11, fontWeight: '700' },
  resultsBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', minHeight: 34, gap: 10 },
  results: { fontSize: 12, fontWeight: '600' },
  sorts: { gap: 14 },
  sortText: { fontSize: 11, fontWeight: '700' },
  gridRow: { gap: 10, marginBottom: 10 },
  tile: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  art: { aspectRatio: 0.78, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  artDetail: { aspectRatio: 0.72, borderRadius: 12, borderWidth: 1 },
  artFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, gap: 10 },
  factionIcon: { width: 30, height: 30, transform: [{ rotate: '-45deg' }] },
  factionIconDetail: { width: 48, height: 48, transform: [{ rotate: '-45deg' }] },
  factionIconMeta: { width: 13, height: 13 },
  rune: { width: 58, height: 58, borderWidth: 1, borderRadius: 18, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  fallbackName: { fontSize: 10, fontWeight: '800', textAlign: 'center', textTransform: 'uppercase' },
  artShade: { ...StyleSheet.absoluteFillObject },
  artRule: { position: 'absolute', bottom: 0, left: 12, right: 12, height: 2, opacity: 0.8 },
  tileBody: { padding: 10 },
  tileName: { fontSize: 13, fontWeight: '800' },
  tileMeta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 5 },
  rarity: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  dot: { fontSize: 12 },
  tileStats: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  tileStat: { fontSize: 9, fontWeight: '700' },
  ownedBadge: { position: 'absolute', top: 8, right: 8, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4, flexDirection: 'row', gap: 3, alignItems: 'center' },
  ownedText: { fontSize: 10, fontWeight: '800' },
  founderBadge: { position: 'absolute', top: 8, left: 8, borderWidth: 1, borderRadius: 5, paddingHorizontal: 5, paddingVertical: 3 },
  founderText: { fontSize: 8, fontWeight: '800' },
  loading: { alignItems: 'center', gap: 10, paddingVertical: 40 },
  loadingText: { fontSize: 10, fontWeight: '700', letterSpacing: 1.1 },
  error: { borderWidth: 1, borderRadius: 10, padding: 12, flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 8 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 28, alignItems: 'center', marginTop: 12, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  clearButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },
  clearButtonText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
  modal: { flex: 1, justifyContent: 'flex-end' },
  detailPanel: { maxHeight: '94%', borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: 'hidden' },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.06)' },
  detailHeading: { flex: 1 },
  detailTitle: { fontSize: 23, fontWeight: '800', marginTop: 7 },
  code: { fontSize: 11, letterSpacing: 1, marginTop: 5 },
  closeButton: { width: 36, height: 36, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailScroll: { padding: 18, paddingBottom: 38 },
  detailTop: { flexDirection: 'row', gap: 14 },
  detailArtColumn: { width: '42%' },
  statsColumn: { flex: 1, justifyContent: 'center' },
  stat: { marginBottom: 13 },
  statTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  statLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8 },
  statValue: { fontSize: 14, fontWeight: '800' },
  ownership: { borderWidth: 1, borderRadius: 9, alignItems: 'center', padding: 8, marginTop: 8 },
  ownershipLabel: { fontSize: 11, fontWeight: '800' },
  ownershipMeta: { fontSize: 9, marginTop: 3 },
  infoPanel: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 18 },
  sectionLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  infoText: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  keywordSection: { marginTop: 18 },
  keywordWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 9 },
  keyword: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5 },
  keywordText: { fontSize: 10, fontWeight: '700' },
  detailRows: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 18 },
  detailRow: { paddingVertical: 13, borderBottomWidth: 1 },
  lore: { paddingTop: 13 },
  loreText: { fontSize: 12, lineHeight: 19, fontStyle: 'italic', marginTop: 7 },
  supplyRow: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', paddingTop: 18, marginTop: 18 },
  supplyValue: { fontSize: 16, fontWeight: '800', textAlign: 'center', marginBottom: 4 },
});