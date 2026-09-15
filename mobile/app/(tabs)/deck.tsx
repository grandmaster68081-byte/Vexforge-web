import { Feather } from '@/components/ForgeIcon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import {
  loadPlayerDeck,
  saveDeck,
  validateDeck,
  type DeckSlot,
  type DeckValidation,
  type PlayerCard,
} from '@/lib/supabase';
import { ScreenShell } from '@/components/ScreenShell';
import { useMeasuredCanonicalFrame } from '@/components/CanonicalFrame';
import { DomainHeader } from '@/components/DomainHeader';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';

const MAX_DECKS = 10;
const MAX_DECK = 30;
const MIN_DECK = 5;
const MAX_MYTHIC = 1;
const MAX_LEGENDARY = 3;
const FACTIONS = ['Guerrero', 'Mago', 'Paladín', 'Pícaro'] as const;
type Faction = (typeof FACTIONS)[number];

function rarityColor(rarity: string, colors: ReturnType<typeof useColors>) {
  return {
    Common: colors.rarityCommon,
    Uncommon: colors.rarityUncommon,
    Rare: colors.rarityRare,
    Epic: colors.rarityEpic,
    Legendary: colors.rarityLegendary,
    Mythic: colors.rarityMythic,
  }[rarity] ?? colors.mutedForeground;
}

function factionColor(faction: string, colors: ReturnType<typeof useColors>) {
  return {
    Guerrero: colors.danger,
    Mago: colors.rarityRare,
    Paladín: colors.accent,
    Pícaro: colors.rarityEpic,
  }[faction] ?? colors.mutedForeground;
}

function maxCopiesFor(card: PlayerCard) {
  return card.rarity === 'Legendary' || card.rarity === 'Mythic' ? 1 : 2;
}

type DeckSummary = {
  cardCount: number;
  power: number;
  factions: string[];
  factionLabel: string;
  primaryFaction: string | null;
  championName: string | null;
};

function summarizeDeck(slots: DeckSlot[]): DeckSummary {
  const factions = [...new Set(
    slots
      .map((slot) => slot.faction.trim())
      .filter((faction) => faction.length > 0),
  )];
  const champion = slots.find((slot) => slot.is_champion);
  return {
    cardCount: slots.length,
    power: slots.reduce((total, slot) => total + slot.power, 0),
    factions,
    factionLabel: factions.length > 0 ? factions.join(' · ') : 'FACCIONES NO REPORTADAS',
    primaryFaction: factions[0] ?? null,
    championName: champion?.name || null,
  };
}

