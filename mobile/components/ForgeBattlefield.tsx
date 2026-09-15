import { Feather } from '@/components/ForgeIcon';
import { useEffect, useMemo, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import type { BattleTurn, BattleUnit } from '@/lib/supabase';
import { VISUAL_TOKENS } from '@/constants/experience';
import { CANONICAL_BACKGROUNDS } from '@/constants/visual';

type Role = 'VANGUARDIA' | 'CAMPEÓN' | 'CENTINELA';
type DisplayRole = Role | 'RESERVA' | 'CAÍDA' | 'SIN POSICIÓN';
type Side = 'a' | 'b';
type BattleOutcome = 'victory' | 'defeat' | 'draw';
type Colors = ReturnType<typeof useColors>;

type Props = {
  finalUnits: BattleUnit[];
  currentTurn: BattleTurn | null;
  turnIndex: number;
  totalTurns: number | null;
  reducedMotion: boolean;
  parallaxY?: Animated.Value;
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

function BattlefieldScene({ reducedMotion, colors, parallaxY }: { reducedMotion: boolean; colors: Colors; parallaxY?: Animated.Value }) {
  const drift = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const localParallax = useRef(new Animated.Value(0)).current;
  const scrollParallax = parallaxY ?? localParallax;

  useEffect(() => {
    if (reducedMotion) {
      drift.stopAnimation();
      pulse.stopAnimation();
      drift.setValue(0);
      pulse.setValue(0);
      return;
    }

    const driftLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, { toValue: 1, duration: 4200, useNativeDriver: true }),
        Animated.timing(drift, { toValue: 0, duration: 4200, useNativeDriver: true }),
      ]),
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1900, useNativeDriver: true }),
      ]),
    );
    driftLoop.start();
    pulseLoop.start();
    return () => {
      driftLoop.stop();
      pulseLoop.stop();
    };
  }, [drift, pulse, reducedMotion]);

  const sceneTransform = {
    translateY: drift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }),
    scale: drift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.018] }),
  };
  const parallaxTransform = reducedMotion
    ? 0
    : scrollParallax.interpolate({
      inputRange: [0, 240],
      outputRange: [0, -VISUAL_TOKENS.battlefield.performance.parallaxMaxTranslateY],
      extrapolate: 'clamp',
    });
  const cyanGlowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.08, 0.22] });
  const emberGlowOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.06, 0.18] });

  return (
    <View pointerEvents="none" testID="battlefield-scene-viewport" style={styles.sceneBackdrop}>
      <Animated.Image
        source={CANONICAL_BACKGROUNDS.pvp}
        resizeMode="cover"
        accessibilityLabel="Escena oficial viva del Battlefield VEXFORGE"
        style={[
          StyleSheet.absoluteFillObject,
          styles.sceneImage,
          {
            transform: [
              { translateY: sceneTransform.translateY },
              { translateY: parallaxTransform },
              { scale: sceneTransform.scale },
            ],
          },
        ]}
      />
      <LinearGradient
        colors={['#020A16E8', '#071A2CA8', '#100B08DA']}
        locations={[0, 0.48, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={[`${colors.primary}30`, 'transparent', `${colors.danger}36`]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
      {VISUAL_TOKENS.battlefield.performance.maxAnimatedSceneLayers >= 1 ? (
        <Animated.View style={[styles.sceneGlow, styles.sceneGlowCyan, { backgroundColor: colors.primary, opacity: cyanGlowOpacity }]} />
      ) : null}
      {VISUAL_TOKENS.battlefield.performance.maxAnimatedSceneLayers >= 2 ? (
        <Animated.View style={[styles.sceneGlow, styles.sceneGlowEmber, { backgroundColor: colors.danger, opacity: emberGlowOpacity }]} />
      ) : null}
      <View style={[styles.sceneVignette, { borderColor: `${colors.accent}26` }]} />
    </View>
  );
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
          <Feather name="image" size={VISUAL_TOKENS.battlefield.icons.artMissing} color={colors.mutedForeground} />
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
        <Feather name="layers" size={VISUAL_TOKENS.battlefield.icons.reserveHeader} color={colors.mutedForeground} />
        <Text style={[styles.reserveTitle, { color: colors.mutedForeground }]}>RESERVA</Text>
      </View>
      <View style={styles.reserveItems}>
        {units.length > 0 ? units.map((unit, index) => (
          <View key={`${unit.id ?? unit.name ?? 'reserve'}-${index}`} style={[styles.reserveItem, { borderColor: factionColor(unit.faction, colors) }]}>
            {unit.image_url ? <Image source={{ uri: unit.image_url }} resizeMode="cover" style={styles.reserveArt} /> : <Feather name="image" size={VISUAL_TOKENS.battlefield.icons.reserveFallback} color={colors.mutedForeground} />}
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
        <Feather name="alert-circle" size={VISUAL_TOKENS.battlefield.icons.stateHeader} color={colors.mutedForeground} />
        <Text style={[styles.reserveTitle, { color: colors.mutedForeground }]}>{label}</Text>
      </View>
      <View style={styles.reserveItems}>
        {units.map((unit, index) => (
          <View key={`${unit.id ?? unit.name ?? 'state'}-${index}`} style={[styles.reserveItem, { borderColor: unit.alive === false ? colors.danger : colors.border }]}>
            {unit.image_url ? <Image source={{ uri: unit.image_url }} resizeMode="cover" style={styles.reserveArt} /> : <Feather name="image" size={VISUAL_TOKENS.battlefield.icons.reserveFallback} color={colors.mutedForeground} />}
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
          <Feather name={side === 'a' ? 'user' : 'shield'} size={VISUAL_TOKENS.battlefield.icons.identity} color={side === 'a' ? colors.primary : colors.danger} />
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
    <View testID="forge-battlefield" accessibilityRole="summary" accessibilityLabel="Campo de batalla VEXFORGE con Campeón, Vanguardia, Centinela, Reserva y lectura viva del evento." style={[styles.root, { borderColor: `${colors.accent}55` }]}>
      <BattlefieldScene reducedMotion={reducedMotion} colors={colors} parallaxY={parallaxY} />
      <View style={styles.sceneContent}>
      <View style={styles.topBar}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>ARENA · FORGEFORMATION</Text>
          <Text style={[styles.title, { color: colors.foreground }]}>UMBRAL DE COMBATE</Text>
        </View>
        <View style={[styles.turnBadge, { borderColor: colors.primary, backgroundColor: `${colors.primary}18` }]}>
          <Text style={[styles.turnValue, { color: colors.primary }]}>{currentTurn && totalTurns !== null && totalTurns > 0 ? `${turnIndex + 1}/${totalTurns}` : 'NO REPORTADO'}</Text>
          <Text style={[styles.turnLabel, { color: colors.mutedForeground }]}>TURNO</Text>
        </View>
      </View>
      <View testID="battlefield-live-hud" style={styles.liveHud}>
        <View style={[styles.liveHudSignal, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.ink}88` }]}>
          <Feather name="layers" size={VISUAL_TOKENS.battlefield.icons.reserveHeader} color={colors.accent} />
          <Text style={[styles.liveHudLabel, { color: colors.mutedForeground }]}>MANO</Text>
          <Text style={[styles.liveHudValue, { color: colors.foreground }]}>NO REPORTADO</Text>
        </View>
        <View style={[styles.liveHudSignal, { borderColor: `${colors.accent}66`, backgroundColor: `${colors.ink}88` }]}>
          <Feather name="zap" size={VISUAL_TOKENS.battlefield.icons.identity} color={colors.accent} />
          <Text style={[styles.liveHudLabel, { color: colors.mutedForeground }]}>COMMAND</Text>
          <Text style={[styles.liveHudValue, { color: colors.foreground }]}>NO REPORTADO</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'relative',
    borderWidth: VISUAL_TOKENS.battlefield.controls.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.root.radius,
    padding: 0,
    overflow: 'hidden',
  },
  sceneBackdrop: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  sceneImage: {
    opacity: 0.96,
  },
  sceneGlow: {
    position: 'absolute',
    width: 240,
    height: 240,
    borderRadius: 120,
  },
  sceneGlowCyan: {
    top: '18%',
    left: -130,
  },
  sceneGlowEmber: {
    bottom: '18%',
    right: -130,
  },
  sceneVignette: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: VISUAL_TOKENS.battlefield.root.radius,
  },
  sceneContent: {
    position: 'relative',
    padding: VISUAL_TOKENS.battlefield.root.padding,
    gap: VISUAL_TOKENS.battlefield.root.gap,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: VISUAL_TOKENS.battlefield.controls.topBarPaddingHorizontal,
  },
  liveHud: {
    flexDirection: 'row',
    gap: 6,
  },
  liveHudSignal: {
    flex: 1,
    minHeight: 34,
    borderWidth: 1,
    borderRadius: 9,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveHudLabel: {
    fontSize: VISUAL_TOKENS.battlefield.typography.liveHudLabel.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.liveHudLabel.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.liveHudLabel.letterSpacing,
  },
  liveHudValue: {
    flex: 1,
    fontSize: VISUAL_TOKENS.battlefield.typography.liveHudValue.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.liveHudValue.fontWeight,
    textAlign: 'right',
  },
  eyebrow: {
    fontSize: VISUAL_TOKENS.battlefield.typography.eyebrow.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.eyebrow.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.eyebrow.letterSpacing,
  },
  title: {
    fontSize: VISUAL_TOKENS.battlefield.typography.title.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.title.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.title.letterSpacing,
    marginTop: VISUAL_TOKENS.battlefield.typography.title.marginTop,
  },
  turnBadge: {
    minWidth: VISUAL_TOKENS.battlefield.controls.turnBadge.minWidth,
    borderWidth: VISUAL_TOKENS.battlefield.controls.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.controls.turnBadge.radius,
    paddingVertical: VISUAL_TOKENS.battlefield.controls.turnBadge.paddingVertical,
    alignItems: 'center',
  },
  turnValue: {
    fontSize: VISUAL_TOKENS.battlefield.typography.turnValue.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.turnValue.fontWeight,
  },
  turnLabel: {
    fontSize: VISUAL_TOKENS.battlefield.typography.turnLabel.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.turnLabel.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.turnLabel.letterSpacing,
    marginTop: VISUAL_TOKENS.battlefield.typography.turnLabel.marginTop,
  },
  sideBlock: { gap: VISUAL_TOKENS.battlefield.controls.sideBlockGap },
  stateRail: {
    gap: VISUAL_TOKENS.battlefield.controls.stateRail.gap,
    paddingTop: VISUAL_TOKENS.battlefield.controls.stateRail.paddingTop,
  },
  identityStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.battlefield.identity.gap,
    paddingHorizontal: VISUAL_TOKENS.battlefield.identity.paddingHorizontal,
  },
  identityMark: {
    width: VISUAL_TOKENS.battlefield.identity.markSize,
    height: VISUAL_TOKENS.battlefield.identity.markSize,
    borderWidth: VISUAL_TOKENS.battlefield.controls.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.identity.markRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityCopy: { flex: 1 },
  identityKicker: {
    fontSize: VISUAL_TOKENS.battlefield.typography.identityKicker.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.identityKicker.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.identityKicker.letterSpacing,
  },
  identityName: {
    fontSize: VISUAL_TOKENS.battlefield.typography.identityName.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.identityName.fontWeight,
    marginTop: VISUAL_TOKENS.battlefield.typography.identityName.marginTop,
  },
  identityStatus: {
    fontSize: VISUAL_TOKENS.battlefield.typography.identityStatus.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.identityStatus.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.identityStatus.letterSpacing,
  },
  formationRow: { flexDirection: 'row', gap: VISUAL_TOKENS.battlefield.formation.gap, alignItems: 'stretch' },
  formationMirror: { flexDirection: 'row-reverse' },
  unitCard: {
    flex: 1,
    minWidth: 0,
    borderWidth: VISUAL_TOKENS.battlefield.controls.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.unitCard.radius,
    padding: VISUAL_TOKENS.battlefield.unitCard.padding,
    gap: VISUAL_TOKENS.battlefield.unitCard.gap,
  },
  championCard: { flex: 1.18 },
  roleRow: {
    minHeight: VISUAL_TOKENS.battlefield.controls.roleRow.minHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: VISUAL_TOKENS.battlefield.controls.roleRow.gap,
  },
  roleText: {
    fontSize: VISUAL_TOKENS.battlefield.typography.roleText.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.roleText.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.roleText.letterSpacing,
  },
  fallenText: {
    fontSize: VISUAL_TOKENS.battlefield.typography.fallenText.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.fallenText.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.fallenText.letterSpacing,
  },
  unitArt: {
    width: '100%',
    height: VISUAL_TOKENS.battlefield.unitArt.height,
    borderRadius: VISUAL_TOKENS.battlefield.unitArt.radius,
    backgroundColor: 'rgba(0,0,0,0.24)',
  },
  championArt: { height: VISUAL_TOKENS.battlefield.championArtHeight },
  artMissing: {
    height: VISUAL_TOKENS.battlefield.unitArt.height,
    borderWidth: VISUAL_TOKENS.battlefield.controls.artMissing.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.unitArt.radius,
    alignItems: 'center',
    justifyContent: 'center',
    gap: VISUAL_TOKENS.battlefield.controls.artMissing.gap,
  },
  artMissingText: {
    fontSize: VISUAL_TOKENS.battlefield.typography.artMissing.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.artMissing.fontWeight,
    textAlign: 'center',
  },
  unitName: {
    fontSize: VISUAL_TOKENS.battlefield.typography.unitName.fontSize,
    lineHeight: VISUAL_TOKENS.battlefield.typography.unitName.lineHeight,
    fontWeight: VISUAL_TOKENS.battlefield.typography.unitName.fontWeight,
    minHeight: VISUAL_TOKENS.battlefield.typography.unitName.minHeight,
  },
  unitFaction: {
    fontSize: VISUAL_TOKENS.battlefield.typography.unitFaction.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.unitFaction.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.unitFaction.letterSpacing,
  },
  hpTrack: {
    height: VISUAL_TOKENS.battlefield.controls.hpTrack.height,
    borderRadius: VISUAL_TOKENS.battlefield.controls.hpTrack.radius,
    overflow: 'hidden',
    marginTop: VISUAL_TOKENS.battlefield.controls.hpTrack.marginTop,
  },
  hpFill: { height: '100%', borderRadius: VISUAL_TOKENS.battlefield.controls.hpTrack.radius },
  hpText: {
    fontSize: VISUAL_TOKENS.battlefield.typography.hpText.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.hpText.fontWeight,
  },
  keywordRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VISUAL_TOKENS.battlefield.controls.keywordRow.gap,
    minHeight: VISUAL_TOKENS.battlefield.controls.keywordRow.minHeight,
  },
  keyword: {
    borderWidth: VISUAL_TOKENS.battlefield.controls.keyword.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.controls.keyword.radius,
    paddingHorizontal: VISUAL_TOKENS.battlefield.controls.keyword.paddingHorizontal,
    paddingVertical: VISUAL_TOKENS.battlefield.controls.keyword.paddingVertical,
  },
  keywordText: {
    fontSize: VISUAL_TOKENS.battlefield.typography.keyword.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.keyword.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.keyword.letterSpacing,
  },
  reserveRail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.battlefield.reserve.gap,
    minHeight: VISUAL_TOKENS.battlefield.reserve.minHeight,
    paddingHorizontal: VISUAL_TOKENS.battlefield.reserve.paddingHorizontal,
  },
  reserveHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: VISUAL_TOKENS.battlefield.controls.reserveHeader.gap,
    minWidth: VISUAL_TOKENS.battlefield.controls.reserveHeader.minWidth,
  },
  reserveTitle: {
    fontSize: VISUAL_TOKENS.battlefield.typography.reserveTitle.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.reserveTitle.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.reserveTitle.letterSpacing,
  },
  reserveItems: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: VISUAL_TOKENS.battlefield.controls.reserveItemsGap,
  },
  reserveItem: {
    width: VISUAL_TOKENS.battlefield.reserve.itemWidth,
    height: VISUAL_TOKENS.battlefield.reserve.itemHeight,
    borderWidth: VISUAL_TOKENS.battlefield.controls.reserveBorderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.reserve.itemRadius,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reserveArt: { width: '100%', height: '100%' },
  emptyReserve: {
    fontSize: VISUAL_TOKENS.battlefield.typography.emptyReserve.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.emptyReserve.fontWeight,
  },
  lane: {
    borderWidth: VISUAL_TOKENS.battlefield.controls.borderWidth,
    borderRadius: VISUAL_TOKENS.battlefield.lane.radius,
    paddingVertical: VISUAL_TOKENS.battlefield.lane.paddingVertical,
    paddingHorizontal: VISUAL_TOKENS.battlefield.lane.paddingHorizontal,
    alignItems: 'center',
    gap: VISUAL_TOKENS.battlefield.lane.gap,
  },
  laneLine: {
    width: VISUAL_TOKENS.battlefield.controls.laneLine.width,
    height: VISUAL_TOKENS.battlefield.controls.laneLine.height,
    borderRadius: VISUAL_TOKENS.battlefield.controls.laneLine.radius,
    marginBottom: VISUAL_TOKENS.battlefield.controls.laneLine.marginBottom,
  },
  laneLabel: {
    fontSize: VISUAL_TOKENS.battlefield.typography.laneLabel.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.laneLabel.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.laneLabel.letterSpacing,
  },
  laneCopy: { fontSize: VISUAL_TOKENS.battlefield.typography.laneCopy.fontSize, textAlign: 'center' },
  damageLabel: {
    fontSize: VISUAL_TOKENS.battlefield.typography.damageLabel.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.damageLabel.fontWeight,
    marginTop: VISUAL_TOKENS.battlefield.typography.damageLabel.marginTop,
  },
  outcome: {
    fontSize: VISUAL_TOKENS.battlefield.typography.outcome.fontSize,
    fontWeight: VISUAL_TOKENS.battlefield.typography.outcome.fontWeight,
    letterSpacing: VISUAL_TOKENS.battlefield.typography.outcome.letterSpacing,
    textAlign: 'center',
    paddingVertical: VISUAL_TOKENS.battlefield.typography.outcome.paddingVertical,
  },
});
