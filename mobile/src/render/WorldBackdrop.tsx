import { AnimatedVexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Path, Rect, vec } from '@shopify/react-native-skia';
import type { QualityTier } from '../types/game';
import { COLORS, SCENE_ACCENT, SCENE_ART_TIER, type SceneVariant } from '../core/constants';

const PARTICLES = Array.from({ length: 32 }, (_, i) => ({
  x: (i * 47) % 101,
  y: (i * 73 + 11) % 96,
  r: 0.7 + (i % 4) * 0.55,
  o: 0.05 + (i % 6) * 0.018,
}));

export function WorldBackdrop({ variant, tier }: { variant: SceneVariant; tier: QualityTier }) {
  const { width, height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const drift = useSharedValue(0);
  const shimmer = useSharedValue(0);
  const accent = SCENE_ACCENT[variant];

  useEffect(() => {
    const driftDuration = tier === 'HIGH' ? 16000 : 21000;
    if (reducedMotion) {
      drift.value = 0;
      shimmer.value = 0;
      return;
    }
    drift.value = withRepeat(withTiming(1, { duration: driftDuration, easing: Easing.inOut(Easing.quad) }), -1, true);
    shimmer.value = withRepeat(withTiming(1, { duration: 6200, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [drift, shimmer, reducedMotion, tier]);

  const movement = useAnimatedStyle(() => ({
    transform: [
      { scale: 1.055 },
      { translateX: drift.value * 9 - 4.5 },
      { translateY: -drift.value * 7 + 3.5 },
    ],
  }));
  const lightSweep = useAnimatedStyle(() => ({
    opacity: 0.08 + shimmer.value * 0.08,
    transform: [{ translateX: shimmer.value * width * 0.22 - width * 0.11 }],
  }));

  const particleCount = tier === 'LOW' ? 7 : tier === 'MEDIUM' ? 17 : PARTICLES.length;
  const particleDots = useMemo(() => PARTICLES.slice(0, particleCount), [particleCount]);
  const scene = SCENE_ART_TIER[tier][variant];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
      <AnimatedVexforgeImage source={scene} resizeMode="cover" cacheMode="memory-disk" style={[StyleSheet.absoluteFillObject, styles.art, movement]} />

      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient
            start={vec(0, 0)}
            end={vec(width, height)}
            colors={['rgba(0,0,0,.08)', 'rgba(2,3,9,.17)', 'rgba(2,2,6,.84)']}
          />
        </Rect>
        <Circle cx={width * 0.78} cy={height * 0.15} r={Math.min(width, height) * 0.34} color={accent} opacity={0.045} />
        <Circle cx={width * 0.78} cy={height * 0.15} r={Math.min(width, height) * 0.25} color={accent} opacity={0.10} style="stroke" strokeWidth={1.2} />
        <Circle cx={width * 0.20} cy={height * 0.72} r={Math.min(width, height) * 0.22} color={COLORS.gold} opacity={0.035} style="stroke" strokeWidth={1} />
        <Path path={`M ${width * .08} ${height * .82} Q ${width * .5} ${height * .59} ${width * .92} ${height * .82}`} color={COLORS.gold} opacity={0.12} style="stroke" strokeWidth={1} />
        {particleDots.map((p, i) => (
          <Circle key={i} cx={width * p.x / 100} cy={height * p.y / 100} r={p.r} color={i % 3 === 0 ? COLORS.goldBright : accent} opacity={p.o} />
        ))}
      </Canvas>

      <Animated.View style={[styles.lightSweep, lightSweep, { backgroundColor: accent }]} />
      <View style={styles.topVeil} />
      <View style={styles.bottomVeil} />
      <View style={[styles.edge, { borderColor: `${accent}2C` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  art: { opacity: 0.98 },
  lightSweep: { position: 'absolute', top: 0, bottom: 0, width: '28%', opacity: 0.07, transform: [{ skewX: '-12deg' }] },
  topVeil: { position: 'absolute', left: 0, right: 0, top: 0, height: '24%', backgroundColor: 'rgba(2,2,7,.22)' },
  bottomVeil: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '34%', backgroundColor: 'rgba(2,2,7,.46)' },
  edge: { ...StyleSheet.absoluteFillObject, borderWidth: 1, borderRadius: 30 },
});
