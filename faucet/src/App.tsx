import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { api } from './lib/api';
import type { EarnItem, LedgerEntry, PlatformConfig, User, Wallet, Withdrawal } from './lib/types';
import { AuthPage } from './pages/AuthPage';
import { AdminPage } from './pages/AdminPage';
import { LegalPage } from './pages/LegalPage';
import { KivoraFinalWorld, KivoraLanding } from './kivora/KivoraFinalWorld';
import './styles.css';

function path() { return window.location.pathname || '/'; }
function go(next: string) { window.history.pushState({}, '', next); window.dispatchEvent(new PopStateEvent('popstate')); }

const fallbackConfig: PlatformConfig = {
  currencyName: 'Kivora Points',
  pointsPerUsdDisplay: 1000,
  withdrawalMinPoints: 10000,
  targetUserShareBps: 3500,
  supportedPayouts: [{ asset: 'USDT', network: 'TRC20' }],
  providerConfigured: false,
  treasuryAsset: 'USDT',
  treasuryNetwork: 'TRC20',
  treasuryAddress: 'TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD',
};

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [config, setConfig] = useState<PlatformConfig>(fallbackConfig);
  const [offers, setOffers] = useState<EarnItem[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [adminSummary, setAdminSummary] = useState<any>(null);
  const [adminWithdrawals, setAdminWithdrawals] = useState<Withdrawal[]>([]);
  const [currentPath, setCurrentPath] = useState(path());
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(path() === '/register' ? 'signup' : 'login');
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');
  const [providerConfigured, setProviderConfigured] = useState(false);

  useEffect(() => { const handler = () => setCurrentPath(path()); window.addEventListener('popstate', handler); return () => window.removeEventListener('popstate', handler); }, []);
  const toastIt = useCallback((message: string) => { setToast(message); window.setTimeout(() => setToast(''), 3600); }, []);

  const refreshAll = useCallback(async () => {
    try { const cfg = await api.config(); setConfig(cfg); setProviderConfigured(Boolean(cfg.providerConfigured)); } catch { setConfig(fallbackConfig); setProviderConfigured(false); }
    try { const r = await api.publicConfig(); setProviderConfigured(Boolean(r.providerConfigured)); } catch { setProviderConfigured(false); }
    try { const r = await api.offers(); setOffers(r.offers); } catch { setOffers([]); }
    try { const r = await api.wallet(); setWallet(r.wallet); setWithdrawals(r.withdrawals); } catch { /* session may not exist */ }
    try { const r = await api.activity(); setLedger(r.ledger); } catch { setLedger([]); }
  }, []);

  const refreshMe = useCallback(async () => {
    try { const r = await api.me(); setUser(r.user); setWallet(r.wallet); } finally { setLoading(false); }
  }, []);

  useEffect(() => { void refreshMe(); }, [refreshMe]);
  useEffect(() => { void refreshAll(); }, [refreshAll]);
  useEffect(() => { if (user) void refreshAll(); }, [user, refreshAll]);

  useEffect(() => {
    if (user?.role !== 'admin' || currentPath !== '/admin') return;
    void (async () => {
      try {
        const [summary, withdrawalsResult] = await Promise.all([api.adminSummary(), api.adminWithdrawals()]);
        setAdminSummary(summary);
        setAdminWithdrawals(withdrawalsResult.withdrawals);
      } catch { setAdminSummary(null); setAdminWithdrawals([]); }
    })();
  }, [currentPath, user]);

  const logout = async () => { await api.logout().catch(() => undefined); setUser(null); setWallet(null); go('/'); };
  const authSubmit = async (payload: { username?: string; email: string; password: string }) => {
    const response = authMode === 'login' ? await api.login(payload) : await api.signup({ username: payload.username ?? '', email: payload.email, password: payload.password });
    setUser(response.user); await refreshAll(); go('/');
  };

  if (loading) return <div className="kg-boot"><img src="/kivora/ui/kivora-sigil.svg" alt=""/><span>BOOTING STATION</span><b>KIVORA</b></div>;
  if (!user) {
    if (currentPath === '/terms' || currentPath === '/privacy') return <LegalPage kind={currentPath === '/terms' ? 'terms' : 'privacy'} onBack={() => go('/')} />;
    if (currentPath === '/login' || currentPath === '/register') return <div className="kg-auth"><AuthPage mode={authMode} onSubmit={authSubmit} onSwitch={mode => { setAuthMode(mode); go(mode === 'signup' ? '/register' : '/login'); }} /></div>;
    return <KivoraLanding onLogin={() => { setAuthMode('login'); go('/login'); }} onRegister={() => { setAuthMode('signup'); go('/register'); }} />;
  }

  if (currentPath === '/admin' && user.role === 'admin') {
    return <AdminPage summary={adminSummary} withdrawals={adminWithdrawals} onAction={async (id, action, note) => { await api.adminSetWithdrawal(id, { action, note, txHash: action === 'paid' ? window.prompt('Transaction hash') || undefined : undefined }); toastIt(`Withdrawal ${action}`); await refreshAll(); }} />;
  }

  if (!wallet) return <div className="kg-boot"><img src="/kivora/ui/kivora-sigil.svg" alt=""/><span>RESTORING VAULT</span></div>;

  return <>
    <KivoraFinalWorld user={user} wallet={wallet} config={config} offers={offers} ledger={ledger} withdrawals={withdrawals} providerConfigured={providerConfigured} onRefresh={() => void refreshAll()} onLogout={logout} />
    {toast && <div className="kg-toast"><Sparkles size={15} />{toast}</div>}
  </>;
}
