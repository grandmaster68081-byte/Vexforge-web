import { Bell, Menu, Search, WalletCards } from 'lucide-react';
import type { User, Wallet } from '../lib/types';
import { points } from '../lib/format';
export function Topbar({user,wallet,onMenu,onSearch}:{user:User;wallet:Wallet;onMenu:()=>void;onSearch:()=>void}){
 return <header className="topbar">
   <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20}/></button>
   <button className="top-search" onClick={onSearch}><Search size={15}/><span>Search opportunities</span><kbd>/</kbd></button>
   <div className="topbar-spacer"/>
   <div className="top-status"><i/>Provider connected</div>
   <button className="top-wallet" aria-label="Wallet balance"><WalletCards size={15}/><span>{points(wallet.availablePoints)} pts</span></button>
   <button className="icon-button top-notify" aria-label="Notifications"><Bell size={17}/><i/></button>
   <div className="top-avatar">{user.username.slice(0,2).toUpperCase()}</div>
 </header>;
}
