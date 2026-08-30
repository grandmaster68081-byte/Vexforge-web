import { Feather } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useGame } from '@/context/GameContext';
import { ScreenShell } from '@/components/ScreenShell';
import { loadPlayerDeck } from '@/lib/supabase';
import type { BattleResult, BattleTurn, DeckSlot, Opponent } from '@/lib/supabase';
import { ForgeFormationPreview } from '@/components/ForgeFormationPreview';

type Phase = 'lobby' | 'confirm' | 'replay' | 'result';

function rankName(mmr: number) {
  if (mmr >= 3000) return 'MYTHIC';
  if (mmr >= 2400) return 'DIAMOND';
  if (mmr >= 1800) return 'PLATINUM';
  if (mmr >= 1300) return 'GOLD';
  if (mmr >= 900) return 'SILVER';
  if (mmr >= 500) return 'BRONZE';
  return 'IRON';
}

function factionColor(faction: string | undefined, colors: ReturnType<typeof useColors>) {
  return {
    Guerrero: colors.danger,
    Mago: colors.rarityRare,
    Paladín: colors.accent,
    Pícaro: colors.rarityEpic,
  }[faction ?? ''] ?? colors.mutedForeground;
}

function resultTitle(result: BattleResult) {
  if (!result.ok) return 'Resolución rechazada';
  return result.you_won ? 'Victoria confirmada' : 'Derrota registrada';
}

function hpPercent(hp: number | undefined, max: number | undefined) {
  if (typeof hp !== 'number' || typeof max !== 'number' || max <= 0) return null;
  return Math.max(0, Math.min(100, (hp / max) * 100));
}

function OpponentRow({
  opponent,
  selected,
  disabled,
  colors,
  onPress,
}: {
  opponent: Opponent;
  selected: boolean;
  disabled: boolean;
  colors: ReturnType<typeof useColors>;
  onPress: () => void;
}) {
  const tier = rankName(opponent.mmr);
  return (
    <Pressable
      testID={`battle-opponent-${opponent.player_id}`}
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar oponente ${opponent.display_name}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.opponent,
        {
          backgroundColor: selected ? `${colors.primary}14` : colors.panel,
          borderColor: selected ? colors.primary : colors.border,
          opacity: pressed ? 0.78 : disabled ? 0.55 : 1,
        },
      ]}
    >
      <View style={[styles.rankSeal, { borderColor: `${colors.accent}88`, backgroundColor: colors.panelStrong }]}>
        <Feather name="shield" size={18} color={colors.accent} />
      </View>
      <View style={styles.opponentCopy}>
        <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>{opponent.display_name}</Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]}>{tier} · {opponent.mmr} MMR</Text>
        <Text style={[styles.record, { color: colors.mutedForeground }]}>{opponent.wins} victorias · {opponent.losses} derrotas</Text>
      </View>
      <Feather name={selected ? 'check-circle' : 'chevron-right'} size={19} color={selected ? colors.primary : colors.mutedForeground} />
    </Pressable>
  );
}

function BattleCard({
  label,
  actor,
  side,
  colors,
}: {
  label: string;
  actor: BattleTurn['attacker'] | BattleTurn['defender'];
  side: string;
  colors: ReturnType<typeof useColors>;
}) {
  const accent = factionColor(actor?.faction, colors);
  const percent = hpPercent(actor?.hp, actor?.max_hp);
  return (
    <View style={[styles.unitCard, { backgroundColor: colors.panel, borderColor: actor ? accent : colors.border }]}>
      <View style={styles.unitHeader}>
        <Text style={[styles.unitSide, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.unitFaction, { color: accent }]}>{actor?.faction ?? side}</Text>
      </View>
      <View style={[styles.unitSeal, { borderColor: `${accent}88`, backgroundColor: `${accent}14` }]}>
        <Feather name={side === 'a' ? 'zap' : 'target'} size={19} color={accent} />
      </View>
      <Text style={[styles.unitName, { color: colors.foreground }]} numberOfLines={2}>{actor?.name ?? 'Unidad no disponible'}</Text>
      <Text style={[styles.unitRarity, { color: accent }]}>{actor?.rarity ?? 'REGISTRO OFICIAL'}</Text>
      {percent !== null ? (
        <>
          <View style={[styles.hpTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.hpFill, { width: `${percent}%`, backgroundColor: percent > 35 ? colors.success : colors.danger }]} />
          </View>
          <Text style={[styles.hpText, { color: colors.mutedForeground }]}>{actor?.hp} / {actor?.max_hp} HP</Text>
        </>
      ) : null}
    </View>
  );
}

