import { useEffect, useState } from 'react';
import { CheckCircle2, ExternalLink, FileUp, LoaderCircle, Play, ShieldCheck, X, AlertTriangle } from 'lucide-react';
import type { EarnItem } from '../lib/types';
import { points } from '../lib/format';

export function OfferModal({item,onClose,onAction}:{item:EarnItem|null;onClose:()=>void;onAction:(item:EarnItem, data?:{proof?:string;taskImage?:File;completeVideo?:boolean})=>Promise<any>}){
 const [busy,setBusy]=useState(false); const [videoUrl,setVideoUrl]=useState<string|null>(null); const [proof,setProof]=useState(''); const [file,setFile]=useState<File|undefined>(); const [message,setMessage]=useState('');
 useEffect(()=>{setBusy(false);setVideoUrl(null);setProof('');setFile(undefined);setMessage('')},[item]);
 if(!item)return null;
 const submit=async()=>{setBusy(true);setMessage('');try{const res=await onAction(item,{proof:proof.trim(),taskImage:file}); if(res?.video_url){setVideoUrl(res.video_url);setMessage('Watch the full creative, then confirm completion below.')}else setMessage('Action started. Provider verification will handle the reward.') }catch(e){setMessage(e instanceof Error?e.message:'Could not start this opportunity.')}finally{setBusy(false)}};
 const isVideo=item.category==='video', isTask=item.category==='tasks';
 return <div className="modal-backdrop" onMouseDown={e=>{if(e.currentTarget===e.target)onClose()}}><section className="offer-modal" role="dialog" aria-modal="true" aria-labelledby="offer-title">
   <button className="modal-close" onClick={onClose} aria-label="Close"><X size={18}/></button>
   <div className="modal-kicker"><span>{item.category.toUpperCase()}</span>{item.boosted&&<span className="hot-mini">BOOSTED</span>}</div>
   <h2 id="offer-title">{item.title}</h2><p className="modal-desc">{item.description||item.requirements||'Follow the advertiser requirements carefully. Only verified completions can receive the displayed reward.'}</p>
   <div className="modal-reward"><span>Potential reward</span><strong>+{points(item.reward)}</strong><small>{item.currencyName}</small></div>
   {item.goals?.length ? <div className="modal-goals">{item.goals.map((g,i)=><div key={`${g.name}-${i}`}><span>{i+1}</span><div><strong>{g.name}</strong><small>{g.description||'Milestone defined by the advertiser.'}</small></div></div>)}</div>:null}
   {isVideo&&videoUrl?<div className="video-wrap"><iframe src={videoUrl} title={item.title} allow="autoplay; encrypted-media" allowFullScreen/></div>:null}
   {isTask&&<div className="task-proof"><label>Your proof<textarea value={proof} onChange={e=>setProof(e.target.value)} placeholder="Describe what you completed or paste the requested proof…"/></label><label className="file-input"><FileUp size={16}/><span>{file?file.name:'Optional screenshot'}</span><input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0])}/></label></div>}
   {message&&<div className={`notice ${message.includes('Could not')?'error':'info'}`}><AlertTriangle size={15}/><span>{message}</span></div>}
   <div className="modal-actions"><div className="modal-trust"><ShieldCheck size={14}/><span>Provider verified</span></div>{isVideo&&videoUrl?<button className="primary-button" disabled={busy} onClick={async()=>{setBusy(true);try{await onAction(item,{completeVideo:true});setMessage('Completion sent to the provider.')}catch(e){setMessage(e instanceof Error?e.message:'Could not complete video.')}finally{setBusy(false)}}}>{busy?<LoaderCircle className="spin" size={16}/>:<CheckCircle2 size={16}/>} Confirm watched</button>:<button className="primary-button" disabled={busy} onClick={()=>void submit()}>{busy?<LoaderCircle className="spin" size={16}/>:isTask?<FileUp size={16}/>:<ExternalLink size={16}/>} {isTask?'Submit proof':'Start opportunity'}</button>}</div>
 </section></div>;
}
