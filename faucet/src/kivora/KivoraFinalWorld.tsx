import { useMemo, useState } from 'react';
import type { ChangeEvent, ReactNode } from 'react';
import {
  Activity, ArrowRight, ArrowUpRight, Check, CircleGauge, Coins, Compass, Crosshair,
  History, LockKeyhole, LogOut, Menu, Radio, Search, ShieldCheck, Sparkles, Target,
  Timer, WalletCards, X, Zap
} from 'lucide-react';
import type { EarnItem, LedgerEntry, PlatformConfig, User, Wallet, Withdrawal } from '../lib/types';
import { api } from '../lib/api';
import { points, usdFromPoints } from '../lib/format';
import './golden.css';

type Scene = 'deck' | 'field' | 'vault' | 'chronicle' | 'settlement';

type Props = {
  user: User;
  wallet: Wallet;
  config: PlatformConfig;
  offers: EarnItem[];
  ledger: LedgerEntry[];
  withdrawals: Withdrawal[];
  providerConfigured: boolean;
  onRefresh: () => void;
  onLogout: () => void;
};

const sceneDefs: Record<Scene, { label: string; caption: string; environment: string }> = {
  deck: { label: 'Command Deck', caption: 'La estación está despierta.', environment: '/kivora/final/station-wide.webp' },
  field: { label: 'Opportunity Field', caption: 'Las señales están esperando.', environment: '/kivora/final/station-panorama.webp' },
  vault: { label: 'Kivora Vault', caption: 'Tu valor, seguro y disponible.', environment: '/kivora/final/core-environment.webp' },
  chronicle: { label: 'Chronicle', caption: 'La memoria de tu trayectoria.', environment: '/kivora/final/station-wide.webp' },
  settlement: { label: 'Settlement Terminal', caption: 'Convierte el valor en libertad.', environment: '/kivora/final/station-panorama.webp' },
};

function efficiency(item: EarnItem) {
  const minutes = Math.max(1, (item.durationSeconds ?? 300) / 60);
  return Math.round(item.reward / minutes);
}

function duration(seconds?: number) {
  if (!seconds) return '—';
  return `${Math.max(1, Math.round(seconds / 60))} min`;
}

