import { BarChart3, Gift, History, LogOut, Sparkles, WalletCards, X, ShieldCheck } from 'lucide-react';
import type { User } from '../lib/types';
import { Logo } from './Logo';

const items = [
  ['/','Overview',Sparkles],
  ['/earn','Earn',Gift],
  ['/wallet','Wallet',WalletCards],
  ['/activity','Activity',History]
] as const;

export function Sidebar({ user, path, onNavigate, onLogout, open, onClose }:{user:User;path:string;onNavigate:(p:string)=>void;onLogout:()=>void;open:boolean;onClose:()=>void}){
 return <>
   <button className={`mobile-scrim ${open?'show':''}`} aria-label="Close navigation" onClick={onClose}/>
   <aside className={`sidebar ${open?'open':''}`}>
     <div className="sidebar-head"><Logo compact/><button className="icon-button mobile-close" onClick={onClose} aria-label="Close navigation"><X size={18}/></button></div>
     <nav className="side-nav" aria-label="Main navigation">
       {items.map(([href,label,Icon])=><button key={href} className={path===href?'active':''} onClick={()=>onNavigate(href)}><Icon size={17}/><span>{label}</span>{href==='/earn' && <span className="nav-live">LIVE</span>}</button>)}
       {user.role==='admin' && <button className={path==='/admin'?'active':''} onClick={()=>onNavigate('/admin')}><ShieldCheck size={17}/><span>Operations</span></button>}
     </nav>
     <div className="sidebar-promo">
       <div className="promo-mark"><BarChart3 size={17}/></div>
       <strong>Built around verified value.</strong>
       <span>Provider callbacks settle rewards before they reach your balance.</span>
     </div>
     <div className="side-bottom">
       <div className="mini-user"><div className="avatar">{user.username.slice(0,2).toUpperCase()}</div><div><strong>{user.username}</strong><small>{user.role==='admin'?'Operations':'Member'}</small></div></div>
       <button className="icon-button" onClick={onLogout} aria-label="Sign out"><LogOut size={16}/></button>
     </div>
   </aside>
 </>;
}
