import { Feather } from '@/components/ForgeIcon';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
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
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ProgressBar } from '@/components/ProgressBar';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { getCanonicalFrameMetrics } from '@/components/CanonicalFrame';
import { DomainState } from '@/components/DomainState';
import { DomainHeader } from '@/components/DomainHeader';
import type { PlayerCard, PublicCard } from '@/lib/supabase';
import { FACTION_ICONS } from '@/constants/visual';
import { getCardPilotIdentity } from '@/constants/cardPilot';

const RARITIES = ['Common', 'Uncommon', 'Rare', 'Epic', 'Legendary', 'Mythic'] as const;
const FACTIONS = ['Guerrero', 'Mago', 'Paladín', 'Pícaro'] as const;
type Rarity = (typeof RARITIES)[number];
const COLLECTION_REFERENCE = require('@/assets/images/collection-reference-scene.png');

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
  compact = false,
}: {
  card: PublicCard;
  colors: ReturnType<typeof useColors>;
  detail?: boolean;
  compact?: boolean;
}) {
  const accent = rarityColor(card.rarity, colors);
  const identity = getCardPilotIdentity(card.code);
  const [artState, setArtState] = useState<'loading' | 'ready' | 'error'>(
    card.image_url ? 'loading' : 'error',
  );

  useEffect(() => {
    setArtState(card.image_url ? 'loading' : 'error');
  }, [card.image_url]);

  return (
    <View style={[styles.art, compact && styles.referenceArt, detail && styles.artDetail, { borderColor: identity?.edge ?? accent, backgroundColor: colors.panelStrong }]}>
      {card.image_url && artState !== 'error' ? (
        <Image
          source={{ uri: card.image_url }}
          style={[StyleSheet.absoluteFill, { opacity: artState === 'ready' ? 1 : 0 }]}
          resizeMode="cover"
          accessibilityLabel={`Arte oficial de ${card.name}`}
          onLoad={() => setArtState('ready')}
          onError={() => setArtState('error')}
        />
      ) : null}
      {artState === 'loading' ? (
        <View style={styles.artStatus} accessibilityLiveRegion="polite">
          <Feather name="cards" size={detail ? 30 : 22} color={colors.mutedForeground} />
          <Text style={[styles.artStatusText, { color: colors.mutedForeground }]}>Cargando arte oficial</Text>
        </View>
      ) : null}
      {artState === 'error' ? (
        <View style={styles.artStatus} accessibilityRole="image" accessibilityLabel={`Arte oficial no disponible para ${card.name}`}>
          <Feather name="warning" size={detail ? 30 : 22} color={colors.mutedForeground} />
          <Text style={[styles.artStatusText, { color: colors.mutedForeground }]}>Arte oficial no disponible</Text>
        </View>
      ) : null}
      {artState === 'ready' ? <View style={[styles.artShade, { backgroundColor: `${colors.ink}66` }]} /> : null}
      {identity && artState === 'ready' ? (
        <View pointerEvents="none" testID={`card-pilot-${card.code}`} style={[styles.pilotOverlay, { backgroundColor: identity.overlay }]}>
          <View style={[styles.pilotBadge, { backgroundColor: `${colors.ink}C7`, borderColor: identity.edge }]}>
            <Feather name={identity.icon} size={detail ? 15 : 12} color={identity.accent} />
          </View>
        </View>
      ) : null}
      <View style={[styles.artRule, { backgroundColor: accent }]} />
    </View>
  );
}

