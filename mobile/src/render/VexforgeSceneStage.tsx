import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withRepeat, withTiming, type SharedValue } from 'react-native-reanimated';
import { Canvas, Circle, LinearGradient, Path, Rect, vec } from '@shopify/react-native-skia';
import { VexforgeImage } from './VexforgeImage';
import { SCENE_ART_TIER } from '../core/constants';
import type { QualityTier } from '../types/game';
import type { SceneVariant } from '../core/constants';

const WORLD_ART: Record<string, number> = {
  master: require('../../assets/vexforge/world/VF_WORLD_MASTER.jpg'),
  nexus: require('../../assets/vexforge/world/VF_WORLD_NEXUS.jpg'),
  arena: require('../../assets/vexforge/world/VF_WORLD_ARENA.jpg'),
  archive: require('../../assets/vexforge/world/VF_WORLD_ARCHIVE.jpg'),
  forge: require('../../assets/vexforge/world/VF_WORLD_FORGE.jpg'),
  missions: require('../../assets/vexforge/world/VF_WORLD_MISSIONS.jpg'),
  world: require('../../assets/vexforge/world/VF_WORLD_WORLD.jpg'),
  store: require('../../assets/vexforge/world/VF_WORLD_STORE.jpg'),
  economy: require('../../assets/vexforge/world/VF_WORLD_ECONOMY.jpg'),
  social: require('../../assets/vexforge/world/VF_WORLD_SOCIAL.jpg'),
  legacy: require('../../assets/vexforge/world/VF_WORLD_LEGACY.jpg'),
  meta: require('../../assets/vexforge/world/VF_WORLD_META.jpg'),
  tutorial: require('../../assets/vexforge/world/VF_WORLD_TUTORIAL.jpg'),
  auth: require('../../assets/vexforge/world/VF_WORLD_AUTH.jpg'),
  events: require('../../assets/vexforge/world/VF_WORLD_MASTER.jpg'),
};

const ACCENTS: Record<string, string> = {
  nexus: '#77B9FF', arena: '#74AFFF', archive: '#C5A86C', forge: '#F09054',
  missions: '#D0C07A', world: '#72B5FF', store: '#E7BE6A', economy: '#7CCFA4',
  social: '#A899E8', legacy: '#9A8A6A', meta: '#7BA5FF', tutorial: '#78C5E8',
  auth: '#B992F0', master: '#E0B75B', events: '#B05A5E',
};
const PARTICLES = Array.from({ length: 40 }, (_, i) => ({ x: (i * 37 + 11) % 101, y: (i * 59 + 7) % 97, r: 0.8 + (i % 4) * 0.55, o: 0.045 + (i % 7) * 0.016 }));
const SHARDS = Array.from({ length: 20 }, (_, i) => ({ x: 7 + ((i * 43) % 86), y: 17 + ((i * 29) % 64), s: 6 + (i % 4) * 2, r: -35 + (i * 19) % 70 }));

function colorForVariant(variant: string) { return ACCENTS[variant] ?? ACCENTS.nexus; }
function shardStyle(index: number, x: number, y: number, size: number, rotation: number, phase: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    left: `${x}%`, top: `${y}%`, opacity: 0.10 + 0.16 * Math.sin(phase.value + index * 0.63) ** 2,
    transform: [
      { translateY: Math.sin(phase.value * 0.75 + index) * (3 + index % 3) },
      { rotate: `${rotation + Math.sin(phase.value + index) * 8}deg` },
      { scale: 0.86 + 0.14 * Math.sin(phase.value * 0.9 + index * 0.5) ** 2 },
    ],
  }));
}