function TurnView({
  turn,
  index,
  total,
  colors,
}: {
  turn: BattleTurn;
  index: number;
  total: number;
  colors: ReturnType<typeof useColors>;
}) {
  const attackerSide = turn.atk_side === 'b' ? 'b' : 'a';
  const damage = typeof turn.damage === 'number' ? turn.damage : 0;
  const eventLabels = (turn.events ?? []).map((event) => {
    if (event.type === 'shield_block') return 'Barrera activada';
    if (event.type === 'poisoned' || event.type === 'poison_tick') return 'Veneno';
    if (event.type === 'lifesteal') return 'Drenaje';
    if (event.type === 'double_strike') return 'Doble golpe';
    if (event.type === 'poison_death') return 'Unidad derrotada';
    return 'Efecto de carta';
  });
  return (
    <View testID="battle-turn-view" accessibilityLiveRegion="polite">
      <View style={styles.turnHeader}>
        <Text style={[styles.turnKicker, { color: colors.primary }]}>TURNO {turn.turn || index + 1}</Text>
        <Text style={[styles.turnCount, { color: colors.mutedForeground }]}>{index + 1}/{total}</Text>
      </View>
      <View style={styles.vsRow}>
        <BattleCard label={attackerSide === 'a' ? 'TU UNIDAD' : 'OPONENTE'} actor={turn.attacker} side={attackerSide} colors={colors} />
        <View style={styles.impact}>
          <Text style={[styles.impactLabel, { color: colors.mutedForeground }]}>IMPACTO</Text>
          <Text style={[styles.damage, { color: turn.is_crit ? colors.accent : colors.danger }]}>{damage}</Text>
          <Text style={[styles.impactType, { color: turn.is_kill ? colors.danger : colors.mutedForeground }]}>{turn.is_kill ? 'DERROTA' : turn.is_crit ? 'CRÍTICO' : 'DAÑO'}</Text>
        </View>
        <BattleCard label={attackerSide === 'a' ? 'OPONENTE' : 'TU UNIDAD'} actor={turn.defender} side={attackerSide === 'a' ? 'b' : 'a'} colors={colors} />
      </View>
      {eventLabels.length > 0 ? (
        <View style={[styles.eventRail, { borderColor: `${colors.accent}44`, backgroundColor: `${colors.accent}0D` }]}>
          <Feather name="activity" size={14} color={colors.accent} />
          <Text style={[styles.eventText, { color: colors.accent }]}>{eventLabels.join(' · ')}</Text>
        </View>
      ) : null}
      <View style={styles.aliveRow}>
        <Text style={[styles.aliveText, { color: colors.mutedForeground }]}>Unidades activas</Text>
        <Text style={[styles.aliveText, { color: colors.foreground }]}>Tú {turn.alive_a ?? '—'} · Rival {turn.alive_b ?? '—'}</Text>
      </View>
    </View>
  );
}

function ResultPanel({
  result,
  colors,
  onDismiss,
}: {
  result: BattleResult;
  colors: ReturnType<typeof useColors>;
  onDismiss: () => void;
}) {
  const won = Boolean(result.ok && result.you_won);
  return (
    <View testID="battle-result" style={[styles.result, { backgroundColor: won ? `${colors.success}10` : `${colors.danger}0E`, borderColor: won ? colors.success : colors.danger }]}>
      <View style={[styles.resultSeal, { borderColor: won ? colors.success : colors.danger }]}>
        <Feather name={won ? 'check' : 'x'} size={26} color={won ? colors.success : colors.danger} />
      </View>
      <Text style={[styles.resultTitle, { color: won ? colors.success : colors.danger }]}>{resultTitle(result)}</Text>
      <Text style={[styles.resultCopy, { color: colors.mutedForeground }]}>
        {result.ok ? `${result.player_name ?? 'Tú'} contra ${result.opponent_name ?? 'Oponente'}` : result.error ?? result.reason ?? 'El servidor no completó el combate.'}
      </Text>
      {result.ok ? (
        <View style={styles.resultStats}>
          <View style={styles.resultStat}><Text style={[styles.resultValue, { color: colors.foreground }]}>{result.total_turns ?? result.turns?.length ?? 0}</Text><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>TURNOS</Text></View>
          <View style={styles.resultStat}><Text style={[styles.resultValue, { color: result.elo_change && result.elo_change > 0 ? colors.success : colors.danger }]}>{result.elo_change && result.elo_change > 0 ? '+' : ''}{result.elo_change ?? 0}</Text><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>MMR</Text></View>
          <View style={styles.resultStat}><Text style={[styles.resultValue, { color: colors.accent }]}>{result.match_id ? result.match_id.slice(0, 8).toUpperCase() : '—'}</Text><Text style={[styles.resultLabel, { color: colors.mutedForeground }]}>MATCH</Text></View>
        </View>
      ) : null}
      <Pressable testID="battle-close-result" accessibilityRole="button" onPress={onDismiss} style={[styles.closeResult, { borderColor: colors.border }]}>
        <Text style={[styles.closeResultText, { color: colors.foreground }]}>VOLVER A LA ARENA</Text>
      </Pressable>
    </View>
  );
}

