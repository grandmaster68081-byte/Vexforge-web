import { Feather } from '@/components/ForgeIcon';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { BattleTurn, BattleUnit } from '@/lib/supabase';

type Role = 'VANGUARDIA' | 'CAMPEÓN' | 'CENTINELA';
type DisplayRole = Role | 'RESERVA' | 'CAÍDA' | 'SIN POSICIÓN';
type Side = 'a' | 'b';
type BattleOutcome = 'victory' | 'defeat' | 'draw';
type Colors = ReturnType<typeof useColors>;

type Props = {
  finalUnits: BattleUnit[];
  currentTurn: BattleTurn | null;
  turnIndex: number;
  totalTurns: number;
  reducedMotion: boolean;
  youWon?: boolean;
  outcome?: BattleOutcome;
};

const ROLE_LABELS: Record<Role, string> = {
  VANGUARDIA: 'vanguard',
  CAMPEÓN: 'champion',
  CENTINELA: 'sentinel',
};

function roleForUnit(unit: BattleUnit): DisplayRole {
  const slot = String(unit.slot ?? '').toLowerCase();
  if (unit.is_champion || slot.includes('champ')) return 'CAMPEÓN';
  if (slot.includes('vanguard')) return 'VANGUARDIA';
  if (slot.includes('sentinel')) return 'CENTINELA';
  if (unit.in_reserve || slot.includes('reserve')) return 'RESERVA';
  if (slot.includes('fallen')) return 'CAÍDA';
  if (unit.alive === false) return 'CAÍDA';
  return 'SIN POSICIÓN';
}

function factionColor(faction: string | undefined, colors: Colors) {
  return {
    Guerrero: colors.danger,
    Mago: colors.rarityRare,
    Paladín: colors.accent,
    Pícaro: colors.rarityEpic,
  }[faction ?? ''] ?? colors.primary;
}

