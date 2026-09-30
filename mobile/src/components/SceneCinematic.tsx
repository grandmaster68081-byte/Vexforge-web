import { AnimatedVexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import { useGame } from '../app/GameProvider';
import { COLORS, SCENE_ART_TIER, type SceneVariant } from '../core/constants';

export function SceneCinematic({ visible, kicker, title, body, accent = COLORS.goldBright, icon = '✦', scene = 'nexus', duration = 2200, onFinish, skippable = true }: { visible: boolean; kicker: string; title: string; body?: string; accent?: string; icon?: string; scene?: SceneVariant; duration?: number; onFinish?: () => void; skippable?: boolean }) {
  const { width, height } = useWindowDimensions();
  const { quality } = useGame();
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0);
  const scale = useSharedValue(.985);
  const imageScale = useSharedValue(1.03);

  const finishRef = useRef(onFinish);
  useEffect(() => { finishRef.current = onFinish; }, [onFinish]);

  useEffect(() => {
    if (!visible) {
      opacity.value = withTiming(0, { duration: 150 });
      return;
    }
    const fade = reducedMotion ? 120 : 280;
    const hold = Math.max(300, duration - 680);
    opacity.value = withSequence(withTiming(1, { duration: fade }), withTiming(.98, { duration: hold }), withTiming(0, { duration: reducedMotion ? 100 : 380 }));
    scale.value = withSequence(withTiming(1, { duration: 360, easing: Easing.out(Easing.cubic) }), withTiming(1.015, { duration: hold }));
    imageScale.value = reducedMotion ? 1.03 : withSequence(withTiming(1.07, { duration: Math.min(duration, 1700), easing: Easing.inOut(Easing.quad) }), withTiming(1.03, { duration: 430 }));
    const finishTimer = setTimeout(() => finishRef.current?.(), Math.max(0, duration));
    return () => clearTimeout(finishTimer);
  }, [visible, duration, reducedMotion, opacity, scale, imageScale]);

  const shell = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ scale: scale.value }] }));
  const image = useAnimatedStyle(() => ({ transform: [{ scale: imageScale.value }] }));
  if (!visible) return null;

  return (
    <View style={styles.root} pointerEvents="auto">
      <AnimatedVexforgeImage source={SCENE_ART_TIER[quality][scene]} resizeMode="cover" cacheMode="memory-disk" style={[StyleSheet.absoluteFillObject, image]} />
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={['rgba(1,2,7,.18)', 'rgba(2,2,6,.38)', 'rgba(1,1,4,.88)']} />
        </Rect>
        <Circle cx={width * .5} cy={height * .46} r={Math.min(width, height) * .37} color={accent} opacity={.06} />
        <Circle cx={width * .5} cy={height * .46} r={Math.min(width, height) * .25} color={accent} opacity={.14} style="stroke" strokeWidth={1.2} />
      </Canvas>

      <Animated.View style={[StyleSheet.absoluteFillObject, styles.content, shell]} pointerEvents="box-none">
        <View style={styles.letterbox} />
        <View style={styles.plate}>
          <View style={[styles.crest, { borderColor: `${accent}6A`, shadowColor: accent }]}><Text style={[styles.icon, { color: accent }]}>{icon}</Text></View>
          <Text style={[styles.kicker, { color: accent }]}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          {body ? <Text style={styles.body}>{body}</Text> : null}
          <View style={styles.rule}><View style={[styles.ruleFill, { backgroundColor: accent }]} /></View>
          <Text style={styles.caption}>VEXFORGE · ESCENA OFICIAL DEL NEXUS</Text>
        </View>
      </Animated.View>

      {skippable ? <Pressable accessibilityRole="button" accessibilityLabel="Saltar escena" onPress={() => onFinish?.()} style={styles.skip}><Text style={styles.skipText}>SALTAR · ››</Text></Pressable> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFillObject, zIndex: 300, backgroundColor: '#03030A' },
  content: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  letterbox: { ...StyleSheet.absoluteFillObject, borderTopWidth: 72, borderBottomWidth: 72, borderColor: 'rgba(0,0,0,.42)' },
  plate: { width: '91%', maxWidth: 420, alignItems: 'center', paddingHorizontal: 25, paddingVertical: 28, borderRadius: 25, borderWidth: 1, borderColor: 'rgba(255,255,255,.12)', backgroundColor: 'rgba(3,3,8,.70)', shadowColor: '#000', shadowOpacity: .40, shadowRadius: 36, elevation: 10 },
  crest: { width: 62, height: 62, borderRadius: 31, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: 'rgba(0,0,0,.18)', shadowOpacity: .44, shadowRadius: 18 },
  icon: { fontSize: 26, fontWeight: '900' },
  kicker: { fontSize: 6.5, fontWeight: '900', letterSpacing: 2.2, textAlign: 'center' },
  title: { color: COLORS.white, fontFamily: 'Cinzel_900Black', fontSize: 24, lineHeight: 28, textAlign: 'center', marginTop: 6 },
  body: { color: COLORS.parchment, fontSize: 9.2, lineHeight: 14, textAlign: 'center', marginTop: 9, maxWidth: 360 },
  rule: { width: '74%', height: 2, marginTop: 15, backgroundColor: 'rgba(255,255,255,.08)', overflow: 'hidden', borderRadius: 1 },
  ruleFill: { height: 2, width: '68%', borderRadius: 1 },
  caption: { color: COLORS.ash, fontSize: 5.5, fontWeight: '900', letterSpacing: 1.4, marginTop: 9 },
  skip: { position: 'absolute', right: 16, bottom: 30, minHeight: 34, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,.18)', backgroundColor: 'rgba(0,0,0,.30)' },
  skipText: { color: COLORS.white, fontSize: 6.5, fontWeight: '900', letterSpacing: 1 },
});
