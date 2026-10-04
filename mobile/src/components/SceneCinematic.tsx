import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useGame } from '../app/GameProvider';
import { COLORS, type SceneVariant } from '../core/constants';
import { VexforgeSceneStage } from '../render/VexforgeSceneStage';

export function SceneCinematic({ visible, kicker, title, body, accent = COLORS.goldBright, icon = '✦', scene = 'nexus', duration = 2200, onFinish, skippable = true }: { visible: boolean; kicker: string; title: string; body?: string; accent?: string; icon?: string; scene?: SceneVariant; duration?: number; onFinish?: () => void; skippable?: boolean }) {
  const { width, height } = useWindowDimensions();
  const { quality } = useGame();
  const reducedMotion = useReducedMotion() === true;
  const opacity = useSharedValue(0);
  const contentY = useSharedValue(26);
  const emblem = useSharedValue(.72);
  const ring = useSharedValue(.86);
  const finishRef = useRef(onFinish);
  const finishedRef = useRef(false);
  const finishOnce = () => { if (finishedRef.current) return; finishedRef.current = true; finishRef.current?.(); };
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    if (!visible) { opacity.value = withTiming(0, { duration: 120 }); return; }
    finishedRef.current = false;
    const fade = reducedMotion ? 90 : 260;
    const hold = Math.max(260, duration - 720);
    opacity.value = withSequence(withTiming(1, { duration: fade }), withTiming(.98, { duration: hold }), withTiming(0, { duration: reducedMotion ? 80 : 300 }));
    contentY.value = withTiming(0, { duration: reducedMotion ? 90 : 560, easing: Easing.out(Easing.cubic) });
    emblem.value = withSequence(withTiming(1.08, { duration: reducedMotion ? 80 : 420, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 260 }));
    ring.value = reducedMotion ? 1 : withTiming(1.08, { duration: 1100, easing: Easing.out(Easing.quad) });
    const timer = setTimeout(finishOnce, Math.max(0, duration));
    return () => clearTimeout(timer);
  }, [visible, duration, reducedMotion, opacity, contentY, emblem, ring]);

  const contentStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: contentY.value }] }));
  const emblemStyle = useAnimatedStyle(() => ({ transform: [{ scale: emblem.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }, { rotate: '11deg' }] }));
  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="auto">
      <VexforgeSceneStage variant={scene} tier={quality} dim />
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(1,2,7,.08)', 'rgba(2,3,8,.23)', 'rgba(1,1,4,.82)']} />
        </Rect>
        <Circle cx={width*.5} cy={height*.44} r={Math.min(width,height)*.32} color={accent} opacity={.05} />
      </Canvas>
      <Animated.View style={[styles.runeFrame, { borderColor: `${accent}7D`, shadowColor: accent }, ringStyle]} pointerEvents="none">
        <Animated.View style={[styles.emblem, { borderColor: `${accent}87`, shadowColor: accent }, emblemStyle]}><Text style={[styles.icon, { color: accent }]}>{icon}</Text></Animated.View>
      </Animated.View>
      <Animated.View style={[styles.content, contentStyle]} pointerEvents="box-none">
        <View style={styles.plate}>
          <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          <View style={styles.rule}><View style={[styles.ruleFill, { backgroundColor: accent }]} /></View>
          <Text style={styles.caption}>VEXFORGE · ESCENA DEL MUNDO</Text>
        </View>
      </Animated.View>
      {skippable ? <Pressable accessibilityRole="button" accessibilityLabel="Saltar escena" onPress={finishOnce} style={styles.skip}><Text style={styles.skipText}>SALTAR · ››</Text></Pressable> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 300, backgroundColor: '#02050A' },
  runeFrame: { position: 'absolute', top: '29%', left: '50%', width: 178, height: 178, marginLeft: -89, borderRadius: 89, borderWidth: 1.2, alignItems: 'center', justifyContent: 'center', shadowOpacity: .28, shadowRadius: 28 },
  emblem: { width: 84, height: 84, borderRadius: 42, borderWidth: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,.18)', shadowOpacity: .40, shadowRadius: 22 },
  icon: { fontSize: 34, fontWeight: '900' },
  content: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 22 },
  plate: { width: '92%', maxWidth: 430, alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,.14)', backgroundColor: 'rgba(2,5,11,.72)', shadowColor: '#000', shadowOpacity: .38, shadowRadius: 36, elevation: 10 },
  kicker: { fontSize: 7, fontWeight: '900', letterSpacing: 2.2, textAlign: 'center' },
  title: { marginTop: 7, color: COLORS.white, fontFamily: 'Cinzel_900Black', fontSize: 25, lineHeight: 29, textAlign: 'center', textShadowColor: 'rgba(0,0,0,.95)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 14 },
  body: { color: COLORS.parchment, fontSize: 9.4, lineHeight: 14, textAlign: 'center', marginTop: 10, maxWidth: 365 },
  rule: { width: '72%', height: 2, marginTop: 16, backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden' },
  ruleFill: { height: 2, width: '66%' },
  caption: { marginTop: 10, color: COLORS.ash, fontSize: 5.5, fontWeight: '900', letterSpacing: 1.4 },
  skip: { position: 'absolute', right: 16, bottom: 28, minHeight: 35, paddingHorizontal: 11, justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', borderRadius: 12, backgroundColor: 'rgba(0,0,0,.32)' },
  skipText: { color: COLORS.white, fontSize: 6.5, fontWeight: '900', letterSpacing: 1 },
});
