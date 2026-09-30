import { makeSeed, simulateTacticalBattle, TRAINING_CARDS, TRAINING_ENEMY } from '../engine/tacticalLabEngine.ts';
export interface BattleAuditReport { ok:boolean; runs:number; failures:string[]; invariants:{nonNegativeHp:true|number; boundedEnergy:true|number; noDeadActor:true|number; deterministic:true|number; uniqueEventIds:true|number}; }
export function auditBattle(runs=2500):BattleAuditReport{
  const failures:string[]=[];let nonNeg=0,energy=0,dead=0,det=0,unique=0;
  for(let i=0;i<runs;i++){
    const seed=makeSeed(`audit-${i}`);const a=simulateTacticalBattle(TRAINING_CARDS,TRAINING_ENEMY,seed);const b=simulateTacticalBattle(TRAINING_CARDS,TRAINING_ENEMY,seed);
    const units=[...a.player,...a.enemy]; if(units.some(u=>u.hpNow<0)){nonNeg++;failures.push(`run ${i}: negative HP`);} if(units.some(u=>u.energy<0||u.energy>u.maxEnergy)){energy++;failures.push(`run ${i}: invalid energy`);}
    const defeatedAt=new Map<string,number>();for(const e of a.events)if(e.event_type==='UNIT_DEFEATED'&&e.target_id&&!defeatedAt.has(e.target_id))defeatedAt.set(e.target_id,e.sequence);if(a.events.some(e=>(e.event_type.includes('ATTACK')||e.event_type.includes('SKILL')||e.event_type.includes('HIT')||e.event_type==='DRAIN')&&e.actor_id&&defeatedAt.has(e.actor_id)&&e.sequence>(defeatedAt.get(e.actor_id)??Infinity))){dead++;failures.push(`run ${i}: defeated actor emitted action after KO`);} 
    const sig=(x:typeof a)=>JSON.stringify({winner:x.winner,rounds:x.rounds,events:x.events.map(e=>[e.id,e.event_type,e.actor_id,e.target_id,e.amount,e.payload])}); if(sig(a)!==sig(b)){det++;failures.push(`run ${i}: non-deterministic result`);} 
    if(new Set(a.events.map(e=>e.id)).size!==a.events.length){unique++;failures.push(`run ${i}: duplicate event ids`);} 
    if(failures.length>20)break;
  }
  return {ok:failures.length===0,runs,failures,invariants:{nonNegativeHp:nonNeg===0||nonNeg,boundedEnergy:energy===0||energy,noDeadActor:dead===0||dead,deterministic:det===0||det,uniqueEventIds:unique===0||unique}};
}
