import { Feather } from '@/components/ForgeIcon';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { ProgressBar } from '@/components/ProgressBar';
import {
  loadPlayerDeck,
  saveDeck,
  validateDeck,
  type DeckValidation,
  type PlayerCard,
} from '@/lib/supabase';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { DomainHeader } from '@/components/DomainHeader';
import { DomainState } from '@/components/DomainState';

const RARITIES = ['Mythic', 'Legendary', 'Epic', 'Rare', 'Uncommon', 'Common'] as const;
const FACTIONS = ['Guerrero', 'Mago', 'Paladín', 'Pícaro'] as const;
const MAX_DECK = 30;
const MIN_DECK = 5;
const MAX_MYTHIC = 1;
const MAX_LEGENDARY = 3;

function rarityLabel(rarity: string) {
  return {
    Common: 'Común',
    Uncommon: 'Infrecuente',
    Rare: 'Rara',
    Epic: 'Épica',
    Legendary: 'Legendaria',
    Mythic: 'Mítica',
  }[rarity] ?? rarity;
}

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

function deckPower(cards: PlayerCard[], selectedIds: string[], championId: string | null) {
  const multiplier: Record<string, number> = {
    Common: 1,
    Uncommon: 1.3,
    Rare: 1.6,
    Epic: 2.1,
    Legendary: 3,
    Mythic: 4,
  };
  return Math.round(
    selectedIds.reduce((total, id) => {
      if (id === championId) return total;
      const card = cards.find((item) => item.card_id === id);
      return total + (card?.power ?? 1) * (multiplier[card?.rarity ?? 'Common'] ?? 1);
    }, 0),
  );
}

function powerTier(power: number, colors: ReturnType<typeof useColors>) {
  if (power >= 2000) return { label: 'LEYENDA', color: colors.accent, icon: 'award' as const };
  if (power >= 1200) return { label: 'MAESTRO', color: colors.rarityLegendary, icon: 'star' as const };
  if (power >= 600) return { label: 'FORJADOR', color: colors.rarityEpic, icon: 'zap' as const };
  if (power >= 200) return { label: 'APRENDIZ', color: colors.rarityRare, icon: 'shield' as const };
  return { label: 'RECLUTA', color: colors.mutedForeground, icon: 'target' as const };
}

function DeckCard({
  card,
  count,
  selected,
  disabled,
  colors,
  onPress,
}: {
  card: PlayerCard;
  count: number;
  selected: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const accent = rarityColor(card.rarity ?? 'Common', colors);
  const factionAccent = factionColor(card.faction ?? '', colors);
  return (
    <Pressable
      testID={`deck-card-${card.code}`}
      accessibilityRole="button"
      accessibilityLabel={`${selected ? 'Quitar' : 'Añadir'} ${card.name} al mazo`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled && !selected}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: selected ? `${accent}16` : colors.panel,
          borderColor: selected ? accent : `${accent}55`,
          opacity: pressed ? 0.78 : disabled && !selected ? 0.42 : 1,
        },
      ]}
    >
      <View style={[styles.cardArt, { backgroundColor: colors.panelStrong, borderBottomColor: accent }]}>
        {card.image_url ? (
          <Image source={{ uri: card.image_url }} style={StyleSheet.absoluteFill} resizeMode="cover" accessibilityLabel={`Arte de ${card.name}`} />
        ) : (
          <View style={styles.artFallback}>
            <Text style={[styles.artFallbackText, { color: accent }]} numberOfLines={3}>ARTE CANÓNICO PENDIENTE</Text>
          </View>
        )}
        <View style={[styles.artShade, { backgroundColor: `${colors.ink}55` }]} />
        {count > 0 && (
          <View style={[styles.countBadge, { backgroundColor: accent }]}>
            <Text style={[styles.countText, { color: colors.ink }]}>×{count}</Text>
          </View>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text style={[styles.cardRarity, { color: accent }]}>{rarityLabel(card.rarity ?? 'Common')}</Text>
        <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>{card.name}</Text>
        <View style={styles.cardMeta}>
          <Text style={[styles.cardFaction, { color: factionAccent }]} numberOfLines={1}>{card.faction ?? 'Sin facción'}</Text>
          <Text style={[styles.cardPower, { color: colors.accent }]}>PWR {card.power ?? 0}</Text>
        </View>
        <Text style={[styles.cardQuantity, { color: colors.mutedForeground }]}>Disponibles: {card.quantity}</Text>
      </View>
    </Pressable>
  );
}

