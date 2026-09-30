import type { BattleEvent, BattleResult } from '../types/api';
import { classifyBattleEvent, type PresentationKind } from './presentation';
export interface ReplayFrame { index:number; event:BattleEvent; kind:PresentationKind; progress:number; actorId:string|null; targetId:string|null; }
export const buildReplayFrames=(result:BattleResult):ReplayFrame[]=>{const events=result.events??[];const last=Math.max(1,events.length-1);return events.map((event,index)=>({index,event,kind:classifyBattleEvent(event),progress:index/last,actorId:event.actor_id??null,targetId:event.target_id??null}));};
