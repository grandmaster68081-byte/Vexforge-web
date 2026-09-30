import { dispatchPlayerAction, legalActions, legalTargets, startTacticalSession } from '../src/engine/tacticalInteractive.ts';
import { makeSeed, TRAINING_CARDS, TRAINING_ENEMY } from '../src/engine/tacticalLabEngine.ts';

let failures:string[]=[];
const runs=500;
for(let i=0;i<runs;i++){
  const seed=makeSeed(`interactive-audit-${i}`);
  let a=startTacticalSession(TRAINING_CARDS,TRAINING_ENEMY,seed);
  let guard=0;
  while(!a.ended && guard++<240){
    const actor=a.currentActorId ? [...a.player,...a.enemy].find(u=>u.id===a.currentActorId) : null;
    if(!actor){failures.push(`run ${i}: missing current actor`);break;}
    if(actor.side!=='player'){
      failures.push(`run ${i}: player-dispatch loop reached enemy turn`);break;
    }
    const actions=legalActions(a);
    if(!actions.length){failures.push(`run ${i}: player turn has no legal action`);break;}
    const type=actions.includes('skill')?'skill':actions.includes('attack')?'attack':'guard';
    const targets=legalTargets(a,type);
    const targetId=type==='guard'?actor.id:targets[0]?.id;
    if(!targetId){failures.push(`run ${i}: ${type} has no legal target`);break;}
    const before=JSON.stringify(a);
    const next=dispatchPlayerAction(a,{actorId:actor.id,type,targetId});
    if(next.events.length<=a.events.length){failures.push(`run ${i}: action produced no event`);break;}
    if([...next.player,...next.enemy].some(u=>u.hpNow<0||u.hpNow>u.hp)){failures.push(`run ${i}: HP out of bounds`);break;}
    if([...next.player,...next.enemy].some(u=>u.energy<0||u.energy>u.maxEnergy)){failures.push(`run ${i}: energy out of bounds`);break;}
    a=next;
    if(before===JSON.stringify(a)) { failures.push(`run ${i}: action did not advance`);break; }
  }
  if(guard>=240 && !a.ended) failures.push(`run ${i}: safety cap exceeded`);

  // Same action sequence from the same seed must converge to the same terminal state.
  let b=startTacticalSession(TRAINING_CARDS,TRAINING_ENEMY,seed);
  let safety=0;
  while(!b.ended && safety++<240){
    const actor=b.currentActorId ? [...b.player,...b.enemy].find(u=>u.id===b.currentActorId) : null;
    if(!actor||actor.side!=='player') break;
    const actions=legalActions(b); const type=actions.includes('skill')?'skill':actions.includes('attack')?'attack':'guard';
    const targets=legalTargets(b,type); const targetId=type==='guard'?actor.id:targets[0]?.id; if(!targetId) break;
    b=dispatchPlayerAction(b,{actorId:actor.id,type,targetId});
  }
  const sig=(x:typeof a)=>JSON.stringify({round:x.round,ended:x.ended,winner:x.winner,phase:x.bossPhase,events:x.events.map(e=>[e.id,e.event_type,e.actor_id,e.target_id,e.amount,e.payload]),units:[...x.player,...x.enemy].map(u=>[u.id,u.hpNow,u.energy,u.alive,u.statuses])});
  if(sig(a)!==sig(b)) failures.push(`run ${i}: deterministic divergence`);
  if(failures.length>20) break;
}

{
  const boss=[{...TRAINING_ENEMY[0],id:'BOSS-SHOWCASE-AUDIT'} as any,...TRAINING_ENEMY.slice(1)];
  let s=startTacticalSession(TRAINING_CARDS,boss,makeSeed('boss-phase-audit'));
  const phases:number[]=[];
  for(let i=0;i<160&&!s.ended;i++){
    const actor=s.currentActorId?[...s.player,...s.enemy].find(u=>u.id===s.currentActorId):null;
    if(!actor||actor.side!=='player')break;
    const actions=legalActions(s); const type=actions.includes('skill')?'skill':actions.includes('attack')?'attack':'guard';
    const ts=legalTargets(s,type); const targetId=type==='guard'?actor.id:ts[0]?.id; if(!targetId)break;
    s=dispatchPlayerAction(s,{actorId:actor.id,type,targetId});
    phases.push(s.bossPhase);
  }
  if(phases.some((v,i)=>i>0&&v<phases[i-1])) failures.push('boss phase regressed');
  const phaseEvents=s.events.filter(e=>e.event_type==='BOSS_PHASE');
  if(new Set(phaseEvents.map(e=>e.id)).size!==phaseEvents.length) failures.push('duplicate boss phase event id');
  if(phaseEvents.length>3) failures.push('boss phase emitted more than three times');
}
const report={ok:failures.length===0,runs,failures};
console.log(JSON.stringify(report,null,2));
process.exitCode=report.ok?0:1;