export default function BattleScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    session,
    opponents,
    findOpponents,
    startBattle,
    battleLoading,
    battleResult,
    authError,
    clearBattleResult,
  } = useGame();
  const [phase, setPhase] = useState<Phase>('lobby');
  const [selectedOpponent, setSelectedOpponent] = useState<Opponent | null>(null);
  const [searching, setSearching] = useState(false);
  const [turnIndex, setTurnIndex] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [formationSlots, setFormationSlots] = useState<DeckSlot[]>([]);
  const [formationLoading, setFormationLoading] = useState(false);
  const [formationError, setFormationError] = useState<string | null>(null);
  const turns = battleResult?.turns ?? [];
  const currentTurn = turns[turnIndex] ?? null;

  const refreshFormation = async () => {
    if (!session) return;
    setFormationLoading(true);
    setFormationError(null);
    try {
      setFormationSlots(await loadPlayerDeck(session, session.user.id));
    } catch (error) {
      setFormationError(error instanceof Error ? error.message : 'No se pudo cargar tu formación real.');
    } finally {
      setFormationLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setFormationSlots([]);
      return;
    }
    void refreshFormation();
  }, [session]);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion).catch(() => {});
  }, []);

  useEffect(() => {
    if (!battleResult) return;
    setLocalError(null);
    if (!battleResult.ok) {
      setPhase('lobby');
      setLocalError(battleResult.error ?? battleResult.reason ?? 'El servidor rechazó la resolución.');
      return;
    }
    setTurnIndex(0);
    setPhase(turns.length > 0 ? 'replay' : 'result');
  }, [battleResult, turns.length]);

  useEffect(() => {
    if (phase !== 'replay' || reducedMotion || turns.length === 0 || turnIndex >= turns.length - 1) return;
    const timer = setTimeout(() => setTurnIndex((current) => Math.min(current + 1, turns.length - 1)), 1600);
    return () => clearTimeout(timer);
  }, [phase, reducedMotion, turnIndex, turns.length]);

  const sortedOpponents = useMemo(
    () => [...opponents].sort((a, b) => Math.abs(a.mmr - 1000) - Math.abs(b.mmr - 1000)),
    [opponents],
  );

  if (!session) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Feather name="lock" size={28} color={colors.primary} />
        <Text style={[styles.title, { color: colors.foreground }]}>Arena protegida</Text>
        <Text style={[styles.copy, { color: colors.mutedForeground }]}>Inicia sesión para competir en el combate real de VEXFORGE.</Text>
      </View>
    );
  }

  const handleFind = async () => {
    setSearching(true);
    setLocalError(null);
    try {
      await findOpponents();
    } finally {
      setSearching(false);
    }
  };

  const handleStartBattle = async () => {
    if (!selectedOpponent) return;
    setPhase('lobby');
    setLocalError(null);
    await startBattle(selectedOpponent.player_id);
  };

  const handleDismiss = () => {
    clearBattleResult();
    setSelectedOpponent(null);
    setTurnIndex(0);
    setPhase('lobby');
  };

  return (
    <ScreenShell surface="pvp">
      <ScrollView
      testID="battle-screen"
      style={{ backgroundColor: 'transparent' }}
      contentContainerStyle={[styles.screen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 108 }]}
      refreshControl={<RefreshControl refreshing={searching} onRefresh={handleFind} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View style={[styles.headingSeal, { borderColor: colors.primary, backgroundColor: `${colors.primary}12` }]}>
          <Feather name="zap" size={18} color={colors.primary} />
        </View>
        <View>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>VEXFORGE / P1</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>Arena oficial</Text>
        </View>
      </View>
      <Text style={[styles.copy, { color: colors.mutedForeground }]}>Cada combate se resuelve en Supabase y llega a tu dispositivo como evidencia de la partida. El cliente no calcula victorias, daño ni recompensas.</Text>

      {phase === 'replay' && currentTurn && battleResult ? (
        <View testID="battle-replay">
          <View style={[styles.liveBanner, { borderColor: `${colors.primary}66`, backgroundColor: `${colors.primary}0D` }]}>
            <View style={[styles.liveDot, { backgroundColor: colors.success }]} />
            <Text style={[styles.liveText, { color: colors.success }]}>RESOLUCIÓN RECIBIDA · {battleResult.engine ?? 'MOTOR OFICIAL'}</Text>
          </View>
          <TurnView turn={currentTurn} index={turnIndex} total={turns.length} colors={colors} />
          <Pressable
            testID="battle-next-turn"
            accessibilityRole="button"
            onPress={() => {
              if (turnIndex >= turns.length - 1) setPhase('result');
              else setTurnIndex((current) => current + 1);
            }}
            style={[styles.button, { backgroundColor: colors.primary }]}
          >
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{turnIndex >= turns.length - 1 ? 'VER RESULTADO' : reducedMotion ? 'SIGUIENTE TURNO' : 'CONTINUAR LECTURA'}</Text>
            <Feather name={turnIndex >= turns.length - 1 ? 'award' : 'arrow-right'} size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      ) : phase === 'result' && battleResult ? (
        <ResultPanel result={battleResult} colors={colors} onDismiss={handleDismiss} />
      ) : (
        <>
          <ForgeFormationPreview
            slots={formationSlots}
            loading={formationLoading}
            error={formationError}
            colors={colors}
            onRetry={() => { void refreshFormation(); }}
          />
          <View style={[styles.statusPanel, { backgroundColor: colors.panel, borderColor: colors.border }]}>
            <View style={styles.statusCopy}>
              <Text style={[styles.statusTitle, { color: colors.foreground }]}>MOTOR DE COMBATE</Text>
              <Text style={[styles.statusBody, { color: colors.mutedForeground }]}>RPC autoritativa · RLS activa · sin simulación local</Text>
            </View>
            <Feather name="radio" size={19} color={colors.success} />
          </View>
          <Pressable
            testID="battle-find-opponents"
            accessibilityRole="button"
            disabled={searching || battleLoading}
            onPress={handleFind}
            style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.78 : searching ? 0.65 : 1 }]}
          >
            {searching ? <ActivityIndicator color={colors.primaryForeground} /> : <Feather name="search" size={17} color={colors.primaryForeground} />}
            <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>{searching ? 'BUSCANDO OPONENTES' : 'BUSCAR OPONENTES'}</Text>
          </Pressable>
          {selectedOpponent ? (
            <View testID="battle-confirmation" style={[styles.confirmation, { backgroundColor: colors.panelStrong, borderColor: colors.accent }]}>
              <Text style={[styles.sectionLabel, { color: colors.accent }]}>CONFIRMAR DESAFÍO</Text>
              <Text style={[styles.confirmTitle, { color: colors.foreground }]}>{selectedOpponent.display_name}</Text>
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{rankName(selectedOpponent.mmr)} · {selectedOpponent.mmr} MMR · diferencia {selectedOpponent.mmr - 1000 >= 0 ? '+' : ''}{selectedOpponent.mmr - 1000}</Text>
              <View style={styles.confirmActions}>
                <Pressable accessibilityRole="button" disabled={battleLoading} onPress={() => setSelectedOpponent(null)} style={[styles.cancelButton, { borderColor: colors.border }]}>
                  <Text style={[styles.cancelText, { color: colors.mutedForeground }]}>CANCELAR</Text>
                </Pressable>
                <Pressable testID="battle-confirm" accessibilityRole="button" disabled={battleLoading || formationSlots.length < 3} onPress={handleStartBattle} style={[styles.confirmButton, { backgroundColor: colors.accent, opacity: battleLoading || formationSlots.length < 3 ? 0.7 : 1 }]}>
                  {battleLoading ? <ActivityIndicator color={colors.accentForeground} /> : <Feather name="crosshair" size={16} color={colors.accentForeground} />}
                  <Text style={[styles.confirmText, { color: colors.accentForeground }]}>{battleLoading ? 'RESOLVIENDO' : 'INICIAR COMBATE'}</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>OPONENTES DISPONIBLES</Text>
          {sortedOpponents.length === 0 ? (
            <View style={[styles.empty, { backgroundColor: colors.panel, borderColor: colors.border }]}>
              <Feather name="compass" size={25} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>La arena está en espera</Text>
              <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Busca oponentes para cargar la clasificación viva. Si no aparecen, vuelve a intentarlo.</Text>
            </View>
          ) : sortedOpponents.map((opponent) => (
            <OpponentRow
              key={opponent.player_id}
              opponent={opponent}
              selected={selectedOpponent?.player_id === opponent.player_id}
              disabled={battleLoading}
              colors={colors}
              onPress={() => setSelectedOpponent(opponent)}
            />
          ))}
          {(localError || authError) ? (
            <View style={[styles.error, { borderColor: `${colors.danger}66`, backgroundColor: `${colors.danger}12` }]}>
              <Feather name="alert-circle" size={17} color={colors.danger} />
              <Text style={[styles.errorText, { color: colors.danger }]}>{localError ?? authError}</Text>
            </View>
          ) : null}
        </>
      )}
      </ScrollView>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  screen: { paddingHorizontal: 18, gap: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 2 },
  headingSeal: { width: 42, height: 42, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { fontSize: 29, fontWeight: '800', marginTop: 4 },
  copy: { fontSize: 13, lineHeight: 20, marginBottom: 8 },
  statusPanel: { borderWidth: 1, borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center' },
  statusCopy: { flex: 1 },
  statusTitle: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  statusBody: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  button: { minHeight: 50, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, paddingHorizontal: 18, marginBottom: 7 },
  buttonText: { fontSize: 11, fontWeight: '900', letterSpacing: 0.9 },
  sectionLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: 4 },
  opponent: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 16, padding: 14 },
  rankSeal: { width: 40, height: 40, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  opponentCopy: { flex: 1, minWidth: 0 },
  name: { fontSize: 15, fontWeight: '800' },
  meta: { fontSize: 11, marginTop: 4 },
  record: { fontSize: 10, marginTop: 3 },
  confirmation: { borderWidth: 1, borderRadius: 16, padding: 15, gap: 6 },
  confirmTitle: { fontSize: 20, fontWeight: '800', marginTop: 2 },
  confirmActions: { flexDirection: 'row', gap: 9, marginTop: 10 },
  cancelButton: { minHeight: 44, borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, alignItems: 'center', justifyContent: 'center' },
  cancelText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
  confirmButton: { flex: 1, minHeight: 44, borderRadius: 11, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 7 },
  confirmText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 25, alignItems: 'center', gap: 9 },
  emptyTitle: { fontSize: 17, fontWeight: '800' },
  emptyCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center' },
  error: { borderWidth: 1, borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9 },
  errorText: { flex: 1, fontSize: 12, lineHeight: 18 },
  liveBanner: { borderWidth: 1, borderRadius: 12, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },
  liveText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  turnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 },
  turnKicker: { fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  turnCount: { fontSize: 11, fontWeight: '700' },
  vsRow: { flexDirection: 'row', gap: 7, alignItems: 'stretch', marginTop: 8 },
  unitCard: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 14, padding: 10 },
  unitHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 },
  unitSide: { fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  unitFaction: { flex: 1, textAlign: 'right', fontSize: 8, fontWeight: '800' },
  unitSeal: { width: 38, height: 38, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  unitName: { fontSize: 12, lineHeight: 16, fontWeight: '800', marginTop: 8, minHeight: 32 },
  unitRarity: { fontSize: 8, fontWeight: '900', letterSpacing: 0.4, marginTop: 4 },
  hpTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 10 },
  hpFill: { height: '100%', borderRadius: 3 },
  hpText: { fontSize: 9, marginTop: 4 },
  impact: { width: 46, alignItems: 'center', justifyContent: 'center' },
  impactLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  damage: { fontSize: 21, fontWeight: '900', marginTop: 4 },
  impactType: { fontSize: 7, fontWeight: '900', marginTop: 1 },
  eventRail: { borderWidth: 1, borderRadius: 10, padding: 9, flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 9 },
  eventText: { flex: 1, fontSize: 10, fontWeight: '800' },
  aliveRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  aliveText: { fontSize: 10, fontWeight: '700' },
  result: { borderWidth: 1, borderRadius: 18, padding: 20, alignItems: 'center', marginTop: 8 },
  resultSeal: { width: 62, height: 62, borderWidth: 1, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '900', marginTop: 14, textAlign: 'center' },
  resultCopy: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
  resultStats: { flexDirection: 'row', width: '100%', justifyContent: 'space-around', marginTop: 20, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.12)' },
  resultStat: { alignItems: 'center', minWidth: 70 },
  resultValue: { fontSize: 18, fontWeight: '900' },
  resultLabel: { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  closeResult: { minHeight: 42, borderWidth: 1, borderRadius: 10, paddingHorizontal: 17, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  closeResultText: { fontSize: 10, fontWeight: '900', letterSpacing: 0.7 },
});
    