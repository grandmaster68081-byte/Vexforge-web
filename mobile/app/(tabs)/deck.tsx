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
import { getCanonicalFrameMetrics } from '@/components/CanonicalFrame';

const MAX_DECKS = 10;
const MAX_DECK = 30;
const MIN_DECK = 5;
const MAX_MYTHIC = 1;
const MAX_LEGENDARY = 3;
const FACTIONS = ['Guerrero', 'Mago', 'Paladín', 'Pícaro'] as const;
type Faction = (typeof FACTIONS)[number];
type SortMode = 'recent' | 'name' | 'power';
const DECK_REFERENCE = require('@/assets/images/decks-reference-scene.png');

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

function deckPower(cards: PlayerCard[], selectedIds: string[]) {
  const multiplier: Record<string, number> = { Common: 1, Uncommon: 1.3, Rare: 1.6, Epic: 2.1, Legendary: 3, Mythic: 4 };
  return Math.round(selectedIds.reduce((total, id) => {
    const card = cards.find((item) => item.card_id === id);
    return total + (card?.power ?? 1) * (multiplier[card?.rarity ?? 'Common'] ?? 1);
  }, 0));
}

function slotFaction(slots: DeckSlot[]) {
  return slots[0]?.faction ?? 'Sin facción';
}

function DeckPreviewCard({
  slot,
  colors,
  width,
  active,
  onPress,
}: {
  slot?: DeckSlot;
  colors: ReturnType<typeof useColors>;
  width: number;
  active?: boolean;
  onPress: () => void;
}) {
  const accent = slot ? factionColor(slot.faction, colors) : colors.border;
  return (
    <Pressable
      testID={slot ? 'saved-deck-card' : 'empty-deck-slot'}
      accessibilityRole="button"
      accessibilityLabel={slot ? `Editar ${slot.name}` : 'Crear un nuevo mazo'}
      onPress={onPress}
      style={({ pressed }) => [
        styles.deckPreview,
        { width, borderColor: active ? colors.accent : `${accent}AA`, opacity: pressed ? 0.76 : 1 },
      ]}
    >
      {slot?.image_url ? (
        <Image source={{ uri: slot.image_url }} style={StyleSheet.absoluteFillObject} resizeMode="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.deckPreviewFallback, { backgroundColor: `${colors.ink}E8` }]}>
          {slot ? <Text style={[styles.missingArtText, { color: accent }]}>ARTE CANÓNICO PENDIENTE</Text> : <Feather name="plus" size={35} color={colors.accent} />}
        </View>
      )}
      <View style={[styles.deckPreviewShade, { backgroundColor: `${colors.ink}98` }]} />
      {!slot ? (
        <View style={styles.createDeckCopy}>
          <Text style={[styles.createDeckTitle, { color: colors.accent }]}>CREAR NUEVO MAZO</Text>
          <Text style={[styles.createDeckText, { color: colors.mutedForeground }]}>Construye tu estrategia y prepárate para la batalla.</Text>
        </View>
      ) : (
        <View style={styles.deckPreviewCopy}>
          <Text style={[styles.deckPreviewName, { color: colors.foreground }]} numberOfLines={1}>{slot.name || 'MAZO SIN NOMBRE'}</Text>
          <Text style={[styles.deckPreviewFaction, { color: accent }]}>{slot.faction}</Text>
          <Feather name="more-horizontal" size={17} color={colors.foreground} />
        </View>
      )}
    </Pressable>
  );
}

