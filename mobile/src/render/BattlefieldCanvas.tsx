import { VexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Rect, RoundedRect, vec } from '@shopify/react-native-skia';
import type { BattleEvent, BattleUnitState } from '../types/api';
import type { PresentationKind } from '../engine/presentation';
import { COLORS } from '../core/constants';
import { BattleEffects, type BattlePoint } from './BattleEffects';
import { buildSceneActors, cameraForPresentation, projectScenePoint, WIDE_CAMERA } from '../../game/scene';
import { runtimeCueForEvent } from '../../game/timeline';
import { actorRigProfile } from '../../game/actors';
import { isSceneLayerVisible, type SceneLayerId, type SceneLayerVisibility } from '../../game/layers';
import type { ActorMotion, RuntimeCue, RuntimeHapticCue } from '../../game/types';
import { useGame } from '../app/GameProvider';
import { AudioCues } from './AudioCues';

const FALLBACK = require('../../assets/vexforge/VF_CARD_FALLBACK_NEUTRAL.png');
const CARD_FRAME_EPIC = require('../../assets/vexforge/VF_CARD_FRAME_EPIC.png');
const CARD_FRAME_LEGENDARY = require('../../assets/vexforge/VF_CARD_FRAME_LEGENDARY.png');
const BOSS_AURA = require('../../assets/vexforge/VF_BOSS_AURA.png');
const ACC: Record<PresentationKind, string> = { boss: COLORS.crimson, victory: COLORS.goldBright, cast: COLORS.arcaneBright, attack: COLORS.crimson, guard: COLORS.arcaneBright, heal: COLORS.mint, defeat: COLORS.crimson, status: '#D5784E', neutral: COLORS.gold };

interface PositionedUnit extends BattleUnitState {
  point: BattlePoint;
  depthScale: number;
  zIndex: number;
  motion: ActorMotion;
}

