import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, Line, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import type { BattleEvent } from '../types/api';
import type { PresentationKind } from '../engine/presentation';
import { COLORS } from '../core/constants';

export interface BattlePoint { x: number; y: number; }

export function BattleEffects({ event, kind, origin, target }: { event: BattleEvent | null; kind: PresentationKind | null; origin?: BattlePoint | null; target?: BattlePoint | null }) {
  const { width, height } = useWindowDimensions();
  const burst = useSharedValue(0);
  const travel = useSharedValue(0);
  const amount = event?.amount;
  const payload=(event?.payload&&typeof event.payload==='object')?event.payload as Record<string,unknown>:{};
  const statusName=String(payload.status??payload.status_type??'').toLowerCase();
  const tone = kind === 'heal' ? COLORS.mint : kind === 'guard' ? COLORS.arcaneBright : kind === 'boss' ? COLORS.crimson : kind === 'victory' ? COLORS.goldBright : kind === 'defeat' ? COLORS.crimson : kind === 'status' ? (statusName.includes('poison') ? '#77D98B' : statusName.includes('burn') ? '#F07A46' : statusName.includes('stun') ? '#D8C36A' : '#D5784E') : kind === 'cast' ? COLORS.arcaneBright : COLORS.crimson;

  useEffect(() => {
    burst.value = withSequence(withTiming(1, { duration: 110 }), withTiming(0, { duration: 580, easing: Easing.out(Easing.quad) }));
    travel.value = withSequence(withTiming(1, { duration: 220, easing: Easing.out(Easing.cubic) }), withTiming(0, { duration: 420, easing: Easing.out(Easing.cubic) }));
  }, [event, kind, burst, travel]);

  const ringStyle = useAnimatedStyle(() => ({ opacity: burst.value, transform: [{ scale: 0.30 + burst.value * 1.55 }] }));
  const projectileStyle = useAnimatedStyle(() => ({ opacity: travel.value, transform: [{ scaleX: .35 + travel.value * .9 }] }));
  const shockStyle = useAnimatedStyle(() => ({ opacity: burst.value * .72, transform: [{ scale: .35 + burst.value * 1.9 }] }));
  const statusStyle = useAnimatedStyle(() => ({ opacity: burst.value * .42, transform: [{ scale: .72 + burst.value * .65 }] }));
  const sparks = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    x: Math.cos(i * 1.47) * (22 + (i % 6) * 14),
    y: Math.sin(i * 1.19) * (18 + (i % 5) * 16),
    r: 1.1 + (i % 3) * 0.65,
  })), []);
  if (!event && !kind) return null;

  const a = origin ?? { x: width * .5, y: height * .54 };
  const b = target ?? { x: width * .5, y: height * .54 };
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const distance = Math.max(1, Math.sqrt(dx * dx + dy * dy));
  const ux = dx / distance;
  const uy = dy / distance;
  const midpoint = { x: a.x + dx * .5, y: a.y + dy * .5 };


  const symbol = kind === 'heal' ? '✚' : kind === 'guard' ? '◇' : kind === 'status' ? (statusName.includes('burn') ? '🔥' : statusName.includes('poison') ? '☠' : statusName.includes('stun') ? '✹' : '◌') : kind === 'boss' ? '◆' : kind === 'cast' ? (String(event?.event_type??'').includes('SUMMON') ? '✦' : '✧') : kind === 'victory' ? '✧' : '╱';
  const amountText = amount == null ? null : `${kind === 'heal' ? '+' : kind === 'defeat' ? '×' : ''}${amount}`;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height} opacity={kind === 'boss' ? .16 : .06}>
          <LinearGradient start={vec(0, height * .45)} end={vec(width, height * .45)} colors={[`${tone}00`, `${tone}22`, `${tone}00`]} />
        </Rect>
        {origin && target && kind !== 'victory' && (
          <Line x1={a.x} y1={a.y} x2={b.x} y2={b.y} color={tone} opacity={0.18} strokeWidth={kind === 'status' ? 2 : 3} />
        )}
        {sparks.map((p, i) => <Circle key={i} cx={b.x + p.x} cy={b.y + p.y} r={p.r} color={tone} opacity={0.16 - i * 0.004} />)}
      </Canvas>

      {origin && target && kind !== 'victory' ? (
        <Animated.View style={[styles.projectileTrack, projectileStyle, { left: a.x - 2, top: a.y - 2, width: distance, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] }] }>
          <View style={[styles.projectile, { backgroundColor: tone, shadowColor: tone }]} />
        </Animated.View>
      ) : null}

      <Animated.View style={[styles.targetRing, ringStyle, { left: b.x - 48, top: b.y - 48, borderColor: `${tone}B8`, shadowColor: tone }]} />
      <Animated.View style={[styles.shock, shockStyle, { left: b.x - 74, top: b.y - 74, borderColor: `${tone}66`, shadowColor: tone }]} />
      {(kind === 'status' || kind === 'boss') ? <Animated.View style={[styles.statusAura, statusStyle, { left: b.x - 62, top: b.y - 62, borderColor: `${tone}5C`, shadowColor: tone }]} /> : null}
      <Animated.View style={[styles.sig, ringStyle, { left: b.x - 34, top: b.y - 34, borderColor: `${tone}7A`, shadowColor: tone }]}>
        <Text style={[styles.sigText, { color: tone }]}>{symbol}</Text>
      </Animated.View>
      {amountText ? <Animated.View style={[styles.amount, { left: Math.max(6, b.x - 65), top: b.y - 92 }, ringStyle]}><Text style={[styles.amountText, { color: tone }]}>{amountText}</Text></Animated.View> : null}
      {kind === 'boss' && payload.phase != null ? <Animated.View style={[styles.phaseBadge, ringStyle, { left: Math.max(8, b.x - 44), top: b.y + 49, borderColor: `${tone}88` }]}><Text style={[styles.phaseText, { color: tone }]}>FASE {String(payload.phase)}</Text></Animated.View> : null}
      {kind === 'attack' || kind === 'cast' || kind === 'defeat' ? (
        <Animated.View style={[styles.tracer, { left: midpoint.x - 42, top: midpoint.y - 1, backgroundColor: tone, shadowColor: tone, transform: [{ rotate: `${Math.atan2(dy, dx) - Math.PI / 8}rad` }, { translateX: -ux * 12 }, { translateY: -uy * 12 }] }, projectileStyle]} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shock: { position: 'absolute', width: 148, height: 148, borderRadius: 74, borderWidth: 2, backgroundColor: 'transparent', shadowOpacity: .28, shadowRadius: 28 },
  statusAura: { position: 'absolute', width: 124, height: 124, borderRadius: 62, borderWidth: 1.5, backgroundColor: 'transparent', shadowOpacity: .24, shadowRadius: 24 },
  targetRing: { position: 'absolute', width: 96, height: 96, borderRadius: 48, borderWidth: 2, shadowOpacity: .48, shadowRadius: 22 },
  sig: { position: 'absolute', width: 68, height: 68, borderRadius: 34, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.14)', shadowOpacity: .44, shadowRadius: 18 },
  sigText: { fontSize: 28, fontWeight: '900' },
  amount: { position: 'absolute', width: 130, alignItems: 'center' },
  amountText: { fontSize: 28, fontWeight: '900', textShadowColor: 'rgba(0,0,0,.95)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 10 },
  phaseBadge: { position: 'absolute', minWidth: 88, height: 20, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.48)' },
  phaseText: { fontSize: 6, fontWeight: '900', letterSpacing: 1.3 },
  projectileTrack: { position: 'absolute', height: 4, transformOrigin: 'left center' },
  projectile: { position: 'absolute', right: 0, top: -3, width: 10, height: 10, borderRadius: 5, shadowOpacity: .82, shadowRadius: 12 },
  tracer: { position: 'absolute', width: 84, height: 3, shadowOpacity: .75, shadowRadius: 13 },
});
