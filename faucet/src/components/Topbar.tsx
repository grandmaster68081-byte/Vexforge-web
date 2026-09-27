import { Bell, Menu, Search, WalletCards } from 'lucide-react';
import type { ProviderHealth, User, Wallet } from '../lib/types';
import { points } from '../lib/format';
const providerLabels: Record<ProviderHealth, string> = {
 connected: 'Provider connected',
 degraded: 'Provider degraded',
 unavailable: 'Provider unavailable',
 not_configured: 'Provider not configured',
};
export function Topbar({user,wallet,providerHealth,onMenu,onSearch}:{user:User;wallet:Wallet|null;providerHealth:ProviderHealth;onMenu:()=>void;onSearch:()=>void}){
 return <header className="topbar">
   <button className="mobile-menu" onClick={onMenu} aria-label="Open navigation"><Menu size={20}/></button>
   <button className="top-search" onClick={onSearch}><Search size={15}/><span>Search opportunities</span><kbd>/</kbd></button>
   <div className="topbar-spacer"/>
   <div className={`top-status provider-health-${providerHealth}`}><i/>{providerLabels[providerHealth]}</div>
    <div className="top-wallet" aria-label="Wallet balance"><WalletCards size={15}/><span>{wallet ? `${points(wallet.availablePoints)} pts` : '— pts'}</span></div>
    <div className="icon-button top-notify" aria-label="Notifications"><Bell size={17}/><i/></div>
   <div className="top-avatar">{user.username.slice(0,2).toUpperCase()}</div>
 </header>;
}