export function BattlefieldCanvas({ units, activeEvent, activeKind = 'neutral', compact = false, selectedTargetId, onSelectTarget, maxAnimatedUnits = 16, runtimeCue = null, layerVisibility }: { units: BattleUnitState[]; activeEvent: BattleEvent | null; activeKind?: PresentationKind; compact?: boolean; selectedTargetId?: string | null; onSelectTarget?: (id: string) => void; maxAnimatedUnits?: number; runtimeCue?: RuntimeCue | null; layerVisibility?: Partial<SceneLayerVisibility> }) {
  const { width } = useWindowDimensions();
  const { haptic } = useGame();
  const prefersReducedMotion = useReducedMotion() === true;
  const height = compact ? 340 : 485;
  const [measured, setMeasured] = useState({ width: 0, height });
  const viewport = { width: measured.width || width, height: measured.height || height };
  const presentationCue = runtimeCue ?? runtimeCueForEvent(activeEvent, activeEvent?.round ?? 0);
  const pulse = useSharedValue(.96);
  const flash = useSharedValue(0);
  const cameraZoom = useSharedValue(1);
  const cameraX = useSharedValue(0);
  const cameraY = useSharedValue(0);
  const accent = ACC[activeKind];
  const cueId = presentationCue?.id ?? (activeEvent ? `${activeEvent.event_type}:${activeEvent.actor_id ?? ''}:${activeEvent.target_id ?? ''}:${activeEvent.round ?? 0}:${activeEvent.amount ?? ''}` : 'scene:idle');
  const camera = presentationCue?.camera ?? cameraForPresentation(activeKind);
  const sceneActors = useMemo(() => buildSceneActors(units, activeEvent, activeKind), [units, activeEvent, activeKind]);
  const cameraAnchor = sceneActors.find(actor => actor.id === camera.focusActorId);
  const cameraFocusX = cameraAnchor?.position.x ?? camera.focusX;
  const cameraFocusY = cameraAnchor?.position.y ?? camera.focusY;
  const hapticTrack = presentationCue?.tracks.find(track => track.track === 'haptic');
  const hapticValue = typeof hapticTrack?.value === 'string'
    && ['selection', 'impact', 'success', 'warning', 'none'].includes(hapticTrack.value)
    ? hapticTrack.value as RuntimeHapticCue
    : presentationCue?.haptic;

  useEffect(() => {
    if (prefersReducedMotion) {
      pulse.value = 1;
      flash.value = 0;
      return;
    }
    pulse.value = withSequence(withTiming(1.045, { duration: 150, easing: Easing.out(Easing.quad) }), withTiming(1, { duration: 460 }));
    flash.value = withSequence(withTiming(.54, { duration: 80 }), withTiming(0, { duration: 660 }));
  }, [cueId, activeKind, pulse, flash, prefersReducedMotion]);

  useEffect(() => {
    const duration = prefersReducedMotion ? 0 : camera.durationMs;
    cameraZoom.value = withTiming(camera.zoom, { duration, easing: Easing.out(Easing.cubic) });
    cameraX.value = withTiming(cameraFocusX, { duration, easing: Easing.out(Easing.cubic) });
    cameraY.value = withTiming(cameraFocusY, { duration, easing: Easing.out(Easing.cubic) });
  }, [camera.shot, cameraFocusX, cameraFocusY, camera.zoom, camera.durationMs, cameraZoom, cameraX, cameraY, prefersReducedMotion]);

  useEffect(() => {
    if (hapticValue && hapticValue !== 'none') void haptic(hapticValue);
  }, [presentationCue?.id, hapticValue, haptic]);

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value, transform: [{ scale: pulse.value }] }));
  const cameraStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -cameraX.value * viewport.width * .36 },
      { translateY: -cameraY.value * viewport.height * .29 },
      { scale: cameraZoom.value },
    ],
  }));
  const sideLimit = Math.max(1, Math.min(8, Math.floor(maxAnimatedUnits / 2)));
  const positioned = useMemo(() => {
    const sideCounts = { player: 0, enemy: 0 };
    return sceneActors.flatMap((actor): PositionedUnit[] => {
      if (sideCounts[actor.side] >= sideLimit) return [];
      sideCounts[actor.side] += 1;
      const projected = projectScenePoint(actor.position, viewport, WIDE_CAMERA);
      return [{
        ...actor.unit,
        point: { x: projected.x, y: projected.y },
        depthScale: projected.scale,
        zIndex: projected.zIndex,
        motion: presentationCue?.actorMotion[actor.id] ?? actor.motion,
      }];
    });
  }, [sceneActors, sideLimit, viewport.width, viewport.height, presentationCue]);
  const pUnits = positioned.filter(unit => ['player', 'you'].includes(String(unit.side ?? '').toLowerCase()));
  const eUnits = positioned.filter(unit => !['player', 'you'].includes(String(unit.side ?? '').toLowerCase()));
  const actorId = activeEvent?.actor_id ?? null;
  const targetId = activeEvent?.target_id ?? null;
  const origin = positioned.find(u => u.id === actorId)?.point ?? null;
  const target = positioned.find(u => u.id === targetId)?.point ?? null;
  const alivePlayer = pUnits.filter(u => String(u.status ?? 'alive') !== 'defeated').length;
  const aliveEnemy = eUnits.filter(u => String(u.status ?? 'alive') !== 'defeated').length;
  const visible = (layer: SceneLayerId) => isSceneLayerVisible(layerVisibility, layer);

  return (
    <View
      onLayout={({ nativeEvent }) => {
        const next = { width: nativeEvent.layout.width, height: nativeEvent.layout.height };
        setMeasured(current => current.width === next.width && current.height === next.height ? current : next);
      }}
      style={[styles.root, { height }]}
    >
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, cameraStyle]}>
        <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
          {visible('BACK') ? (
            <Rect x={0} y={0} width={viewport.width} height={viewport.height}>
              <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(2,3,8,.20)', 'rgba(3,3,7,.38)', 'rgba(2,2,5,.82)']} />
            </Rect>
          ) : null}
          {visible('MID') ? <Circle cx={viewport.width * .5} cy={height * .53} r={145} color={COLORS.arcane} opacity={.08} /> : null}
          {visible('PLAYFIELD') ? (
            <>
              <Circle cx={viewport.width * .5} cy={height * .53} r={122} color={COLORS.gold} opacity={.14} style="stroke" strokeWidth={1.2} />
              <Circle cx={viewport.width * .5} cy={height * .53} r={86} color={accent} opacity={.18} style="stroke" strokeWidth={2} />
              <RoundedRect x={viewport.width * .08} y={height * .51} width={viewport.width * .84} height={2} r={1} color={accent} opacity={.22} />
            </>
          ) : null}
        </Canvas>
      </Animated.View>

      {visible('HUD') ? (
        <>
          <View pointerEvents="none" style={styles.topHud}>
            <View><Text style={styles.hudK}>OPONENTE</Text><Text style={styles.hudV}>{aliveEnemy}/{eUnits.length}</Text></View>
            <View style={styles.hudCenter}><Text style={styles.coreK}>NEXUS CORE</Text><Text style={styles.coreV}>R{activeEvent?.round ?? '—'}</Text></View>
            <View style={styles.rightHud}><Text style={styles.hudK}>TU FORMACIÓN</Text><Text style={styles.hudV}>{alivePlayer}/{pUnits.length}</Text></View>
          </View>
          <View pointerEvents="none" style={styles.centerLabel}>
            <Text style={styles.centerK}>CAMPO VIVO</Text>
            <Text style={styles.centerT}>{activeEvent ? String(activeEvent.event_type).replaceAll('_', ' ') : 'ESPERANDO COMANDO'}</Text>
            <Text style={[styles.centerS, { color: accent }]}>{activeEvent?.amount != null ? `${activeEvent.amount} EFECTO` : 'LECTURA TÁCTICA'}</Text>
          </View>
        </>
      ) : null}

      <Animated.View style={[StyleSheet.absoluteFillObject, cameraStyle]}>
        {visible('ACTORS') ? (
          <>
            {eUnits.map(u => <BattleToken key={u.id} unit={u} active={u.id === actorId} selected={u.id === selectedTargetId} side="enemy" cueId={cueId} onPress={onSelectTarget ? () => onSelectTarget(u.id) : undefined} reducedMotion={prefersReducedMotion} />)}
            {pUnits.map(u => <BattleToken key={u.id} unit={u} active={u.id === actorId} selected={u.id === selectedTargetId} side="player" cueId={cueId} reducedMotion={prefersReducedMotion} />)}
          </>
        ) : null}
        {visible('FRONT_FX') ? <BattleEffects event={activeEvent} kind={activeKind === 'neutral' ? null : activeKind} origin={origin} target={target} cueId={cueId} viewport={viewport} /> : null}
      </Animated.View>
      {visible('FRONT_FX') ? <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFillObject, styles.flash, { borderColor: `${accent}AA`, shadowColor: accent }, flashStyle]} /> : null}
      <AudioCues cue={presentationCue} kind={activeKind === 'neutral' ? null : activeKind} />
    </View>
  );
}