function DetailModal({
  slot,
  colors,
  onClose,
}: {
  slot: DeckSlot | null;
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
              <Text style={[styles.detailTitle, { color: colors.foreground }]}>{slot.name || 'MAZO SIN NOMBRE'}</Text>
            </View>
            <Pressable testID="close-deck-detail" accessibilityRole="button" accessibilityLabel="Cerrar detalle del mazo" onPress={onClose} style={[styles.closeButton, { borderColor: colors.border }]}>
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>
          <View style={styles.detailBody}>
            {slot.image_url ? <Image source={{ uri: slot.image_url }} style={[styles.detailArt, { borderColor: factionColor(slot.faction, colors) }]} resizeMode="cover" /> : <View style={[styles.detailArtFallback, { borderColor: factionColor(slot.faction, colors) }]}><Text style={[styles.detailMissingArtText, { color: factionColor(slot.faction, colors) }]}>ARTE CANÓNICO PENDIENTE</Text></View>}
            <Text style={[styles.detailFaction, { color: factionColor(slot.faction, colors) }]}>{slot.faction}</Text>
            <Text style={[styles.detailCopy, { color: colors.mutedForeground }]}>Formación sincronizada desde tu mazo activo. Edita las cartas desde la Forja para prepararte para la Arena.</Text>
            <View style={styles.detailStats}>
              <Text style={[styles.detailStat, { color: colors.foreground }]}>{slot.power} <Text style={{ color: colors.mutedForeground }}>PODER</Text></Text>
              <Text style={[styles.detailStat, { color: colors.foreground }]}>{slot.is_champion ? 'CAMPEÓN' : 'RESERVA'}</Text>
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
            <Pressable testID="close-deck-editor" accessibilityRole="button" accessibilityLabel="Cerrar editor del mazo" onPress={onClose} style={[styles.closeButton, { borderColor: colors.border }]}>
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
                  style={({ pressed }) => [styles.editorCard, { borderColor: count ? accent : colors.border, backgroundColor: count ? `${accent}18` : colors.panel, opacity: pressed ? 0.76 : 1 }]}
                >
                  {card.image_url ? <Image source={{ uri: card.image_url }} style={styles.editorArt} resizeMode="cover" /> : <View style={[styles.editorArtFallback, { backgroundColor: `${accent}18`, borderColor: `${accent}88` }]}><Text style={[styles.missingArtText, { color: accent }]}>ARTE CANÓNICO PENDIENTE</Text></View>}
                  <View style={styles.editorCardCopy}>
                    <Text style={[styles.editorCardName, { color: colors.foreground }]} numberOfLines={1}>{card.name}</Text>
                    <Text style={[styles.editorCardMeta, { color: accent }]}>{card.rarity} · {card.faction ?? 'Sin facción'} · disponibles ×{card.quantity}</Text>
                  </View>
                  <Text style={[styles.editorCount, { color: count ? accent : colors.mutedForeground }]}>{count ? `×${count}` : '+'}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {validation ? <View style={[styles.editorNotice, { borderColor: validation.valid ? colors.success : colors.danger }]}><Feather name={validation.valid ? 'check-circle' : 'alert-circle'} size={15} color={validation.valid ? colors.success : colors.danger} /><Text style={[styles.editorNoticeText, { color: colors.foreground }]}>{validation.valid ? 'MAZO VÁLIDO' : validation.errors.join(' ')}</Text></View> : null}
          {message ? <Text style={[styles.editorMessage, { color: message.startsWith('Mazo guardado') ? colors.success : colors.mutedForeground }]}>{message}</Text> : null}
          <View style={styles.editorActions}>
            <Pressable testID="validate-deck" accessibilityRole="button" accessibilityLabel="Validar mazo contra las reglas oficiales" onPress={onValidate} style={[styles.editorSecondary, { borderColor: colors.accent }]}><Feather name="check-circle" size={15} color={colors.accent} /><Text style={[styles.editorActionText, { color: colors.accent }]}>VALIDAR</Text></Pressable>
            <Pressable testID="save-deck" accessibilityRole="button" accessibilityLabel="Guardar mazo" disabled={saving} onPress={onSave} style={[styles.editorPrimary, { backgroundColor: deckReady ? colors.primary : colors.muted, opacity: saving ? 0.7 : 1 }]}>{saving ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Feather name="save" size={15} color={deckReady ? colors.primaryForeground : colors.mutedForeground} />}<Text style={[styles.editorActionText, { color: deckReady ? colors.primaryForeground : colors.mutedForeground }]}>{saving ? 'GUARDANDO' : 'GUARDAR'}</Text></Pressable>
          </View>
          <Pressable testID="open-arena-from-forge" accessibilityRole="button" accessibilityLabel="Guardar el mazo y entrar en la Arena" disabled={saving} onPress={onArena} style={[styles.editorArena, { borderColor: deckReady ? `${colors.accent}AA` : colors.border }]}><Feather name="zap" size={15} color={deckReady ? colors.accent : colors.mutedForeground} /><Text style={[styles.editorActionText, { color: deckReady ? colors.accent : colors.mutedForeground }]}>GUARDAR Y PROBAR EN ARENA</Text></Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function DeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: viewportWidth, height: viewportHeight } = useWindowDimensions();
  const { width, height: canvasHeight } = getCanonicalFrameMetrics(
    viewportWidth,
    Math.max(1, viewportHeight - insets.top - insets.bottom),
  );
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
  const [sort, setSort] = useState<SortMode>('recent');
  const [detail, setDetail] = useState<DeckSlot | null>(null);
  const [editing, setEditing] = useState(false);

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
    const name = card.faction ?? 'Sin facción';
    result[name] = (result[name] ?? 0) + 1;
    return result;
  }, {}), [selectedCards]);
  const factionsInDraft = Object.keys(factionCounts);
  const mythicCount = selectedCards.filter((card) => card.rarity === 'Mythic').length;
  const legendaryCount = selectedCards.filter((card) => card.rarity === 'Legendary').length;
  const power = deckPower(collection, selectedIds);
  const deckReady = selectedIds.length >= MIN_DECK && selectedIds.length <= MAX_DECK && factionsInDraft.length <= 2 && mythicCount <= MAX_MYTHIC && legendaryCount <= MAX_LEGENDARY;
  const currentFaction = slotFaction(savedSlots);
  const visibleSavedDeck = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (faction !== 'all' && currentFaction !== faction) return false;
    return !query || 'mazo sin nombre'.includes(query) || currentFaction.toLowerCase().includes(query);
  }, [currentFaction, faction, search]);
  const cardWidth = Math.max(74, Math.min(112, (width - 46) / 4.2));
  const hasSavedDeck = savedSlots.length > 0;

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

  return (
    <ScreenShell sceneMode="hero">
      <View style={[styles.referenceRoot, { marginBottom: -insets.bottom }]}>
        <View style={[styles.referenceCanvas, { width, height: canvasHeight, marginTop: insets.top, alignSelf: 'center' }]}>
        <Image source={DECK_REFERENCE} style={StyleSheet.absoluteFillObject} resizeMode="cover" accessibilityLabel="Composición oficial de Mazos VEXFORGE" />
        <View pointerEvents="none" style={[styles.referenceShade, { backgroundColor: `${colors.ink}18` }]} />
        <View pointerEvents="box-none" style={StyleSheet.absoluteFillObject}>
          <View style={[styles.deckCounter, { top: canvasHeight * 0.19, right: width * 0.115 }]}>
            <Text style={[styles.deckCounterValue, { color: colors.foreground }]}>{hasSavedDeck ? 1 : 0} / {MAX_DECKS}</Text>
            <Text style={[styles.deckCounterLabel, { color: colors.mutedForeground }]}>MAZOS CREADOS</Text>
          </View>
          <Pressable testID="deck-refresh" accessibilityRole="button" accessibilityLabel="Actualizar mazos" onPress={onRefresh} style={[styles.refreshHotspot, { top: canvasHeight * 0.18, right: width * 0.04 }]} />

          <Pressable testID="deck-collection-tab" accessibilityRole="button" accessibilityLabel="Abrir colección" onPress={() => navigate('/collection')} style={[styles.topHotspot, { left: width * 0.04, top: canvasHeight * 0.108, width: width * 0.24 }]} />
          <Pressable testID="deck-owned-tab" accessibilityRole="button" accessibilityLabel="Abrir tus cartas" onPress={() => router.push('/collection?scope=owned')} style={[styles.topHotspot, { left: width * 0.29, top: canvasHeight * 0.108, width: width * 0.23 }]} />
          <Pressable testID="deck-fusion-tab" accessibilityRole="button" accessibilityLabel="Abrir fusión" onPress={() => router.push('/store?mode=fusion')} style={[styles.topHotspot, { left: width * 0.52, top: canvasHeight * 0.108, width: width * 0.19 }]} />
          <Pressable testID="deck-achievements-tab" accessibilityRole="button" accessibilityLabel="Abrir logros" onPress={() => router.push('/profile?section=achievements')} style={[styles.topHotspot, { right: width * 0.04, top: canvasHeight * 0.108, width: width * 0.19 }]} />

          <View style={[styles.factionRow, { top: canvasHeight * 0.315, left: width * 0.04, right: width * 0.04 }]}>
            <Pressable testID="deck-faction-all" accessibilityRole="button" accessibilityLabel="Todos los mazos" onPress={() => setFaction('all')} style={styles.factionHit} />
            {FACTIONS.map((value, index) => (
              <Pressable key={value} testID={`deck-faction-${value}`} accessibilityRole="button" accessibilityLabel={`Filtrar mazos por ${value}`} onPress={() => setFaction(faction === value ? 'all' : value)} style={[styles.factionHit, { left: `${20 * (index + 1)}%` }]} />
            ))}
          </View>

           <View style={[styles.searchBox, { top: canvasHeight * 0.374, left: width * 0.065, width: width * 0.59, borderColor: `${colors.foreground}44`, backgroundColor: `${colors.ink}44` }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput testID="deck-search" accessibilityLabel="Buscar mazo por nombre" value={search} onChangeText={setSearch} placeholder="Buscar mazo por nombre..." placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} autoCorrect={false} />
            {search ? <Pressable testID="deck-clear-search" accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}><Feather name="x-circle" size={15} color={colors.mutedForeground} /></Pressable> : null}
          </View>
          <Pressable testID="deck-sort" accessibilityRole="button" accessibilityLabel="Cambiar orden de mazos" onPress={() => setSort(sort === 'recent' ? 'name' : sort === 'name' ? 'power' : 'recent')} style={[styles.sortBox, { top: canvasHeight * 0.374, right: width * 0.16, width: width * 0.32, borderColor: `${colors.foreground}44`, backgroundColor: `${colors.ink}44` }]}>
            <Text style={[styles.sortText, { color: colors.mutedForeground }]}>Ordenar: {sort === 'recent' ? 'Recientes' : sort === 'name' ? 'Nombre' : 'Poder'}</Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </Pressable>
          <Pressable testID="deck-filter" accessibilityRole="button" accessibilityLabel="Restablecer filtros de mazos" onPress={() => { setFaction('all'); setSearch(''); }} style={[styles.filterButton, { top: canvasHeight * 0.391, right: width * 0.045, borderColor: colors.accent }]}>
            <Feather name="sliders" size={18} color={colors.accent} />
          </Pressable>

           <View style={[styles.deckCarousel, { top: canvasHeight * 0.445, left: width * 0.04, right: width * 0.04 }]}>
            <DeckPreviewCard colors={colors} width={cardWidth} onPress={handleCreate} />
            {visibleSavedDeck && selectedPreview ? <DeckPreviewCard slot={selectedPreview} colors={colors} width={cardWidth} active={selectedIds.length > 0} onPress={() => { setSelectedIds(savedSlots.map((slot) => slot.card_id)); setMessage('Mazo cargado para edición.'); setEditing(true); }} /> : null}
            {Array.from({ length: Math.max(0, 3 - (visibleSavedDeck && selectedPreview ? 1 : 0)) }, (_, index) => <DeckPreviewCard key={`empty-${index}`} colors={colors} width={cardWidth} onPress={handleCreate} />)}
          </View>

          <View style={[styles.detailCard, { top: canvasHeight * 0.715, left: width * 0.04, right: width * 0.04, borderColor: `${factionColor(currentFaction, colors)}99`, backgroundColor: `${colors.ink}D9` }]}>
            <View style={[styles.detailSeal, { borderColor: factionColor(currentFaction, colors) }]}>
              <Feather name="shield" size={26} color={factionColor(currentFaction, colors)} />
            </View>
            <View style={styles.detailCopyBlock}>
              <Text style={[styles.detailDeckName, { color: colors.foreground }]} numberOfLines={1}>{selectedPreview?.name || 'MAZO SIN NOMBRE'}</Text>
              <Text style={[styles.detailDeckFaction, { color: factionColor(currentFaction, colors) }]}>{currentFaction}</Text>
              <View style={styles.detailMetrics}>
                <Text style={[styles.metric, { color: colors.mutedForeground }]}><Feather name="card" size={12} color={colors.mutedForeground} /> Cartas {selectedIds.length || '—'}</Text>
                <Text style={[styles.metric, { color: colors.mutedForeground }]}><Feather name="target" size={12} color={colors.mutedForeground} /> Poder {power || '—'}</Text>
              </View>
            </View>
            <View style={styles.detailActions}>
              <Pressable testID="edit-deck" accessibilityRole="button" accessibilityLabel="Editar mazo" onPress={() => { setSelectedIds(savedSlots.map((slot) => slot.card_id)); setMessage('Mazo cargado para edición.'); setEditing(true); }} style={[styles.editButton, { borderColor: colors.accent }]}>
                <Feather name="edit-2" size={13} color={colors.accent} /><Text style={[styles.actionText, { color: colors.accent }]}>EDITAR MAZO</Text>
              </Pressable>
              <Pressable testID="view-deck-detail" accessibilityRole="button" accessibilityLabel="Ver detalle del mazo" onPress={() => setDetail(selectedPreview)} style={[styles.viewButton, { borderColor: colors.border }]}>
                <Feather name="eye" size={14} color={colors.mutedForeground} /><Text style={[styles.actionText, { color: colors.mutedForeground }]}>VER DETALLE</Text>
              </Pressable>
            </View>
          </View>

          {deckError || syncState === 'offline' ? <Pressable testID="deck-sync-error" accessibilityRole="button" accessibilityLabel="Reintentar sincronización de mazos" onPress={onRefresh} style={[styles.syncError, { backgroundColor: `${colors.ink}E8`, borderColor: `${colors.danger}AA` }]}><Feather name="alert-triangle" size={15} color={colors.danger} /><Text style={[styles.syncText, { color: colors.foreground }]}>{deckError ?? syncError ?? 'SIN SEÑAL · TOCA PARA REINTENTAR'}</Text></Pressable> : null}
          {collectionLoading || deckLoading ? <View style={[styles.loadingState, { backgroundColor: `${colors.ink}C9` }]}><ActivityIndicator color={colors.accent} /><Text style={[styles.loadingText, { color: colors.foreground }]}>SINCRONIZANDO MAZOS</Text></View> : null}
          {message ? <Text style={[styles.message, { color: message.startsWith('Mazo guardado') ? colors.success : colors.foreground }]}>{message}</Text> : null}
          {validation ? <Pressable testID="deck-validation" accessibilityRole="alert" onPress={() => setValidation(null)} style={[styles.validation, { borderColor: validation.valid ? colors.success : colors.danger, backgroundColor: `${colors.ink}EE` }]}><Feather name={validation.valid ? 'check-circle' : 'alert-circle'} size={15} color={validation.valid ? colors.success : colors.danger} /><Text style={[styles.validationText, { color: colors.foreground }]}>{validation.valid ? 'MAZO VÁLIDO' : validation.errors.join(' ')}</Text></Pressable> : null}

          <View style={styles.bottomNavigation}>
            <Pressable testID="reference-home" accessibilityRole="button" accessibilityLabel="Inicio" onPress={() => navigate('/')} style={styles.bottomHit} />
            <Pressable testID="reference-battle" accessibilityRole="button" accessibilityLabel="Batalla" onPress={() => navigate('/battle')} style={styles.bottomHit} />
            <Pressable testID="reference-cards" accessibilityRole="button" accessibilityLabel="Cartas" onPress={() => navigate('/collection')} style={styles.bottomHit} />
            <Pressable testID="reference-deck" accessibilityRole="button" accessibilityLabel="Mazo" onPress={() => navigate('/deck')} style={styles.bottomHit} />
            <Pressable testID="reference-profile" accessibilityRole="button" accessibilityLabel="Perfil" onPress={() => navigate('/profile')} style={styles.bottomHit} />
          </View>
          </View>
        </View>
        <DetailModal slot={detail} colors={colors} onClose={() => setDetail(null)} />
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
  referenceCanvas: { position: 'relative', overflow: 'hidden' },
  referenceShade: { ...StyleSheet.absoluteFillObject },
  deckCounter: { position: 'absolute', alignItems: 'flex-end', zIndex: 4 },
  deckCounterValue: { fontSize: 13, fontWeight: '900', letterSpacing: 0.7 },
  deckCounterLabel: { fontSize: 6, fontWeight: '800', letterSpacing: 0.7, marginTop: 2 },
  refreshHotspot: { position: 'absolute', width: 38, height: 38, zIndex: 8 },
  topHotspot: { position: 'absolute', height: 48, zIndex: 8 },
  factionRow: { position: 'absolute', height: 42, zIndex: 8 },
  factionHit: { position: 'absolute', top: 0, width: '20%', height: 42 },
  searchBox: { position: 'absolute', height: 40, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 11, gap: 7, zIndex: 8 },
  searchInput: { flex: 1, fontSize: 10, paddingVertical: 8 },
  sortBox: { position: 'absolute', height: 40, borderWidth: 1, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, zIndex: 8 },
  sortText: { fontSize: 9, fontWeight: '700' },
  filterButton: { position: 'absolute', width: 38, height: 38, borderWidth: 1, borderRadius: 19, alignItems: 'center', justifyContent: 'center', zIndex: 8 },
  deckCarousel: { position: 'absolute', height: 190, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 },
  deckPreview: { height: 180, borderWidth: 1, borderRadius: 10, overflow: 'hidden', position: 'relative', justifyContent: 'flex-end' },
  deckPreviewFallback: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  missingArtText: { fontSize: 7, lineHeight: 9, fontWeight: '900', letterSpacing: 0.2, textAlign: 'center' },
  deckPreviewShade: { ...StyleSheet.absoluteFillObject },
  createDeckCopy: { padding: 8, minHeight: 63, justifyContent: 'flex-end' },
  createDeckTitle: { fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.3 },
  createDeckText: { fontSize: 7, lineHeight: 10, textAlign: 'center', marginTop: 5 },
  deckPreviewCopy: { minHeight: 49, paddingHorizontal: 7, paddingVertical: 6, justifyContent: 'flex-end' },
  deckPreviewName: { fontSize: 7, fontWeight: '900' },
  deckPreviewFaction: { fontSize: 8, fontWeight: '900', marginTop: 4 },
  detailCard: { position: 'absolute', minHeight: 127, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', padding: 10, zIndex: 6, gap: 8 },
  detailSeal: { width: 57, height: 57, borderWidth: 1, borderRadius: 29, alignItems: 'center', justifyContent: 'center' },
  detailCopyBlock: { flex: 1, minWidth: 0 },
  detailDeckName: { fontSize: 11, fontWeight: '900' },
  detailDeckFaction: { fontSize: 9, fontWeight: '900', marginTop: 4 },
  detailMetrics: { flexDirection: 'row', gap: 9, marginTop: 13 },
  metric: { fontSize: 8 },
  detailActions: { width: '34%', gap: 8 },
  editButton: { minHeight: 35, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  viewButton: { minHeight: 35, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5 },
  actionText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.35 },
  syncError: { position: 'absolute', top: '47%', left: '10%', right: '10%', minHeight: 38, borderWidth: 1, borderRadius: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, zIndex: 12 },
  syncText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.4, textAlign: 'center' },
  loadingState: { position: 'absolute', top: '48%', left: '25%', right: '25%', minHeight: 54, borderRadius: 10, alignItems: 'center', justifyContent: 'center', gap: 6, zIndex: 13 },
  loadingText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  message: { position: 'absolute', left: '12%', right: '12%', bottom: '12.5%', fontSize: 9, textAlign: 'center', fontWeight: '800', zIndex: 12 },
  validation: { position: 'absolute', left: '9%', right: '9%', bottom: '13%', minHeight: 36, borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 7, zIndex: 14 },
  validationText: { flex: 1, fontSize: 9, fontWeight: '800' },
  bottomNavigation: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '11%', flexDirection: 'row', zIndex: 11 },
  bottomHit: { flex: 1 },
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