function textSignal(value: string | null | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function numberSignal(value: number | null | undefined, fallback: string) {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : fallback;
}

function hpSignal(unit: BattleUnit) {
  const current = numberSignal(unit.hp, 'HP ACTUAL NO REPORTADO');
  const maximum = numberSignal(unit.max_hp, 'HP MÁXIMO NO REPORTADO');
  return `${current} / ${maximum} HP`;
}

function eventLabel(turn: BattleTurn | null) {
  if (!turn) return 'FORMACIÓN LISTA';
  if (turn.is_kill) return 'UNIDAD ELIMINADA';
  if (turn.is_crit) return 'IMPACTO CRÍTICO';
  const event = turn.events?.[0];
  if (event?.type === 'shield_block') return 'GUARDIA ACTIVADA';
  if (event?.type === 'poison_death') return 'UNIDAD ELIMINADA POR VENENO';
  if (event?.type === 'poisoned' || event?.type === 'poison_tick') return 'VENENO CONFIRMADO';
  if (event?.type === 'lifesteal') return 'DRENAJE';
  if (event?.type === 'double_strike') return 'DOBLE GOLPE';
  if (typeof turn.damage === 'number' && turn.damage > 0) return 'IMPACTO CONFIRMADO';
  return 'EVENTO NO REPORTADO';
}

function hpPercent(unit: BattleUnit) {
  const hp = unit.hp;
  const max = unit.max_hp;
  if (typeof hp !== 'number' || !Number.isFinite(hp) || typeof max !== 'number' || !Number.isFinite(max) || max <= 0) return null;
  return Math.max(0, Math.min(100, (hp / max) * 100));
}

function UnitCard({
  unit,
  role,
  active,
  targeted,
  reducedMotion,
  colors,
  side,
}: {
  unit: BattleUnit | null;
  role: Role;
  active: boolean;
  targeted: boolean;
  reducedMotion: boolean;
  colors: Colors;
  side: Side;
}) {
  const pulse = useRef(new Animated.Value(1)).current;
  const accent = unit ? factionColor(unit.faction, colors) : colors.border;
  const percent = unit ? hpPercent(unit) : null;
  const name = unit ? textSignal(unit.name, 'IDENTIDAD NO REPORTADA') : 'POSICIÓN VACÍA';
  const faction = unit ? textSignal(unit.faction, 'FACCIÓN NO REPORTADA') : 'UNIDAD NO REPORTADA';

  useEffect(() => {
    if (reducedMotion || (!active && !targeted)) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.035, duration: 420, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 420, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [active, targeted, reducedMotion, pulse]);

  const label = unit ? `${role}. ${name}. ${hpSignal(unit)}.` : `${role}. POSICIÓN VACÍA.`;
  return (
    <Animated.View
      testID={`battlefield-${side}-${ROLE_LABELS[role]}`}
      accessible
      accessibilityLabel={label}
      style={[
        styles.unitCard,
        role === 'CAMPEÓN' ? styles.championCard : null,
        { borderColor: active ? colors.accent : targeted ? colors.danger : accent, backgroundColor: `${colors.panelStrong}F2`, transform: [{ scale: pulse }] },
      ]}
    >
      <View style={styles.roleRow}>
        <Text style={[styles.roleText, { color: active ? colors.accent : accent }]}>{role}</Text>
        {unit?.alive === false ? <Text style={[styles.fallenText, { color: colors.danger }]}>CAÍDO</Text> : null}
      </View>
      {unit?.image_url ? (
        <Image source={{ uri: unit.image_url }} resizeMode="cover" style={[styles.unitArt, role === 'CAMPEÓN' ? styles.championArt : null]} />
      ) : (
        <View style={[styles.artMissing, { borderColor: colors.border }]}>
          <Feather name="image" size={18} color={colors.mutedForeground} />
          <Text style={[styles.artMissingText, { color: colors.mutedForeground }]}>ARTE NO DISPONIBLE</Text>
        </View>
      )}
      <Text style={[styles.unitName, { color: colors.foreground }]} numberOfLines={2}>{name}</Text>
      <Text style={[styles.unitFaction, { color: accent }]} numberOfLines={1}>{faction}</Text>
      {unit ? (
        <>
          {percent !== null ? (
            <View style={[styles.hpTrack, { backgroundColor: colors.muted }]}>
              <View style={[styles.hpFill, { width: `${percent}%`, backgroundColor: percent > 35 ? colors.success : colors.danger }]} />
            </View>
          ) : null}
          <Text style={[styles.hpText, { color: colors.mutedForeground }]}>{hpSignal(unit)}</Text>
          <View style={styles.keywordRow}>
            {(unit.keywords ?? []).slice(0, 2).map((keyword) => (
              <View key={keyword} style={[styles.keyword, { borderColor: `${accent}88`, backgroundColor: `${accent}18` }]}>
                <Text style={[styles.keywordText, { color: accent }]}>{keyword.toUpperCase()}</Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </Animated.View>
  );
}

function ReserveRail({ units, colors, side }: { units: BattleUnit[]; colors: Colors; side: Side }) {
  return (
    <View testID={`battlefield-${side}-reserve`} accessible accessibilityLabel={`${side === 'a' ? 'Tu' : 'Rival'} reserva. ${units.length} cartas.`} style={styles.reserveRail}>
      <View style={styles.reserveHeader}>
        <Feather name="layers" size={13} color={colors.mutedForeground} />
        <Text style={[styles.reserveTitle, { color: colors.mutedForeground }]}>RESERVA</Text>
      </View>
      <View style={styles.reserveItems}>
        {units.length > 0 ? units.map((unit, index) => (
          <View key={`${unit.id ?? unit.name ?? 'reserve'}-${index}`} style={[styles.reserveItem, { borderColor: factionColor(unit.faction, colors) }]}>
            {unit.image_url ? <Image source={{ uri: unit.image_url }} resizeMode="cover" style={styles.reserveArt} /> : <Feather name="image" size={12} color={colors.mutedForeground} />}
          </View>
        )) : <Text style={[styles.emptyReserve, { color: colors.mutedForeground }]}>RESERVA VACÍA</Text>}
      </View>
    </View>
  );
}

function StateRail({
  units,
  colors,
  label,
  accessibilityLabel,
  testID,
}: {
  units: BattleUnit[];
  colors: Colors;
  label: string;
  accessibilityLabel: string;
  testID: string;
}) {
  return (
    <View testID={testID} accessible accessibilityLabel={accessibilityLabel} style={styles.stateRail}>
      <View style={styles.reserveHeader}>
        <Feather name="alert-circle" size={13} color={colors.mutedForeground} />
        <Text style={[styles.reserveTitle, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <View style={styles.reserveItems}>
        {units.map((unit, index) => (
          <View key={`${unit.id ?? unit.name ?? 'state'}-${index}`} style={[styles.reserveItem, { borderColor: unit.alive === false ? colors.danger : colors.border }]}>
            {unit.image_url ? <Image source={{ uri: unit.image_url }} resizeMode="cover" style={styles.reserveArt} /> : <Feather name="image" size={12} color={colors.mutedForeground} />}
          </View>
        ))}
      </View>
    </View>
  );
}

export function ForgeBattlefield({ finalUnits, currentTurn, turnIndex, totalTurns, reducedMotion, youWon, outcome }: Props) {
  const colors = useColors();
  const resolvedOutcome = outcome ?? (typeof youWon === 'boolean' ? (youWon ? 'victory' : 'defeat') : undefined);
  const unitsBySide = useMemo(() => {
    const result: Record<Side, BattleUnit[]> & { unknown: BattleUnit[] } = { a: [], b: [], unknown: [] };
    finalUnits.forEach((unit) => {
      if (unit.side === 'a' || unit.side === 'b') {
        result[unit.side].push(unit);
      } else {
        result.unknown.push(unit);
      }
    });
    return result;
  }, [finalUnits]);

  const activeName = currentTurn?.attacker?.name;
  const targetName = currentTurn?.defender?.name;
  const renderSide = (side: Side) => {
    const classified = unitsBySide[side].map((unit) => ({ unit, role: roleForUnit(unit) }));
    const activeUnits = classified.filter((entry) => entry.role === 'VANGUARDIA' || entry.role === 'CAMPEÓN' || entry.role === 'CENTINELA');
    const reserveUnits = classified.filter((entry) => entry.role === 'RESERVA').map((entry) => entry.unit);
    const fallenUnits = classified.filter((entry) => entry.role === 'CAÍDA').map((entry) => entry.unit);
    const unassignedUnits = classified.filter((entry) => entry.role === 'SIN POSICIÓN').map((entry) => entry.unit);
    const findRole = (role: Role) => activeUnits.find((entry) => entry.role === role)?.unit ?? null;
    return {
      vanguard: findRole('VANGUARDIA'),
      champion: findRole('CAMPEÓN'),
      sentinel: findRole('CENTINELA'),
      reserve: reserveUnits,
      fallen: fallenUnits,
      unassigned: unassignedUnits,
    };
  };

  const opponent = renderSide('b');
  const player = renderSide('a');
  const unknownSideUnits = unitsBySide.unknown;
  const isActive = (unit: BattleUnit | null) => Boolean(unit && activeName && unit.name === activeName);
  const isTargeted = (unit: BattleUnit | null) => Boolean(unit && targetName && unit.name === targetName);

  const formation = (side: Side, units: ReturnType<typeof renderSide>) => (
    <View testID={`battlefield-${side}-formation`} style={styles.sideBlock}>
      <View style={styles.identityStrip}>
        <View style={[styles.identityMark, { borderColor: side === 'a' ? colors.primary : colors.danger }]}>
          <Feather name={side === 'a' ? 'user' : 'shield'} size={14} color={side === 'a' ? colors.primary : colors.danger} />
        </View>
        <View style={styles.identityCopy}>
          <Text style={[styles.identityKicker, { color: side === 'a' ? colors.primary : colors.danger }]}>{side === 'a' ? 'TU FORMACIÓN' : 'FORMACIÓN RIVAL'}</Text>
          <Text style={[styles.identityName, { color: colors.foreground }]}>{side === 'a' ? 'FORJADOR' : 'OPONENTE'}</Text>
        </View>
        <Text style={[styles.identityStatus, { color: colors.mutedForeground }]}>{side === 'a' ? 'ACTIVA' : 'HOSTIL'}</Text>
      </View>
      <View style={[styles.formationRow, side === 'b' ? styles.formationMirror : null]}>
        <UnitCard unit={units.vanguard} role="VANGUARDIA" active={isActive(units.vanguard)} targeted={isTargeted(units.vanguard)} reducedMotion={reducedMotion} colors={colors} side={side} />
        <UnitCard unit={units.champion} role="CAMPEÓN" active={isActive(units.champion)} targeted={isTargeted(units.champion)} reducedMotion={reducedMotion} colors={colors} side={side} />
        <UnitCard unit={units.sentinel} role="CENTINELA" active={isActive(units.sentinel)} targeted={isTargeted(units.sentinel)} reducedMotion={reducedMotion} colors={colors} side={side} />
      </View>
      <ReserveRail units={units.reserve} colors={colors} side={side} />
      {units.fallen.length > 0 ? (
        <StateRail
          units={units.fallen}
          colors={colors}
          label="CAÍDAS REPORTADAS"
          accessibilityLabel={`${side === 'a' ? 'Tu' : 'Rival'} unidades caídas reportadas por el servidor. ${units.fallen.length} cartas.`}
          testID={`battlefield-${side}-fallen`}
        />
      ) : null}
      {units.unassigned.length > 0 ? (
        <StateRail
          units={units.unassigned}
          colors={colors}
          label="POSICIÓN NO REPORTADA"
          accessibilityLabel={`${side === 'a' ? 'Tu' : 'Rival'} unidades sin posición reportada por el servidor. ${units.unassigned.length} cartas.`}
          testID={`battlefield-${side}-unassigned`}
        />
      ) : null}
    </View>
  );

  return (
    <View testID="forge-battlefield" accessibilityRole="summary" accessibilityLabel="Campo de batalla VEXFORGE con Campeón, Vanguardia, Centinela y Reserva de ambos lados." style={[styles.root, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>ARENA · FORGEFORMATION</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>CAMPO DE BATALLA</Text>
        </View>
        <View style={[styles.turnBadge, { borderColor: colors.primary, backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.turnValue, { color: colors.primary }]}>{currentTurn && totalTurns > 0 ? `${turnIndex + 1}/${totalTurns}` : 'NO REPORTADO'}</Text>
          <Text style={[styles.turnLabel, { color: colors.mutedForeground }]}>TURNO</Text>
        </View>
      </View>
      {formation('b', opponent)}
      <View testID="battlefield-confrontation-lane" style={[styles.lane, { borderColor: `${colors.accent}55`, backgroundColor: `${colors.accent}0A` }]}>
        <View style={[styles.laneLine, { backgroundColor: colors.accent }]} />
        <Text style={[styles.laneLabel, { color: colors.accent }]}>{eventLabel(currentTurn)}</Text>
        <Text style={[styles.laneCopy, { color: colors.mutedForeground }]}>
           {currentTurn ? `${textSignal(currentTurn.attacker?.name, 'ATACANTE NO REPORTADO')} → ${textSignal(currentTurn.defender?.name, 'OBJETIVO NO REPORTADO')}` : 'La formación espera la resolución del servidor'}
        </Text>
        {currentTurn && typeof currentTurn.damage === 'number' && Number.isFinite(currentTurn.damage) ? (
          <Text style={[styles.damageLabel, { color: currentTurn.is_crit ? colors.accent : colors.danger }]}>
            {currentTurn.damage === 0 ? '0 DAÑO CONFIRMADO' : `−${currentTurn.damage}${currentTurn.is_crit ? ' · CRÍTICO' : ' DAÑO'}`}
          </Text>
        ) : currentTurn ? <Text style={[styles.damageLabel, { color: colors.mutedForeground }]}>DAÑO NO REPORTADO</Text> : null}
      </View>
      {formation('a', player)}
      {unknownSideUnits.length > 0 ? (
        <StateRail
          units={unknownSideUnits}
          colors={colors}
          label="LADO NO REPORTADO"
          accessibilityLabel={`Unidades cuyo lado no fue reportado por el servidor. ${unknownSideUnits.length} cartas.`}
          testID="battlefield-side-unassigned"
        />
      ) : null}
      {resolvedOutcome ? (
        <Text
          testID="battlefield-outcome"
          style={[styles.outcome, { color: resolvedOutcome === 'victory' ? colors.success : resolvedOutcome === 'draw' ? colors.accent : colors.danger }]}
        >
          {resolvedOutcome === 'victory' ? 'VICTORIA CONFIRMADA POR EL SERVIDOR' : resolvedOutcome === 'draw' ? 'EMPATE CONFIRMADO POR EL SERVIDOR' : 'DERROTA CONFIRMADA POR EL SERVIDOR'}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { borderWidth: 1, borderRadius: 22, padding: 12, gap: 10, overflow: 'hidden' },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 3 },
  eyebrow: { fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  title: { fontSize: 18, fontWeight: '900', letterSpacing: 0.4, marginTop: 3 },
  turnBadge: { minWidth: 54, borderWidth: 1, borderRadius: 12, paddingVertical: 6, alignItems: 'center' },
  turnValue: { fontSize: 13, fontWeight: '900' },
  turnLabel: { fontSize: 7, fontWeight: '900', letterSpacing: 0.6, marginTop: 2 },
  sideBlock: { gap: 7 },
  stateRail: { gap: 7, paddingTop: 2 },
  identityStrip: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 3 },
  identityMark: { width: 30, height: 30, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  identityCopy: { flex: 1 },
  identityKicker: { fontSize: 8, fontWeight: '900', letterSpacing: 0.9 },
  identityName: { fontSize: 12, fontWeight: '800', marginTop: 2 },
  identityStatus: { fontSize: 8, fontWeight: '900', letterSpacing: 0.7 },
  formationRow: { flexDirection: 'row', gap: 6, alignItems: 'stretch' },
  formationMirror: { flexDirection: 'row-reverse' },
  unitCard: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 13, padding: 6, gap: 3 },
  championCard: { flex: 1.18 },
  roleRow: { minHeight: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  roleText: { fontSize: 7, fontWeight: '900', letterSpacing: 0.45 },
  fallenText: { fontSize: 6, fontWeight: '900', letterSpacing: 0.4 },
  unitArt: { width: '100%', height: 74, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.24)' },
  championArt: { height: 92 },
  artMissing: { height: 74, borderWidth: 1, borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 3 },
  artMissingText: { fontSize: 6, fontWeight: '900', textAlign: 'center' },
  unitName: { fontSize: 10, lineHeight: 13, fontWeight: '800', minHeight: 26 },
  unitFaction: { fontSize: 7, fontWeight: '900', letterSpacing: 0.3 },
  hpTrack: { height: 5, borderRadius: 3, overflow: 'hidden', marginTop: 3 },
  hpFill: { height: '100%', borderRadius: 3 },
  hpText: { fontSize: 7, fontWeight: '700' },
  keywordRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 3, minHeight: 13 },
  keyword: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 3, paddingVertical: 2 },
  keywordText: { fontSize: 5.5, fontWeight: '900', letterSpacing: 0.2 },
  reserveRail: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 28, paddingHorizontal: 3 },
  reserveHeader: { flexDirection: 'row', alignItems: 'center', gap: 4, minWidth: 62 },
  reserveTitle: { fontSize: 7, fontWeight: '900', letterSpacing: 0.5 },
  reserveItems: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  reserveItem: { width: 24, height: 28, borderWidth: 1, borderRadius: 5, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  reserveArt: { width: '100%', height: '100%' },
  emptyReserve: { fontSize: 7, fontWeight: '900' },
  lane: { borderWidth: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center', gap: 2 },
  laneLine: { width: 34, height: 2, borderRadius: 1, marginBottom: 2 },
  laneLabel: { fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  laneCopy: { fontSize: 9, textAlign: 'center' },
  damageLabel: { fontSize: 11, fontWeight: '900', marginTop: 2 },
  outcome: { fontSize: 9, fontWeight: '900', letterSpacing: 0.7, textAlign: 'center', paddingVertical: 4 },
});