function BattleToken({ unit, active, selected, side, cueId, onPress, reducedMotion }: { unit: PositionedUnit; active: boolean; selected: boolean; side: 'player' | 'enemy'; cueId: string; onPress?: () => void; reducedMotion: boolean }) {
  const scale = useSharedValue(1);
  const motion = useSharedValue(0);
  const profile = actorRigProfile(unit.motion);
  useEffect(() => {
    if (reducedMotion) {
      scale.value = active ? 1.06 : selected ? 1.03 : 1;
      motion.value = unit.motion === 'idle' ? 0 : 1;
      return;
    }
    scale.value = withSequence(withTiming(active ? 1.12 : selected ? 1.05 : 1, { duration: 150 }), withTiming(1, { duration: 360 }));
    if (unit.motion === 'idle') {
      motion.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, true);
    } else if (unit.motion === 'defeated') {
      motion.value = withTiming(1, { duration: 260 });
    } else {
      motion.value = withSequence(withTiming(1, { duration: 140 }), withTiming(0, { duration: 360, easing: Easing.out(Easing.quad) }));
    }
  }, [active, selected, unit.motion, cueId, scale, motion, reducedMotion]);
  const animated = useAnimatedStyle(() => {
    const activeOffset = unit.motion === 'attacking' ? motion.value * 15 : unit.motion === 'taking-hit' ? -motion.value * 8 : 0;
    const verticalOffset = unit.motion === 'casting' ? -motion.value * 9 : unit.motion === 'healing' ? -motion.value * 5 : 0;
    const motionScale = unit.motion === 'guarding' ? 1 + motion.value * .06 : 1;
    return {
      transform: [
        { translateX: unit.point.x - 38 + activeOffset },
        { translateY: unit.point.y - 58 + verticalOffset },
        { scale: scale.value * unit.depthScale * motionScale },
      ],
      opacity: unit.motion === 'defeated' || unit.status === 'defeated' ? .30 : 1,
      zIndex: unit.zIndex,
    };
  });
  const leftArmStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: profile.bodyLift * motion.value }, { rotate: `${profile.leftArmDegrees * motion.value}deg` }],
  }));
  const rightArmStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: profile.bodyLift * motion.value }, { rotate: `${profile.rightArmDegrees * motion.value}deg` }],
  }));
  const torsoStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: profile.bodyLift * motion.value }, { rotate: `${profile.bodyTiltDegrees * motion.value}deg` }],
  }));
  const weaponStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${profile.weaponDegrees * motion.value}deg` }, { translateY: -profile.bodyLift * motion.value }],
  }));
  const cloakStyle = useAnimatedStyle(() => ({
    opacity: profile.opacity,
    transform: [{ translateY: profile.bodyLift * motion.value }, { rotate: `${profile.cloakDegrees * motion.value}deg` }],
  }));
  const motionPart = useAnimatedStyle(() => ({
    opacity: unit.motion === 'idle' ? 0 : motion.value,
    transform: [
      { translateX: unit.motion === 'attacking' ? 18 * motion.value : unit.motion === 'taking-hit' ? -12 * motion.value : 0 },
      { translateY: unit.motion === 'casting' || unit.motion === 'healing' ? -18 * motion.value : 0 },
      { rotate: `${unit.motion === 'attacking' ? -35 * motion.value : unit.motion === 'taking-hit' ? 25 * motion.value : 0}deg` },
    ],
  }));
  const hp = Math.max(0, Number(unit.hp ?? 0));
  const max = Math.max(1, Number(unit.max_hp ?? hp));
  const accent = side === 'player' ? COLORS.goldBright : COLORS.crimson;
  const rawStatuses = (unit as any).statuses;
  const statusEntries = rawStatuses && typeof rawStatuses === 'object' ? Object.entries(rawStatuses).filter(([,v]) => Number(v) > 0).slice(0, 3) : [];
  const statusText = statusEntries.map(([key,value]) => `${String(key).toUpperCase().slice(0, 4)} ${value}`).join(' · ');
  const energy = Math.max(0, Math.min(5, Number((unit as any).energy ?? 0)));
  const rarity = String((unit as any).rarity ?? '').toLowerCase();
  const frameSource = rarity === 'legendary' || rarity === 'mythic' ? CARD_FRAME_LEGENDARY : rarity === 'epic' ? CARD_FRAME_EPIC : null;
  const isBoss = String((unit as any).faction ?? '').toLowerCase() === 'boss' || String(unit.id).startsWith('BOSS-SHOWCASE-');
  const role = String((unit as any).role ?? '').toUpperCase();
  const name = String(unit.card_id ?? unit.id).slice(0, 14);
  const motionGlyph: Record<ActorMotion, string> = { idle: '', anticipation: '…', attacking: '╱', 'taking-hit': '✦', casting: '✧', guarding: '◇', staggered: '✦', status: '⌁', healing: '✚', defeated: '×', victory: '✦', summoning: '✧', phase: '◈', revealing: '✦' };
  const content = (
    <Animated.View style={[styles.token, animated, { shadowColor: active || selected ? accent : 'transparent' }] }>
      <View style={[styles.tokenHalo, { borderColor: `${accent}${active || selected ? '99' : '28'}` }]} />
      {isBoss ? <VexforgeImage source={BOSS_AURA} resizeMode="contain" style={styles.bossAura} /> : null}
      <Animated.View pointerEvents="none" style={[styles.rigCape, { borderColor: accent, backgroundColor: COLORS.void }, cloakStyle]} />
      <Animated.View pointerEvents="none" style={torsoStyle}>
        <VexforgeImage source={unit.image_url ? { uri: unit.image_url } : FALLBACK} resizeMode="cover" style={[styles.avatar, { borderColor: selected ? accent : `${accent}66` }]} />
        {frameSource ? <VexforgeImage source={frameSource} resizeMode="stretch" style={styles.frame} /> : null}
      </Animated.View>
      <Animated.View pointerEvents="none" style={[styles.rigArm, styles.rigArmLeft, { backgroundColor: accent }, leftArmStyle]} />
      <Animated.View pointerEvents="none" style={[styles.rigArm, styles.rigArmRight, { backgroundColor: accent }, rightArmStyle]} />
      <Animated.View pointerEvents="none" style={[styles.rigWeapon, { backgroundColor: COLORS.goldBright }, weaponStyle]} />
      {unit.motion !== 'idle' ? <Animated.View pointerEvents="none" style={[styles.motionPart, { borderColor: accent, shadowColor: accent }, motionPart]}><Text style={[styles.motionGlyph, { color: accent }]}>{motionGlyph[unit.motion]}</Text></Animated.View> : null}
      <View style={styles.hpTrack}><View style={[styles.hpFill, { width: `${Math.min(100, hp / max * 100)}%`, backgroundColor: accent }]} /></View>
      {(Number((rawStatuses as any)?.shield ?? 0) > 0) ? <View style={styles.shieldTrack}><View style={[styles.shieldFill, { width: `${Math.min(100, Number((rawStatuses as any).shield) / 180 * 100)}%` }]} /></View> : null}
      <View style={styles.energyRow}>{Array.from({ length: 5 }, (_, i) => <View key={i} style={[styles.energyDot, { backgroundColor: i < energy ? accent : 'rgba(255,255,255,.10)', shadowColor: accent }]} />)}</View>
      <Text numberOfLines={1} style={styles.unitName}>{name}</Text>
      {role ? <Text numberOfLines={1} style={styles.role}>{role}</Text> : null}
      {statusText ? <Text numberOfLines={1} style={[styles.status, { color: statusText.includes('BURN') || statusText.includes('POIS') ? '#D5784E' : accent }]}>{statusText}</Text> : null}
    </Animated.View>
  );
  return onPress ? (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Seleccionar ${name}`}
      accessibilityState={{ selected }}
      onPress={onPress}
      hitSlop={8}
    >
      {content}
    </Pressable>
  ) : content;
}

