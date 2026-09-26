import { ArrowUpRight, Clock3, FileText, Flame, Play, Rocket, ShieldCheck, Smartphone, Target, Video, Link2 } from 'lucide-react';
import type { EarnItem } from '../lib/types';
import { points } from '../lib/format';

const labels: Record<EarnItem['category'], string> = {
  surveys:'Surveys', offers:'Offers', ptc:'PTC', video:'Video', faucet:'Faucet', shortlinks:'Shortlinks', tasks:'Tasks', article:'Read & earn'
};
const icons: Record<EarnItem['category'], any> = { surveys:Target, offers:Rocket, ptc:EyeIcon, video:Video, faucet:SparkIcon, shortlinks:Link2, tasks:FileText, article:FileText };
function EyeIcon(p:any){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...p}><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.5"/></svg> }
function SparkIcon(p:any){ return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" {...p}><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Z"/><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z"/></svg> }

export function OfferCard({item,onOpen}:{item:EarnItem;onOpen:(item:EarnItem)=>void}){
 const Icon=icons[item.category];
 return <article className="offer-card">
   <div className="offer-visual">
     {item.image ? <img src={item.image} alt="" loading="lazy" referrerPolicy="no-referrer"/> : <div className="offer-visual-fallback"><Icon size={30}/><span>{labels[item.category]}</span></div>}
     <div className="offer-chip-row"><span className="offer-chip"><Icon size={12}/>{labels[item.category]}</span>{item.boosted&&<span className="offer-chip hot"><Flame size={12}/> Boosted</span>}</div>
     {item.reward >= 500 && <span className="reward-ribbon">HIGH REWARD</span>}
   </div>
   <div className="offer-body">
     <div className="offer-meta"><span>{item.source}</span>{item.durationSeconds ? <span><Clock3 size={12}/>{item.durationSeconds}s</span>:null}</div>
     <h3>{item.title}</h3>
     <p>{item.description || item.requirements || 'Complete the advertiser-defined goal to receive the displayed reward.'}</p>
     {item.goals?.length ? <div className="goal-preview">{item.goals.slice(0,2).map((g,i)=><span key={`${g.name}-${i}`}><i/>{g.name}</span>)}</div>:null}
     {(item.claimed!==undefined||item.waitSeconds!==undefined)&&<div className="provider-meta-row">{item.claimed!==undefined&&item.limit!==undefined?<span>{item.claimed}/{item.limit} today</span>:null}{item.waitSeconds!==undefined?<span>{item.waitSeconds>0?`${item.waitSeconds}s cooldown`:'Ready now'}</span>:null}</div>}
     <div className="offer-foot">
       <div className="offer-reward"><small>{item.earnUpTo&&item.earnUpTo>item.reward?'Up to':'Reward'}</small><strong>+{points(item.earnUpTo&&item.earnUpTo>item.reward?item.earnUpTo:item.reward)}</strong><span>{item.currencyName}</span></div>
       <button className="primary-button compact" onClick={()=>onOpen(item)}>{item.category==='video'?<><Play size={14}/> Watch</>:item.category==='ptc'?<><Smartphone size={14}/> View</>:<>Start <ArrowUpRight size={14}/></>}</button>
     </div>
   </div>
   <div className="offer-trust"><ShieldCheck size={11}/> Reward confirmed by provider callback after completion</div>
 </article>;
}