function percent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function KivoraFinalWorld({ user, wallet, config, offers, ledger, withdrawals, providerConfigured, onRefresh, onLogout }: Props) {
  const [scene, setScene] = useState<Scene>('deck');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EarnItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const filteredOffers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = offers.filter(item => !item.blocked).sort((a, b) => efficiency(b) - efficiency(a));
    return q ? list.filter(item => `${item.title} ${item.category} ${item.source}`.toLowerCase().includes(q)) : list;
  }, [offers, query]);

  const recommended = filteredOffers[0];
  const dailyTarget = filteredOffers.slice(0, 3).reduce((sum, item) => sum + item.reward, 0);
  const today = new Date().toLocaleDateString('en-CA');
  const todayRewards = ledger.filter(item => item.pointsDelta > 0 && new Date(item.createdAt).toLocaleDateString('en-CA') === today);
  const runPercent = filteredOffers.length ? percent((Math.min(3, todayRewards.length) / 3) * 100) : 0;
  const efficiencyScore = filteredOffers.length ? percent(filteredOffers.slice(0, 5).reduce((sum, item) => sum + efficiency(item), 0) / Math.min(5, filteredOffers.length)) : 0;

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4200);
  };

  const openScene = (next: Scene) => {
    setScene(next);
    setSelected(null);
    setMenuOpen(false);
  };

  const submitWithdrawal = async () => {
    const target = destination.trim();
    if (!target) return notify('Introduce una dirección USDT TRC20.');
    if (wallet.availablePoints < config.withdrawalMinPoints) return notify(`Necesitas ${points(config.withdrawalMinPoints)} KP para iniciar el settlement.`);
    setBusy(true);
    try {
      await api.withdraw({ amountPoints: config.withdrawalMinPoints, asset: 'USDT', network: 'TRC20', destination: target });
      notify('Settlement solicitado. Los fondos quedan reservados para revisión manual.');
      onRefresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo crear el settlement.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="kg-world">
      <div className="kg-world-image" style={{ backgroundImage: `url(${sceneDefs[scene].environment})` }} />
      <div className="kg-world-light" />
      <header className="kg-bar">
        <button className="kg-brand" onClick={() => openScene('deck')} aria-label="Kivora Command Deck">
          <img src="/kivora/ui/kivora-sigil.svg" alt="" />
          <span><b>KIVORA</b><small>PLAY · EARN · GROW</small></span>
        </button>
        <div className="kg-status"><i />{providerConfigured ? 'REWARD ENGINE ONLINE' : 'STATION READY · PROVIDER NOT CONFIGURED'}</div>
        <div className="kg-actions">
          <div className="kg-balance"><span>AVAILABLE</span><strong>{points(wallet.availablePoints)} KP</strong></div>
          <button className="kg-menu" onClick={() => setMenuOpen(v => !v)} aria-label="Navigation"><Menu size={18} /></button>
          <button className="kg-avatar" onClick={onLogout} title="Cerrar sesión">{user.username.slice(0, 2).toUpperCase()}</button>
        </div>
      </header>

      <div className={`kg-layout ${menuOpen ? 'kg-open' : ''}`}>
        <aside className="kg-rail">
          <div className="kg-rail-orbit"><span /><span /></div>
          <nav>
            <NavButton active={scene === 'deck'} icon={<Compass size={17} />} label="DECK" onClick={() => openScene('deck')} />
            <NavButton active={scene === 'field'} icon={<Crosshair size={17} />} label="FIELD" onClick={() => openScene('field')} />
            <NavButton active={scene === 'vault'} icon={<LockKeyhole size={17} />} label="VAULT" onClick={() => openScene('vault')} />
            <NavButton active={scene === 'chronicle'} icon={<History size={17} />} label="CHRONICLE" onClick={() => openScene('chronicle')} />
            <NavButton active={scene === 'settlement'} icon={<Coins size={17} />} label="SETTLEMENT" onClick={() => openScene('settlement')} />
          </nav>
          <NavButton icon={<LogOut size={16} />} label="EXIT" onClick={onLogout} />
        </aside>

        <main className="kg-stage">
          <div className="kg-chrome">
            <div><span>{sceneDefs[scene].label.toUpperCase()}</span><h1>{sceneDefs[scene].caption}</h1></div>
            <div className="kg-stats"><span><CircleGauge size={13} /> {efficiencyScore}% EFICIENCIA</span><span><Zap size={13} /> {runPercent}% RUN</span><span><Activity size={13} /> {offers.length} SEÑALES</span></div>
          </div>

          {scene === 'deck' && <DeckScene user={user} wallet={wallet} config={config} recommended={recommended} dailyTarget={dailyTarget} runPercent={runPercent} onField={() => openScene('field')} onVault={() => openScene('vault')} />}
          {scene === 'field' && <FieldScene offers={filteredOffers} selected={selected} query={query} setQuery={setQuery} setSelected={setSelected} onDeck={() => openScene('deck')} />}
          {scene === 'vault' && <VaultScene wallet={wallet} config={config} withdrawals={withdrawals} onSettlement={() => openScene('settlement')} />}
          {scene === 'chronicle' && <ChronicleScene ledger={ledger} />}
          {scene === 'settlement' && <SettlementScene wallet={wallet} config={config} destination={destination} setDestination={setDestination} onSubmit={submitWithdrawal} busy={busy} notice={notice} />}
        </main>
      </div>

      <nav className="kg-mobile-nav" aria-label="Kivora spaces">
        {[
          ['deck', <Compass size={16} />, 'DECK'], ['field', <Crosshair size={16} />, 'FIELD'], ['vault', <LockKeyhole size={16} />, 'VAULT'],
          ['chronicle', <History size={16} />, 'CHRONICLE'], ['settlement', <Coins size={16} />, 'SETTLEMENT']
        ].map(([key, icon, label]) => <button key={String(key)} className={scene === key ? 'active' : ''} onClick={() => openScene(key as Scene)}>{icon}<span>{label}</span></button>)}
      </nav>
      {notice && <div className="kg-toast"><Sparkles size={15} />{notice}</div>}
    </div>
  );
}

function NavButton({ active, icon, label, onClick }: { active?: boolean; icon: ReactNode; label: string; onClick: () => void }) {
  return <button className={`kg-nav-btn ${active ? 'active' : ''}`} onClick={onClick}><span>{icon}</span><small>{label}</small></button>;
}

