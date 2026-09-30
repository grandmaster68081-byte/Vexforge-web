import { DeterministicRng, makeSeed, TRAINING_CARDS, TRAINING_ENEMY } from './tacticalLabEngine.ts';
import type { LabCard, LabEvent, LabStatus, LabUnit, LabSide } from './tacticalLabEngine.ts';

export type TacticalActionType = 'attack'|'skill'|'guard';
export interface TacticalAction { actorId:string; type:TacticalActionType; targetId?:string|null; }
export interface TacticalSession {
  seed:number;
  round:number;
  player:LabUnit[];
  enemy:LabUnit[];
  events:LabEvent[];
  currentActorId:string|null;
  winner:LabSide|null;
  draw:boolean;
  ended:boolean;
  turnQueue:string[];
  turnIndex:number;
  bossPhase:number;
}

const clamp=(n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
const living=(units:LabUnit[])=>units.filter(u=>u.alive);
const cloneUnit=(u:LabUnit):LabUnit=>({...u,statuses:{...u.statuses}});
const cloneSession=(s:TacticalSession):TacticalSession=>({...s,player:s.player.map(cloneUnit),enemy:s.enemy.map(cloneUnit),events:s.events.map(e=>({...e,payload:e.payload?{...e.payload}:undefined})),bossPhase:s.bossPhase});
const allUnits=(s:TacticalSession)=>[...s.player,...s.enemy];
const findUnit=(s:TacticalSession,id:string)=>allUnits(s).find(u=>u.id===id)??null;
const livingOpponents=(s:TacticalSession,side:LabSide)=>living(side==='player'?s.enemy:s.player);
const livingAllies=(s:TacticalSession,side:LabSide)=>living(side==='player'?s.player:s.enemy);
const push=(s:TacticalSession,e:Omit<LabEvent,'sequence'>)=>s.events.push({...e,sequence:s.events.length});
const attackPower=(u:LabUnit)=>u.attack*(1+((u.statuses.fury??0)>0?.22:0)+((u.statuses.overcharge??0)>0?.18:0))*((u.statuses.weaken??0)>0?.78:1);
const defensePower=(u:LabUnit)=>u.defense*((u.statuses.weaken??0)>0?.8:1)*((u.statuses.marked??0)>0?.92:1);

function makeUnits(cards:LabCard[],side:LabSide){
  return cards.slice(0,8).map((c,i)=>({...c,side,hpNow:c.hp,energy:c.maxEnergy,statuses:{},alive:true,cooldown:0,position:i}));
}
function buildTurnQueue(s:TacticalSession){return allUnits(s).filter(u=>u.alive).sort((a,b)=>b.speed-a.speed||a.position-b.position||a.id.localeCompare(b.id)).map(u=>u.id);}
function refreshCurrentActor(s:TacticalSession){s.currentActorId=s.turnQueue[s.turnIndex]??null;}
function advanceTurn(s:TacticalSession){s.turnIndex+=1;if(s.turnIndex>=s.turnQueue.length){resetRound(s);return;}refreshCurrentActor(s);}
function resetRound(s:TacticalSession){
  s.round+=1;
  for(const u of allUnits(s)){
    if(!u.alive)continue;
    const burn=u.statuses.burn??0;
    if(burn){
      const dmg=8+burn*4;
      u.hpNow=clamp(u.hpNow-dmg,0,u.hp);
      push(s,{id:`r${s.round}:burn:${u.id}:${s.events.length}`,round:s.round,event_type:'STATUS_TICK',actor_id:u.id,amount:dmg,note:`${u.name} recibe ${dmg} de Quemadura.`,payload:{status:'burn',remaining_hp:u.hpNow}});
      if(u.hpNow<=0){u.alive=false;push(s,{id:`r${s.round}:ko:${u.id}:${s.events.length}`,round:s.round,event_type:'UNIT_DEFEATED',target_id:u.id,note:`${u.name} cae por Quemadura.`});}
    }
    const regen=u.statuses.regen??0;
    if(regen && u.alive){const before=u.hpNow;u.hpNow=clamp(u.hpNow+10+regen*5,0,u.hp);if(u.hpNow>before)push(s,{id:`r${s.round}:regen:${u.id}:${s.events.length}`,round:s.round,event_type:'REGENERATE',actor_id:u.id,amount:u.hpNow-before,note:`${u.name} recupera ${u.hpNow-before} HP.`});}
    for(const k of Object.keys(u.statuses) as LabStatus[]){const n=u.statuses[k]??0;if(n>0)u.statuses[k]=Math.max(0,n-1);}
    u.energy=Math.min(u.maxEnergy,u.energy+1);
    u.cooldown=Math.max(0,u.cooldown-1);
  }
  push(s,{id:`r${s.round}:start`,round:s.round,event_type:'ROUND_START',note:`Ronda ${s.round}: la iniciativa se determina por Velocidad.`,payload:{turn_order:buildTurnQueue(s)}});
  s.turnQueue=buildTurnQueue(s);s.turnIndex=0;refreshCurrentActor(s);
}

function checkBossPhase(s:TacticalSession){
  const boss=s.enemy.find(u=>u.id.startsWith('BOSS-SHOWCASE-'))??null;
  if(!boss||!boss.alive)return;
  const ratio=boss.hpNow/Math.max(1,boss.hp);
  const thresholds:[number,number][]=[[.72,1],[.42,2],[.22,3]];
  const next=thresholds.find(([limit,phase])=>ratio<=limit&&phase>s.bossPhase)?.[1]??0;
  if(!next)return;
  s.bossPhase=next;
  const shield=75+next*20;
  boss.statuses.shield=Math.min(220,(boss.statuses.shield??0)+shield);
  boss.statuses.fury=Math.max(boss.statuses.fury??0,2);
  push(s,{id:`boss-phase:${boss.id}:${next}`,round:s.round,event_type:'BOSS_PHASE',actor_id:boss.id,amount:shield,note:`${boss.name} despierta la Fase ${next}. El núcleo se refuerza y entra en Furia.`,payload:{phase:next,hp_ratio:ratio}});
}
function checkWinner(s:TacticalSession){
  const p=living(s.player).length,e=living(s.enemy).length;
  if(!e){s.winner='player';s.draw=false;s.ended=true;push(s,{id:`victory:${s.events.length}`,round:s.round,event_type:'VICTORY',note:'La formación controla el Nexus.'});}
  else if(!p){s.winner='enemy';s.draw=false;s.ended=true;push(s,{id:`defeat:${s.events.length}`,round:s.round,event_type:'DEFEAT',note:'La línea defensiva ha sido superada.'});}
  else if(s.round>=20){s.winner=p===e?null:(p>e?'player':'enemy');s.draw=s.winner===null;s.ended=true;push(s,{id:`limit:${s.events.length}`,round:s.round,event_type:s.draw?'DRAW':s.winner==='player'?'VICTORY':'DEFEAT',note:'El límite táctico de 20 rondas ha sido alcanzado.',payload:{round_cap:20}});}
}
function resolveDamage(s:TacticalSession,actor:LabUnit,target:LabUnit,rng:DeterministicRng,mult=1){
  const base=Math.max(1,Math.round(attackPower(actor)-defensePower(target)));
  const critical=rng.next()<0.05;
  let amount=Math.max(1,Math.round(base*(critical?1.5:1)*mult));
  const shield=Math.max(0,target.statuses.shield??0);
  if(shield){const blocked=Math.min(shield,amount);target.statuses.shield=shield-blocked;amount-=blocked;push(s,{id:`shield:${s.events.length}`,round:s.round,event_type:'SHIELD',actor_id:actor.id,target_id:target.id,amount:blocked,note:`${target.name} bloquea ${blocked} de daño.`});}
  target.hpNow=clamp(target.hpNow-amount,0,target.hp);
  push(s,{id:`hit:${s.events.length}`,round:s.round,event_type:critical?'CRITICAL_HIT':'BASIC_ATTACK',actor_id:actor.id,target_id:target.id,amount,note:`${actor.name} inflige ${amount}${critical?' crítico':''}.`,payload:{critical,remaining_hp:target.hpNow}});
  if(target.hpNow<=0){target.alive=false;push(s,{id:`ko:${s.events.length}`,round:s.round,event_type:'UNIT_DEFEATED',target_id:target.id,note:`${target.name} es eliminado.`});}
}
function applyAction(s:TacticalSession,a:TacticalAction,actor:LabUnit,target:LabUnit|null){
  const rng=new DeterministicRng(makeSeed(`${s.seed}:${s.round}:${s.events.length}:${a.actorId}:${a.type}:${a.targetId??''}`));
  if(a.type==='attack' && target){resolveDamage(s,actor,target,rng,1);}
  else if(a.type==='guard'){
    const value=60+(actor.defense*.35);
    actor.statuses.shield=Math.min(180,(actor.statuses.shield??0)+Math.round(value));
    push(s,{id:`guard:${s.events.length}`,round:s.round,event_type:'SHIELD_CAST',actor_id:actor.id,target_id:actor.id,amount:Math.round(value),note:`${actor.name} erige un escudo de ${Math.round(value)}.`});
  } else if(a.type==='skill' && target){
    if(actor.energy<=0 || actor.cooldown>0)return;
    actor.energy-=1; actor.cooldown=2;
    switch(actor.skill){
      case 'strike': resolveDamage(s,actor,target,rng,1.35); push(s,{id:`skill:${s.events.length}`,round:s.round,event_type:'SPECIAL_SKILL',actor_id:actor.id,target_id:target.id,note:`${actor.name} ejecuta Golpe de Forja.`}); break;
      case 'ward': {const value=70; target.statuses.shield=Math.min(180,(target.statuses.shield??0)+value);push(s,{id:`ward:${s.events.length}`,round:s.round,event_type:'SHIELD_CAST',actor_id:actor.id,target_id:target.id,amount:value,note:`${actor.name} despliega ${value} de escudo.`});break;}
      case 'mend': {const before=target.hpNow;target.hpNow=clamp(target.hpNow+85,0,target.hp);target.statuses.regen=3;push(s,{id:`heal:${s.events.length}`,round:s.round,event_type:'HEAL',actor_id:actor.id,target_id:target.id,amount:target.hpNow-before,note:`${actor.name} restaura ${target.hpNow-before} HP.`});break;}
      case 'burn': target.statuses.burn=Math.min(5,(target.statuses.burn??0)+2);target.statuses.marked=2;push(s,{id:`burn:${s.events.length}`,round:s.round,event_type:'BURN_APPLIED',actor_id:actor.id,target_id:target.id,amount:2,note:`${actor.name} aplica Quemadura y Marca.`});break;
      case 'rally': actor.statuses.fury=3;actor.statuses.overcharge=2;push(s,{id:`rally:${s.events.length}`,round:s.round,event_type:'BUFF',actor_id:actor.id,note:`${actor.name} entra en Furia y Sobrecarga.`});break;
      case 'drain': {const amount=Math.max(1,Math.round(attackPower(actor)*.65-defensePower(target)*.16));target.hpNow=clamp(target.hpNow-amount,0,target.hp);actor.hpNow=clamp(actor.hpNow+amount,0,actor.hp);push(s,{id:`drain:${s.events.length}`,round:s.round,event_type:'DRAIN',actor_id:actor.id,target_id:target.id,amount,note:`${actor.name} drena ${amount} HP.`});if(target.hpNow<=0){target.alive=false;push(s,{id:`ko-drain:${s.events.length}`,round:s.round,event_type:'UNIT_DEFEATED',target_id:target.id,note:`${target.name} cae por Drenaje.`});}break;}
      case 'summon': {
        const fallen=allUnits(s).find(u=>u.side===actor.side&&!u.alive)??null;
        if(fallen){
          fallen.alive=true;
          fallen.hpNow=Math.max(1,Math.round(fallen.hp*.35));
          fallen.energy=Math.min(1,fallen.maxEnergy);
          fallen.cooldown=0;
          fallen.statuses={};
          push(s,{id:`summon:${s.events.length}`,round:s.round,event_type:'SUMMON',actor_id:actor.id,target_id:fallen.id,amount:fallen.hpNow,note:`${actor.name} devuelve a ${fallen.name} al campo con ${fallen.hpNow} HP.`,payload:{revived:true}});
        }else{
          actor.statuses.overcharge=2;
          push(s,{id:`summon:${s.events.length}`,round:s.round,event_type:'SUMMON',actor_id:actor.id,target_id:actor.id,note:`${actor.name} activa una matriz de invocación y sobrecarga su núcleo.`,payload:{revived:false}});
        }
        break;
      }
    }
  }
}
function chooseEnemyAction(s:TacticalSession,actor:LabUnit){
  const foes=livingOpponents(s,actor.side);const allies=livingAllies(s,actor.side);if(!foes.length||!allies.length)return null;
  let target:LabUnit|null=null;
  if(actor.skill==='mend')target=allies.slice().sort((a,b)=>a.hpNow/a.hp-b.hpNow/b.hp)[0];
  else if(actor.skill==='ward')target=allies.slice().sort((a,b)=>a.hpNow/a.hp-b.hp/b.hp)[0]??actor;
  else target=foes.slice().sort((a,b)=>a.hpNow-b.hpNow||b.speed-a.speed)[0];
  if(actor.energy>0&&actor.cooldown===0 && actor.skill!=='mend' && actor.skill!=='ward')return {actorId:actor.id,type:'skill' as const,targetId:target?.id};
  if(actor.energy>0&&actor.cooldown===0&&actor.skill==='ward'&&target)return {actorId:actor.id,type:'skill' as const,targetId:target.id};
  if(actor.energy>0&&actor.cooldown===0&&actor.skill==='mend'&&target && target.hpNow<target.hp*.82)return {actorId:actor.id,type:'skill' as const,targetId:target.id};
  return {actorId:actor.id,type:'attack' as const,targetId:target?.id};
}

export function startTacticalSession(playerCards:LabCard[]=TRAINING_CARDS,enemyCards:LabCard[]=TRAINING_ENEMY,seed=makeSeed('VEXFORGE-TACTICAL-INTERACTIVE-2026')):TacticalSession{
  const s:TacticalSession={seed,round:0,player:makeUnits(playerCards,'player'),enemy:makeUnits(enemyCards,'enemy'),events:[],currentActorId:null,winner:null,draw:false,ended:false,turnQueue:[],turnIndex:0,bossPhase:0};
  resetRound(s);return s;
}
export function currentActor(s:TacticalSession){return s.currentActorId?findUnit(s,s.currentActorId):null;}
export function legalActions(s:TacticalSession):TacticalActionType[]{
  const actor=currentActor(s);if(!actor||actor.side!=='player'||s.ended)return [];
  const actions:TacticalActionType[]=['attack'];
  if(actor.energy>0&&actor.cooldown===0)actions.push('skill');
  actions.push('guard');
  return actions;
}
export function legalTargets(s:TacticalSession,type:TacticalActionType){
  const actor=currentActor(s);if(!actor)return[];
  if(type==='guard')return[actor];
  if(type==='skill'&&(actor.skill==='mend'||actor.skill==='ward'))return livingAllies(s,'player');
  if(type==='skill'&&(actor.skill==='rally'||actor.skill==='summon'))return[actor];
  return livingOpponents(s,'player');
}
export function dispatchPlayerAction(s0:TacticalSession,action:TacticalAction):TacticalSession{
  const s=cloneSession(s0);if(s.ended) return s;const actor=currentActor(s);if(!actor||actor.side!=='player'||actor.id!==action.actorId) return s;const targets=legalTargets(s,action.type);const target=action.targetId?targets.find(t=>t.id===action.targetId)??null:targets[0]??null;if((action.type!=='guard')&&!target)return s;
  applyAction(s,action,actor,target);checkBossPhase(s);checkWinner(s);if(s.ended)return s;
  advanceTurn(s);
  let safety=0;
  while(!s.ended && safety++<24){
    const enemyActor=currentActor(s);
    if(!enemyActor || enemyActor.side!=='enemy')break;
    const ea=chooseEnemyAction(s,enemyActor);if(!ea)break;const etarget=ea.targetId?findUnit(s,ea.targetId):null;applyAction(s,ea,enemyActor,etarget);checkBossPhase(s);checkWinner(s);if(s.ended)break;
    if(living(s.player).length===0||living(s.enemy).length===0)break;
    advanceTurn(s);
  }
  checkWinner(s);
  return s;
}
