import React,{useEffect,useMemo,useState}from'react';
import{Pressable,ScrollView,StyleSheet,Text,View}from'react-native';
import{useRouter,useLocalSearchParams}from'expo-router';
import{WorldBackdrop}from'../../src/render/WorldBackdrop';
import{RuntimeHeader}from'../../src/app/RuntimeHeader';
import{useGame}from'../../src/app/GameProvider';
import{repository}from'../../src/services/repository';
import{SUPABASE_CONFIGURED}from'../../src/services/supabase';
import{COLORS,QUALITY_BUDGETS}from'../../src/core/constants';
import{makeSeed,TRAINING_CARDS,TRAINING_ENEMY}from'../../src/engine/tacticalLabEngine';
import{currentActor,dispatchPlayerAction,legalActions,legalTargets,startTacticalSession}from'../../src/engine/tacticalInteractive';
import type{TacticalSession}from'../../src/engine/tacticalInteractive';
import{RuneButton,SectionTitle,StatSeal,StatusPill,WorldObject,WorldTitle}from'../../src/render/Diegetic';
import{SceneCinematic}from'../../src/components/SceneCinematic';
import{BattleCinematic}from'../../src/components/BattleCinematic';
import{classifyBattleEvent}from'../../src/engine/presentation';
import{buildBattleSequence,battlePlaybackDelay,nextBattleCursor,previousBattleCursor}from'../../src/engine/battleDirector';
import{buildRuntimeTimeline,runtimeCueForEvent}from'../../game/timeline';
import{createGameFlow,enterGameBattle,finishGameBattle,isAuthoritativeResult,returnToWorld}from'../../game/session';
import{createIdempotencyKey}from'../../src/utils/idempotency';
import{BattlefieldCanvas}from'../../src/render/BattlefieldCanvas';
import type{BattleEvent,BattleResult,PvpOpponent,WorldBoss}from'../../src/types/api';
import type{LabCard}from'../../src/engine/tacticalLabEngine';

function bossDeck(boss?:WorldBoss|null):LabCard[]{
  const root={...TRAINING_ENEMY[0],id:`BOSS-SHOWCASE-${boss?.id??'CORE'}`,name:boss?.name??TRAINING_ENEMY[0].name,hp:Math.max(900,Number(boss?.hp??1500)),attack:Math.max(84,Number(boss?.power_level??TRAINING_ENEMY[0].attack)),rarity:'mythic' as const};
  return [root,...TRAINING_ENEMY.slice(1)];
}

function eventFromInteractive(session:TacticalSession|null):BattleEvent|null{
  const events=session?.events??[];
  const last=events.slice().reverse().find(e=>e.event_type!=='UNIT_DEFEATED'&&e.event_type!=='ROUND_START'&&(e.actor_id||e.target_id||e.amount!=null))??events.at(-1);
  if(!last)return null;
  return{event_type:last.event_type,actor_id:last.actor_id,target_id:last.target_id,amount:last.amount,round:last.round,payload:last.payload};
}

const eventLabel=(e:BattleEvent|null)=>e?String(e.event_type).replaceAll('_',' '):'ESPERANDO COMANDO';