function DeckScene({ user, wallet, config, recommended, dailyTarget, runPercent, onField, onVault }: { user: User; wallet: Wallet; config: PlatformConfig; recommended?: EarnItem; dailyTarget: number; runPercent: number; onField: () => void; onVault: () => void }) {
  const usd = usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay);
  return <section className="kg-scene kg-deck">
    <div className="kg-stage-scene">
      <div className="kg-engine">
        <div className="kg-ring a" /><div className="kg-ring b" />
        <img src="/kivora/ui/kivora-core.svg" alt="Kivora Engine" />
        <div className="kg-readout"><span>KIVORA ENGINE</span><b>{points(wallet.availablePoints)}</b><span>≈ ${usd.toFixed(2)} · AVAILABLE VALUE</span></div>
      </div>
      <div className="kg-console">
        <div className="kg-block"><span>OPERATOR</span><b>{user.username}</b><p>{user.role === 'admin' ? 'Operator access' : 'Explorer profile'}</p></div>
        <div className="kg-block"><span>DAILY RUN</span><b>{Math.min(3, Math.round(runPercent / 34))} / 3</b><div className="kg-progress"><i style={{ width: `${runPercent}%` }} /></div><p>Una sesión corta para explorar y volver mañana.</p></div>
        <div className="kg-block"><span>RECOMMENDED SIGNAL</span><b>{recommended ? `${recommended.category} · +${points(recommended.reward)} KP` : 'STATION READY'}</b><p>{recommended ? `${duration(recommended.durationSeconds)} · ${efficiency(recommended)} KP/min · provider verification.` : 'El proveedor aún no está configurado. La estación está preparada.'}</p><button className="kg-cta" onClick={onField}>ENTER THE FIELD <ArrowRight size={14} /></button></div>
        <div className="kg-mini-grid"><div><span>PENDING</span><b>{points(wallet.pendingPoints)}</b></div><div><span>WITHDRAWN</span><b>{points(wallet.lifetimeWithdrawnPoints)}</b></div><div><span>DAILY POTENTIAL</span><b>{points(dailyTarget)}</b></div></div>
        <button className="kg-cta" onClick={onVault}><WalletCards size={14} /> OPEN VAULT <ArrowUpRight size={14} /></button>
      </div>
    </div>
    <div className="kg-footer"><span><ShieldCheck size={13} /> LEDGER CONTROLLED</span><span><Coins size={13} /> 1,000 KP = $1 REFERENCE</span><span><Target size={13} /> 10,000 KP MINIMUM</span></div>
  </section>;
}

function FieldScene({ offers, selected, query, setQuery, setSelected, onDeck }: { offers: EarnItem[]; selected: EarnItem | null; query: string; setQuery: (v: string) => void; setSelected: (item: EarnItem | null) => void; onDeck: () => void }) {
  const positions = [[18, 28], [38, 44], [56, 24], [72, 46], [27, 70], [54, 69], [80, 27], [78, 72]];
  return <section className="kg-scene kg-field"><button className="kg-back" onClick={onDeck}>← COMMAND DECK</button><div className="kg-field-tools"><div><Search size={14} /><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Buscar una señal" /></div><span>{offers.length} disponibles</span></div><div className="kg-field-plane">{offers.slice(0, 8).map((item, index) => { const [left, top] = positions[index % positions.length]; return <button key={item.id} className={`kg-signal ${selected?.id === item.id ? 'selected' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => setSelected(item)}><i /><b>+{points(item.reward)}</b><small>{duration(item.durationSeconds)}</small></button>; })}</div>{selected ? <div className="kg-detail"><div><span>SIGNAL LOCK</span><button onClick={() => setSelected(null)}><X size={14} /></button></div><h2>{selected.title}</h2><p>{selected.description}</p><strong>+{points(selected.reward)} KP · {duration(selected.durationSeconds)} · {efficiency(selected)} KP/min</strong><button className="kg-cta" onClick={() => window.open(selected.url, '_blank', 'noopener,noreferrer')}>OPEN SIGNAL <ArrowRight size={14} /></button></div> : <div className="kg-field-hint"><Sparkles size={15} /> Selecciona una señal para entrar en su ruta.</div>}</section>;
}

function VaultScene({ wallet, config, withdrawals, onSettlement }: { wallet: Wallet; config: PlatformConfig; withdrawals: Withdrawal[]; onSettlement: () => void }) {
  const usd = usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay);
  const reserved = withdrawals.filter(w => ['pending', 'approved'].includes(w.status)).reduce((sum, w) => sum + w.amountPoints, 0);
  return <section className="kg-scene kg-vault"><div className="kg-vault-core"><div className="kg-ring a" /><div className="kg-ring b" /><img src="/kivora/ui/kivora-core.svg" alt="Vault" /><span>VAULT</span></div><div className="kg-vault-info"><span>KIVORA VAULT</span><h2>{points(wallet.availablePoints)} <small>KP</small></h2><p>≈ ${usd.toFixed(2)} de referencia · disponible para settlement.</p><div className="kg-mini-grid"><div><span>AVAILABLE</span><b>{points(wallet.availablePoints)}</b></div><div><span>PENDING</span><b>{points(wallet.pendingPoints)}</b></div><div><span>RESERVED</span><b>{points(reserved)}</b></div></div><button className="kg-cta" onClick={onSettlement}>OPEN SETTLEMENT <ArrowRight size={14} /></button></div></section>;
}

