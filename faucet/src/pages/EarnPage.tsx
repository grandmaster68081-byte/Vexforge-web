import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, RefreshCw, Search, SlidersHorizontal, Sparkles, Zap } from 'lucide-react';
import type { EarnItem, EarnCategory, ProviderHealth } from '../lib/types';
import { OfferCard } from '../components/OfferCard';
import { OfferModal } from '../components/OfferModal';
import { getBitcoTasksWall } from '../lib/bitcotasks-sdk';
import { DailyRunPanel } from '../components/daily/DailyRunPanel';
const categories:[EarnCategory,string][]=[['all','All'],['offers','Offers'],['surveys','Surveys'],['ptc','PTC'],['video','Video'],['tasks','Tasks'],['shortlinks','Shortlinks'],['faucet','Faucet'],['article','Read']];
const providerLabels: Record<ProviderHealth, string> = {
 connected: 'BitcoTasks connected',
 degraded: 'BitcoTasks degraded',
 unavailable: 'BitcoTasks unavailable',
 not_configured: 'BitcoTasks not configured',
};
export function EarnPage({fallbackOffers,providerHealth,onToast}:{fallbackOffers:EarnItem[];providerHealth:ProviderHealth;onToast:(m:string,t?:'info'|'success'|'error')=>void}){
 const [category,setCategory]=useState<EarnCategory>('all'); const [items,setItems]=useState<EarnItem[]>(fallbackOffers); const [query,setQuery]=useState(''); const [sort,setSort]=useState<'reward'|'quick'>('reward'); const [loading,setLoading]=useState(true); const [selected,setSelected]=useState<EarnItem|null>(null); const [sdkReady,setSdkReady]=useState(false);
  const load=async(force=false)=>{
    if(providerHealth==='not_configured'){
      setSdkReady(false);
      setItems(fallbackOffers);
      setLoading(false);
      return;
    }
    setLoading(true);
    try{const wall=await getBitcoTasksWall();setSdkReady(true);const types=category==='all'?categories.slice(1).map(x=>x[0] as Exclude<EarnCategory,'all'>):[category as Exclude<EarnCategory,'all'>];const rs=await Promise.allSettled(types.map(t=>wall.getOffers(t,{forceRefresh:force,page:1})));const next=rs.flatMap((r)=>r.status==='fulfilled'?r.value:[]);setItems(next.length?next:fallbackOffers);if(!next.length)onToast('No live provider inventory matched your current profile.','info')}catch{setSdkReady(false);setItems(fallbackOffers);if(!fallbackOffers.length)onToast('BitcoTasks inventory is unavailable right now.','error')}finally{setLoading(false)}
  };
  useEffect(()=>{void load(false)},[category,providerHealth]);
 const filtered=useMemo(()=>{let r=items.filter(i=>!query||`${i.title} ${i.description} ${i.category}`.toLowerCase().includes(query.toLowerCase()));r.sort((a,b)=>sort==='reward'?b.reward-a.reward:(a.durationSeconds??999999)-(b.durationSeconds??999999));return r},[items,query,sort]);
 const open=async(item:EarnItem)=>{if(!sdkReady){window.open(item.url,'_blank','noopener,noreferrer');return}setSelected(item)};
 const action=async(item:EarnItem,data?:{proof?:string;taskImage?:File;completeVideo?:boolean})=>{const wall=await getBitcoTasksWall();if(item.category==='offers'||item.category==='surveys')return wall.openOffer(item);if(item.category==='article')return wall.openArticle(item);if(item.category==='faucet')return wall.claimFaucet(item);if(item.category==='shortlinks')return wall.openShortlink(item);if(item.category==='ptc')return wall.startPTC(item);if(item.category==='video')return data?.completeVideo?wall.completeVideo(item):wall.startVideo(item);if(item.category==='tasks')return wall.submitTask(item,{proof:data?.proof??'',taskImage:data?.taskImage});};
  return <div className="page-stack scene-page opportunity-field"><section className="earn-header scene-hero"><div><span className="scene-eyebrow"><Zap size={12}/> OPPORTUNITY FIELD</span><h1>Choose your <em>next move.</em></h1><p>Quick, Core and High Yield are deterministic lanes built from real provider inventory. Requirements stay visible before you begin.</p></div><div className="earn-header-actions"><span className={providerHealth==='connected'&&sdkReady?'provider-state online':'provider-state'}><i/>{providerHealth==='connected'&&sdkReady?providerLabels.connected:providerLabels[providerHealth]}</span><button className="secondary-button" onClick={()=>void load(true)} disabled={loading}>{loading?<RefreshCw className="spin" size={15}/>:<RefreshCw size={15}/>}Refresh field</button></div></section>
  <section className="field-signals"><div><small>LIVE INVENTORY</small><strong>{items.length}</strong><span>offers visible to this account</span></div><div><small>ACTIVE FILTER</small><strong>{category === 'all' ? 'ALL' : category.toUpperCase()}</strong><span>provider category lane</span></div><div><small>SORT MODE</small><strong>{sort === 'reward' ? 'REWARD' : 'SPEED'}</strong><span>display preference only</span></div></section>
 <DailyRunPanel onOpen={open}/><section className="earn-toolbar"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search rewards, tasks or campaigns"/></div><div className="filter-pills">{categories.map(([id,label])=><button key={id} className={category===id?'filter-pill active':'filter-pill'} onClick={()=>setCategory(id)}>{label}</button>)}</div><div className="sort-select"><SlidersHorizontal size={15}/><select value={sort} onChange={e=>setSort(e.target.value as any)}><option value="reward">Highest reward</option><option value="quick">Fastest actions</option></select><ChevronDown size={14}/></div></section>
 <div className="earn-highlight"><div className="highlight-badge"><Sparkles size={16}/></div><div><strong>Protect your progress.</strong><span>Higher-value opportunities can have stricter requirements or review windows. Read each requirement before you begin.</span></div><div className="highlight-stat"><small>{filtered.length}</small><span>shown now</span></div></div>
 <section className="earn-grid-wrap">{loading?<div className="skeleton-grid">{Array.from({length:6}).map((_,i)=><div className="skeleton-card" key={i}/>)}</div>:filtered.length?<div className="offer-grid earn-grid">{filtered.map(item=><OfferCard key={`${item.category}-${item.id}`} item={item} onOpen={open}/>)}</div>:<div className="empty-state large"><Filter size={28}/><h3>No matching opportunities</h3><p>Try another category or clear your search. Provider inventory changes by account, device, country and campaign caps.</p></div>}</section>
 <OfferModal item={selected} onClose={()=>setSelected(null)} onAction={async(item,data)=>{const result=await action(item,data);if(item.category!=='video'||data?.proof){onToast('Action sent. Provider verification will determine the reward.','success');setSelected(null)}return result}}/>
 </div>;
}