function FilterChip({
  label,
  active,
  colors,
  accent,
  onPress,
}: {
  label: string;
  active: boolean;
  colors: ReturnType<typeof useColors>;
  accent?: string;
  onPress: () => void;
}) {
  const color = accent ?? colors.primary;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={[styles.chip, { borderColor: active ? color : colors.border, backgroundColor: active ? `${color}1C` : colors.panel }]}
    >
      <Text style={[styles.chipText, { color: active ? color : colors.mutedForeground }]}>{label}</Text>
    </Pressable>
  );
}

function EmptyState({
  title,
  description,
  colors,
  action,
}: {
  title: string;
  description: string;
  colors: ReturnType<typeof useColors>;
  action?: { label: string; onPress: () => void };
}) {
  return <DomainState kind="empty" title={title} message={description} actionLabel={action?.label} onAction={action?.onPress} testID="deck-empty" />;
}

export default function DeckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { session, player, collection, collectionLoading, syncState, syncError, refresh } = useGame();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [championId, setChampionId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rarity, setRarity] = useState<string | 'all'>('all');
  const [faction, setFaction] = useState<string | 'all'>('all');
  const [deckLoading, setDeckLoading] = useState(true);
  const [deckError, setDeckError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [validation, setValidation] = useState<DeckValidation | null>(null);

  const loadDeck = useCallback(async () => {
    if (!session || !player) {
      setDeckLoading(false);
      return;
    }
    setDeckLoading(true);
    setDeckError(null);
    try {
      const slots = await loadPlayerDeck(session, player.id);
      setSelectedIds(slots.map((slot) => slot.card_id));
    } catch (error) {
      setDeckError(error instanceof Error ? error.message : 'No se pudo cargar tu mazo.');
    } finally {
      setDeckLoading(false);
    }
  }, [player, session]);

  useEffect(() => {
    void loadDeck();
  }, [loadDeck]);

  const counts = useMemo(() => {
    return selectedIds.reduce<Record<string, number>>((result, id) => {
      result[id] = (result[id] ?? 0) + 1;
      return result;
    }, {});
  }, [selectedIds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return [...collection]
      .filter((card) => {
        if (rarity !== 'all' && card.rarity !== rarity) return false;
        if (faction !== 'all' && card.faction !== faction) return false;
        return !query || card.name.toLowerCase().includes(query) || card.code.toLowerCase().includes(query);
      })
      .sort((a, b) => {
        const rarityDifference = RARITIES.indexOf((a.rarity ?? 'Common') as typeof RARITIES[number]) - RARITIES.indexOf((b.rarity ?? 'Common') as typeof RARITIES[number]);
        return rarityDifference || (b.power ?? 0) - (a.power ?? 0) || a.name.localeCompare(b.name);
      });
  }, [collection, faction, rarity, search]);

  const selectedCards = useMemo(
    () => selectedIds.map((id) => collection.find((card) => card.card_id === id)).filter((card): card is PlayerCard => Boolean(card)),
    [collection, selectedIds],
  );
  const factionCounts = useMemo(
    () => selectedCards.reduce<Record<string, number>>((result, card) => {
      result[card.faction ?? 'Sin facción'] = (result[card.faction ?? 'Sin facción'] ?? 0) + 1;
      return result;
    }, {}),
    [selectedCards],
  );
  const factionList = Object.entries(factionCounts).sort((a, b) => b[1] - a[1]);
  const mythicCount = selectedCards.filter((card) => card.rarity === 'Mythic').length;
  const legendaryCount = selectedCards.filter((card) => card.rarity === 'Legendary').length;
  const power = deckPower(collection, selectedIds, championId);
  const tier = powerTier(power, colors);
  const eligibleChampions = selectedCards.filter((card) => card.rarity === 'Legendary' || card.rarity === 'Mythic')
    .filter((card, index, cards) => cards.findIndex((item) => item.card_id === card.card_id) === index);
  const hasFilters = Boolean(search || rarity !== 'all' || faction !== 'all');
  const deckReady =
    selectedIds.length >= MIN_DECK &&
    selectedIds.length <= MAX_DECK &&
    factionList.length <= 2 &&
    mythicCount <= MAX_MYTHIC &&
    legendaryCount <= MAX_LEGENDARY;
  const forgeState = deckReady
    ? { label: 'LISTA PARA LA ARENA', color: colors.success }
    : selectedIds.length === 0
      ? { label: 'NÚCLEO VACÍO', color: colors.mutedForeground }
      : { label: 'FORJA EN CURSO', color: colors.primary };

  const toggleCard = (card: PlayerCard) => {
    setMessage(null);
    setValidation(null);
    setSelectedIds((current) => {
      const count = current.filter((id) => id === card.card_id).length;
      if (count >= maxCopiesFor(card)) return current.filter((id) => id !== card.card_id);
      const rarityCount = current.reduce((total, id) => {
        const selectedCard = collection.find((item) => item.card_id === id);
        return total + (selectedCard?.rarity === card.rarity ? 1 : 0);
      }, 0);
      if (card.rarity === 'Mythic' && rarityCount >= MAX_MYTHIC) return current;
      if (card.rarity === 'Legendary' && rarityCount >= MAX_LEGENDARY) return current;
      if (current.length >= MAX_DECK || count >= card.quantity) return current;
      return [...current, card.card_id];
    });
  };

  const handleValidate = async () => {
    if (!session) return;
    if (selectedIds.length === 0) {
      setValidation({ valid: false, errors: ['El mazo está vacío.'], card_count: 0, mythic_count: 0, legendary_count: 0 });
      return;
    }
    setMessage(null);
    try {
      setValidation(await validateDeck(selectedIds, session));
    } catch (error) {
      setValidation({ valid: false, errors: [error instanceof Error ? error.message : 'No se pudo validar el mazo.'], card_count: selectedIds.length, mythic_count: 0, legendary_count: 0 });
    }
  };

  const handleSave = async () => {
    if (!session) return;
    if (!deckReady) {
      setMessage(
        selectedIds.length < MIN_DECK
          ? `El mazo necesita al menos ${MIN_DECK} cartas.`
          : factionList.length > 2
            ? 'El formato permite un máximo de 2 facciones.'
            : mythicCount > MAX_MYTHIC
              ? `El formato permite ${MAX_MYTHIC} carta Mítica por mazo.`
              : `El formato permite ${MAX_LEGENDARY} cartas Legendarias por mazo.`,
      );
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveDeck(selectedIds, session);
      if (!result.ok) {
        setMessage(result.reason ?? 'El servidor rechazó el guardado del mazo.');
      } else {
        setMessage(`Mazo guardado · ${result.slots_saved ?? selectedIds.length} cartas`);
        await loadDeck();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el mazo.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenArena = async () => {
    if (!deckReady) {
      setMessage(
        selectedIds.length < MIN_DECK
          ? `Añade al menos ${MIN_DECK} cartas antes de entrar en la Arena.`
          : 'Corrige los límites de facción y rareza antes de entrar en la Arena.',
      );
      return;
    }
    if (!session || saving) return;
    setSaving(true);
    setMessage(null);
    try {
      const result = await saveDeck(selectedIds, session);
      if (!result.ok) {
        setMessage(result.reason ?? 'El servidor rechazó el guardado del mazo.');
        return;
      }
      await loadDeck();
      router.push('/battle');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo preparar el mazo para la Arena.');
    } finally {
      setSaving(false);
    }
  };

  const resetDraft = () => {
    setSelectedIds([]);
    setChampionId(null);
    setValidation(null);
    setMessage('Borrador de forja reiniciado.');
  };

  const onRefresh = async () => {
    await Promise.all([refresh(), loadDeck()]);
  };

  return (
    <ScreenShell surface="forge">
      <View style={[styles.root, { backgroundColor: 'transparent' }]}>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.card_id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        scrollEnabled={filtered.length > 0}
        renderItem={({ item }) => (
          <DeckCard
            card={item}
            count={counts[item.card_id] ?? 0}
            selected={Boolean(counts[item.card_id])}
            disabled={
              selectedIds.length >= MAX_DECK ||
              (counts[item.card_id] ?? 0) >= maxCopiesFor(item) ||
              (counts[item.card_id] ?? 0) >= item.quantity ||
              (item.rarity === 'Mythic' && mythicCount >= MAX_MYTHIC) ||
              (item.rarity === 'Legendary' && legendaryCount >= MAX_LEGENDARY)
            }
            colors={colors}
            onPress={() => toggleCard(item)}
          />
        )}
        refreshControl={<RefreshControl refreshing={syncState === 'loading' || deckLoading} onRefresh={onRefresh} tintColor={colors.primary} />}
        contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: insets.bottom + 104, paddingHorizontal: 16 }}
        ListHeaderComponent={
          <View>
            <DomainHeader
              domain="forja"
              status={`Formato estándar · ${MIN_DECK}–${MAX_DECK} cartas · 2 copias · 2 facciones`}
            />

              <View testID="forge-core" style={[styles.powerPanel, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.accent}0B` }]}>
              <View style={styles.powerHeader}>
                <View>
                    <Text style={[styles.powerEyebrow, { color: colors.accent }]}>NÚCLEO DE LA FORJA</Text>
                    <Text style={[styles.powerCopy, { color: colors.mutedForeground }]}>La herramienta que llevarás a la Arena</Text>
                </View>
                <View style={styles.powerValue}>
                  <Feather name={tier.icon} size={18} color={tier.color} />
                  <Text style={[styles.powerNumber, { color: tier.color }]}>{power.toLocaleString()}</Text>
                  <Text style={[styles.powerTier, { color: tier.color, borderColor: `${tier.color}66`, backgroundColor: `${tier.color}16` }]}>{tier.label}</Text>
                </View>
              </View>
                <View style={[styles.forgeState, { borderColor: `${forgeState.color}66`, backgroundColor: `${forgeState.color}12` }]}>
                  <View style={[styles.forgeStateDot, { backgroundColor: forgeState.color }]} />
                  <Text style={[styles.forgeStateText, { color: forgeState.color }]}>{forgeState.label}</Text>
                </View>
              <ProgressBar value={(power / 2000) * 100} color={tier.color} />
              <View style={styles.powerFooter}>
                <Text style={[styles.counter, { color: selectedIds.length >= MIN_DECK ? colors.success : colors.danger }]}>{selectedIds.length}/{MAX_DECK} cartas</Text>
                <Text style={[styles.counter, { color: factionList.length > 2 ? colors.danger : colors.mutedForeground }]}>{factionList.length}/2 facciones</Text>
                <Text style={[styles.counter, { color: mythicCount > MAX_MYTHIC ? colors.danger : colors.mutedForeground }]}>Míticas {mythicCount}/{MAX_MYTHIC}</Text>
                <Text style={[styles.counter, { color: legendaryCount > MAX_LEGENDARY ? colors.danger : colors.mutedForeground }]}>Legendarias {legendaryCount}/{MAX_LEGENDARY}</Text>
              </View>
              <View style={styles.championSection}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESIGNAR CAMPEÓN · LEGENDARY / MYTHIC</Text>
                {eligibleChampions.length === 0 ? (
                  <Text style={[styles.helper, { color: colors.mutedForeground }]}>Añade una carta Legendary o Mythic para designar tu Campeón.</Text>
                ) : (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.championList}>
                    {eligibleChampions.map((card) => {
                      const active = championId === card.card_id;
                      const accent = rarityColor(card.rarity ?? 'Common', colors);
                      return (
                        <Pressable
                          key={card.card_id}
                          accessibilityRole="button"
                          accessibilityState={{ selected: active }}
                          onPress={() => setChampionId(active ? null : card.card_id)}
                          style={[styles.championChip, { borderColor: active ? accent : `${accent}55`, backgroundColor: active ? `${accent}18` : colors.panel }]}
                        >
                          {active ? <Feather name="award" size={12} color={accent} /> : null}
                          <Text style={[styles.championName, { color: active ? accent : colors.mutedForeground }]} numberOfLines={1}>{card.name}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>
                )}
              </View>
            </View>

            {factionList.length > 0 && (
              <View style={[styles.breakdown, { borderColor: colors.border, backgroundColor: colors.panel }]}>
                <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>LECTURA DE FORMACIÓN</Text>
                <View style={styles.breakdownRows}>
                  {factionList.map(([name, amount]) => (
                    <View key={name} style={styles.breakdownRow}>
                      <Text style={[styles.breakdownName, { color: factionColor(name, colors) }]}>{name}</Text>
                      <Text style={[styles.breakdownAmount, { color: colors.foreground }]}>{amount}</Text>
                    </View>
                  ))}
                </View>
                {factionList.length > 2 ? (
                  <Text style={[styles.warning, { color: colors.danger }]}><Feather name="alert-triangle" size={12} color={colors.danger} /> Máximo 2 facciones</Text>
                ) : null}
              </View>
            )}

            <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.panel }]}>
              <Feather name="search" size={17} color={colors.mutedForeground} />
              <TextInput
                testID="deck-search"
                accessibilityLabel="Buscar carta para el mazo"
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar nombre o código"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.searchInput, { color: colors.foreground }]}
                autoCorrect={false}
              />
              {search ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Limpiar búsqueda" onPress={() => setSearch('')}>
                  <Feather name="x-circle" size={17} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <FilterChip label="Todas" active={rarity === 'all'} colors={colors} onPress={() => setRarity('all')} />
              {RARITIES.map((value) => (
                <FilterChip key={value} label={rarityLabel(value)} active={rarity === value} colors={colors} accent={rarityColor(value, colors)} onPress={() => setRarity(rarity === value ? 'all' : value)} />
              ))}
            </ScrollView>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              <FilterChip label="Todas" active={faction === 'all'} colors={colors} onPress={() => setFaction('all')} />
              {FACTIONS.map((value) => (
                <FilterChip key={value} label={value} active={faction === value} colors={colors} accent={factionColor(value, colors)} onPress={() => setFaction(faction === value ? 'all' : value)} />
              ))}
            </ScrollView>

            <View style={styles.actionRow}>
              <Pressable testID="validate-deck" accessibilityRole="button" onPress={handleValidate} style={[styles.secondaryButton, { borderColor: `${colors.accent}77`, backgroundColor: colors.panel }]}>
                <Feather name="check-circle" size={15} color={colors.accent} />
                <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>VALIDAR</Text>
              </Pressable>
              <Pressable testID="save-deck" accessibilityRole="button" disabled={saving} onPress={handleSave} style={[styles.primaryButton, { backgroundColor: deckReady ? colors.primary : colors.muted, opacity: saving ? 0.7 : 1 }]}>
                {saving ? <ActivityIndicator color={colors.primaryForeground} size="small" /> : <Feather name="save" size={15} color={deckReady ? colors.primaryForeground : colors.mutedForeground} />}
                <Text style={[styles.primaryButtonText, { color: deckReady ? colors.primaryForeground : colors.mutedForeground }]}>{saving ? 'GUARDANDO' : 'GUARDAR MAZO'}</Text>
              </Pressable>
            </View>
            <View style={styles.quickActionRow}>
              <Pressable
                testID="reset-deck-draft"
                accessibilityRole="button"
                accessibilityLabel="Reiniciar el borrador de forja"
                onPress={resetDraft}
                style={({ pressed }) => [styles.quickAction, { borderColor: colors.border, backgroundColor: colors.panel, opacity: pressed ? 0.72 : 1 }]}
              >
                <Feather name="rotate-ccw" size={14} color={colors.mutedForeground} />
                <Text style={[styles.quickActionText, { color: colors.mutedForeground }]}>REINICIAR BORRADOR</Text>
              </Pressable>
              <Pressable
                testID="open-arena-from-forge"
                accessibilityRole="button"
                accessibilityLabel="Guardar el mazo y entrar en la Arena"
                disabled={saving}
                onPress={handleOpenArena}
                style={({ pressed }) => [
                  styles.quickAction,
                  { borderColor: deckReady ? `${colors.primary}88` : colors.border, backgroundColor: deckReady ? `${colors.primary}14` : colors.panel, opacity: pressed ? 0.72 : deckReady ? 1 : 0.5 },
                ]}
              >
                <Feather name="zap" size={14} color={deckReady ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.quickActionText, { color: deckReady ? colors.primary : colors.mutedForeground }]}>PROBAR EN ARENA</Text>
              </Pressable>
            </View>
            {validation && (
              <View style={[styles.validation, { borderColor: validation.valid ? `${colors.success}66` : `${colors.danger}66`, backgroundColor: validation.valid ? `${colors.success}12` : `${colors.danger}12` }]}>
                <Feather name={validation.valid ? 'check-circle' : 'alert-circle'} size={16} color={validation.valid ? colors.success : colors.danger} />
                <View style={styles.validationBody}>
                  <Text style={[styles.validationTitle, { color: validation.valid ? colors.success : colors.danger }]}>{validation.valid ? 'Mazo válido' : 'El servidor encontró problemas'}</Text>
                  {validation.errors.map((error, index) => <Text key={`${error}-${index}`} style={[styles.validationText, { color: colors.mutedForeground }]}>{error}</Text>)}
                </View>
              </View>
            )}
            {message ? <Text style={[styles.message, { color: message.startsWith('Mazo guardado') ? colors.success : colors.danger }]}>{message}</Text> : null}
            {deckError || syncState === 'offline' ? (
              <DomainState
                kind="error"
                title="La Forja no está sincronizada"
                message={deckError ?? syncError ?? 'No se pudo sincronizar tu colección.'}
                actionLabel="REINTENTAR SINCRONIZACIÓN"
                onAction={() => { void onRefresh(); }}
                testID="deck-sync-error"
              />
            ) : null}
            {collectionLoading || deckLoading ? (
              <DomainState kind="loading" title="Cargando tu formación" message="La Forja está consultando tu colección y tu mazo real." testID="deck-loading" />
            ) : null}
            {!collectionLoading && !deckLoading && collection.length > 0 ? (
              <Text style={[styles.results, { color: colors.mutedForeground }]}>
                {hasFilters ? `${filtered.length} resultados de ${collection.length}` : `${collection.length} cartas disponibles`}
              </Text>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          !collectionLoading && !deckLoading ? (
            <EmptyState
              title={hasFilters ? 'Sin coincidencias' : 'Sin cartas disponibles'}
              description={hasFilters ? 'Ninguna carta coincide con los filtros actuales.' : 'Necesitas cartas en tu colección para construir un mazo.'}
              colors={colors}
              action={hasFilters ? { label: 'LIMPIAR FILTROS', onPress: () => { setSearch(''); setRarity('all'); setFaction('all'); } } : undefined}
            />
          ) : null
        }
      />
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: { width: 34, height: 34, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  title: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 14 },
  subtitle: { fontSize: 12, marginTop: 5, lineHeight: 18 },
  powerPanel: { borderWidth: 1, borderRadius: 16, padding: 15, marginBottom: 12 },
  powerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  powerEyebrow: { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  powerCopy: { fontSize: 10, marginTop: 4 },
  powerValue: { alignItems: 'flex-end', gap: 4 },
  powerNumber: { fontSize: 24, fontWeight: '900' },
  powerTier: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 3, fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  forgeState: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 12, paddingHorizontal: 9, paddingVertical: 5, flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10 },
  forgeStateDot: { width: 6, height: 6, borderRadius: 3 },
  forgeStateText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  powerFooter: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', columnGap: 8, rowGap: 5, marginTop: 9 },
  counter: { fontSize: 11, fontWeight: '800' },
  championSection: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)', marginTop: 13, paddingTop: 12 },
  sectionLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  helper: { fontSize: 11, marginTop: 8, lineHeight: 16 },
  championList: { gap: 7, paddingTop: 8 },
  championChip: { borderWidth: 1, borderRadius: 16, paddingHorizontal: 10, paddingVertical: 7, flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: 170 },
  championName: { fontSize: 10, fontWeight: '800' },
  breakdown: { borderWidth: 1, borderRadius: 13, padding: 13, marginBottom: 12 },
  breakdownRows: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 100 },
  breakdownName: { fontSize: 12, fontWeight: '800' },
  breakdownAmount: { fontSize: 12, fontWeight: '900' },
  warning: { fontSize: 11, marginTop: 10, fontWeight: '700' },
  searchBox: { minHeight: 48, borderWidth: 1, borderRadius: 12, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12 },
  chips: { gap: 8, paddingVertical: 10 },
  chip: { borderWidth: 1, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 7 },
  chipText: { fontSize: 11, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 9, marginTop: 4, marginBottom: 10 },
  quickActionRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  quickAction: { flex: 1, minHeight: 40, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 6, paddingHorizontal: 8 },
  quickActionText: { fontSize: 9, fontWeight: '900', letterSpacing: 0.45, textAlign: 'center' },
  primaryButton: { flex: 1, minHeight: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 10 },
  primaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  secondaryButton: { minHeight: 44, borderWidth: 1, borderRadius: 11, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7, paddingHorizontal: 14 },
  secondaryButtonText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  validation: { borderWidth: 1, borderRadius: 11, padding: 11, flexDirection: 'row', gap: 9, marginBottom: 8 },
  validationBody: { flex: 1 },
  validationTitle: { fontSize: 12, fontWeight: '900' },
  validationText: { fontSize: 11, lineHeight: 17, marginTop: 2 },
  message: { fontSize: 12, lineHeight: 18, marginBottom: 8 },
  error: { borderWidth: 1, borderRadius: 11, padding: 11, flexDirection: 'row', gap: 9, alignItems: 'center', marginBottom: 8 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18 },
  loading: { alignItems: 'center', gap: 9, paddingVertical: 25 },
  loadingText: { fontSize: 10, fontWeight: '800', letterSpacing: 1.1 },
  results: { fontSize: 12, fontWeight: '700', marginBottom: 9 },
  gridRow: { gap: 10, marginBottom: 10 },
  card: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  cardArt: { aspectRatio: 0.78, borderBottomWidth: 1, overflow: 'hidden', position: 'relative' },
  artFallback: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12 },
  artFallbackText: { fontSize: 9, fontWeight: '900', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.7, lineHeight: 14 },
  artShade: { ...StyleSheet.absoluteFillObject },
  countBadge: { position: 'absolute', top: 7, right: 7, borderRadius: 12, paddingHorizontal: 7, paddingVertical: 4 },
  countText: { fontSize: 10, fontWeight: '900' },
  cardBody: { padding: 10 },
  cardRarity: { fontSize: 9, fontWeight: '900', textTransform: 'uppercase' },
  cardName: { fontSize: 13, fontWeight: '800', marginTop: 3 },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4, marginTop: 7 },
  cardFaction: { flex: 1, fontSize: 9, fontWeight: '800' },
  cardPower: { fontSize: 9, fontWeight: '900' },
  cardQuantity: { fontSize: 9, marginTop: 6 },
  empty: { borderWidth: 1, borderRadius: 14, padding: 28, alignItems: 'center', gap: 10, marginTop: 4 },
  emptySeal: { width: 60, height: 60, borderWidth: 1, borderRadius: 20, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '45deg' }] },
  emptyTitle: { fontSize: 17, fontWeight: '800', marginTop: 3 },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: 'center' },
  clearButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 9, marginTop: 4 },
  clearButtonText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.7 },
});