export function VexforgeSceneStage({ variant, tier, dim = false }: { variant: SceneVariant | string; tier: QualityTier; dim?: boolean }) {
  const { width, height } = useWindowDimensions();
  const reduced = useReducedMotion() === true;
  const phase = useSharedValue(0); const beam = useSharedValue(0); const ring = useSharedValue(0); const depth = useSharedValue(0);
  const particleCount = tier === 'LOW' ? 10 : tier === 'MEDIUM' ? 24 : 40;
  const shardCount = tier === 'LOW' ? 7 : tier === 'MEDIUM' ? 13 : 20;
  const v=String(variant); const accent=colorForVariant(v);
  const authored = (SCENE_ART_TIER as Record<string, Record<string, number>>)[tier]?.[v];
  const fallback = WORLD_ART[v] ?? WORLD_ART.nexus;
  useEffect(() => {
    if (reduced) { phase.value=0; beam.value=0; ring.value=0; depth.value=0; return; }
    phase.value=withRepeat(withTiming(Math.PI*2,{duration:tier==='HIGH'?9000:13000,easing:Easing.linear}),-1,false);
    beam.value=withRepeat(withTiming(1,{duration:tier==='HIGH'?6200:8000,easing:Easing.inOut(Easing.sin)}),-1,true);
    ring.value=withRepeat(withTiming(1,{duration:12000,easing:Easing.linear}),-1,false);
    depth.value=withRepeat(withTiming(1,{duration:16000,easing:Easing.inOut(Easing.sin)}),-1,true);
  }, [beam,depth,phase,reduced,ring,tier]);
  const farStyle=useAnimatedStyle(()=>({ transform:[{translateX:depth.value*width*0.018-width*0.009}], opacity:dim?0.035:0.10 }));
  const artStyle=useAnimatedStyle(()=>({ transform:[{translateX:depth.value*width*0.008-width*0.004}], opacity:dim?0.91:1 }));
  const beamStyle=useAnimatedStyle(()=>({opacity:dim?0.045:0.10+beam.value*0.08,transform:[{translateX:beam.value*width*0.55-width*0.28},{rotate:'-12deg'}]}));
  const runeStyle=useAnimatedStyle(()=>({transform:[{rotate:`${ring.value*360}deg`}],opacity:dim?0.11:0.19}));
  const particleDots=useMemo(()=>PARTICLES.slice(0,particleCount),[particleCount]);
  // Independent far plane + authored scene plane + Independent middle plane + Independent foreground plane + moving depth layer.
  return <View pointerEvents="none" style={StyleSheet.absoluteFillObject}>
    <Animated.View style={[StyleSheet.absoluteFillObject,farStyle]}><VexforgeImage source={WORLD_ART.master} resizeMode="cover" cacheMode="memory-disk" style={styles.art} /></Animated.View>
    <Animated.View style={[StyleSheet.absoluteFillObject,artStyle]}><VexforgeImage source={authored ?? fallback} resizeMode="cover" cacheMode="memory-disk" style={styles.art} /></Animated.View>
    <Canvas style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Rect x={0} y={0} width={width} height={height}><LinearGradient start={vec(0,0)} end={vec(0,height)} colors={['rgba(0,0,0,.03)','rgba(2,4,10,.14)','rgba(2,2,7,.60)']} /></Rect>
      <Circle cx={width*.50} cy={height*.42} r={Math.min(width,height)*.30} color={accent} opacity={dim?.018:.055}/>
      <Circle cx={width*.50} cy={height*.42} r={Math.min(width,height)*.235} color={accent} opacity={dim?.025:.095} style="stroke" strokeWidth={1.15}/>
      <Circle cx={width*.50} cy={height*.42} r={Math.min(width,height)*.14} color={accent} opacity={dim?.018:.045} style="stroke" strokeWidth={1}/>
      <Path path={`M ${width*.08} ${height*.84} Q ${width*.50} ${height*.58} ${width*.92} ${height*.84}`} color={accent} opacity={dim?.04:.10} style="stroke" strokeWidth={1}/>
      <Path path={`M ${width*.14} ${height*.77} Q ${width*.50} ${height*.62} ${width*.86} ${height*.77}`} color="#DAB46A" opacity={dim?.025:.055} style="stroke" strokeWidth={1}/>
      {particleDots.map((p,i)=><Circle key={i} cx={width*p.x/100} cy={height*p.y/100} r={p.r} color={i%3===0?'#E6BD67':accent} opacity={dim?p.o*.5:p.o}/>) }
    </Canvas>
    <Animated.View style={[styles.runePlane,{left:width*.5-108,top:height*.405-108,width:216,height:216,borderColor:`${accent}3C`,shadowColor:accent},runeStyle]}>
      <View style={[styles.runeTick,{borderColor:`${accent}7A`,transform:[{rotate:'0deg'}]}]}/><View style={[styles.runeTick,{borderColor:`${accent}4A`,transform:[{rotate:'90deg'}]}]}/><View style={[styles.runeTick,{borderColor:`${accent}4A`,transform:[{rotate:'45deg'}]}]}/>
    </Animated.View>
    <Animated.View style={[styles.beam,{backgroundColor:accent},beamStyle]}/>
    {SHARDS.slice(0,shardCount).map((s,i)=><AnimatedShard key={i} index={i} x={s.x} y={s.y} s={s.s} r={s.r} phase={phase}/>) }
    <View style={[styles.bottomDepth,{backgroundColor:dim?'rgba(2,4,10,.16)':'rgba(2,4,10,.30)'}]}/><View style={[styles.edge,{borderColor:`${accent}26`}]}/>
  </View>;
}
function AnimatedShard({index,x,y,s,r,phase}:{index:number;x:number;y:number;s:number;r:number;phase:SharedValue<number>}){const style=shardStyle(index,x,y,s,r,phase);return <Animated.View style={[styles.shard,{width:s,height:s,borderColor:'#E6BD67'},style]}/>;}
const styles=StyleSheet.create({art:{...StyleSheet.absoluteFillObject,opacity:.995},runePlane:{position:'absolute',borderWidth:1,borderRadius:108,alignItems:'center',justifyContent:'center',shadowOpacity:.22,shadowRadius:28},runeTick:{position:'absolute',width:96,height:96,borderWidth:1,borderRadius:48},beam:{position:'absolute',top:'-18%',bottom:'-18%',width:'18%',opacity:.08},shard:{position:'absolute',borderWidth:1,backgroundColor:'rgba(8,14,25,.24)'},bottomDepth:{position:'absolute',left:0,right:0,bottom:0,height:'28%'},edge:{...StyleSheet.absoluteFillObject,borderWidth:1,borderRadius:24}});
