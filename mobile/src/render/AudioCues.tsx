import React,{useEffect}from'react';
import{useAudioPlayer}from'expo-audio';
import type{PresentationKind}from'../engine/presentation';
import type{RuntimeAudioCue,RuntimeCue}from'../../game/types';

const SRC={attack:require('../../assets/vexforge/attack.wav'),impact:require('../../assets/vexforge/impact.wav'),shield:require('../../assets/vexforge/shield.wav'),fusion:require('../../assets/vexforge/fusion.wav'),reward:require('../../assets/vexforge/reward.wav'),reveal:require('../../assets/vexforge/pack_reveal.wav')};
type AudioPlayer = ReturnType<typeof useAudioPlayer>;

function audioForKind(kind:PresentationKind|null):RuntimeAudioCue{
 if(kind==='attack')return'attack';
 if(kind==='guard'||kind==='heal'||kind==='cast')return'shield';
 if(kind==='victory')return'reward';
 if(kind==='boss')return'reveal';
 if(kind==='defeat'||kind==='status')return'impact';
 return'none';
}

export function AudioCues({kind=null,cue=null}:{kind?:PresentationKind|null;cue?:RuntimeCue|null}){
 const attack=useAudioPlayer(SRC.attack),impact=useAudioPlayer(SRC.impact),shield=useAudioPlayer(SRC.shield),fusion=useAudioPlayer(SRC.fusion),reward=useAudioPlayer(SRC.reward),reveal=useAudioPlayer(SRC.reveal);
 const sound=cue?.audio??audioForKind(kind);
 const player:AudioPlayer|null=sound==='attack'?attack:sound==='impact'?impact:sound==='shield'?shield:sound==='fusion'?fusion:sound==='reward'?reward:sound==='reveal'?reveal:null;
 useEffect(()=>{
  if(!player)return;
  try{void player.seekTo(0);player.play()}catch{/* audio is optional */}
 },[cue?.id,sound,player]);
 return null;
}