function DetailModal({
  slot,
  summary,
  colors,
  onClose,
}: {
  slot: DeckSlot | null;
  summary: DeckSummary;
  colors: ReturnType<typeof useColors>;
  onClose: () => void;
}) {
  if (!slot) return null;
  return (
    <Modal transparent animationType="slide" visible onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.detailPanel, { backgroundColor: colors.panelStrong, borderColor: `${colors.accent}77` }]}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailEyebrow, { color: colors.accent }]}>DETALLE DEL MAZO</Text>
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>MAZO ACTIVO</Text>
            </View>
            <Pressable
              testID="close-deck-detail"
              accessibilityRole="button"
              accessibilityLabel="Cerrar detalle del mazo"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
              ]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.detailBody}>
            {slot.image_url ? <Image source={{ uri: slot.image_url }} style={[styles.detailArt, { borderColor: factionColor(slot.faction, colors) }]} resizeMode="cover" /> : <View style={[styles.detailArtFallback, { borderColor: factionColor(slot.faction, colors) }]}><Text style={[styles.detailMissingArtText, { color: factionColor(slot.faction, colors) }]}>ARTE CANÓNICO PENDIENTE</Text></View>}
            <Text style={[styles.detailFaction, { color: factionColor(summary.primaryFaction ?? '', colors) }]}>{summary.factionLabel}</Text>
            <Text style={[styles.detailCopy, { color: colors.mutedForeground }]}>{summary.cardCount} cartas sincronizadas desde tu formación oficial. {summary.championName ? `Campeón: ${summary.championName}.` : 'Campeón no reportado.'}</Text>
            <View style={styles.detailStats}>
              <Text style={[styles.detailStat, { color: colors.foreground }]}>{summary.power} <Text style={{ color: colors.mutedForeground }}>PODER</Text></Text>
              <Text style={[styles.detailStat, { color: colors.foreground }]}>{summary.championName ? `CAMPEÓN · ${summary.championName}` : 'CAMPEÓN NO REPORTADO'}</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EditorModal({
  visible,
  colors,
  collection,
  selectedIds,
  deckReady,
  saving,
  validation,
  message,
  onToggle,
  onValidate,
  onSave,
  onArena,
  onClose,
}: {
  visible: boolean;
  colors: ReturnType<typeof useColors>;
  collection: PlayerCard[];
  selectedIds: string[];
  deckReady: boolean;
  saving: boolean;
  validation: DeckValidation | null;
  message: string | null;
  onToggle: (card: PlayerCard) => void;
  onValidate: () => void;
  onSave: () => void;
  onArena: () => void;
  onClose: () => void;
}) {
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.editorPanel, { backgroundColor: colors.panelStrong, borderColor: `${colors.accent}77` }]}>
          <View style={styles.detailHeader}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.detailEyebrow, { color: colors.accent }]}>FORJA DE MAZO</Text>
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>Edita tu formación</Text>
              <Text style={[styles.editorSummary, { color: colors.mutedForeground }]}>{selectedIds.length}/{MAX_DECK} cartas · toca una carta para añadirla o quitarla</Text>
            </View>
            <Pressable
              testID="close-deck-editor"
              accessibilityRole="button"
              accessibilityLabel="Cerrar editor del mazo"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { borderColor: colors.border, opacity: pressed ? 0.72 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
              ]}
            >
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.editorList}>
            {collection.length === 0 ? (
              <Text style={[styles.editorEmpty, { color: colors.mutedForeground }]}>Tu colección todavía no tiene cartas disponibles.</Text>
            ) : collection.map((card) => {
              const count = selectedIds.filter((id) => id === card.card_id).length;
              const accent = rarityColor(card.rarity ?? 'Common', colors);
              return (
                <Pressable
                  key={card.card_id}
                  testID={`editor-card-${card.code}`}
                  accessibilityRole="button"
                  accessibilityLabel={`${count ? 'Quitar' : 'Añadir'} ${card.name}`}
                  accessibilityState={{ selected: count > 0 }}
                  onPress={() => onToggle(card)}
                  style={({ pressed }) => [
                    styles.editorCard,
                    {
                      borderColor: count ? accent : colors.border,
                      backgroundColor: count ? `${accent}18` : colors.panel,
                      opacity: pressed ? 0.76 : 1,
                      transform: [{ translateY: pressed ? 2 : 0 }],
                    },
                  ]}
                >
                  {card.image_url ? <Image source={{ uri: card.image_url }} style={styles.editorArt} resizeMode="cover" /> : <View style={[styles.editorArtFallback, { backgroundColor: `${accent}18`, borderColor: `${accent}88` }]}><Text style={[styles.missingArtText, { color: accent }]}>ARTE CANÓNICO PENDIENTE</Text></View>}
                  <View style={styles.editorCardCopy}>
                    <Text style={[styles.editorCardName, { color: colors.foreground }]} numberOfLines={1}>{card.name}</Text>
                    <Text style={[styles.editorCardMeta, { color: accent }]}>{card.rarity || '—'} · {card.faction?.trim() || '—'} · disponibles ×{card.quantity}</Text>
                  </View>
                  <Text style={[styles.editorCount, { color: count ? accent : colors.mutedForeground }]}>{count ? `×${count}` : '+'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {validation ? <View style={[styles.editorNotice, { borderColor: validation.valid ? colors.success : colors.danger }]}><Feather name={validation.valid ? 'check-circle' : 'alert-circle'} size={15} color={validation.valid ? colors.success : colors.danger} /><Text style={[styles.editorNoticeText, { color: colors.foreground }]}>{validation.valid ? 'MAZO VÁLIDO' : validation.errors.join(' ')}</Text></View> : null}
          {message ? <Text style={[styles.editorMessage, { color: message.startsWith('Mazo guardado') ? colors.success : colors.mutedForeground }]}>{message}</Text> : null}
          <View style={styles.editorActions}>
            <Pressable
              testID="validate-deck"
              accessibilityRole="button"
              accessibilityLabel="Validar mazo contra las reglas oficiales"
              onPress={onValidate}
              style={({ pressed }) => [
                styles.editorSecondary,
                { borderColor: colors.accent, opacity: pressed ? 0.78 : 1, transform: [{ translateY: pressed ? 2 : 0 }] },
              ]}
            >
              <Feather name="check-circle" size={15} color={colors.accent} />
              <Text style={[styles.editorActionText, { color: colors.accent }]}>VALIDAR</Text>
            </Pressable>
            <Pressable
              testID="save-deck"
              accessibilityRole="button"
              accessibilityLabel="Guardar mazo"
              disabled={saving}
              onPress={onSave}
              style={({ pressed }) => [
                styles.editorPrimary,
                {
                  backgroundColor: deckReady ? colors.primary : colors.muted,
                  opacity: saving ? 0.7 : pressed ? 0.82 : 1,
                  transform: [{ translateY: pressed && !saving ? 2 : 0 }],
                },
              ]}
            >
              {saving ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Feather name="save" size={15} color={deckReady ? colors.primaryForeground : colors.mutedForeground} />}
              <Text style={[styles.editorActionText, { color: deckReady ? colors.primaryForeground : colors.mutedForeground }]}>{saving ? 'GUARDANDO' : 'GUARDAR'}</Text>
            </Pressable>
          </View>
          <Pressable
            testID="open-arena-from-forge"
            accessibilityRole="button"
            accessibilityLabel="Guardar el mazo y entrar en la Arena"
            disabled={saving}
            onPress={onArena}
            style={({ pressed }) => [
              styles.editorArena,
              {
                borderColor: deckReady ? `${colors.accent}AA` : colors.border,
                opacity: saving ? 0.7 : pressed ? 0.82 : 1,
                transform: [{ translateY: pressed && !saving ? 2 : 0 }],
              },
            ]}
          >
            <Feather name="zap" size={15} color={deckReady ? colors.accent : colors.mutedForeground} />
            <Text style={[styles.editorActionText, { color: deckReady ? colors.accent : colors.mutedForeground }]}>GUARDAR Y PROBAR EN ARENA</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function DeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const scenePulse = useSharedValue(0);
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const {
    width: frameWidth,
    height: canvasHeight,
    onLayout: onReferenceRootLayout,
  } = useMeasuredCanonicalFrame(
    viewportWidth,
    viewportHeight,
    insets.top,
    insets.bottom,
  );
  const width = frameWidth;
  const router = useRouter();
  const { session, player, collection, collectionLoading, syncState, syncError, refresh } = useGame();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedSlots, setSavedSlots] = useState<DeckSlot[]>([]);
  const [deckLoading, setDeckLoading] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<DeckValidation | null>(null);
  const [search, setSearch] = useState('');
  const [faction, setFaction] = useState<Faction | 'all'>('all');
  const [detail, setDetail] = useState<DeckSlot | null>(null);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(scenePulse);
      scenePulse.value = 0;
      return;
    }
    scenePulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 2600 }),
        withTiming(0, { duration: 2600 }),
      ),
      -1,
      false,
    );
    return () => cancelAnimation(scenePulse);
  }, [reduceMotion, scenePulse]);

  const sceneArtStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -scenePulse.value * 3 },
      { scale: 1 + scenePulse.value * 0.004 },
    ],
  }));
  const coreGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.22 + scenePulse.value * 0.2,
    transform: [{ scale: 0.92 + scenePulse.value * 0.12 }],
  }));
  const lightSweepStyle = useAnimatedStyle(() => ({
    opacity: 0.18 + (1 - scenePulse.value) * 0.16,
    transform: [{ translateY: scenePulse.value * 10 }],
  }));

  const loadDeck = useCallback(async () => {
    if (!session || !player) {
      setDeckLoading(false);
      return;
    }
    setDeckLoading(true);
    setDeckError(null);
    try {
      const slots = await loadPlayerDeck(session, player.id);
      setSavedSlots(slots);
      setSelectedIds(slots.map((slot) => slot.card_id));
    } catch (error) {
      setDeckError(error instanceof Error ? error.message : 'No se pudo cargar tu mazo.');
    } finally {
      setDeckLoading(false);
    }
  }, [player, session]);

  useEffect(() => { void loadDeck(); }, [loadDeck]);

  const selectedCards = useMemo(() => selectedIds.map((id) => collection.find((card) => card.card_id === id)).filter((card): card is PlayerCard => Boolean(card)), [collection, selectedIds]);
  const factionCounts = useMemo(() => selectedCards.reduce<Record<string, number>>((result, card) => {
    const name = card.faction?.trim();
    if (name) result[name] = (result[name] ?? 0) + 1;
    return result;
  }, {}), [selectedCards]);
  const factionsInDraft = Object.keys(factionCounts);
  const mythicCount = selectedCards.filter((card) => card.rarity === 'Mythic').length;
  const legendaryCount = selectedCards.filter((card) => card.rarity === 'Legendary').length;
  const deckReady = selectedIds.length >= MIN_DECK && selectedIds.length <= MAX_DECK && factionsInDraft.length <= 2 && mythicCount <= MAX_MYTHIC && legendaryCount <= MAX_LEGENDARY;
  const savedSummary = useMemo(() => summarizeDeck(savedSlots), [savedSlots]);
  const hasSavedDeck = savedSlots.length > 0;
  const visibleSavedDeck = useMemo(() => {
    if (!hasSavedDeck) return false;
    const query = search.trim().toLowerCase();
    if (faction !== 'all' && !savedSummary.factions.includes(faction)) return false;
    const officialText = [
      savedSummary.factionLabel,
      savedSummary.championName ?? '',
      ...savedSlots.flatMap((slot) => [slot.name, slot.code]),
    ].join(' ').toLowerCase();
    return !query || officialText.includes(query);
  }, [faction, hasSavedDeck, savedSlots, savedSummary, search]);
  const showSavedDeck = hasSavedDeck && visibleSavedDeck;
  const sceneSlots = showSavedDeck ? savedSlots : [];
  const reserveSlots = showSavedDeck ? savedSlots.slice(7, 14) : [];
  const toggleCard = (card: PlayerCard) => {
    setMessage(null);
    setValidation(null);
    setSelectedIds((current) => {
      const count = current.filter((id) => id === card.card_id).length;
      if (count >= maxCopiesFor(card)) return current.filter((id) => id !== card.card_id);
      if (current.length >= MAX_DECK || count >= card.quantity) return current;
      if (card.rarity === 'Mythic' && mythicCount >= MAX_MYTHIC) return current;
      if (card.rarity === 'Legendary' && legendaryCount >= MAX_LEGENDARY) return current;
      return [...current, card.card_id];
    });
  };

  const handleCreate = () => {
    setSelectedIds([]);
    setValidation(null);
    setMessage('Nuevo borrador listo para forjar.');
    setEditing(true);
  };

  const handleValidate = async () => {
    if (!session) return;
    try {
      setValidation(await validateDeck(selectedIds, session));
    } catch (error) {
      setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'No se pudo validar el mazo.'], card_count: selectedIds.length, mythic_count: mythicCount, legendary_count: legendaryCount });
    }
  };

  const handleSave = async (): Promise<boolean> => {
    if (!session) return false;
    if (!deckReady) {
      setMessage(selectedIds.length < MIN_DECK ? `El mazo necesita al menos ${MIN_DECK} cartas.` : 'Corrige los límites de facción y rareza antes de guardar.');
      return false;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveDeck(selectedIds, session);
      if (!result.ok) {
        setMessage(result.reason ?? 'El servidor rechazó el guardado del mazo.');
        return false;
      }
      setMessage(`Mazo guardado · ${result.slots_saved ?? selectedIds.length} cartas`);
      await loadDeck();
      setEditing(false);
      return true;
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el mazo.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenArena = async () => {
    if (await handleSave()) router.push('/battle');
  };

  const onRefresh = async () => { await Promise.all([refresh(), loadDeck()]); };
  const navigate = (destination: '/' | '/battle' | '/collection' | '/deck' | '/profile') => {
    if (destination === '/') {
      router.replace('/');
      return;
    }
    router.push(destination);
  };
  const selectedPreview = savedSlots[0] ?? null;
  const domainStatus = collectionLoading || deckLoading
    ? 'SINCRONIZANDO MAZOS'
    : deckError || syncState === 'offline'
      ? 'SIN SEÑAL · TOCA PARA REINTENTAR'
      : hasSavedDeck
        ? `${savedSummary.cardCount} CARTAS · ${savedSummary.factionLabel}`
        : 'Construye una estrategia real con las cartas sincronizadas desde tu colección.';

  return (
    <ScreenShell surface="forge" sceneMode="hero">
      <View
        onLayout={onReferenceRootLayout}
        style={[styles.referenceRoot, { marginBottom: -insets.bottom, backgroundColor: colors.ink }]}
      >
        <View style={[styles.referenceScene, { width: frameWidth, height: canvasHeight, marginTop: insets.top, alignSelf: 'center', backgroundColor: colors.background }]}>
          <Animated.Image
            testID="deck-scene-art"
            source={CANONICAL_BACKGROUNDS.forge}
            resizeMode="cover"
            style={[StyleSheet.absoluteFillObject, styles.sceneArt, sceneArtStyle]}
            accessibilityLabel="Escena oficial de la Forja de Mazos"
          />
          <LinearGradient
            pointerEvents="none"
            colors={[`${colors.ink}2C`, `${colors.background}08`, `${colors.ink}66`]}
            locations={[0, 0.48, 1]}
            style={StyleSheet.absoluteFillObject}
          />
          <Animated.View pointerEvents="none" style={[styles.forgeCoreGlow, { backgroundColor: colors.accent }, coreGlowStyle]} />
          <Animated.View pointerEvents="none" style={[styles.lightSweep, { backgroundColor: colors.rarityEpic }, lightSweepStyle]} />
          <View testID="deck-programmatic-surface" style={styles.sceneUi}>
            <DomainHeader
              domain="forja"
              status={domainStatus}
              style={styles.sceneHeader}
              trailing={(
                <Pressable
                  testID="deck-refresh-visible"
                  accessibilityRole="button"
                  accessibilityLabel="Actualizar mazos"
                  onPress={onRefresh}
                  style={({ pressed }) => [styles.sceneRefresh, { borderColor: `${colors.accent}AA`, opacity: pressed ? 0.72 : 1 }]}
                >
                  <Feather name="refresh-cw" size={16} color={colors.accent} />
                </Pressable>
              )}
            />
            <View pointerEvents="none" style={styles.portalReadout}>
              <Text style={[styles.portalEyebrow, { color: colors.accent }]}>PORTAL DE FORJA · FORGEFORMATION V6</Text>
              <Text style={[styles.portalTitle, { color: colors.foreground }]} numberOfLines={1}>
                {showSavedDeck ? savedSummary.championName ?? 'FORMACIÓN ACTIVA' : hasSavedDeck ? 'SIN COINCIDENCIAS' : 'NÚCLEO EN ESPERA'}
              </Text>
              <Text style={[styles.portalCopy, { color: colors.mutedForeground }]}>
                {showSavedDeck ? `${savedSummary.cardCount} cartas · ${savedSummary.factionLabel}` : hasSavedDeck ? 'Ajusta la búsqueda o el filtro de facción.' : 'Elige cartas reales para encender tu formación.'}
              </Text>
            </View>
            {hasSavedDeck ? (
              <View pointerEvents="none" style={styles.sceneCounter}>
                <Text style={[styles.sceneCounterValue, { color: colors.foreground }]}>1 / {MAX_DECKS}</Text>
                <Text style={[styles.sceneCounterLabel, { color: colors.mutedForeground }]}>MAZOS</Text>
              </View>
            ) : null}

            <View style={[styles.formationRail, { top: canvasHeight * 0.405, left: frameWidth * 0.075, right: frameWidth * 0.075 }]}>
              {Array.from({ length: 7 }).map((_, index) => {
                const slot = sceneSlots[index];
                const accent = slot ? factionColor(slot.faction, colors) : `${colors.foreground}66`;
                return (
                  <Pressable
                    key={`formation-slot-${index}`}
                    testID={`formation-slot-${index + 1}`}
                    accessibilityRole="button"
                    accessibilityLabel={slot ? `Ver ${slot.name}` : `Forjar slot ${index + 1}`}
                    onPress={() => slot ? setDetail(slot) : handleCreate()}
                    style={({ pressed }) => [styles.formationSlot, { borderColor: slot?.is_champion ? colors.accent : accent, opacity: pressed ? 0.72 : 1 }]}
                  >
                    {slot?.image_url ? (
                      <Image source={{ uri: slot.image_url }} style={styles.formationArt} resizeMode="cover" />
                    ) : (
                      <View style={[styles.formationFallback, { backgroundColor: `${colors.ink}B8` }]}>
                        <Feather name={slot ? 'shield' : 'plus'} size={12} color={accent} />
                        <Text style={[styles.formationSlotLabel, { color: accent }]}>{slot ? slot.code : `S${index + 1}`}</Text>
                      </View>
                    )}
                    {slot ? <Text style={[styles.formationSlotName, { color: colors.foreground }]} numberOfLines={1}>{slot.name}</Text> : null}
                  </Pressable>
                );
              })}
            </View>

            <View style={[styles.reserveRail, { top: canvasHeight * 0.605, left: frameWidth * 0.075, right: frameWidth * 0.075 }]}>
              {Array.from({ length: 7 }).map((_, index) => {
                const slot = reserveSlots[index];
                const accent = slot ? factionColor(slot.faction, colors) : `${colors.foreground}4D`;
                return (
                  <Pressable
                    key={`reserve-slot-${index}`}
                    testID={`reserve-slot-${index + 1}`}
                    accessibilityRole="button"
                    accessibilityLabel={slot ? `Ver reserva ${slot.name}` : `Forjar reserva ${index + 1}`}
                    onPress={() => slot ? setDetail(slot) : handleCreate()}
                    style={({ pressed }) => [styles.reserveSlot, { borderColor: slot?.is_champion ? colors.accent : accent, opacity: pressed ? 0.72 : 1 }]}
                  >
                    {slot?.image_url ? <Image source={{ uri: slot.image_url }} style={styles.reserveArt} resizeMode="cover" /> : <View style={[styles.reserveFallback, { backgroundColor: `${colors.ink}B8` }]}><Feather name={slot ? 'shield' : 'plus'} size={10} color={accent} /><Text style={[styles.reserveLabel, { color: accent }]}>{slot ? slot.code : `R${index + 1}`}</Text></View>}
                    {slot ? <Text style={[styles.reserveName, { color: colors.foreground }]} numberOfLines={1}>{slot.name}</Text> : null}
                  </Pressable>
                );
              })}
            </View>

            <View testID="deck-summary-overlay" style={[styles.forgeReadout, { top: canvasHeight * 0.735, left: frameWidth * 0.09, right: frameWidth * 0.09 }]}>
              <View style={styles.forgeReadoutStats}>
                <View style={styles.forgeReadoutStat}><Text style={[styles.forgeReadoutValue, { color: colors.foreground }]}>{showSavedDeck ? savedSummary.cardCount : '—'}</Text><Text style={[styles.forgeReadoutLabel, { color: colors.mutedForeground }]}>CARTAS</Text></View>
                <View style={styles.forgeReadoutStat}><Text style={[styles.forgeReadoutValue, { color: colors.foreground }]}>{showSavedDeck ? savedSummary.power : '—'}</Text><Text style={[styles.forgeReadoutLabel, { color: colors.mutedForeground }]}>PODER</Text></View>
                <View style={[styles.forgeReadoutStat, { flex: 1 }]}><Text style={[styles.forgeReadoutValue, { color: showSavedDeck ? factionColor(savedSummary.primaryFaction ?? '', colors) : colors.mutedForeground }]} numberOfLines={1}>{showSavedDeck ? savedSummary.championName ?? 'CAMPEÓN NO REPORTADO' : hasSavedDeck ? 'SIN COINCIDENCIAS' : 'NÚCLEO EN ESPERA'}</Text><Text style={[styles.forgeReadoutLabel, { color: colors.mutedForeground }]}>{showSavedDeck ? savedSummary.factionLabel : faction === 'all' ? 'TODAS LAS FACCIONES' : faction.toUpperCase()}</Text></View>
              </View>
            </View>

            <View style={[styles.bottomConsole, { top: canvasHeight * 0.785, left: frameWidth * 0.075, right: frameWidth * 0.075 }]}>
              <View style={[styles.searchDock, { borderColor: `${colors.foreground}5C`, backgroundColor: `${colors.ink}B8` }]}>
                <Feather name="search" size={13} color={colors.mutedForeground} />
                <TextInput
                  testID="deck-search"
                  accessibilityLabel="Buscar carta o código"
                  value={search}
                  onChangeText={setSearch}
                  placeholder="BUSCAR"
                  placeholderTextColor={`${colors.mutedForeground}CC`}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  autoCorrect={false}
                />
                {search ? <Pressable testID="deck-clear-search" accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}><Feather name="x" size={13} color={colors.mutedForeground} /></Pressable> : null}
              </View>
              <Pressable
                testID="edit-deck"
                accessibilityRole="button"
                accessibilityLabel={hasSavedDeck ? 'Editar mazo' : 'Crear mazo'}
                onPress={() => { setSelectedIds(savedSlots.map((slot) => slot.card_id)); setMessage(hasSavedDeck ? 'Mazo cargado para edición.' : 'Nuevo borrador listo para forjar.'); setEditing(true); }}
                style={({ pressed }) => [styles.coreAction, { borderColor: colors.accent, backgroundColor: `${colors.ink}D9`, opacity: pressed ? 0.72 : 1, transform: [{ scale: pressed ? 0.96 : 1 }] }]}
              >
                <Feather name={hasSavedDeck ? 'edit-2' : 'plus'} size={17} color={colors.accent} />
                <Text style={[styles.coreActionText, { color: colors.accent }]}>{hasSavedDeck ? 'EDITAR' : 'FORJAR'}</Text>
              </Pressable>
              <View style={styles.utilityDock}>
                <Pressable
                  testID="deck-filter"
                  accessibilityRole="button"
                  accessibilityLabel={`Cambiar filtro de facción: ${faction === 'all' ? 'todas' : faction}`}
                  onPress={() => setFaction(faction === 'all' ? FACTIONS[0] : faction === FACTIONS[FACTIONS.length - 1] ? 'all' : FACTIONS[FACTIONS.indexOf(faction) + 1])}
                  style={({ pressed }) => [styles.utilityButton, { borderColor: faction === 'all' ? `${colors.foreground}5C` : factionColor(faction, colors), opacity: pressed ? 0.72 : 1 }]}
                >
                  <Feather name="filter" size={13} color={faction === 'all' ? colors.mutedForeground : factionColor(faction, colors)} />
                  <Text style={[styles.utilityLabel, { color: faction === 'all' ? colors.mutedForeground : factionColor(faction, colors) }]}>{faction === 'all' ? 'TODO' : faction.slice(0, 3).toUpperCase()}</Text>
                </Pressable>
                <Pressable
                  testID="view-deck-detail"
                  accessibilityRole="button"
                  accessibilityLabel="Ver detalle del mazo"
                  disabled={!hasSavedDeck}
                  onPress={() => setDetail(selectedPreview)}
                  style={({ pressed }) => [styles.utilityButton, { borderColor: hasSavedDeck ? `${colors.foreground}66` : `${colors.foreground}22`, opacity: pressed ? 0.72 : hasSavedDeck ? 1 : 0.45 }]}
                >
                  <Feather name="eye" size={13} color={hasSavedDeck ? colors.foreground : colors.mutedForeground} />
                  <Text style={[styles.utilityLabel, { color: hasSavedDeck ? colors.foreground : colors.mutedForeground }]}>VER</Text>
                </Pressable>
              </View>
            </View>

            {deckError || syncState === 'offline' ? <Pressable testID="deck-sync-error" accessibilityRole="button" accessibilityLabel="Reintentar sincronización de mazos" onPress={onRefresh} style={[styles.syncError, { backgroundColor: `${colors.ink}EE`, borderColor: `${colors.danger}AA` }]}><Feather name="alert-triangle" size={15} color={colors.danger} /><Text style={[styles.syncText, { color: colors.foreground }]}>{deckError ?? syncError ?? 'SIN SEÑAL · TOCA PARA REINTENTAR'}</Text></Pressable> : null}
            {collectionLoading || deckLoading ? <View style={[styles.loadingState, { backgroundColor: `${colors.ink}D9`, borderColor: `${colors.accent}66` }]}><ActivityIndicator color={colors.accent} /><Text style={[styles.loadingText, { color: colors.foreground }]}>SINCRONIZANDO MAZOS</Text></View> : null}
            {message ? <Text style={[styles.message, { color: message.startsWith('Mazo guardado') ? colors.success : colors.foreground }]}>{message}</Text> : null}
            {validation ? <Pressable testID="deck-validation" accessibilityRole="alert" onPress={() => setValidation(null)} style={[styles.validation, { borderColor: validation.valid ? colors.success : colors.danger, backgroundColor: `${colors.ink}EE` }]}><Feather name={validation.valid ? 'check-circle' : 'alert-circle'} size={15} color={validation.valid ? colors.success : colors.danger} /><Text style={[styles.validationText, { color: colors.foreground }]}>{validation.valid ? 'MAZO VÁLIDO' : validation.errors.join(' ')}</Text></Pressable> : null}

            <View style={[styles.bottomNavigation, { borderColor: `${colors.foreground}44`, backgroundColor: `${colors.ink}D9` }]}>
              <Pressable testID="reference-home" accessibilityRole="button" accessibilityLabel="Inicio" onPress={() => navigate('/')} style={styles.bottomHit}><Feather name="home" size={16} color={colors.mutedForeground} /><Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>NEXUS</Text></Pressable>
              <Pressable testID="reference-battle" accessibilityRole="button" accessibilityLabel="Batalla" onPress={() => navigate('/battle')} style={styles.bottomHit}><Feather name="zap" size={16} color={colors.mutedForeground} /><Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>ARENA</Text></Pressable>
              <Pressable testID="reference-cards" accessibilityRole="button" accessibilityLabel="Cartas" onPress={() => navigate('/collection')} style={styles.bottomHit}><Feather name="layers" size={16} color={colors.mutedForeground} /><Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>ARCHIVO</Text></Pressable>
              <Pressable testID="reference-deck" accessibilityRole="button" accessibilityLabel="Mazo" onPress={() => navigate('/deck')} style={[styles.bottomHit, styles.bottomHitActive, { borderColor: colors.accent }]}><Feather name="columns" size={16} color={colors.accent} /><Text style={[styles.bottomLabel, { color: colors.accent }]}>FORJA</Text></Pressable>
              <Pressable testID="reference-profile" accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => navigate('/profile')} style={styles.bottomHit}><Feather name="award" size={16} color={colors.mutedForeground} /><Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>LEGADO</Text></Pressable>
            </View>
          </View>
        </View>
        <DetailModal slot={detail} summary={savedSummary} colors={colors} onClose={() => setDetail(null)} />
        <EditorModal
          visible={editing}
          colors={colors}
          collection={collection}
          selectedIds={selectedIds}
          deckReady={deckReady}
          saving={saving}
          validation={validation}
          message={message}
          onToggle={toggleCard}
          onValidate={() => void handleValidate()}
          onSave={() => void handleSave()}
          onArena={() => void handleOpenArena()}
          onClose={() => setEditing(false)}
        />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  referenceRoot: { flex: 1, width: '100%', overflow: 'hidden' },
  referenceScene: { overflow: 'hidden' },
  sceneArt: { opacity: 0.96 },
  sceneUi: { ...StyleSheet.absoluteFillObject, zIndex: 2 },
  sceneHeader: { position: 'absolute', top: 18, left: 22, right: 22, paddingBottom: 0 },
  sceneRefresh: { width: 36, height: 36, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(8,12,18,0.54)' },
  forgeCoreGlow: { position: 'absolute', width: 180, height: 180, borderRadius: 90, top: '24%', left: '50%', marginLeft: -90 },
  lightSweep: { position: 'absolute', width: '120%', height: 90, top: '31%', left: '-10%', transform: [{ rotate: '-8deg' }] },
  portalReadout: { position: 'absolute', top: '17.5%', left: '14%', right: '14%', alignItems: 'center' },
  portalEyebrow: { fontSize: 7, fontWeight: '900', letterSpacing: 1.25, textAlign: 'center' },
  portalTitle: { fontSize: 18, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center', marginTop: 4, textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 7 },
  portalCopy: { fontSize: 8, fontWeight: '800', textAlign: 'center', marginTop: 3, letterSpacing: 0.35 },
  sceneCounter: { position: 'absolute', top: '8.5%', right: '9%', alignItems: 'flex-end' },
  sceneCounterValue: { fontSize: 12, fontWeight: '900', letterSpacing: 0.7 },
  sceneCounterLabel: { fontSize: 6, fontWeight: '900', letterSpacing: 0.8, marginTop: 2 },
  formationRail: { position: 'absolute', height: '15%', flexDirection: 'row', gap: 4, zIndex: 4 },
  formationSlot: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 6, overflow: 'hidden', backgroundColor: 'rgba(7,12,18,0.72)' },
  formationArt: { width: '100%', height: '78%' },
  formationFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 3 },
  formationSlotLabel: { fontSize: 6, fontWeight: '900', letterSpacing: 0.3 },
  formationSlotName: { position: 'absolute', left: 3, right: 3, bottom: 3, fontSize: 5.5, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 4 },
  reserveRail: { position: 'absolute', height: '13%', flexDirection: 'row', gap: 4, zIndex: 4 },
  reserveSlot: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 5, overflow: 'hidden', backgroundColor: 'rgba(7,12,18,0.68)' },
  reserveArt: { width: '100%', height: '78%' },
  reserveFallback: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', gap: 2 },
  reserveLabel: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.25 },
  reserveName: { position: 'absolute', left: 2, right: 2, bottom: 2, fontSize: 4.8, fontWeight: '900', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.95)', textShadowRadius: 4 },
  forgeReadout: { position: 'absolute', minHeight: 45, justifyContent: 'center', zIndex: 6 },
  forgeReadoutStats: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  forgeReadoutStat: { minWidth: 35 },
  forgeReadoutValue: { fontSize: 9, fontWeight: '900', textShadowColor: 'rgba(0,0,0,0.9)', textShadowRadius: 5 },
  forgeReadoutLabel: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.45, marginTop: 2 },
  bottomConsole: { position: 'absolute', height: '10.5%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', zIndex: 8 },
  searchDock: { width: '30%', height: 52, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 5 },
  searchInput: { flex: 1, minWidth: 0, paddingHorizontal: 0, paddingVertical: 0, fontSize: 9, fontWeight: '700' },
  coreAction: { width: 72, height: 72, borderWidth: 1, borderRadius: 36, alignItems: 'center', justifyContent: 'center', gap: 3, shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 4 },
  coreActionText: { fontSize: 6.5, fontWeight: '900', letterSpacing: 0.65 },
  utilityDock: { width: '30%', flexDirection: 'row', justifyContent: 'flex-end', gap: 5 },
  utilityButton: { width: 42, height: 52, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 3, backgroundColor: 'rgba(7,12,18,0.72)' },
  utilityLabel: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.4 },
  missingArtText: { fontSize: 7, lineHeight: 9, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  syncError: { position: 'absolute', top: '47%', left: '10%', right: '10%', minHeight: 38, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 12 },
  syncText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  loadingState: { position: 'absolute', top: '48%', left: '25%', right: '25%', minHeight: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 13 },
  loadingText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  message: { position: 'absolute', left: '12%', right: '12%', bottom: '12.5%', fontSize: 9, textAlign: 'center', fontWeight: '800', zIndex: 12 },
  validation: { position: 'absolute', left: '9%', right: '9%', bottom: '13%', minHeight: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, zIndex: 14 },
  validationText: { flex: 1, fontSize: 9, fontWeight: '800' },
  bottomNavigation: { position: 'absolute', left: '5%', right: '5%', bottom: '2.5%', height: '8.5%', borderTopWidth: 1, flexDirection: 'row', zIndex: 11, alignItems: 'stretch' },
  bottomHit: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  bottomHitActive: { borderTopWidth: 2 },
  bottomLabel: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.55 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.72)', justifyContent: 'flex-end' },
  detailPanel: { borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 28 },
  detailHeader: { flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  detailEyebrow: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  detailTitle: { fontSize: 22, fontWeight: '900', marginTop: 5 },
  closeButton: { width: 36, height: 36, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  detailBody: { padding: 18, alignItems: 'center' },
  detailArt: { width: 130, height: 160, borderWidth: 1, borderRadius: 12 },
  detailArtFallback: { width: 130, height: 160, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  detailMissingArtText: { maxWidth: 86, fontSize: 9, lineHeight: 13, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  detailFaction: { fontSize: 12, fontWeight: '900', marginTop: 10 },
  detailCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 8, maxWidth: 330 },
  detailStats: { flexDirection: 'row', gap: 25, marginTop: 16 },
  detailStat: { fontSize: 13, fontWeight: '900' },
  editorPanel: { maxHeight: '92%', borderTopWidth: 1, borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 22 },
  editorSummary: { fontSize: 10, marginTop: 5 },
  editorList: { padding: 16, gap: 8 },
  editorCard: { minHeight: 54, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', padding: 6, gap: 9 },
  editorArt: { width: 38, height: 44, borderRadius: 6 },
  editorArtFallback: { width: 38, height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  editorCardCopy: { flex: 1, minWidth: 0 },
  editorCardName: { fontSize: 12, fontWeight: '800' },
  editorCardMeta: { fontSize: 9, marginTop: 4 },
  editorCount: { width: 27, textAlign: 'center', fontSize: 14, fontWeight: '900' },
  editorEmpty: { padding: 28, textAlign: 'center', fontSize: 12 },
  editorNotice: { marginHorizontal: 16, padding: 9, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 7 },
  editorNoticeText: { flex: 1, fontSize: 10, fontWeight: '800' },
  editorMessage: { marginHorizontal: 16, marginTop: 8, fontSize: 10, textAlign: 'center' },
  editorActions: { flexDirection: 'row', gap: 8, marginHorizontal: 16, marginTop: 10 },
  editorSecondary: { flex: 0.8, minHeight: 42, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editorPrimary: { flex: 1.2, minHeight: 42, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editorArena: { minHeight: 40, marginHorizontal: 16, marginTop: 8, borderWidth: 1, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  editorActionText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
});