const styles = StyleSheet.create({
  root: { width: '100%', overflow: 'hidden', borderRadius: 26, borderWidth: 1, borderColor: `${COLORS.gold}30`, backgroundColor: COLORS.void },
  topHud: { position: 'absolute', top: 14, left: 15, right: 15, flexDirection: 'row', justifyContent: 'space-between', zIndex: 2 },
  hudK: { color: COLORS.goldDim, fontSize: 5.5, fontWeight: '900', letterSpacing: 1.5 },
  hudV: { color: COLORS.white, fontSize: 12, fontWeight: '900', marginTop: 1 },
  rightHud: { alignItems: 'flex-end' },
  hudCenter: { alignItems: 'center' },
  coreK: { color: COLORS.goldDim, fontSize: 5, fontWeight: '900', letterSpacing: 1.5 },
  coreV: { color: COLORS.white, fontFamily: 'Cinzel_700Bold', fontSize: 14, marginTop: 1 },
  centerLabel: { position: 'absolute', left: 0, right: 0, top: '45%', alignItems: 'center', zIndex: 1 },
  centerK: { color: COLORS.goldDim, fontSize: 5.5, fontWeight: '900', letterSpacing: 1.8 },
  centerT: { color: COLORS.white, fontSize: 13, fontWeight: '900', letterSpacing: .8, marginTop: 3 },
  centerS: { fontSize: 6.5, fontWeight: '900', letterSpacing: 1.3, marginTop: 4 },
  flash: { margin: 7, borderWidth: 1, borderRadius: 23, shadowOpacity: .35, shadowRadius: 26 },
  token: { position: 'absolute', width: 76, alignItems: 'center', padding: 4, borderRadius: 16, backgroundColor: 'rgba(3,3,7,.54)', shadowOpacity: .40, shadowRadius: 16, elevation: 4 },
  tokenHalo: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, borderWidth: 1, borderRadius: 16 },
  motionPart: { position: 'absolute', zIndex: 8, top: 10, right: -14, width: 28, height: 28, borderWidth: 1.5, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(3,3,7,.88)', shadowOpacity: .8, shadowRadius: 10 },
  motionGlyph: { fontSize: 18, fontWeight: '900' },
  rigCape: { position: 'absolute', top: 22, left: 16, width: 44, height: 58, borderWidth: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, opacity: .35 },
  rigArm: { position: 'absolute', top: 34, width: 21, height: 5, borderRadius: 3, elevation: 3 },
  rigArmLeft: { left: 2 },
  rigArmRight: { right: 2 },
  rigWeapon: { position: 'absolute', top: 23, right: 2, width: 4, height: 31, borderRadius: 2, elevation: 4 },
  bossAura: { position: 'absolute', width: 88, height: 100, top: -13, opacity: .62 },
  avatar: { width: 52, height: 70, borderRadius: 12, borderWidth: 1, backgroundColor: COLORS.stone },
  frame: { position: 'absolute', width: 55, height: 74, top: 2, opacity: .78 },
  hpTrack: { width: 55, height: 4, borderRadius: 2, marginTop: 4, backgroundColor: 'rgba(255,255,255,.10)', overflow: 'hidden' },
  hpFill: { height: 4, borderRadius: 2 },
  shieldTrack: { width: 55, height: 2, borderRadius: 1, marginTop: 2, backgroundColor: 'rgba(141,187,255,.10)', overflow: 'hidden' },
  shieldFill: { height: 2, borderRadius: 1, backgroundColor: COLORS.arcaneBright },
  energyRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  energyDot: { width: 6, height: 6, borderRadius: 3, shadowOpacity: .50, shadowRadius: 5 },
  unitName: { color: COLORS.parchment, fontSize: 4.9, fontWeight: '900', marginTop: 3, maxWidth: 68 },
  role: { color: COLORS.goldDim, fontSize: 3.9, fontWeight: '900', marginTop: 1, letterSpacing: .55 },
  status: { fontSize: 4.2, fontWeight: '900', marginTop: 1, letterSpacing: .55, maxWidth: 70 },
});
