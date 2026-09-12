import { Feather } from '@/components/ForgeIcon';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import type { BattleTurn, BattleUnit } from '@/lib/supabase';

type Role = 'VANGUARDIA' | 'CAMPEÓN' | 'CENTINELA';
type Side = 'a' | 'b';
type Colors = ReturnType<typeof useColors>;

type Props = {
  finalUnits: BattleUnit[];
  currentTurn: BattleTurn | null;
  turnIndex: number;
  totalTurns: number;
  reducedMotion: boolean;
  youWon?: boolean;
};

const ROLE_LABELS: Record<Role, string> = {
  VANGUARDIA: 'vanguard',
  CAMPEÓN: 'champion',
  CENTINELA: 'sentinel',
};

function roleForUnit(unit: BattleUnit, index: number): Role | 'RESERVA' {
  const slot = String(unit.slot ?? '').toLowerCase();
  if (unit.is_champion || slot.includes('champ')) return 'CAMPEÓN';
  if (slot.includes('vanguard')) return 'VANGUARDIA';
  if (slot.includes('sentinel')) return 'CENTINELA';
  if (unit.in_reserve || slot.includes('reserve')) return 'RESERVA';
  return index === 0 ? 'VANGUARDIA' : index === 1 ? 'CENTINELA' : 'RESERVA';
}

function factionColor(faction: string | undefined, colors: Colors) {
  return {
    Guerrero: colors.danger,
    Mago: colors.rarityRare,
    Paladín: colors.accent,
    Pícaro: colors.rarityEpic,
  }[faction ?? ''] ?? colors.primary;
}

function eventLabel(turn: BattleTurn | null) {
  if (!turn) return 'FORMACIÓN LISTA';
  if (turn.is_kill) return 'UNIDAD ELIMINADA';
  if (turn.is_crit) return 'IMPACTO CRÍTICO';
  const event = turn.events?.[0];
  if (event?.type === 'shield_block') return 'GUARDIA ACTIVADA';
  if (event?.type === 'poisoned' || event?.type === 'poison_tick' || event?.type === 'poison_death') return 'VENENO';
  if (event?.type === 'lifesteal') return 'DRENAJE';
  if (event?.type === 'double_strike') return 'DOBLE GOLPE';
  if (typeof turn.damage === 'number' && turn.damage > 0) return 'IMPACTO CONFIRMADO';
  return 'TARGET LOCK';
}

function hpPercent(unit: BattleUnit) {
  const hp = Number(unit.hp ?? 0);
  const max = Number(unit.max_hp ?? 0);
  return max > 0 ? Math.max(0, Math.min(100, (hp / max) * 100)) : 0;
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
  const percent = unit ? hpPercent(unit) : 0;

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

  const label = unit ? `${role}. ${unit.name ?? 'Unidad'}. ${unit.hp ?? 0} de ${unit.max_hp ?? 0} HP.` : `${role}. Posición vacía.`;
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
      <Text style={[styles.unitName, { color: colors.foreground }]} numberOfLines={2}>{unit?.name ?? 'Posición vacía'}</Text>
      <Text style={[styles.unitFaction, { color: accent }]} numberOfLines={1}>{unit?.faction ?? 'ESPERANDO UNIDAD'}</Text>
      {unit ? (
        <>
          <View style={[styles.hpTrack, { backgroundColor: colors.muted }]}>
            <View style={[styles.hpFill, { width: `${percent}%`, backgroundColor: percent > 35 ? colors.success : colors.danger }]} />
          </View>
          <Text style={[styles.hpText, { color: colors.mutedForeground }]}>{unit.hp ?? 0} / {unit.max_hp ?? 0} HP</Text>
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
        )) : <Text style={[styles.emptyReserve, { color: colors.mutedForeground }]}>VACÍA</Text>}
      </View>
    </View>
  );
}

export function ForgeBattlefield({ finalUnits, currentTurn, turnIndex, totalTurns, reducedMotion, youWon }: Props) {
  const colors = useColors();
  const unitsBySide = useMemo(() => {
    const explicit = finalUnits.some((unit) => unit.side === 'a' || unit.side === 'b');
    const result: Record<Side, BattleUnit[]> = { a: [], b: [] };
    finalUnits.forEach((unit, index) => {
      const side: Side = unit.side === 'b' || (!explicit && index >= Math.ceil(finalUnits.length / 2)) ? 'b' : 'a';
      result[side].push(unit);
    });
    return result;
  }, [finalUnits]);

  const activeName = currentTurn?.attacker?.name;
  const targetName = currentTurn?.defender?.name;
  const renderSide = (side: Side) => {
    const classified = unitsBySide[side].map((unit, index) => ({ unit, role: roleForUnit(unit, index) }));
    const activeUnits = classified.filter((entry) => entry.role !== 'RESERVA');
    const reserveUnits = classified.filter((entry) => entry.role === 'RESERVA').map((entry) => entry.unit);
    const findRole = (role: Role) => activeUnits.find((entry) => entry.role === role)?.unit ?? null;
    return {
      vanguard: findRole('VANGUARDIA'),
      champion: findRole('CAMPEÓN'),
      sentinel: findRole('CENTINELA'),
      reserve: reserveUnits,
    };
  };

  const opponent = renderSide('b');
  const player = renderSide('a');
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
          <Text style={[styles.turnValue, { color: colors.primary }]}>{currentTurn ? `${turnIndex + 1}/${totalTurns}` : '—'}</Text>
          <Text style={[styles.turnLabel, { color: colors.mutedForeground }]}>TURNO</Text>
        </View>
      </View>
      {formation('b', opponent)}
      <View testID="battlefield-confrontation-lane" style={[styles.lane, { borderColor: `${colors.accent}55`, backgroundColor: `${colors.accent}0A` }]}>
        <View style={[styles.laneLine, { backgroundColor: colors.accent }]} />
        <Text style={[styles.laneLabel, { color: colors.accent }]}>{eventLabel(currentTurn)}</Text>
        <Text style={[styles.laneCopy, { color: colors.mutedForeground }]}>
          {currentTurn ? `${currentTurn.attacker?.name ?? 'Atacante'} → ${currentTurn.defender?.name ?? 'Objetivo'}` : 'La formación espera la resolución del servidor'}
        </Text>
        {currentTurn && (currentTurn.damage ?? 0) > 0 ? <Text style={[styles.damageLabel, { color: currentTurn.is_crit ? colors.accent : colors.danger }]}>−{currentTurn.damage}{currentTurn.is_crit ? ' · CRÍTICO' : ' DAÑO'}</Text> : null}
      </View>
      {formation('a', player)}
      {typeof youWon === 'boolean' ? <Text testID="battlefield-outcome" style={[styles.outcome, { color: youWon ? colors.success : colors.danger }]}>{youWon ? 'VICTORIA CONFIRMADA POR EL SERVIDOR' : 'DERROTA CONFIRMADA POR EL SERVIDOR'}</Text> : null}
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