function ChronicleScene({ ledger }: { ledger: LedgerEntry[] }) {
  return <section className="kg-scene kg-chronicle"><div className="kg-chronicle-head"><span>MEMORY OF THE STATION</span><h2>Tu trayectoria queda registrada.</h2><p>Cada señal confirmada, recompensa, reserva y settlement deja una marca.</p></div><div className="kg-timeline">{ledger.slice(0, 12).length ? ledger.slice(0, 12).map((item, index) => <div className="kg-event" key={`${item.id}-${index}`}><i /><div><small>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small><b>{item.type}</b><span>{item.source || 'Kivora ledger'}</span></div><strong className={item.pointsDelta < 0 ? 'negative' : ''}>{item.pointsDelta > 0 ? '+' : ''}{points(item.pointsDelta)} KP</strong></div>) : <div className="kg-empty"><History size={22} />Aún no hay eventos en tu Chronicle.</div>}</div></section>;
}

function SettlementScene({ wallet, config, destination, setDestination, onSubmit, busy, notice }: { wallet: Wallet; config: PlatformConfig; destination: string; setDestination: (v: string) => void; onSubmit: () => void; busy: boolean; notice: string }) {
  return <section className="kg-scene kg-settlement"><div className="kg-terminal"><div className="kg-terminal-ring" /><img src="/kivora/ui/settlement-beacon.svg" alt="Settlement" /><span>USDT · TRC20</span></div><div className="kg-settle-panel"><span>SETTLEMENT TERMINAL</span><h2>{points(config.withdrawalMinPoints)} KP <small>≈ ${usdFromPoints(config.withdrawalMinPoints, config.pointsPerUsdDisplay).toFixed(2)}</small></h2><p>Rail inicial único: USDT sobre TRC20. Solicitud manual, revisión y TX hash antes de marcarla pagada.</p><div className="kg-stepper"><b>1</b><i /><b>2</b><i /><b>3</b><i /><b>4</b><i /><b>5</b></div><div className="kg-step-labels"><span>REQUEST</span><span>RESERVE</span><span>VERIFY</span><span>BROADCAST</span><span>PAID</span></div><label><span>USDT · TRC20 DESTINATION</span><input value={destination} onChange={e => setDestination(e.target.value)} placeholder="T..." autoComplete="off" /></label><button className="kg-cta" disabled={busy || wallet.availablePoints < config.withdrawalMinPoints} onClick={onSubmit}>{busy ? <><Timer size={14} /> RESERVING…</> : <><ArrowRight size={14} /> REQUEST SETTLEMENT</>}</button>{notice && <div className="kg-inline"><Check size={14} />{notice}</div>}</div></section>;
}

export function KivoraLanding({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  return <div className="kg-landing"><div className="kg-landing-bg" /><header className="kg-landing-bar"><button className="kg-brand" onClick={onLogin}><img src="/kivora/ui/kivora-sigil.svg" alt="" /><span><b>KIVORA</b><small>PLAY · EARN · GROW</small></span></button><div className="kg-landing-actions"><button onClick={onLogin}>LOG IN</button><button className="kg-cta" onClick={onRegister}>ENTER THE STATION <ArrowRight size={14} /></button></div></header><main className="kg-landing-main"><section><span>LIVING REWARD STATION</span><h1>Tu atención<br /><em>tiene valor.</em></h1><p>Kivora convierte tu tiempo y tus acciones en un recorrido de oportunidades verificadas. Entra, explora, completa y guarda tus recompensas.</p><div><button className="kg-cta" onClick={onRegister}>ENTER THE STATION <ArrowRight size={15} /></button><button onClick={onLogin}>YA TENGO CUENTA</button></div></section><div className="kg-landing-engine"><div className="kg-ring a" /><div className="kg-ring b" /><img src="/kivora/ui/kivora-core.svg" alt="Kivora Engine" /></div></main></div>;
}
