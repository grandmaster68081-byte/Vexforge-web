import { VexforgeImage } from '../render/VexforgeImage';
import React, { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withRepeat, withSpring, withTiming } from 'react-native-reanimated';
import type { CardRecord } from '../types/api';
import { COLORS } from '../core/constants';

const CARD_BACK = require('../../assets/vexforge/VF_CARD_BACK_CORE.png');
const CARD_FALLBACK = require('../../assets/vexforge/VF_CARD_FALLBACK_NEUTRAL.png');
const FRAME_EPIC = require('../../assets/vexforge/VF_CARD_FRAME_EPIC.png');
const FRAME_LEGENDARY = require('../../assets/vexforge/VF_CARD_FRAME_LEGENDARY.png');

const rarityAccent = (rarity?: string | null) => {
  const r = String(rarity ?? '').toLowerCase();
  if (r === 'mythic') return '#D8A7FF';
  if (r === 'legendary') return COLORS.goldBright;
  if (r === 'epic') return '#AA8BFF';
  if (r === 'rare') return COLORS.arcaneBright;
  if (r === 'uncommon') return COLORS.mint;
  return COLORS.steel;
};

export function VexforgeCard({ card, width = 108, selected = false, compact = false, hero = false, faceDown = false, onPress, ownership, motion = true }: { card?: CardRecord | null; width?: number; selected?: boolean; compact?: boolean; hero?: boolean; faceDown?: boolean; onPress?: () => void; ownership?: 'owned' | 'locked' | 'listed'; motion?: boolean }) {
  const scale = useSharedValue(1); const shine = useSharedValue(-1.2); const breathe = useSharedValue(.97);
  const accent = rarityAccent(card?.rarity); const r=String(card?.rarity??'').toLowerCase();
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const shineStyle = useAnimatedStyle(() => ({ opacity: activeMotion ? .36 : 0, transform: [{ translateX: shine.value * (width*1.2) }, { skewX: '-18deg' }] }));
  const animatedRarity = r==='legendary'||r==='mythic'||hero;
  const activeMotion = motion && !faceDown && animatedRarity;
  const auraStyle = useAnimatedStyle(() => ({ transform:[{scale:breathe.value}], opacity:activeMotion ? .34 : 0 }));
  useEffect(()=>{if(!activeMotion){shine.value=-1.2;breathe.value=.97;return;}shine.value=withRepeat(withTiming(1.2,{duration:3400,easing:Easing.inOut(Easing.sin)}),-1,false);breathe.value=withRepeat(withTiming(1.025,{duration:1800,easing:Easing.inOut(Easing.sin)}),-1,true);return()=>{shine.value=-1.2;breathe.value=.97}},[activeMotion,shine,breathe]);
  const height = Math.round(width * 1.42);
  const image = useMemo(() => card?.image_url ? { uri: card.image_url } : CARD_FALLBACK, [card?.image_url]);
  const frame = r === 'legendary' || r === 'mythic' ? FRAME_LEGENDARY : r === 'epic' ? FRAME_EPIC : null;
  return <Pressable onPress={onPress} disabled={!onPress} onPressIn={() => { scale.value = withSpring(0.965, { damping: 16, stiffness: 250 }); }} onPressOut={() => { scale.value = withSpring(1, { damping: 16, stiffness: 250 }); }} style={{ width }}>
    <Animated.View style={[styles.card,{width,height,borderColor:`${accent}88`,shadowColor:accent},selected&&styles.selected,hero&&styles.hero,style]}>
      <VexforgeImage source={faceDown?CARD_BACK:image} resizeMode="cover" style={StyleSheet.absoluteFillObject}/>
      {!faceDown&&<Animated.View pointerEvents="none" style={[styles.aura,{borderColor:`${accent}55`},auraStyle]}/>}
      {!faceDown&&frame?<VexforgeImage source={frame} resizeMode="stretch" style={StyleSheet.absoluteFillObject}/>:null}
      {!faceDown&&<Animated.View pointerEvents="none" style={[styles.shine,shineStyle,{backgroundColor:`${COLORS.white}2A`}]} />}
      {!compact&&!faceDown?<View style={styles.topMeta}><Text style={styles.code}>{card?.code??'CARD'}</Text><View style={[styles.rarityBadge,{borderColor:`${accent}66`,backgroundColor:`${accent}14`}]}><Text style={[styles.rarity,{color:accent}]}>{r?String(card?.rarity).toUpperCase():'UNVERIFIED'}</Text></View></View>:null}
      {!compact&&!faceDown?<View style={styles.caption}><Text numberOfLines={1} style={styles.name}>{card?.name??'Identidad no vinculada'}</Text><Text numberOfLines={1} style={styles.faction}>{card?.faction??'VEXFORGE'} · PWR {card?.power??'—'}</Text></View>:null}
      {ownership==='locked'?<View style={styles.lock}><Text style={styles.lockText}>◌</Text></View>:null}
      {ownership==='listed'?<View style={[styles.tag,{borderColor:`${COLORS.mint}55`}]}><Text style={[styles.tagText,{color:COLORS.mint}]}>MERCADO</Text></View>:null}
      {selected?<View pointerEvents="none" style={[styles.selection,{borderColor:accent}]} />:null}
    </Animated.View>
  </Pressable>;
}
export function CardStatLine({ card }: { card: CardRecord }) { return <View style={styles.stats}><View><Text style={styles.statLabel}>POWER</Text><Text style={styles.stat}>{card.power ?? '—'}</Text></View><View><Text style={styles.statLabel}>AFFINITY</Text><Text style={styles.stat}>{card.affinity ?? '—'}</Text></View><View><Text style={styles.statLabel}>PRESTIGE</Text><Text style={styles.stat}>{card.prestige ?? '—'}</Text></View><View><Text style={styles.statLabel}>CHARGE</Text><Text style={styles.stat}>{card.charge ?? '—'}</Text></View></View>; }
const styles=StyleSheet.create({card:{borderRadius:16,overflow:'hidden',borderWidth:1,backgroundColor:COLORS.stone,shadowOpacity:.28,shadowRadius:18,elevation:6},hero:{borderRadius:22,shadowOpacity:.62,shadowRadius:28,elevation:12},selected:{shadowColor:COLORS.goldBright,shadowOpacity:.9,shadowRadius:24,elevation:12},aura:{position:'absolute',left:5,top:5,right:5,bottom:5,borderWidth:1,borderRadius:14},shine:{position:'absolute',top:-20,bottom:-20,width:35,transformOrigin:'center'},topMeta:{position:'absolute',top:8,left:8,right:8,flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},code:{color:COLORS.parchment,fontSize:5.5,fontWeight:'900',letterSpacing:.9},rarityBadge:{borderWidth:1,borderRadius:8,paddingHorizontal:5,paddingVertical:3},rarity:{fontSize:4.9,fontWeight:'900',letterSpacing:1},caption:{position:'absolute',left:7,right:7,bottom:7,backgroundColor:'rgba(3,3,6,.86)',borderRadius:9,paddingHorizontal:6,paddingVertical:5},name:{color:COLORS.white,fontSize:7.5,fontWeight:'900'},faction:{color:COLORS.parchment,fontSize:5.2,marginTop:1},lock:{...StyleSheet.absoluteFillObject,backgroundColor:'rgba(4,4,7,.56)',alignItems:'center',justifyContent:'center'},lockText:{color:COLORS.ash,fontSize:30},tag:{position:'absolute',top:28,left:6,borderWidth:1,borderRadius:8,paddingHorizontal:4,paddingVertical:2,backgroundColor:'rgba(0,0,0,.6)'},tagText:{fontSize:4.6,fontWeight:'900',letterSpacing:.8},selection:{...StyleSheet.absoluteFillObject,borderWidth:2,borderRadius:16,backgroundColor:'rgba(255,214,129,.05)'},stats:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:'rgba(255,255,255,.07)',paddingTop:9,marginTop:10},statLabel:{color:COLORS.ash,fontSize:5.4,fontWeight:'900',letterSpacing:.8},stat:{color:COLORS.white,fontSize:12,fontWeight:'900',marginTop:2}});
