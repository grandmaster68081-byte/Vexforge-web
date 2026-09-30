import { AnimatedVexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import type { BattleEvent } from '../types/api';
import { CINEMATIC_ART, COLORS } from '../core/constants';
import type { PresentationKind } from '../engine/presentation';

const MAJOR: PresentationKind[] = ['boss', 'victory', 'defeat'];
const META: Record<PresentationKind, { art: number; kicker: string; title: string; accent: string }> = {
  boss: { art: CINEMATIC_ART.boss_phase, kicker: 'ATLAS · BOSS PHASE', title: 'LA ENTIDAD CAMBIA', accent: COLORS.crimson },
  victory: { art: CINEMATIC_ART.battle_victory, kicker: 'CAMPO · RESULTADO', title: 'VICTORIA REGISTRADA', accent: COLORS.goldBright },
  defeat: { art: CINEMATIC_ART.battle_defeat, kicker: 'CAMPO · RESULTADO', title: 'EL CAMPO RECUERDA', accent: COLORS.crimson },
  attack: { art: CINEMATIC_ART.battle_intro, kicker: 'CAMPO', title: 'IMPACTO', accent: COLORS.crimson },
  guard: { art: CINEMATIC_ART.battle_intro, kicker: 'CAMPO', title: 'DEFENSA', accent: COLORS.arcaneBright },
  heal: { art: CINEMATIC_ART.battle_victory, kicker: 'CAMPO', title: 'RESTAURACIÓN', accent: COLORS.mint },
  cast: { art: CINEMATIC_ART.battle_intro, kicker: 'CAMPO', title: 'HABILIDAD', accent: COLORS.arcaneBright },
  status: { art: CINEMATIC_ART.battle_intro, kicker: 'CAMPO', title: 'ESTADO', accent: '#D5784E' },
  neutral: { art: CINEMATIC_ART.battle_intro, kicker: 'CAMPO', title: 'EVENTO', accent: COLORS.gold },
};

export function BattleCinematic({ event, kind, visible, onFinish }: { event: BattleEvent | null; kind: PresentationKind; visible: boolean; onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(1.04);
  const line = useSharedValue(0);
  const meta = META[kind];
  const amount = event?.amount;
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload as Record<string, unknown> : {};
  const detail = useMemo(() => {
    if (kind === 'boss') return payload.phase != null ? `FASE ${String(payload.phase)} · UMBRAL ALCANZADO` : 'EL RITMO DEL ENCUENTRO SE TRANSFORMA';
    if (kind === 'victory') return 'La secuencia autoritativa ha llegado a su cierre.';
    if (kind === 'defeat') return 'La secuencia autoritativa ha llegado a su cierre.';
    return amount == null ? String(event?.event_type ?? '').replaceAll('_', ' ') : `${String(event?.event_type ?? '').replaceAll('_', ' ')} · ${amount}`;
  }, [amount, event?.event_type, kind, payload.phase]);

  useEffect(() => {
    if (!visible || !MAJOR.includes(kind)) return;
    const duration = reduced ? 520 : kind === 'boss' ? 1050 : 900;
    opacity.value = withSequence(withTiming(1, { duration: reduced ? 90 : 180 }), withTiming(.98, { duration: Math.max(180, duration - 400) }), withTiming(0, { duration: reduced ? 100 : 260 }));
    scale.value = withSequence(withTiming(1, { duration: reduced ? 120 : 360, easing: Easing.out(Easing.cubic) }), withTiming(1.02, { duration: Math.max(160, duration - 420) }));
    line.value = withTiming(1, { duration: Math.max(260, duration - 240), easing: Easing.out(Easing.cubic) });
    const timer = setTimeout(onFinish, duration);
    return () => clearTimeout(timer);
  }, [visible, kind, reduced, onFinish, opacity, scale, line]);

  if (!visible || !MAJOR.includes(kind)) return null;
  const shell = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: line.value }] }));

  return <View style={styles.root} pointerEvents="auto">
    <AnimatedVexforgeImage source={meta.art} resizeMode="cover" cacheMode="memory-disk" style={[StyleSheet.absoluteFillObject, shell]} />
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}><LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(0,0,0,.08)', 'rgba(1,1,5,.42)', 'rgba(0,0,2,.90)']} /></Rect>
      <Circle cx={width * .5} cy={height * .44} r={Math.min(width, height) * .31} color={meta.accent} opacity={.06} />
      <Circle cx={width * .5} cy={height * .44} r={Math.min(width, height) * .23} color={meta.accent} opacity={.11} style="stroke" strokeWidth={1.4} />
    </Canvas>
    <Animated.View style={[styles.content, shell]}>
      <Text style={[styles.kicker, { color: meta.accent }]}>{meta.kicker}</Text>
      <Text style={styles.title}>{meta.title}</Text>
      <Text style={styles.detail}>{detail}</Text>
      <View style={styles.rule}><Animated.View style={[styles.ruleFill, { backgroundColor: meta.accent }, lineStyle]} /></View>
      {amount != null ? <Text style={[styles.amount, { color: meta.accent }]}>{amount}</Text> : null}
      <Text style={styles.event}>{String(event?.actor_id ?? 'VEXFORGE').slice(0, 24)} {event?.target_id ? `→ ${String(event.target_id).slice(0, 24)}` : ''}</Text>
    </Animated.View>
    <Pressable style={styles.skip} onPress={onFinish}><Text style={styles.skipText}>CONTINUAR · ››</Text></Pressable>
  </View>;
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 500, backgroundColor: '#020207' },
  content: { position: 'absolute', left: 22, right: 22, top: '33%', alignItems: 'center', paddingHorizontal: 18 },
  kicker: { fontSize: 7, fontWeight: '900', letterSpacing: 2.4, textAlign: 'center' },
  title: { color: COLORS.white, fontFamily: 'Cinzel_900Black', fontSize: 30, lineHeight: 35, textAlign: 'center', marginTop: 7, textShadowColor: 'rgba(0,0,0,.9)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 16 },
  detail: { color: COLORS.parchment, fontSize: 9, lineHeight: 14, textAlign: 'center', marginTop: 10, maxWidth: 380 },
  rule: { width: '76%', height: 2, backgroundColor: 'rgba(255,255,255,.10)', marginTop: 16, overflow: 'hidden' },
  ruleFill: { width: '100%', height: 2 },
  amount: { fontSize: 28, fontWeight: '900', marginTop: 12, textShadowColor: 'rgba(0,0,0,.9)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12 },
  event: { color: COLORS.ash, fontSize: 5.5, fontWeight: '900', letterSpacing: 1.2, marginTop: 12, textTransform: 'uppercase' },
  skip: { position: 'absolute', right: 16, bottom: 28, minHeight: 38, paddingHorizontal: 12, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', borderRadius: 13, backgroundColor: 'rgba(0,0,0,.32)' },
  skipText: { color: COLORS.white, fontSize: 6.5, fontWeight: '900', letterSpacing: 1 },
});
