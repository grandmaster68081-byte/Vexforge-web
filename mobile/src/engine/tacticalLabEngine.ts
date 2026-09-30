export type LabSide = 'player' | 'enemy';
export type LabRole = 'vanguard' | 'champion' | 'sentinel' | 'reserve';
export type LabStatus = 'shield' | 'burn' | 'regen' | 'fury' | 'weaken' | 'stun' | 'marked' | 'overcharge';

export interface LabCard {
  id: string; name: string; faction: string; role: LabRole; hp: number; attack: number; defense: number; speed: number;
  maxEnergy: number; skill: 'strike'|'ward'|'mend'|'burn'|'rally'|'drain'|'summon'; rarity: string;
}
export interface LabUnit extends LabCard { side: LabSide; hpNow:number; energy:number; statuses:Partial<Record<LabStatus, number>>; alive:boolean; cooldown:number; position:number; }
export interface LabEvent { id:string; round:number; sequence:number; event_type:string; actor_id?:string; target_id?:string; amount?:number; note:string; payload?:Record<string,unknown>; }
export interface LabResult { seed:number; winner:LabSide|null; rounds:number; events:LabEvent[]; player:LabUnit[]; enemy:LabUnit[]; draw:boolean; reason:string; }

export const TRAINING_CARDS: LabCard[] = [
  {id:'LAB-VANGUARD',name:'Forjador del Umbral',faction:'warrior',role:'vanguard',hp:360,attack:72,defense:50,speed:57,maxEnergy:3,skill:'strike',rarity:'legendary'},
  {id:'LAB-CHAMPION',name:'Portador del Nexus',faction:'mage',role:'champion',hp:300,attack:82,defense:36,speed:71,maxEnergy:4,skill:'rally',rarity:'mythic'},
  {id:'LAB-SENTINEL',name:'Custodio de Obsidiana',faction:'paladin',role:'sentinel',hp:390,attack:44,defense:72,speed:42,maxEnergy:3,skill:'ward',rarity:'epic'},
  {id:'LAB-04',name:'Tejedor de Ceniza',faction:'mage',role:'reserve',hp:250,attack:69,defense:32,speed:66,maxEnergy:3,skill:'burn',rarity:'epic'},
  {id:'LAB-05',name:'Vigía Carmesí',faction:'warrior',role:'reserve',hp:270,attack:63,defense:45,speed:61,maxEnergy:3,skill:'strike',rarity:'rare'},
  {id:'LAB-06',name:'Hierofante Verde',faction:'paladin',role:'reserve',hp:290,attack:39,defense:48,speed:52,maxEnergy:4,skill:'mend',rarity:'rare'},
  {id:'LAB-07',name:'Hoja Velada',faction:'rogue',role:'reserve',hp:220,attack:75,defense:28,speed:84,maxEnergy:3,skill:'drain',rarity:'rare'},
  {id:'LAB-08',name:'Arquitecto Rúnico',faction:'mage',role:'reserve',hp:235,attack:58,defense:38,speed:77,maxEnergy:3,skill:'ward',rarity:'common'},
];
export const TRAINING_ENEMY: LabCard[] = [
  {id:'BOSS-IRON',name:'Monolito de Hierro',faction:'boss',role:'champion',hp:1500,attack:96,defense:65,speed:45,maxEnergy:5,skill:'rally',rarity:'mythic'},
  {id:'BOSS-FIRE',name:'Heraldo de Cenizas',faction:'boss',role:'vanguard',hp:520,attack:88,defense:45,speed:62,maxEnergy:4,skill:'burn',rarity:'legendary'},
  {id:'BOSS-VEIL',name:'Centinela de la Fractura',faction:'boss',role:'sentinel',hp:610,attack:51,defense:88,speed:34,maxEnergy:4,skill:'ward',rarity:'legendary'},
  {id:'BOSS-WING',name:'Cazador Abisal',faction:'boss',role:'reserve',hp:360,attack:77,defense:39,speed:79,maxEnergy:3,skill:'drain',rarity:'epic'},
  {id:'BOSS-04',name:'Guardia Carbonizado',faction:'boss',role:'reserve',hp:420,attack:62,defense:55,speed:51,maxEnergy:3,skill:'strike',rarity:'rare'},
  {id:'BOSS-05',name:'Sacerdote de Fulgor',faction:'boss',role:'reserve',hp:410,attack:38,defense:50,speed:56,maxEnergy:4,skill:'mend',rarity:'rare'},
  {id:'BOSS-06',name:'Tejedor Roto',faction:'boss',role:'reserve',hp:300,attack:72,defense:33,speed:73,maxEnergy:3,skill:'burn',rarity:'rare'},
  {id:'BOSS-07',name:'Eco de la Bóveda',faction:'boss',role:'reserve',hp:340,attack:57,defense:47,speed:60,maxEnergy:3,skill:'ward',rarity:'common'},
];

