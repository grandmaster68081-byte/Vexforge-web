import { ArrowDownToLine, CheckCircle2, Clock3, Coins, RotateCcw } from 'lucide-react';
import type { LedgerEntry } from '../lib/types';
import { points, shortDate } from '../lib/format';
export function ActivityFeed({entries}:{entries:LedgerEntry[]}){
 const icon=(t:string)=>t==='reward'?<Coins size={15}/>:t==='withdrawal'?<ArrowDownToLine size={15}/>:t==='withdrawal_reversal'?<RotateCcw size={15}/>:<CheckCircle2 size={15}/>;
 return <div className="activity-feed">{entries.slice(0,7).map(e=><div className="activity-row" key={e.id}><div className={`activity-icon ${e.pointsDelta<0?'debit':'credit'}`}>{icon(e.type)}</div><div className="activity-main"><strong>{e.type==='reward'?'Reward credited':e.type==='withdrawal'?'Withdrawal requested':e.type==='withdrawal_reversal'?'Withdrawal returned':'Account adjustment'}</strong><span>{e.source} · {shortDate(e.createdAt)}</span></div><div className={`activity-value ${e.pointsDelta>=0?'positive':'negative'}`}>{e.pointsDelta>=0?'+':''}{points(e.pointsDelta)}<small>pts</small></div><span className={`status-dot ${e.status}`}>{e.status==='pending'?<Clock3 size={11}/>:<CheckCircle2 size={11}/>}</span></div>)}{!entries.length&&<div className="activity-empty">Your first verified reward will appear here.</div>}</div>;
}