export default function Arena(){
 const router=useRouter();const params=useLocalSearchParams<{bossId?:string;mode?:string}>();const{quality,haptic}=useGame();
 const[mode,setMode]=useState<'lab'|'pvp'|'pve'>('lab');
 const[interactive,setInteractive]=useState<TacticalSession|null>(null);
 const[action,setAction]=useState<'attack'|'skill'|'guard'>('attack');const[targetId,setTargetId]=useState<string|null>(null);
 const[autoplay,setAutoplay]=useState(false);const[opponents,setOpponents]=useState<PvpOpponent[]>([]);const[opponentsLoaded,setOpponentsLoaded]=useState(false);const[pvp,setPvp]=useState<BattleResult|null>(null);const[replayCursor,setReplayCursor]=useState(0);const[replayPlaying,setReplayPlaying]=useState(true);const[replaySpeed,setReplaySpeed]=useState<0.75|1|1.5|2>(1);
 const[error,setError]=useState('');const[busy,setBusy]=useState(false);const[bosses,setBosses]=useState<WorldBoss[]>([]);const[pveBoss,setPveBoss]=useState<WorldBoss|null>(null);const[bossIntro,setBossIntro]=useState(false);const[combatCinematic,setCombatCinematic]=useState(false);const[lastCinematicKey,setLastCinematicKey]=useState('');
 const[gameFlow,setGameFlow]=useState(()=>createGameFlow('pvp','world:arena'));
 const frames=useMemo(()=>buildBattleSequence(pvp?.events),[pvp]);
 const liveEvent=eventFromInteractive(interactive);
 const replayEvent=frames[replayCursor]?.event??null;
 const event=mode==='pvp'?replayEvent:liveEvent;
 const activeKind=mode==='pvp'?frames[replayCursor]?.kind??'neutral':event?classifyBattleEvent(event as any):'neutral';
 const liveUnits=interactive?[...interactive.player,...interactive.enemy].map(u=>({id:u.id,hp:u.hpNow,max_hp:u.hp,side:u.side,card_id:u.name,status:u.alive?'alive':'defeated',statuses:u.statuses,energy:u.energy,max_energy:u.maxEnergy,role:u.role,faction:u.faction,rarity:u.rarity,image_url:(u.side==='enemy'&&u.id.startsWith('BOSS-SHOWCASE-'))?pveBoss?.image_url??undefined:undefined})):[];
 const pvpUnits=pvp?.final_units??[];
 const units=mode==='pvp'?pvpUnits:liveUnits;
 const runtimeTimeline=useMemo(()=>buildRuntimeTimeline(pvp?.events,pvp?.final_units??[]),[pvp]);
 const runtimeCue=mode==='pvp'?runtimeTimeline[replayCursor]??null:runtimeCueForEvent(event,interactive?.events.length??0);
 const actor=interactive?currentActor(interactive):null;
 const targets=interactive?legalTargets(interactive,action):[];
 const actions=interactive?legalActions(interactive):[];

 useEffect(()=>{
   if(params.mode==='pvp'&&mode!=='pvp')setMode('pvp');
 },[mode,params.mode]);

 useEffect(()=>{
   if(!params.bossId||mode==='pve'||!SUPABASE_CONFIGURED)return;
   setMode('pve');
 },[mode,params.bossId]);

 useEffect(()=>{
   if(mode!=='pve'||!SUPABASE_CONFIGURED)return;
   let mounted=true;
   repository.world().then(r=>{if(!mounted)return;setBosses(r.bosses);const boss=(params.bossId?r.bosses.find(b=>String(b.id)===String(params.bossId)):null)??r.bosses[0]??null;setPveBoss(boss);if(params.bossId&&boss)setBossIntro(true);}).catch(e=>mounted&&setError(e instanceof Error?e.message:'No se pudo leer el Atlas de bosses.'));
   return()=>{mounted=false;};
 },[mode,params.bossId]);

 useEffect(()=>{
   if(!autoplay||mode==='pvp'||!interactive||interactive.ended)return;
   const id=setInterval(()=>{
     setInteractive(current=>{
       if(!current||current.ended)return current;
       const actorNow=currentActor(current);if(!actorNow||actorNow.side!=='player'){setAutoplay(false);return current;}
       const act=legalActions(current);
       const preferred=act.includes('skill')?'skill':act.includes('attack')?'attack':'guard';
       const legal=legalTargets(current,preferred as any);const target=preferred==='guard'?actorNow.id:(targetId&&legal.some(t=>t.id===targetId)?targetId:legal[0]?.id);
       if(preferred!=='guard'&&!target){setAutoplay(false);return current;}
       const next=dispatchPlayerAction(current,{actorId:actorNow.id,type:preferred as any,targetId:target});
       if(next.ended)setAutoplay(false);
       return next;
     });
   },760);
   return()=>clearInterval(id);
 },[autoplay,mode,interactive,targetId]);

 const startBattle=(deck:LabCard[],seedKey:string)=>{
   const seed=makeSeed(`${seedKey}:${Date.now()}`);
   setInteractive(startTacticalSession(TRAINING_CARDS,deck,seed));setAction('attack');setTargetId(null);setAutoplay(false);setPvp(null);void haptic('impact');
 };
 const runLab=()=>startBattle(TRAINING_ENEMY,'VEXFORGE-LAB');
 const runPve=()=>{if(!pveBoss)return;startBattle(bossDeck(pveBoss),`VEXFORGE-BOSS:${pveBoss.id}`);};
 const loadOpp=async()=>{setBusy(true);setError('');try{setOpponents(await repository.pvpOpponents(8));}catch(e){setError(e instanceof Error?e.message:'No se pudo abrir el emparejamiento.')}finally{setOpponentsLoaded(true);setBusy(false)}};
 useEffect(()=>{if(mode==='pvp'&&!opponentsLoaded&&!busy&&!pvp)void loadOpp();},[mode,opponentsLoaded,busy,pvp]);
 const challenge=async(o:PvpOpponent)=>{setBusy(true);setError('');setPvp(null);setReplayPlaying(false);const battleFlow=enterGameBattle(createGameFlow('pvp',`world:${o.id}`));setGameFlow(battleFlow);try{const r=await repository.resolveBattle(o.id,createIdempotencyKey('vexforge-pvp'));if(!r.ok)throw new Error(r.error??'La resolución autoritativa fue rechazada.');setPvp(r);setGameFlow(finishGameBattle(battleFlow,{authority:'server',result:r}));setReplayCursor(0);setReplayPlaying(true);}catch(e){setGameFlow(createGameFlow('pvp',`world:${o.id}`));setError(e instanceof Error?e.message:'La resolución autoritativa fue rechazada.')}finally{setBusy(false)}};
 const dispatch=(type:'attack'|'skill'|'guard')=>{if(!interactive||!actor||interactive.ended)return;const legal=legalTargets(interactive,type);const chosen=type==='guard'?actor.id:(targetId&&legal.some(t=>t.id===targetId)?targetId:legal[0]?.id);if(type!=='guard'&&!chosen)return;setInteractive(dispatchPlayerAction(interactive,{actorId:actor.id,type,targetId:chosen}));setTargetId(null);};
 const backToWorld=()=>{if(gameFlow.stage==='result')setGameFlow(returnToWorld(gameFlow));setPvp(null);setReplayPlaying(false);router.push('/world');};
 const lastEvents=interactive?.events.slice(-8).reverse()??[];
 const cinematicKey=event?`${mode}:${event.event_type}:${event.actor_id??''}:${event.target_id??''}:${event.round??0}:${event.amount??''}`:'';
 useEffect(()=>{if(!event||!['boss','victory','defeat'].includes(classifyBattleEvent(event as any)))return;if(cinematicKey===lastCinematicKey)return;setLastCinematicKey(cinematicKey);setCombatCinematic(true)},[event,cinematicKey,lastCinematicKey]);
 useEffect(()=>{if(mode!=='pvp'||!replayPlaying||frames.length<2)return;const frame=frames[replayCursor];if(!frame)return;if(replayCursor>=frames.length-1){setReplayPlaying(false);return;}const timer=setTimeout(()=>setReplayCursor(c=>nextBattleCursor(c,frames.length)),battlePlaybackDelay(frame,replaySpeed));return()=>clearTimeout(timer)},[mode,replayPlaying,replayCursor,frames,replaySpeed]);

 return <View style={styles.root}>
 <WorldBackdrop variant="arena" tier={quality}/><RuntimeHeader/>
  <BattleCinematic visible={combatCinematic} event={event as any} kind={classifyBattleEvent(event as any)} onFinish={()=>setCombatCinematic(false)}/>
  <SceneCinematic visible={bossIntro} kicker="ATLAS · ENCUENTRO" title={pveBoss?.name??'BOSS'} body={String((pveBoss?.metadata as any)?.intro??(pveBoss?.metadata as any)?.lore??'Una entidad registrada en el Atlas entra en el campo. La resolución oficial pertenece al servidor.')} scene="arena" accent={COLORS.crimson} icon="♜" onFinish={()=>setBossIntro(false)}/>
  <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
   <WorldTitle kicker="ARENA · COMBATE" title="BASTIÓN DE BATALLA" subtitle="Aquí las cartas no son paneles: ocupan el campo, reciben estados, atacan desde posiciones reales y dejan una secuencia de eventos legible."/>
    <View style={styles.modeRow}>{[['lab','LABORATORIO'],['pvp','RANKED / CASUAL'],['pve','BOSS / RAID']].map(([id,label])=><RuneButton key={id} label={label} onPress={()=>{setMode(id as any);setError('');}} accent={id==='pvp'?COLORS.crimson:id==='pve'?COLORS.mint:COLORS.goldBright}/>)}</View>
   {(mode==='lab'||mode==='pve')?<>
    <SectionTitle kicker={mode==='pve'?'ENCUENTRO NARRATIVO · PRESENTACIÓN':'TEATRO DE APRENDIZAJE'} title={mode==='pve'?'CÁMARA DE ENTIDAD':'COMANDO TÁCTICO'} right={<StatusPill label={mode==='pve'?'TEATRO VISUAL · SIN SETTLEMENT':interactive?.ended?'ENCUENTRO CERRADO':'LIVE LOCAL · DETERMINISTA'} accent={mode==='pve'?COLORS.crimson:interactive?.ended?COLORS.mint:COLORS.gold}/>} />
    {mode==='pve'?<WorldObject accent={COLORS.crimson} style={styles.bossSelect}><Text style={styles.bossK}>JEFE REGISTRADO EN EL ATLAS</Text><Text style={styles.bossName}>{pveBoss?.name??'Selecciona un Boss'}</Text><Text style={styles.eventText}>La escena usa el perfil real del Atlas para el combate de presentación. El cliente no crea daño, recompensas ni economía; cualquier settlement real continúa dependiendo del resolver de servidor.</Text><View style={styles.controls}>{bosses.slice(0,8).map(b=><Pressable key={b.id} onPress={()=>setPveBoss(b)}><StatusPill label={(b.name??b.boss_code??'BOSS').slice(0,18)} accent={pveBoss?.id===b.id?COLORS.goldBright:COLORS.steel}/></Pressable>)}</View><RuneButton label={busy?'…':'ENTRAR AL ENCUENTRO'} disabled={!pveBoss||busy} onPress={runPve} accent={COLORS.crimson}/></WorldObject>:null}
     <BattlefieldCanvas units={units} activeEvent={event as any} activeKind={activeKind as any} runtimeCue={runtimeCue} selectedTargetId={targetId} onSelectTarget={setTargetId} maxAnimatedUnits={QUALITY_BUDGETS[quality].maxAnimatedUnits}/>
    <WorldObject accent={COLORS.crimson} style={styles.command}><View style={styles.eventHead}><View><Text style={styles.round}>RONDA {interactive?.round??'—'}</Text><Text style={styles.turnLine}>{actor?`Turno · ${actor.name}`:eventLabel(event)}</Text></View><StatusPill label={actor?.side==='player'?'TU TURNO':actor?.side==='enemy'?'RESPUESTA':interactive?.ended?'CIERRE':'FIELD'} accent={actor?.side==='player'?COLORS.goldBright:interactive?.ended?COLORS.mint:COLORS.arcaneBright}/></View>
      <Text style={styles.eventText}>{event?.amount!=null?`Efecto registrado: ${event.amount}. `:''}{actor?`Elige una acción para ${actor.name}. Las acciones y objetivos válidos se calculan desde el mismo estado que se está mostrando.`:'Inicia el encuentro para activar el director táctico.'}</Text>
      <View style={styles.seals}><StatSeal compact label="VIVOS" value={units.filter((u:any)=>u.status==='alive').length} accent={COLORS.mint}/><StatSeal compact label="EVENTO" value={event?.event_type??'—'} accent={COLORS.arcaneBright}/><StatSeal compact label="RONDA" value={interactive?.round??0} accent={COLORS.goldBright}/></View>
      <View style={styles.controls}><RuneButton label={interactive?.ended?'NUEVO ENCUENTRO':'INICIAR / REINICIAR'} onPress={()=>mode==='pve'?runPve():runLab} accent={COLORS.goldBright}/><RuneButton label="ATAQUE" disabled={!actions.includes('attack')} onPress={()=>setAction('attack')} accent={action==='attack'?COLORS.crimson:COLORS.steel}/><RuneButton label="HABILIDAD" disabled={!actions.includes('skill')} onPress={()=>setAction('skill')} accent={action==='skill'?COLORS.arcaneBright:COLORS.steel}/><RuneButton label="GUARDIA" disabled={!actions.includes('guard')} onPress={()=>setAction('guard')} accent={action==='guard'?COLORS.mint:COLORS.steel}/><RuneButton label={autoplay?'PAUSAR AUTO':'AUTO COMBATE'} disabled={!interactive||interactive.ended} onPress={()=>setAutoplay(x=>!x)} accent={autoplay?COLORS.crimson:COLORS.arcaneBright}/></View>
      {action!=='guard'&&targets.length?<><Text style={styles.targetK}>OBJETIVO VÁLIDO</Text><View style={styles.targetGrid}>{targets.map(t=><Pressable key={t.id} onPress={()=>setTargetId(t.id)}><WorldObject accent={targetId===t.id?COLORS.goldBright:COLORS.steel} style={styles.target}><Text style={styles.targetName}>{t.name}</Text><Text style={styles.targetMeta}>{t.hpNow}/{t.hp} HP · {Object.entries(t.statuses??{}).filter(([,v])=>Number(v)>0).map(([k,v])=>`${k}:${v}`).join(' · ')||'ESTABLE'}</Text></WorldObject></Pressable>)}</View></>:null}
      <RuneButton label={interactive?.ended?'ENCUENTRO TERMINADO':action==='guard'?'EJECUTAR GUARDIA':'EJECUTAR ACCIÓN'} disabled={!interactive||interactive.ended||(!targetId&&action!=='guard')} onPress={()=>dispatch(action)} accent={COLORS.goldBright}/>
    </WorldObject>
    <SectionTitle kicker="BATTLE TIMELINE" title={`${interactive?.events.length??0} EVENTOS DEL ENCUENTRO`}/>
    <WorldObject accent={COLORS.steel} style={styles.timeline}>{lastEvents.length?lastEvents.map((e:any,i)=><View key={`${e.id??e.sequence}-${i}`} style={styles.timelineRow}><View style={[styles.timelineDot,{backgroundColor:e.event_type.includes('DEFEATED')?COLORS.crimson:e.event_type.includes('HEAL')||e.event_type.includes('REGENERATE')?COLORS.mint:COLORS.arcaneBright}]} /><View style={{flex:1}}><Text style={styles.timelineTitle}>{String(e.event_type).replaceAll('_',' ')}</Text><Text style={styles.timelineMeta}>{e.note??'Evento del director táctico'}{e.amount!=null?` · ${e.amount}`:''}</Text></View><Text style={styles.timelineRound}>R{e.round??'—'}</Text></View>):<Text style={styles.eventText}>La cronología aparecerá aquí sin crear una segunda fuente de verdad.</Text>}</WorldObject>
   </>:null}
    {mode==='pvp'?<><SectionTitle kicker="MATCHMAKING" title="ADVERSARIOS REALES" right={<StatusPill label="SERVER AUTHORITATIVE" accent={COLORS.mint}/>} />{error?<Text style={styles.error}>{error}</Text>:null}{!opponents.length?<RuneButton label={busy?'BUSCANDO…':'BUSCAR OPONENTES'} onPress={()=>void loadOpp()} accent={COLORS.crimson}/>:opponents.map(o=><WorldObject key={o.id} accent={COLORS.crimson} style={styles.opponent}><View style={{flex:1}}><Text style={styles.oppName}>{o.display_name??o.id.slice(0,8)}</Text><Text style={styles.oppMeta}>{o.faction??'FACTION'} · POWER {o.power??'—'} · MMR {o.mmr??'—'} · {o.deck_size??'—'} CARTAS</Text></View><RuneButton label={busy?'…':'DESAFIAR'} disabled={busy} onPress={()=>void challenge(o)} accent={COLORS.crimson}/></WorldObject>)}{pvp&&isAuthoritativeResult(gameFlow.result)?<><WorldObject accent={COLORS.arcaneBright} style={styles.sealed}><Text style={styles.sealedK}>REPLAY SELLADO</Text><Text style={styles.sealedT}>RESOLUCIÓN DEL SERVIDOR</Text><Text style={styles.eventText}>El replay usa los eventos autoritativos devueltos por el backend. El tablero muestra el estado final sellado y los FX siguen el evento que estás inspeccionando.</Text></WorldObject><BattlefieldCanvas units={units} activeEvent={event as any} activeKind={activeKind as any} runtimeCue={runtimeCue} maxAnimatedUnits={QUALITY_BUDGETS[quality].maxAnimatedUnits}/><WorldObject accent={pvp.you_won?COLORS.mint:COLORS.crimson} style={styles.result}><Text style={styles.resultTitle}>{pvp.you_won?'VICTORIA':'DERROTA'}</Text><View style={styles.seals}><StatSeal label="ENGINE" value={pvp.engine??'SERVER'} accent={COLORS.arcaneBright}/><StatSeal label="TURNOS" value={pvp.total_turns??'—'} accent={COLORS.goldBright}/><StatSeal label="EVENTOS" value={frames.length} accent={COLORS.mint}/></View><Text style={styles.eventText}>{replayEvent?.payload?JSON.stringify(replayEvent.payload).slice(0,300):'Replay cargado.'}</Text><View style={styles.controls}><RuneButton label="◀" disabled={replayCursor<=0} onPress={()=>setReplayCursor(c=>previousBattleCursor(c,frames.length))}/><RuneButton label={replayPlaying?'PAUSAR REPLAY':'REPRODUCIR REPLAY'} disabled={!frames.length} onPress={()=>setReplayPlaying(v=>!v)} accent={replayPlaying?COLORS.goldBright:COLORS.mint}/><RuneButton label="▶" disabled={replayCursor>=frames.length-1} onPress={()=>setReplayCursor(c=>nextBattleCursor(c,frames.length))} accent={COLORS.mint}/><RuneButton label="0.75×" onPress={()=>setReplaySpeed(.75)} accent={replaySpeed===.75?COLORS.goldBright:COLORS.steel}/><RuneButton label="1×" onPress={()=>setReplaySpeed(1)} accent={replaySpeed===1?COLORS.goldBright:COLORS.steel}/><RuneButton label="1.5×" onPress={()=>setReplaySpeed(1.5)} accent={replaySpeed===1.5?COLORS.goldBright:COLORS.steel}/><RuneButton label="2×" onPress={()=>setReplaySpeed(2)} accent={replaySpeed===2?COLORS.goldBright:COLORS.steel}/></View><RuneButton label="VOLVER AL MUNDO" onPress={backToWorld} accent={COLORS.mint}/></WorldObject></>:null}</>:null}
   {mode==='pve'?<WorldObject accent={COLORS.mint}><Text style={styles.pveTitle}>RAID / COOPERACIÓN</Text><Text style={styles.eventText}>La participación cooperativa, la contribución, las recompensas y cualquier settlement económico permanecen en el Atlas y en el backend. Esta cámara solo presenta el combate con vida visual y reglas locales deterministas.</Text><View style={styles.controls}><RuneButton label="ABRIR ATLAS" onPress={()=>router.push('/world')} accent={COLORS.mint}/><RuneButton label="TUTORIAL DE COMBATE" onPress={()=>router.push('/tutorial')} accent={COLORS.arcaneBright}/></View></WorldObject>:null}
  </ScrollView>
 </View>
}
const styles=StyleSheet.create({root:{flex:1},content:{padding:15,paddingBottom:130,gap:12},modeRow:{flexDirection:'row',gap:7,flexWrap:'wrap'},command:{gap:9},eventHead:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8},round:{color:COLORS.goldBright,fontSize:7,fontWeight:'900',letterSpacing:1.4},turnLine:{color:COLORS.white,fontFamily:'Cinzel_700Bold',fontSize:11,marginTop:3},eventText:{color:COLORS.parchment,fontSize:9,lineHeight:14,marginTop:5},seals:{flexDirection:'row',gap:6,flexWrap:'wrap'},controls:{flexDirection:'row',gap:6,flexWrap:'wrap',marginTop:8},targetK:{color:COLORS.goldDim,fontSize:6,fontWeight:'900',letterSpacing:1.6,marginTop:7},targetGrid:{gap:6,marginTop:5},target:{paddingVertical:9},targetName:{color:COLORS.white,fontSize:10,fontFamily:'Cinzel_700Bold'},targetMeta:{color:COLORS.ash,fontSize:6.5,marginTop:3},timeline:{gap:8},timelineRow:{flexDirection:'row',alignItems:'center',gap:8,paddingVertical:5,borderBottomWidth:1,borderBottomColor:'rgba(255,255,255,.05)'},timelineDot:{width:7,height:7,borderRadius:4},timelineTitle:{color:COLORS.white,fontSize:7.5,fontWeight:'900',letterSpacing:.4},timelineMeta:{color:COLORS.ash,fontSize:6.5,marginTop:2},timelineRound:{color:COLORS.goldDim,fontSize:6,fontWeight:'900'},error:{color:COLORS.crimson,fontSize:9},opponent:{flexDirection:'row',alignItems:'center',gap:9},oppName:{color:COLORS.white,fontSize:11,fontWeight:'900'},oppMeta:{color:COLORS.ash,fontSize:6.5,marginTop:3},result:{gap:8},resultTitle:{color:COLORS.white,fontFamily:'Cinzel_900Black',fontSize:20},pveTitle:{color:COLORS.mint,fontSize:8,fontWeight:'900',letterSpacing:1.5},bossSelect:{gap:8},bossK:{color:COLORS.goldDim,fontSize:6.5,fontWeight:'900',letterSpacing:1.5},bossName:{color:COLORS.white,fontFamily:'Cinzel_900Black',fontSize:20},sealed:{gap:6},sealedK:{color:COLORS.arcaneBright,fontSize:6.2,fontWeight:'900',letterSpacing:1.4},sealedT:{color:COLORS.white,fontFamily:'Cinzel_700Bold',fontSize:12}});