const clamp = (n:number,min:number,max:number)=>Math.max(min,Math.min(max,n));
export class DeterministicRng { private state:number; constructor(seed:number){this.state=(seed>>>0)||1;} next(){this.state=(Math.imul(1664525,this.state)+1013904223)>>>0;return this.state/4294967296;} int(max:number){return Math.floor(this.next()*max);} }
export function makeSeed(label:string){let h=2166136261;for(let i=0;i<label.length;i++){h^=label.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}

function living(units:LabUnit[]){return units.filter(x=>x.alive);}
function toUnits(cards:LabCard[],side:LabSide):LabUnit[]{return cards.map((c,i)=>({...c,side,hpNow:c.hp,energy:c.maxEnergy,statuses:{},alive:true,cooldown:0,position:i}));}
function atk(u:LabUnit){let n=u.attack;if((u.statuses.fury??0)>0)n*=1.22;if((u.statuses.weaken??0)>0)n*=.78;if((u.statuses.overcharge??0)>0)n*=1.18;return n;}
function def(u:LabUnit){let n=u.defense;if((u.statuses.weaken??0)>0)n*=.8;if((u.statuses.marked??0)>0)n*=.92;return n;}
function target(actor:LabUnit,enemies:LabUnit[],allies:LabUnit[],rng:DeterministicRng){
  const foes=living(enemies); if(!foes.length)return null;
  if(actor.skill==='mend'){const hurt=living(allies).filter(x=>x.hpNow<x.hp*.88).sort((a,b)=>a.hpNow/a.hp-b.hp/b.hp);if(hurt.length)return hurt[0];}
  if(actor.skill==='ward'){return living(allies).sort((a,b)=>(b.hpNow/b.hp)-(a.hpNow/a.hp))[0]??actor;}
  const marked=foes.filter(x=>(x.statuses.marked??0)>0); const pool=marked.length?marked:foes; pool.sort((a,b)=>a.hpNow-b.hpNow||b.speed-a.speed); return pool.slice(0,Math.min(3,pool.length))[rng.int(Math.min(3,pool.length))];
}
function push(events:LabEvent,all:LabEvent[]){all.push({...events,sequence:all.length});}
function damage(actor:LabUnit,targetUnit:LabUnit,rng:DeterministicRng,round:number,events:LabEvent[],mult=1){
  const base=Math.max(1,Math.round(atk(actor)-def(targetUnit))); const crit=rng.next()<.05; let amount=Math.max(1,Math.round(base*(crit?1.5:1)*mult));
  const shield=Math.max(0,targetUnit.statuses.shield??0); const blocked=Math.min(shield,amount); if(blocked){targetUnit.statuses.shield=shield-blocked;push({id:`r${round}:shield:${actor.id}:${targetUnit.id}:${events.length}`,round,sequence:0,event_type:'SHIELD',actor_id:actor.id,target_id:targetUnit.id,amount:blocked,note:`${targetUnit.name} desvía ${blocked} de daño con el escudo.`},events); amount-=blocked;}
  amount=Math.max(0,amount); targetUnit.hpNow=clamp(targetUnit.hpNow-amount,0,targetUnit.hp); push({id:`r${round}:hit:${actor.id}:${targetUnit.id}:${events.length}`,round,sequence:0,event_type:crit?'CRITICAL_HIT':'BASIC_ATTACK',actor_id:actor.id,target_id:targetUnit.id,amount,note:`${actor.name} inflige ${amount} de daño${crit?' crítico':''}.`,payload:{critical:crit,remaining_hp:targetUnit.hpNow}},events);
  if(targetUnit.hpNow<=0){targetUnit.alive=false;push({id:`r${round}:ko:${targetUnit.id}`,round,sequence:0,event_type:'UNIT_DEFEATED',target_id:targetUnit.id,note:`${targetUnit.name} es eliminado.`,payload:{card_id:targetUnit.id}},events);}
}
function skill(actor:LabUnit,targetUnit:LabUnit,rng:DeterministicRng,round:number,events:LabEvent[]){
  if(actor.energy<=0||actor.cooldown>0)return false; actor.energy-=1; actor.cooldown=2;
  switch(actor.skill){
    case 'strike': damage(actor,targetUnit,rng,round,events,1.35); push({id:`r${round}:skill:${actor.id}:${events.length}`,round,sequence:0,event_type:'SPECIAL_SKILL',actor_id:actor.id,target_id:targetUnit.id,note:`${actor.name} desata un Golpe de Forja.`},events); break;
    case 'ward': targetUnit.statuses.shield=Math.min(110,(targetUnit.statuses.shield??0)+60); push({id:`r${round}:ward:${actor.id}:${events.length}`,round,sequence:0,event_type:'SHIELD_CAST',actor_id:actor.id,target_id:targetUnit.id,amount:60,note:`${actor.name} invoca un escudo de 60.`},events); break;
    case 'mend': {const before=targetUnit.hpNow; targetUnit.hpNow=clamp(targetUnit.hpNow+72,0,targetUnit.hp); targetUnit.statuses.regen=2; push({id:`r${round}:heal:${actor.id}:${events.length}`,round,sequence:0,event_type:'HEAL',actor_id:actor.id,target_id:targetUnit.id,amount:targetUnit.hpNow-before,note:`${actor.name} restaura ${targetUnit.hpNow-before} HP y deja Regeneración.`},events);break;}
    case 'burn': targetUnit.statuses.burn=Math.min(4,(targetUnit.statuses.burn??0)+2); targetUnit.statuses.marked=2; push({id:`r${round}:burn:${actor.id}:${events.length}`,round,sequence:0,event_type:'BURN_APPLIED',actor_id:actor.id,target_id:targetUnit.id,amount:2,note:`${actor.name} aplica Quemadura y Marca.`},events);break;
    case 'rally': actor.statuses.fury=3; actor.statuses.overcharge=1; push({id:`r${round}:rally:${actor.id}:${events.length}`,round,sequence:0,event_type:'BUFF',actor_id:actor.id,note:`${actor.name} entra en Furia y Sobrecarga.`},events);break;
    case 'drain': {const amount=Math.max(1,Math.round(atk(actor)*.66-def(targetUnit)*.18)); targetUnit.hpNow=clamp(targetUnit.hpNow-amount,0,targetUnit.hp); actor.hpNow=clamp(actor.hpNow+amount,0,actor.hp); push({id:`r${round}:drain:${actor.id}:${events.length}`,round,sequence:0,event_type:'DRAIN',actor_id:actor.id,target_id:targetUnit.id,amount,note:`${actor.name} roba ${amount} de vida a ${targetUnit.name}.`},events);if(targetUnit.hpNow<=0){targetUnit.alive=false;push({id:`r${round}:ko:${targetUnit.id}:drain`,round,sequence:0,event_type:'UNIT_DEFEATED',target_id:targetUnit.id,note:`${targetUnit.name} es eliminado.`},events);}break;}
    case 'summon': break;
  }
  return true;
}
function tick(unit:LabUnit,round:number,events:LabEvent[]){ if(!unit.alive)return; const burn=unit.statuses.burn??0;if(burn){const dmg=8+burn*4;unit.hpNow=clamp(unit.hpNow-dmg,0,unit.hp);push({id:`r${round}:burntick:${unit.id}`,round,sequence:0,event_type:'STATUS_TICK',actor_id:unit.id,amount:dmg,note:`${unit.name} sufre ${dmg} por Quemadura.`},events);if(unit.hpNow<=0){unit.alive=false;push({id:`r${round}:ko:${unit.id}:burn`,round,sequence:0,event_type:'UNIT_DEFEATED',target_id:unit.id,note:`${unit.name} cae por Quemadura.`},events);}}
  const regen=unit.statuses.regen??0;if(regen&&unit.alive){const before=unit.hpNow;unit.hpNow=clamp(unit.hpNow+10+regen*5,0,unit.hp);if(unit.hpNow>before)push({id:`r${round}:regentick:${unit.id}`,round,sequence:0,event_type:'REGENERATE',actor_id:unit.id,amount:unit.hpNow-before,note:`${unit.name} recupera ${unit.hpNow-before} HP.`},events);}
  (Object.keys(unit.statuses) as LabStatus[]).forEach(k=>{const n=unit.statuses[k]??0;if(n>0)unit.statuses[k]=Math.max(0,n-1);});
  unit.energy=Math.min(unit.maxEnergy,unit.energy+1); unit.cooldown=Math.max(0,unit.cooldown-1);
}

export function simulateTacticalBattle(playerCards:LabCard[]=TRAINING_CARDS,enemyCards:LabCard[]=TRAINING_ENEMY,seed=makeSeed('VEXFORGE-TACTICAL-LAB-2026')):LabResult{
  const rng=new DeterministicRng(seed); const player=toUnits(playerCards.slice(0,8),'player'); const enemy=toUnits(enemyCards.slice(0,8),'enemy'); const events:LabEvent[]=[]; let winner:LabSide|null=null; let lastRound=0;
  for(let round=1;round<=20;round++){
    lastRound=round; push({id:`r${round}:start`,round,sequence:0,event_type:'ROUND_START',note:`Ronda ${round}: la iniciativa se recalcula por Velocidad.`},events);
    const boss=enemy[0]; if(boss?.alive){const ratio=boss.hpNow/boss.hp;if((ratio<=.72&&ratio>.68)||(ratio<=.42&&ratio>.38)||(ratio<=.22&&ratio>.18)){boss.statuses.shield=Math.min(220,(boss.statuses.shield??0)+75);boss.statuses.fury=2;push({id:`r${round}:bossphase:${ratio.toFixed(2)}`,round,sequence:0,event_type:'BOSS_PHASE',actor_id:boss.id,amount:boss.statuses.shield,note:`${boss.name} cambia de fase y refuerza su núcleo.`,payload:{hp_ratio:ratio}},events);}}
    const order=[...living(player),...living(enemy)].sort((a,b)=>b.speed-a.speed||a.id.localeCompare(b.id));
    for(const actor of order){ if(!actor.alive)continue; const allies=actor.side==='player'?player:enemy;const foes=actor.side==='player'?enemy:player;const t=target(actor,foes,allies,rng);if(!t)break; const use=actor.energy>0&&actor.cooldown===0&&((actor.skill==='mend'&&t.hpNow<t.hp*.9)||(actor.skill!=='mend'&&rng.next()>.38)); if(use)skill(actor,t,rng,round,events); else damage(actor,t,rng,round,events); if(!living(foes).length)break; }
    player.forEach(u=>tick(u,round,events));enemy.forEach(u=>tick(u,round,events));
    if(!living(enemy).length){winner='player';break;} if(!living(player).length){winner='enemy';break;}
  }
  if(!winner)winner=living(player).length===living(enemy).length?null:living(player).length>living(enemy).length?'player':'enemy';
  push({id:`result:${lastRound}:${winner??'draw'}`,round:lastRound,sequence:0,event_type:winner==='player'?'VICTORY':winner==='enemy'?'DEFEAT':'DRAW',note:winner==='player'?'La formación domina el encuentro.':winner==='enemy'?'El enemigo conquista el campo.':'El límite táctico produce un empate.',payload:{rounds:lastRound}},events);
  return {seed,winner,rounds:lastRound,events,player,enemy,draw:winner===null,reason:winner?`winner:${winner}`:'round_cap'};
}
