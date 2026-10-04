import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Canvas, Circle, Line, LinearGradient, Rect, vec } from '@shopify/react-native-skia';
import type { BattleEvent } from '../types/api';
import type { PresentationKind } from '../engine/presentation';
import { COLORS } from '../core/constants';
import { VexforgeImage } from '../render/VexforgeImage';

const MAJOR: PresentationKind[] = ['boss', 'victory', 'defeat'];
const BOSS_AURA = require('../../assets/vexforge/VF_BOSS_AURA.png');
const BOSS_SIGIL = require('../../assets/vexforge/VF_BOSS_SIGIL.png');
const REWARD_SIGIL = require('../../assets/vexforge/VF_REWARD_SIGIL_PREMIUM.png');

export function BattleCinematic({ event, kind, visible, onFinish }: { event: BattleEvent | null; kind: PresentationKind; visible: boolean; onFinish: () => void }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion() === true;
  const opacity = useSharedValue(0);
  const emblemScale = useSharedValue(.64);
  const ring = useSharedValue(.60);
  const sweep = useSharedValue(0);
  const finishedRef = useRef(false);
  const finishOnce = () => { if (finishedRef.current) return; finishedRef.current = true; onFinish(); };
  const meta = useMemo(() => {
    if (kind === 'boss') return { kicker: 'ENTIDAD · FASE', title: 'EL CAMPO CAMBIA', accent: COLORS.crimson, art: BOSS_SIGIL };
    if (kind === 'victory') return { kicker: 'CAMPO · RESULTADO', title: 'VICTORIA', accent: COLORS.goldBright, art: REWARD_SIGIL };
    return { kicker: 'CAMPO · RESULTADO', title: 'DERROTA', accent: COLORS.crimson, art: BOSS_SIGIL };
  }, [kind]);
  const payload = event?.payload && typeof event.payload === 'object' ? event.payload as Record<string, unknown> : {};
  const detail = kind === 'boss' && payload.phase != null ? `FASE ${String(payload.phase)} · UMBRAL ALCANZADO` : kind === 'boss' ? 'La entidad modifica el ritmo del encuentro.' : 'La secuencia de combate ha llegado a su resolución.';

  useEffect(() => {
    if (!visible || !MAJOR.includes(kind)) return;
    finishedRef.current = false;
    const duration = reduced ? 520 : kind === 'boss' ? 1180 : 940;
    opacity.value = withSequence(withTiming(1, { duration: reduced ? 70 : 160 }), withTiming(.98, { duration: Math.max(180, duration-360) }), withTiming(0, { duration: reduced ? 90 : 220 }));
    emblemScale.value = withSequence(withTiming(1.06, { duration: reduced ? 80 : 360, easing: Easing.out(Easing.cubic) }), withTiming(1, { duration: 220 }));
    ring.value = reduced ? 1 : withSequence(withTiming(1.15, { duration: 700, easing: Easing.out(Easing.cubic) }), withTiming(.98, { duration: 300 }));
    sweep.value = reduced ? 1 : withTiming(1, { duration: 750, easing: Easing.inOut(Easing.sin) });
    const timer = setTimeout(finishOnce, duration);
    return () => clearTimeout(timer);
  }, [visible, kind, reduced, onFinish, opacity, emblemScale, ring, sweep]);

  const shell = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const emblem = useAnimatedStyle(() => ({ transform: [{ scale: emblemScale.value }] }));
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: ring.value }, { rotate: '-7deg' }] }));
  const sweepStyle = useAnimatedStyle(() => ({ opacity: .05 + sweep.value*.10, transform: [{ translateX: sweep.value*width-width*.50 }] }));
  if (!visible || !MAJOR.includes(kind)) return null;

  return (
    <Animated.View style={[styles.root, shell]} pointerEvents="auto">
      {/* Transparent over the real battlefield: the battlefield itself remains visible. */}
      <View style={styles.scrim} pointerEvents="none" />
      <Animated.View style={[styles.energySweep, { backgroundColor: meta.accent }, sweepStyle]} pointerEvents="none" />
      <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
        <Rect x={0} y={0} width={width} height={height}>
          <LinearGradient start={vec(0,0)} end={vec(0,height)} colors={['rgba(0,0,0,.03)','rgba(1,3,8,.10)','rgba(0,0,3,.28)']} />
        </Rect>
        <Circle cx={width*.50} cy={height*.43} r={Math.min(width,height)*.26} color={meta.accent} opacity={.035} />
        <Circle cx={width*.50} cy={height*.43} r={Math.min(width,height)*.19} color={meta.accent} opacity={.08} style="stroke" strokeWidth={1.2} />
        <Line p1={vec(width*.20,height*.43)} p2={vec(width*.80,height*.43)} color={meta.accent} opacity={.12} strokeWidth={1} />
      </Canvas>
      {kind === 'boss' ? <VexforgeImage source={BOSS_AURA} resizeMode="contain" cacheMode="memory-disk" style={styles.aura} /> : null}
      <Animated.View style={[styles.ring, { borderColor: `${meta.accent}75`, shadowColor: meta.accent }, ringStyle]} pointerEvents="none">
        <Animated.View style={[styles.emblem, { borderColor: `${meta.accent}8D`, shadowColor: meta.accent }, emblem]}>
          <VexforgeImage source={meta.art} resizeMode="contain" cacheMode="memory-disk" style={styles.emblemArt} />
        </Animated.View>
      </Animated.View>
      <View style={styles.textBlock} pointerEvents="none">
        <Text style={[styles.kicker,{color:meta.accent}]}>{meta.kicker}</Text>
        <Text style={styles.title}>{meta.title}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      <Pressable onPress={finishOnce} style={styles.skip}><Text style={styles.skipText}>CONTINUAR · ››</Text></Pressable>
    </Animated.View>
  );
}
const styles=StyleSheet.create({
  root:{...StyleSheet.absoluteFillObject,zIndex:500,backgroundColor:'transparent'},
  scrim:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(0,0,0,.16)'},
  energySweep:{position:'absolute',top:'-12%',bottom:'-12%',width:'22%',transform:[{rotate:'-12deg'}]},
  aura:{position:'absolute',width:330,height:330,left:'50%',top:'17%',marginLeft:-165,opacity:.23},
  ring:{position:'absolute',left:'50%',top:'26%',width:198,height:198,marginLeft:-99,borderRadius:99,borderWidth:1.1,alignItems:'center',justifyContent:'center',shadowOpacity:.28,shadowRadius:30},
  emblem:{width:100,height:100,borderRadius:50,borderWidth:1,backgroundColor:'rgba(0,0,0,.28)',alignItems:'center',justifyContent:'center',shadowOpacity:.44,shadowRadius:24},
  emblemArt:{width:72,height:72},
  textBlock:{position:'absolute',left:20,right:20,top:'47%',alignItems:'center'},
  kicker:{fontSize:7,fontWeight:'900',letterSpacing:2.1},
  title:{marginTop:5,color:COLORS.white,fontFamily:'Cinzel_900Black',fontSize:30,lineHeight:35,textAlign:'center',textShadowColor:'rgba(0,0,0,.95)',textShadowOffset:{width:0,height:3},textShadowRadius:16},
  detail:{marginTop:8,color:COLORS.parchment,fontSize:9.2,lineHeight:14,textAlign:'center',maxWidth:350},
  skip:{position:'absolute',right:16,bottom:26,minHeight:38,paddingHorizontal:12,justifyContent:'center',borderWidth:1,borderColor:'rgba(255,255,255,.18)',borderRadius:13,backgroundColor:'rgba(0,0,0,.30)'},
  skipText:{color:COLORS.white,fontSize:6.5,fontWeight:'900',letterSpacing:1},
});
