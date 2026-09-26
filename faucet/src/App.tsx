import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { api } from './lib/api';
import type { EarnItem, LedgerEntry, PlatformConfig, User, Wallet, Withdrawal } from './lib/types';
import { BrandBackground } from './components/BrandBackground';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { AuthPage } from './pages/AuthPage';
import { OverviewPage } from './pages/OverviewPage';
import { EarnPage } from './pages/EarnPage';
import { WalletPage } from './pages/WalletPage';
import { WithdrawPage } from './pages/WithdrawPage';
import { ActivityPage } from './pages/ActivityPage';
import { AdminPage } from './pages/AdminPage';
import { LandingPage } from './pages/LandingPage';
import { LegalPage } from './pages/LegalPage';
function getPath(){return window.location.pathname||'/'}
function go(path:string){window.history.pushState({},'',path);window.dispatchEvent(new PopStateEvent('popstate'))}
export function App(){
 const [user,setUser]=useState<User|null>(null),[wallet,setWallet]=useState<Wallet|null>(null),[config,setConfig]=useState<PlatformConfig>({currencyName:'Kivora Points',pointsPerUsdDisplay:1000,withdrawalMinPoints:5000,targetUserShareBps:3500,supportedPayouts:[{asset:'USDC',network:'Base'},{asset:'USDC',network:'Solana'},{asset:'BTC',network:'Bitcoin'},{asset:'LTC',network:'Litecoin'}]}),[offers,setOffers]=useState<EarnItem[]>([]),[withdrawals,setWithdrawals]=useState<Withdrawal[]>([]),[ledger,setLedger]=useState<LedgerEntry[]>([]),[adminSummary,setAdminSummary]=useState<any>(null),[adminWithdrawals,setAdminWithdrawals]=useState<Withdrawal[]>([]),[path,setPath]=useState(getPath),[authMode,setAuthMode]=useState<'login'|'signup'>(getPath()==='/register'?'signup':'login'),[loading,setLoading]=useState(true),[mobileNav,setMobileNav]=useState(false),[toast,setToast]=useState<{m:string;t:'info'|'success'|'error'}|null>(null),[searchOpen,setSearchOpen]=useState(false);
 useEffect(()=>{const h=()=>setPath(getPath());window.addEventListener('popstate',h);return()=>window.removeEventListener('popstate',h)},[]);
 const toastIt=useCallback((m:string,t:'info'|'success'|'error'='info')=>{setToast({m,t});window.setTimeout(()=>setToast(null),3600)},[]);
 const refreshMe=useCallback(async()=>{const r=await api.me();setUser(r.user);setWallet(r.wallet);setLoading(false)},[]);
 const refreshFallbackOffers=useCallback(async()=>{try{const r=await api.offers();setOffers(r.offers)}catch{setOffers([])}},[]);
 const refreshWallet=useCallback(async()=>{try{const r=await api.wallet();setWallet(r.wallet);setWithdrawals(r.withdrawals)}catch{}},[]);
 const refreshActivity=useCallback(async()=>{try{const r=await api.activity();setLedger(r.ledger)}catch{}},[]);
 const refreshAdmin=useCallback(async()=>{try{const [s,w]=await Promise.all([api.adminSummary(),api.adminWithdrawals()]);setAdminSummary(s);setAdminWithdrawals(w.withdrawals)}catch{}},[]);
 useEffect(()=>{void api.config().then(setConfig).catch(()=>{});refreshMe().catch(()=>setLoading(false));void refreshFallbackOffers()},[refreshMe,refreshFallbackOffers]);
 useEffect(()=>{if(!user)return;void refreshWallet();void refreshActivity()},[user,refreshWallet,refreshActivity]);
 useEffect(()=>{if(!user)return;if(path==='/admin'&&user.role==='admin')void refreshAdmin()},[path,user,refreshAdmin]);
 const authSubmit=async(payload:any)=>{const r=authMode==='login'?await api.login(payload):await api.signup(payload);setUser(r.user);const me=await api.me();setWallet(me.wallet);go('/')};
 const logout=async()=>{await api.logout().catch(()=>{});setUser(null);setWallet(null);go('/login')};
 const withdraw=async(payload:any)=>{await api.withdraw(payload);await refreshWallet();toastIt('Withdrawal request created and points reserved.','success');go('/wallet')};
 const adminAction=async(id:string,act:'approve'|'reject'|'paid',note?:string)=>{let tx='';if(act==='paid'){tx=window.prompt('Transaction hash (optional)')??''}await api.adminSetWithdrawal(id,{action:act,note,txHash:tx||undefined});await refreshAdmin();await refreshWallet();toastIt(`Withdrawal ${act}.`,act==='reject'?'info':'success')};
 const content=useMemo(()=>{
   if(!user||!wallet)return null;
   switch(path){
     case '/earn': return <EarnPage fallbackOffers={offers} onToast={toastIt}/>;
     case '/wallet': return <WalletPage wallet={wallet} withdrawals={withdrawals} config={config} onNavigate={go}/>;
     case '/withdraw': return <WithdrawPage wallet={wallet} config={config} onSubmit={withdraw} onNavigate={go}/>;
     case '/activity': return <ActivityPage ledger={ledger}/>;
     case '/admin': return user.role==='admin'
       ? <AdminPage summary={adminSummary} withdrawals={adminWithdrawals} onAction={adminAction}/>
       : <OverviewPage user={user} wallet={wallet} offers={offers} config={config} entries={ledger} onNavigate={go}/>;
     default: return <OverviewPage user={user} wallet={wallet} offers={offers} config={config} entries={ledger} onNavigate={go}/>;
   }
 },[adminSummary,adminWithdrawals,adminAction,config,ledger,offers,path,toastIt,user,wallet,withdrawals]);

 if(loading)return <><BrandBackground/><div className="loading-shell"><img src="/kivora-mark.svg" alt=""/><strong>KIVORA</strong><span>Preparing your rewards workspace…</span></div></>;
 if(!user){if(path==='/terms'||path==='/privacy')return <><BrandBackground/><LegalPage kind={path==='/terms'?'terms':'privacy'} onBack={()=>go('/')}/></>;if(path==='/login'||path==='/register')return <><BrandBackground/><AuthPage mode={authMode} onSubmit={authSubmit} onSwitch={m=>{setAuthMode(m);go(m==='signup'?'/register':'/login')}}/></>;return <><BrandBackground/><LandingPage onLogin={()=>{setAuthMode('login');go('/login')}} onRegister={()=>{setAuthMode('signup');go('/register')}} onLegal={go} onShowDemo={()=>document.getElementById('how')?.scrollIntoView({behavior:'smooth'})}/></>}
 return <><BrandBackground/><div className="app-shell"><Sidebar user={user} path={path} open={mobileNav} onClose={()=>setMobileNav(false)} onNavigate={p=>{setMobileNav(false);go(p)}} onLogout={logout}/><div className="main-shell"><Topbar user={user} wallet={wallet} onMenu={()=>setMobileNav(v=>!v)} onSearch={()=>{setSearchOpen(true);setTimeout(()=>document.getElementById('global-search')?.focus(),50)}}/><main className="content"><div className={`mobile-search-drawer ${searchOpen?'show':''}`}><input id="global-search" placeholder="Search opportunities" onKeyDown={e=>{if(e.key==='Enter'){setSearchOpen(false);go('/earn')}}}/><button onClick={()=>setSearchOpen(false)}>×</button></div>{content}</main></div></div>{toast&&<div className={`toast ${toast.t}`} role="status"><span>{toast.t==='success'?<Sparkles size={15}/>:<Search size={15}/>}</span>{toast.m}</div>}{searchOpen&&<button className="search-overlay" aria-label="Close search" onClick={()=>setSearchOpen(false)}/>}</>;
}