function ReferenceCardSlot({
  card,
  owned,
  colors,
  onPress,
}: {
  card?: PublicCard;
  owned?: PlayerCard;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  if (!card) {
    return (
      <View
        testID="collection-empty-slot"
        accessible
        accessibilityRole="image"
        accessibilityLabel="Ranura de carta vacía"
        style={[styles.referenceCardSlot, styles.referenceEmptySlot, { borderColor: `${colors.border}CC` }]}
      >
        <Feather name="cards" size={18} color={`${colors.mutedForeground}88`} />
      </View>
    );
  }

  const accent = rarityColor(card.rarity, colors);
  return (
    <Pressable
      testID={`reference-card-${card.code}`}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalles de ${card.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.referenceCardSlot,
        { borderColor: accent, opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <CardArt card={card} colors={colors} compact />
      {owned ? (
        <View style={[styles.referenceOwned, { backgroundColor: `${colors.ink}E8`, borderColor: accent }]}>
          <Text style={[styles.referenceOwnedText, { color: colors.foreground }]}>x{owned.quantity}</Text>
        </View>
      ) : null}
    </Pressable>
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

function CardSpotlight({
  card,
  owned,
  colors,
  onPress,
  onOpenForge,
}: {
  card: PublicCard;
  owned?: PlayerCard;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
  onOpenForge: () => void;
}) {
  const accent = rarityColor(card.rarity, colors);
  return (
    <View testID="cards-spotlight" style={[styles.spotlight, { backgroundColor: `${colors.panelStrong}EE`, borderColor: `${accent}88` }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Inspeccionar artefacto destacado ${card.name}`}
        onPress={onPress}
        style={({ pressed }) => [styles.spotlightArt, { borderColor: accent, opacity: pressed ? 0.82 : 1 }]}
      >
        <CardArt card={card} colors={colors} detail />
      </Pressable>
      <View style={styles.spotlightCopy}>
        <Text style={[styles.spotlightKicker, { color: accent }]}>ARTEFACTO DESTACADO</Text>
        <Text style={[styles.spotlightTitle, { color: colors.foreground }]} numberOfLines={2}>{card.name}</Text>
        <Text style={[styles.spotlightMeta, { color: colors.mutedForeground }]}>
          {rarityLabel(card.rarity)} · {card.faction ?? 'Sin facción'} · PWR {card.power ?? 0}
        </Text>
        <Text style={[styles.spotlightLore, { color: colors.mutedForeground }]} numberOfLines={3}>
          {card.lore ?? card.specialization ?? 'Una pieza registrada en el archivo oficial de VEXFORGE.'}
        </Text>
        <View style={styles.spotlightActions}>
          <Pressable
            testID="cards-spotlight-inspect"
            accessibilityRole="button"
            accessibilityLabel={`Inspeccionar ${card.name}`}
            onPress={onPress}
            style={[styles.spotlightInspect, { borderColor: accent }]}
          >
            <Text style={[styles.spotlightInspectText, { color: accent }]}>INSPECCIONAR</Text>
          </Pressable>
          <Pressable
            testID="cards-open-forge"
            accessibilityRole="button"
            accessibilityLabel="Abrir la Forja de mazos"
            onPress={onOpenForge}
            style={[styles.spotlightForge, { backgroundColor: colors.primary }]}
          >
            <Feather name="columns" size={13} color={colors.primaryForeground} />
            <Text style={[styles.spotlightForgeText, { color: colors.primaryForeground }]}>FORJAR</Text>
          </Pressable>
        </View>
        <Text style={[styles.spotlightOwnership, { color: owned ? colors.accent : colors.mutedForeground }]}>
          {owned ? `En tu archivo · x${owned.quantity}` : 'Aún no forma parte de tu archivo'}
        </Text>
      </View>
    </View>
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
  const router = useRouter();
  const { scope: scopeParam } = useLocalSearchParams<{ scope?: string }>();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { width, height: canvasHeight } = getCanonicalFrameMetrics(
    viewportWidth,
    Math.max(1, viewportHeight - insets.top - insets.bottom),
  );
  const { featuredCards, cardsTotal, collection, collectionLoading, syncState, syncError, refresh } = useGame();
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<Rarity | 'all'>('all');
  const [faction, setFaction] = useState<(typeof FACTIONS)[number] | 'all'>('all');
  const [sort, setSort] = useState<'recent' | 'rarity' | 'name' | 'power'>('recent');
  const [scope, setScope] = useState<'all' | 'owned'>(scopeParam === 'owned' ? 'owned' : 'all');
  const [selected, setSelected] = useState<PublicCard | null>(null);
  const [pageIndex, setPageIndex] = useState(0);
  // The reference artwork is authored for the complete Android viewport
  // (1080x2340). Safe-area insets must not shrink this frame, otherwise the
  // image and its percentage-based touch map drift apart vertically.
  const pagerRef = useRef<FlatList<PublicCard[]>>(null);
  const ownedById = useMemo(() => new Map(collection.map((card) => [card.card_id, card])), [collection]);
  const completion = cardsTotal > 0 ? Math.round((ownedById.size / cardsTotal) * 100) : 0;

  const filtered = useMemo(() => {
    const rarityOrder = Object.fromEntries(RARITIES.map((name, index) => [name, index]));
    const query = search.trim().toLowerCase();
    return featuredCards
      .filter((card) => {
        if (scope === 'owned' && !ownedById.has(card.id)) return false;
        if (rarity !== 'all' && card.rarity !== rarity) return false;
        if (faction !== 'all' && card.faction !== faction) return false;
        return !query || card.name.toLowerCase().includes(query) || card.code.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        if (sort === 'recent') {
          return (Date.parse(b.created_at ?? '') || 0) - (Date.parse(a.created_at ?? '') || 0);
        }
        if (sort === 'name') return a.name.localeCompare(b.name);
        if (sort === 'power') return (b.power ?? 0) - (a.power ?? 0);
        return (rarityOrder[a.rarity ?? 'Common'] ?? 0) - (rarityOrder[b.rarity ?? 'Common'] ?? 0) || a.name.localeCompare(b.name);
      });
  }, [featuredCards, faction, ownedById, rarity, scope, search, sort]);

  const pages = useMemo(() => {
    const result: PublicCard[][] = [];
    for (let index = 0; index < filtered.length; index += 12) {
      result.push(filtered.slice(index, index + 12));
    }
    return result.length > 0 ? result : [[]];
  }, [filtered]);

  useEffect(() => {
    setPageIndex(0);
    pagerRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [faction, rarity, scope, search, sort]);

  const changePage = (delta: number) => {
    const nextPage = Math.min(Math.max(pageIndex + delta, 0), pages.length - 1);
    if (nextPage === pageIndex) return;
    setPageIndex(nextPage);
    pagerRef.current?.scrollToIndex({ index: nextPage, animated: true });
  };

  const navigateFromReference = (destination: '/index' | '/battle' | '/deck' | '/profile' | '/collection') => {
    router.push(destination);
  };

  const renderPage = useCallback(
    ({ item, index }: { item: PublicCard[]; index: number }) => {
      const slots = Array.from({ length: 12 }, (_, slotIndex) => item[slotIndex]);
      return (
        <View style={[styles.referencePage, { width }]}>
          <View style={styles.referenceGrid}>
            {slots.map((card, slotIndex) => (
              <ReferenceCardSlot
                key={card?.id ?? `empty-${index}-${slotIndex}`}
                card={card}
                owned={card ? ownedById.get(card.id) : undefined}
                colors={colors}
                onPress={() => card && setSelected(card)}
              />
            ))}
          </View>
        </View>
      );
    },
    [colors, ownedById, width],
  );

  const hasFilters = Boolean(search || rarity !== 'all' || faction !== 'all' || scope !== 'all');
  return (
    <ScreenShell sceneMode="hero">
      <View style={[styles.referenceRoot, { marginBottom: -insets.bottom }]}>
        <View style={[styles.referenceCanvas, { width, height: canvasHeight, marginTop: insets.top, alignSelf: 'center' }]}>
        <Image
          source={COLLECTION_REFERENCE}
          style={StyleSheet.absoluteFillObject}
          resizeMode="contain"
          accessibilityLabel="Composición oficial de la colección VEXFORGE"
        />
        <View pointerEvents="none" style={[styles.referenceShade, { backgroundColor: `${colors.ink}20` }]} />

        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <View style={[styles.referenceCounter, { top: canvasHeight * 0.185, right: width * 0.115 }]}>
            <Text style={[styles.referenceCounterValue, { color: colors.foreground }]}>{ownedById.size} / {cardsTotal || filtered.length}</Text>
            <Text style={[styles.referenceCounterLabel, { color: colors.mutedForeground }]}>CARTAS TOTALES</Text>
          </View>

          <Pressable
            testID="collection-refresh"
            accessibilityRole="button"
            accessibilityLabel="Actualizar colección"
            onPress={refresh}
            style={[styles.referenceRefreshHotspot, { top: canvasHeight * 0.185, right: width * 0.04 }]}
          />

          <Pressable
            testID="collection-tab"
            accessibilityRole="button"
            accessibilityLabel="Colección"
            onPress={() => { setScope('all'); setPageIndex(0); }}
            style={[styles.referenceTopHotspot, { left: width * 0.05, top: canvasHeight * 0.108, width: width * 0.26 }]}
          />
          <Pressable
            testID="owned-tab"
            accessibilityRole="button"
            accessibilityLabel="Tus cartas"
            onPress={() => { setScope('owned'); setPageIndex(0); }}
            style={[styles.referenceTopHotspot, { left: width * 0.31, top: canvasHeight * 0.108, width: width * 0.21 }]}
          />
          <Pressable
            testID="fusion-tab"
            accessibilityRole="button"
            accessibilityLabel="Abrir fusión y forja"
            onPress={() => router.push('/store?mode=fusion')}
            style={[styles.referenceTopHotspot, { left: width * 0.53, top: canvasHeight * 0.108, width: width * 0.19 }]}
          />
          <Pressable
            testID="achievements-tab"
            accessibilityRole="button"
            accessibilityLabel="Abrir logros"
            onPress={() => router.push('/profile?section=achievements')}
            style={[styles.referenceTopHotspot, { right: width * 0.05, top: canvasHeight * 0.108, width: width * 0.18 }]}
          />

          <View style={[styles.referenceSearch, { left: width * 0.075, top: canvasHeight * 0.332, width: width * 0.56 }]}>
            <Feather name="search" size={Math.max(14, width * 0.04)} color={colors.mutedForeground} />
            <TextInputCompat value={search} onChangeText={setSearch} colors={colors} />
            {search ? (
              <Pressable testID="clear-search" accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </View>

          <Pressable
            testID="sort-toggle"
            accessibilityRole="button"
            accessibilityLabel={`Cambiar orden de las cartas. Orden actual: ${sort === 'recent' ? 'recientes' : sort === 'name' ? 'nombre' : sort === 'power' ? 'poder' : 'rareza'}`}
            onPress={() => setSort(sort === 'recent' ? 'name' : sort === 'name' ? 'power' : sort === 'power' ? 'rarity' : 'recent')}
             style={[styles.referenceSortHotspot, { right: width * 0.075, top: canvasHeight * 0.332, width: width * 0.24 }]}
          />

           <View style={[styles.referenceFilterRow, { top: canvasHeight * 0.278, left: width * 0.05, right: width * 0.05 }]}>
            <Pressable
              testID="faction-all"
              accessibilityRole="button"
              accessibilityLabel="Todas las facciones"
              onPress={() => setFaction('all')}
              style={styles.referenceFilterHit}
            />
            {FACTIONS.map((value, index) => (
              <Pressable
                key={value}
                testID={`faction-${value}`}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por ${value}`}
                onPress={() => setFaction(faction === value ? 'all' : value)}
                style={[styles.referenceFilterHit, { left: `${20 * (index + 1)}%` }]}
              />
            ))}
          </View>

          <View style={[styles.referenceRarityRow, { top: canvasHeight * 0.372, left: width * 0.045, right: width * 0.045 }]}>
            <Pressable
              testID="rarity-all"
              accessibilityRole="button"
              accessibilityLabel="Todas las rarezas"
              onPress={() => setRarity('all')}
              style={styles.referenceRarityHit}
            />
            {RARITIES.map((value, index) => (
              <Pressable
                key={value}
                testID={`rarity-${value}`}
                accessibilityRole="button"
                accessibilityLabel={`Filtrar por rareza ${rarityLabel(value)}`}
                onPress={() => setRarity(rarity === value ? 'all' : value)}
                style={[styles.referenceRarityHit, { left: `${14.25 * (index + 1)}%` }]}
              />
            ))}
          </View>

          <FlatList
            ref={pagerRef}
            data={pages}
            keyExtractor={(_, index) => `collection-page-${index}`}
            horizontal
            pagingEnabled
            bounces={false}
            showsHorizontalScrollIndicator={false}
            scrollEnabled={pages.length > 1}
            renderItem={renderPage}
             style={[styles.referencePager, { top: canvasHeight * 0.425, height: canvasHeight * 0.39 }]}
            onMomentumScrollEnd={(event) => setPageIndex(Math.round(event.nativeEvent.contentOffset.x / Math.max(width, 1)))}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          />

          {filtered.length === 0 ? (
            <View style={[styles.referenceEmptyMessage, { top: canvasHeight * 0.54, left: width * 0.16, right: width * 0.16, backgroundColor: `${colors.ink}D9`, borderColor: `${colors.accent}99` }]}>
              <Feather name="cards" size={20} color={colors.accent} />
              <Text style={[styles.referenceEmptyTitle, { color: colors.foreground }]}>
                {hasFilters ? 'SIN COINCIDENCIAS' : 'EL COMPENDIO ESTÁ EN SILENCIO'}
              </Text>
              <Text style={[styles.referenceEmptyText, { color: colors.mutedForeground }]}>
                {hasFilters ? 'Prueba con otra búsqueda o filtro.' : 'No hay cartas activas disponibles.'}
              </Text>
            </View>
          ) : null}

          {syncState === 'offline' ? (
            <Pressable
              testID="collection-sync-error"
              accessibilityRole="button"
              accessibilityLabel="Reintentar sincronización de colección"
              onPress={refresh}
              style={[styles.referenceSyncError, { backgroundColor: `${colors.ink}E8`, borderColor: `${colors.danger}AA` }]}
            >
              <Feather name="warning" size={16} color={colors.danger} />
              <Text style={[styles.referenceSyncText, { color: colors.foreground }]}>SIN SEÑAL · TOCA PARA REINTENTAR</Text>
            </Pressable>
          ) : null}

          <View style={[styles.referencePagination, { bottom: canvasHeight * 0.106, left: width * 0.28, right: width * 0.28 }]}>
            <Pressable
              testID="collection-page-previous"
              accessibilityRole="button"
              accessibilityLabel="Página anterior de cartas"
              disabled={pageIndex === 0}
              onPress={() => changePage(-1)}
              style={styles.referencePageButton}
            >
              <Feather name="chevron-left" size={18} color={pageIndex === 0 ? `${colors.mutedForeground}66` : colors.accent} />
            </Pressable>
            <Text testID="collection-page-indicator" style={[styles.referencePageText, { color: colors.foreground }]}>
              {pageIndex + 1} / {pages.length}
            </Text>
            <Pressable
              testID="collection-page-next"
              accessibilityRole="button"
              accessibilityLabel="Página siguiente de cartas"
              disabled={pageIndex === pages.length - 1}
              onPress={() => changePage(1)}
              style={styles.referencePageButton}
            >
              <Feather name="chevron-right" size={18} color={pageIndex === pages.length - 1 ? `${colors.mutedForeground}66` : colors.accent} />
            </Pressable>
          </View>

          <View style={styles.referenceBottomNavigation}>
            <Pressable testID="reference-home" accessibilityRole="button" accessibilityLabel="Inicio" onPress={() => navigateFromReference('/index')} style={styles.referenceBottomHit} />
            <Pressable testID="reference-battle" accessibilityRole="button" accessibilityLabel="Batalla" onPress={() => navigateFromReference('/battle')} style={styles.referenceBottomHit} />
            <Pressable testID="reference-cards" accessibilityRole="button" accessibilityLabel="Cartas" onPress={() => navigateFromReference('/collection')} style={styles.referenceBottomHit} />
            <Pressable testID="reference-deck" accessibilityRole="button" accessibilityLabel="Mazo" onPress={() => navigateFromReference('/deck')} style={styles.referenceBottomHit} />
            <Pressable testID="reference-profile" accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => navigateFromReference('/profile')} style={styles.referenceBottomHit} />
          </View>
        </View>

        </View>
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
    <Pressable accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ selected: active }} onPress={onPress} style={[styles.chip, { borderColor: active ? color : colors.border, backgroundColor: active ? `${color}1C` : colors.panel }]}>
      <Text style={[styles.chipText, { color: active ? color : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  referenceRoot: { flex: 1, width: '100%', overflow: 'hidden' },
  referenceCanvas: { position: 'relative', overflow: 'hidden' },
  referenceShade: { ...StyleSheet.absoluteFillObject },
  referenceCounter: { position: 'absolute', alignItems: 'flex-end', zIndex: 4 },
  referenceCounterValue: { fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  referenceCounterLabel: { fontSize: 6, fontWeight: '800', letterSpacing: 0.7, marginTop: 2 },
  referenceRefreshHotspot: { position: 'absolute', width: 38, height: 38, zIndex: 8 },
  referenceTopHotspot: { position: 'absolute', height: 48, zIndex: 8 },
  referenceSearch: { position: 'absolute', height: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 18, backgroundColor: 'rgba(3,10,22,0.25)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, gap: 7, zIndex: 8 },
  referenceSortHotspot: { position: 'absolute', height: 38, borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)', borderRadius: 18, backgroundColor: 'rgba(3,10,22,0.25)', justifyContent: 'center', alignItems: 'center', zIndex: 8 },
  referenceSortText: { fontSize: 9, fontWeight: '700' },
  referenceFilterRow: { position: 'absolute', height: 40, flexDirection: 'row', zIndex: 8 },
  referenceFilterHit: { position: 'absolute', top: 0, width: '20%', height: 40 },
  referenceRarityRow: { position: 'absolute', height: 38, flexDirection: 'row', zIndex: 8 },
  referenceRarityHit: { position: 'absolute', top: 0, width: '14.25%', height: 38 },
  referencePager: { position: 'absolute', left: 0, right: 0, zIndex: 3 },
  referencePage: { flex: 1, justifyContent: 'center' },
  referenceGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', alignContent: 'center', columnGap: 8, rowGap: 10, paddingHorizontal: '8%' },
  referenceCardSlot: { width: '18%', aspectRatio: 0.68, borderWidth: 1, borderRadius: 8, overflow: 'hidden', position: 'relative', backgroundColor: 'rgba(3,10,22,0.64)' },
  referenceArt: { width: '100%', height: '100%', flex: 1, aspectRatio: 0.68, borderBottomWidth: 0, borderRadius: 7 },
  referenceEmptySlot: { alignItems: 'center', justifyContent: 'center' },
  referenceOwned: { position: 'absolute', right: 3, top: 3, minWidth: 19, height: 17, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },
  referenceOwnedText: { fontSize: 8, fontWeight: '900' },
  referenceEmptyMessage: { position: 'absolute', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, zIndex: 9 },
  referenceEmptyTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 0.8, marginTop: 6 },
  referenceEmptyText: { fontSize: 10, textAlign: 'center', marginTop: 4 },
  referenceSyncError: { position: 'absolute', top: '46%', left: '10%', right: '10%', minHeight: 38, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 10 },
  referenceSyncText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  referencePagination: { position: 'absolute', height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 },
  referencePageButton: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  referencePageText: { fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  referenceBottomNavigation: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '11%', flexDirection: 'row', zIndex: 11 },
  referenceBottomHit: { flex: 1 },
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
  spotlight: { flexDirection: 'row', gap: 14, borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 4, overflow: 'hidden' },
  spotlightArt: { width: '36%', borderWidth: 1, borderRadius: 14, overflow: 'hidden', alignSelf: 'flex-start' },
  spotlightCopy: { flex: 1, minWidth: 0, justifyContent: 'center' },
  spotlightKicker: { fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  spotlightTitle: { fontSize: 20, lineHeight: 24, fontWeight: '900', marginTop: 5 },
  spotlightMeta: { fontSize: 10, lineHeight: 15, marginTop: 5 },
  spotlightLore: { fontSize: 11, lineHeight: 16, marginTop: 8 },
  spotlightActions: { flexDirection: 'row', gap: 7, marginTop: 11 },
  spotlightInspect: { minHeight: 34, borderWidth: 1, borderRadius: 9, paddingHorizontal: 9, alignItems: 'center', justifyContent: 'center' },
  spotlightInspectText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  spotlightForge: { minHeight: 34, borderRadius: 9, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  spotlightForgeText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  spotlightOwnership: { fontSize: 9, fontWeight: '800', marginTop: 8 },
  gridRow: { gap: 10, marginBottom: 10 },
  tile: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  art: { aspectRatio: 0.78, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  artDetail: { aspectRatio: 0.72, borderRadius: 12, borderWidth: 1 },
  factionIconMeta: { width: 13, height: 13 },
  artStatus: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 16, gap: 8 },
  artStatusText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center', textTransform: 'uppercase' },
  artShade: { ...StyleSheet.absoluteFillObject },
  pilotOverlay: { ...StyleSheet.absoluteFillObject },
  pilotBadge: { position: 'absolute', top: 8, right: 8, width: 26, height: 26, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
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