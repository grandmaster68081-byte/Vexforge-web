import { useMemo, useState } from 'react';
import type { ChangeEvent, CSSProperties } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  Activity, ArrowDownRight, ArrowRight, ArrowUpRight, Bell, Check, ChevronLeft, Circle,
  CircleGauge, Coins, Compass, Crosshair, History, LockKeyhole, LogOut, Menu, Radio,
  Search, ShieldCheck, Sparkles, Target, Timer, WalletCards, X, Zap
} from 'lucide-react';
import type { EarnItem, LedgerEntry, PlatformConfig, User, Wallet, Withdrawal } from '../lib/types';
import { api } from '../lib/api';
import { points, usdFromPoints } from '../lib/format';

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

type SceneDef = { label: string; caption: string; icon: LucideIcon; accent: string; environment: string };

const sceneDefs: Record<Scene, SceneDef> = {
  deck: { label: 'Command Deck', caption: 'La estación está despierta.', icon: Compass, accent: '#6cf4ff', environment: '/kivora/identity/engine-environment.webp' },
  field: { label: 'Opportunity Field', caption: 'Las señales están esperando.', icon: Crosshair, accent: '#a97cff', environment: '/kivora/identity/field-environment.webp' },
  vault: { label: 'Kivora Vault', caption: 'Tu valor, seguro y disponible.', icon: LockKeyhole, accent: '#ffbf62', environment: '/kivora/identity/vault-environment.webp' },
  chronicle: { label: 'Chronicle', caption: 'La memoria de tu trayectoria.', icon: History, accent: '#74ffca', environment: '/kivora/identity/chronicle-environment.webp' },
  settlement: { label: 'Settlement Terminal', caption: 'Convierte el valor en libertad.', icon: Coins, accent: '#ffb65a', environment: '/kivora/identity/settlement-environment.webp' }
};

function efficiency(item: EarnItem) {
  const minutes = Math.max(1, (item.durationSeconds ?? 300) / 60);
  return Math.round(item.reward / minutes);
}

function formatDuration(seconds?: number) {
  if (!seconds) return '—';
  const minutes = Math.max(1, Math.round(seconds / 60));
  return `${minutes} min`;
}

function clampPercent(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function KivoraFinalWorld({ user, wallet, config, offers, ledger, withdrawals, providerConfigured, onRefresh, onLogout }: Props) {
  const [scene, setScene] = useState<Scene>('deck');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<EarnItem | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const sortedOffers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const list = offers
      .filter(item => !item.blocked)
      .sort((a, b) => efficiency(b) - efficiency(a));
    if (!normalizedQuery) return list;
    return list.filter(item => `${item.title} ${item.category} ${item.source}`.toLowerCase().includes(normalizedQuery));
  }, [offers, query]);

  const recommended = sortedOffers[0];
  const dailyTarget = sortedOffers.slice(0, 3).reduce((sum, item) => sum + item.reward, 0);
  const todayKey = new Date().toLocaleDateString('en-CA');
  const todayPositiveRewards = ledger.filter(item => item.pointsDelta > 0 && new Date(item.createdAt).toLocaleDateString('en-CA') === todayKey);
  const completion = sortedOffers.length ? clampPercent((Math.min(3, todayPositiveRewards.length) / 3) * 100) : 0;
  const efficiencyScore = sortedOffers.length ? clampPercent(sortedOffers.slice(0, 5).reduce((sum, item) => sum + efficiency(item), 0) / Math.max(1, Math.min(5, sortedOffers.length))) : 0;

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 4200);
  };

  const submitWithdrawal = async () => {
    const trimmed = destination.trim();
    if (!trimmed) return notify('Introduce una dirección USDT TRC20.');
    if (wallet.availablePoints < config.withdrawalMinPoints) return notify(`Necesitas ${points(config.withdrawalMinPoints)} KP para iniciar el settlement.`);
    setWithdrawBusy(true);
    try {
      await api.withdraw({ amountPoints: config.withdrawalMinPoints, asset: 'USDT', network: 'TRC20', destination: trimmed });
      notify('Settlement solicitado. Los fondos quedan reservados para revisión manual.');
      onRefresh();
    } catch (error) {
      notify(error instanceof Error ? error.message : 'No se pudo crear el settlement.');
    } finally {
      setWithdrawBusy(false);
    }
  };

  return (
    <div className="kv5-world" style={{ '--scene-accent': sceneDefs[scene].accent } as CSSProperties}>
      <div className="kv5-environment" style={{ backgroundImage: `url(${sceneDefs[scene].environment})` }} />
      <div className="kv5-vignette" />
      <div className="kv5-stars" aria-hidden="true" />
      <div className="kv5-scanline" aria-hidden="true" />

      <header className="kv5-topbar">
        <button className="kv5-brand" onClick={() => setScene('deck')} aria-label="Kivora Command Deck">
          <img src="/kivora/ui/kivora-sigil.svg" alt="" />
          <span><b>KIVORA</b><small>PLAY · EARN · GROW</small></span>
        </button>
        <div className={`kv5-provider ${providerConfigured ? 'is-live' : 'is-idle'}`}>
          <span className="kv5-led" />
          {providerConfigured ? 'REWARD ENGINE ONLINE' : 'STATION READY · PROVIDER NOT CONFIGURED'}
        </div>
        <div className="kv5-top-actions">
          <div className="kv5-balance-pill"><span>AVAILABLE</span><b>{points(wallet.availablePoints)}</b><small>KP</small></div>
          <button className="kv5-icon" onClick={() => setMenuOpen(!menuOpen)} aria-label="Navigation"><Menu size={18}/></button>
          <button className="kv5-avatar" onClick={onLogout} title="Cerrar sesión">{user.username.slice(0, 2).toUpperCase()}</button>
        </div>
      </header>

      <div className={`kv5-frame ${menuOpen ? 'nav-open' : ''}`}>
        <aside className="kv5-rail">
          <div className="kv5-rail-core" aria-hidden="true">
            <span />
            <span />
          </div>
          <nav>
            {(Object.keys(sceneDefs) as Scene[]).map(key => {
              const def = sceneDefs[key];
              const Icon = def.icon;
              return (
                <button key={key} className={`kv5-rail-btn ${scene === key ? 'active' : ''}`} onClick={() => { setScene(key); setSelected(null); setMenuOpen(false); }}>
                  <span className="kv5-rail-icon"><Icon size={17}/></span>
                  <small>{def.label}</small>
                </button>
              );
            })}
          </nav>
          <div className="kv5-rail-bottom">
            <button className="kv5-rail-btn" onClick={onLogout}><span className="kv5-rail-icon"><LogOut size={16}/></span><small>Salir</small></button>
          </div>
        </aside>

        <main className="kv5-stage">
          <div className="kv5-context">
            <div>
              <span className="kv5-kicker">{sceneDefs[scene].label.toUpperCase()}</span>
              <h1>{sceneDefs[scene].caption}</h1>
            </div>
            <div className="kv5-context-stats">
              <span><CircleGauge size={14}/> {efficiencyScore}% eficiencia</span>
              <span><Zap size={14}/> {completion}% run</span>
              <span><Activity size={14}/> {offers.length} señales</span>
            </div>
          </div>

          {scene === 'deck' && <DeckScene user={user} wallet={wallet} config={config} recommended={recommended} dailyTarget={dailyTarget} completion={completion} onField={() => setScene('field')} onVault={() => setScene('vault')} />}
          {scene === 'field' && <FieldScene offers={sortedOffers} selected={selected} query={query} setQuery={setQuery} setSelected={setSelected} onDeck={() => setScene('deck')} />}
          {scene === 'vault' && <VaultScene wallet={wallet} config={config} withdrawals={withdrawals} onSettlement={() => setScene('settlement')} />}
          {scene === 'chronicle' && <ChronicleScene ledger={ledger} />}
          {scene === 'settlement' && <SettlementScene wallet={wallet} config={config} destination={destination} setDestination={setDestination} onSubmit={submitWithdrawal} busy={withdrawBusy} notice={notice} />}
        </main>
      </div>

      <nav className="kv5-mobile-nav" aria-label="Kivora spaces">
        {(Object.keys(sceneDefs) as Scene[]).map(key => {
          const Icon = sceneDefs[key].icon;
          return <button key={key} className={scene === key ? 'active' : ''} onClick={() => setScene(key)}><Icon size={16}/><span>{sceneDefs[key].label.replace('Opportunity ', '').replace('Kivora ', '')}</span></button>;
        })}
      </nav>

      {notice && <div className="kv5-toast"><Sparkles size={16}/>{notice}</div>}
    </div>
  );
}

function DeckScene({ user, wallet, config, recommended, dailyTarget, completion, onField, onVault }: { user: User; wallet: Wallet; config: PlatformConfig; recommended?: EarnItem; dailyTarget: number; completion: number; onField: () => void; onVault: () => void }) {
  const usd = usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay);
  return (
    <section className="kv5-scene kv5-deck">
      <div className="kv5-deck-lens" aria-hidden="true" />
      <div className="kv5-engine-pedestal">
        <div className="kv5-engine-ring ring-a" />
        <div className="kv5-engine-ring ring-b" />
        <div className="kv5-engine-ring ring-c" />
        <img src="/kivora/ui/kivora-core.svg" alt="Kivora Engine" />
        <div className="kv5-engine-readout">
          <span>KIVORA ENGINE</span>
          <strong>{points(wallet.availablePoints)}</strong>
          <small>≈ ${usd.toFixed(2)} · AVAILABLE VALUE</small>
        </div>
      </div>

      <aside className="kv5-deck-console">
        <div className="kv5-console-block operator-block">
          <span className="kv5-console-kicker">OPERATOR</span>
          <strong>{user.username}</strong>
          <small>{user.role === 'admin' ? 'Operator access' : 'Explorer profile'}</small>
        </div>
        <div className="kv5-console-block run-block">
          <div className="kv5-console-head"><span>DAILY RUN</span><b>{Math.min(3, Math.round(completion / 34))}/3</b></div>
          <div className="kv5-progress"><span style={{ width: `${completion}%` }}/></div>
          <small>Consigue una sesión corta y vuelve mañana.</small>
        </div>
        <div className="kv5-console-block recommendation">
          <div className="kv5-console-head"><span>RECOMMENDED SIGNAL</span><Radio size={14}/></div>
          {recommended ? (
            <>
              <strong>{recommended.title}</strong>
              <div className="kv5-signal-meta"><b>+{points(recommended.reward)} KP</b><span>{formatDuration(recommended.durationSeconds)}</span><span>{recommended.category}</span></div>
              <button className="kv5-command" onClick={onField}>ENTER FIELD <ArrowRight size={15}/></button>
            </>
          ) : <small>El proveedor aún no está configurado. La estación está preparada.</small>}
        </div>
        <div className="kv5-console-grid">
          <div><span>PENDING</span><b>{points(wallet.pendingPoints)}</b></div>
          <div><span>WITHDRAWN</span><b>{points(wallet.lifetimeWithdrawnPoints)}</b></div>
          <div><span>DAILY POTENTIAL</span><b>{points(dailyTarget)}</b></div>
        </div>
        <button className="kv5-secondary-command" onClick={onVault}><WalletCards size={15}/> OPEN VAULT <ArrowUpRight size={14}/></button>
      </aside>

      <div className="kv5-deck-footer">
        <span><ShieldCheck size={14}/> LEDGER CONTROLLED</span>
        <span><Coins size={14}/> 1,000 KP = $1 reference</span>
        <span><Target size={14}/> 10,000 KP minimum</span>
      </div>
    </section>
  );
}

function FieldScene({ offers, selected, query, setQuery, setSelected, onDeck }: { offers: EarnItem[]; selected: EarnItem | null; query: string; setQuery: (v: string) => void; setSelected: (item: EarnItem | null) => void; onDeck: () => void }) {
  const positions = [[18, 28], [38, 44], [56, 24], [72, 46], [27, 70], [54, 69], [80, 27], [78, 72]];
  return (
    <section className="kv5-scene kv5-field">
      <div className="kv5-field-atmosphere" />
      <button className="kv5-back" onClick={onDeck}><ChevronLeft size={15}/> COMMAND DECK</button>
      <div className="kv5-field-tools">
        <div className="kv5-search"><Search size={15}/><input value={query} onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)} placeholder="Buscar una señal" /></div>
        <span>{offers.length} disponibles</span>
      </div>
      <div className="kv5-field-legend"><span><i className="cyan"/> PTC</span><span><i className="violet"/> Survey</span><span><i className="gold"/> Offer</span><span><i className="green"/> Task</span></div>
      <div className="kv5-field-plane">
        <div className="kv5-grid-plane" aria-hidden="true" />
        {offers.slice(0, 8).map((item, index) => {
          const [left, top] = positions[index % positions.length];
          const color = item.category === 'surveys' ? 'violet' : item.category === 'offers' ? 'gold' : item.category === 'tasks' ? 'green' : 'cyan';
          return (
            <button key={item.id} className={`kv5-signal-node ${color} ${selected?.id === item.id ? 'selected' : ''}`} style={{ left: `${left}%`, top: `${top}%` }} onClick={() => setSelected(item)}>
              <span className="kv5-node-core"><span/></span>
              <b>+{points(item.reward)}</b>
              <small>{formatDuration(item.durationSeconds)}</small>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="kv5-signal-console">
          <div className="kv5-signal-title"><span className="kv5-console-kicker">SIGNAL LOCK</span><button onClick={() => setSelected(null)} aria-label="Close"><X size={15}/></button></div>
          <h2>{selected.title}</h2>
          <p>{selected.description}</p>
          <div className="kv5-signal-stats"><span><b>+{points(selected.reward)} KP</b><small>reward</small></span><span><b>{formatDuration(selected.durationSeconds)}</b><small>estimated</small></span><span><b>{efficiency(selected)} KP/min</b><small>efficiency</small></span></div>
          <button className="kv5-command primary" onClick={() => window.open(selected.url, '_blank', 'noopener,noreferrer')}>OPEN SIGNAL <ArrowRight size={15}/></button>
        </div>
      )}
      {!selected && <div className="kv5-field-empty"><Sparkles size={17}/><span>Selecciona una señal para entrar en su ruta.</span></div>}
    </section>
  );
}

function VaultScene({ wallet, config, withdrawals, onSettlement }: { wallet: Wallet; config: PlatformConfig; withdrawals: Withdrawal[]; onSettlement: () => void }) {
  const usd = usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay);
  return (
    <section className="kv5-scene kv5-vault">
      <div className="kv5-vault-portal"><div className="kv5-vault-ring ring-a"/><div className="kv5-vault-ring ring-b"/><img src="/kivora/ui/kivora-core.svg" alt=""/><span>VAULT</span></div>
      <div className="kv5-vault-readout">
        <span className="kv5-console-kicker">KIVORA VAULT</span>
        <h2>{points(wallet.availablePoints)} <small>KP</small></h2>
        <p>≈ ${usd.toFixed(2)} de referencia · disponible para settlement.</p>
        <div className="kv5-amount-stack">
          <div className="available"><span>AVAILABLE</span><b>{points(wallet.availablePoints)} KP</b></div>
          <div className="pending"><span>PENDING</span><b>{points(wallet.pendingPoints)} KP</b></div>
          <div className="reserved"><span>RESERVED</span><b>{points(withdrawals.filter(w => ['pending','approved'].includes(w.status)).reduce((sum, w) => sum + w.amountPoints, 0))} KP</b></div>
        </div>
        <button className="kv5-command primary" onClick={onSettlement}>OPEN SETTLEMENT <ArrowRight size={15}/></button>
      </div>
      <div className="kv5-vault-foot"><span><LockKeyhole size={14}/> Fondo asegurado por ledger</span><span><Activity size={14}/> {withdrawals.length} movimientos recientes</span></div>
    </section>
  );
}

function ChronicleScene({ ledger }: { ledger: LedgerEntry[] }) {
  const items = ledger.slice(0, 12);
  return (
    <section className="kv5-scene kv5-chronicle">
      <div className="kv5-chronicle-core"><img src="/kivora/ui/chronicle-node.svg" alt=""/></div>
      <div className="kv5-chronicle-head"><span className="kv5-console-kicker">MEMORY OF THE STATION</span><h2>Tu trayectoria queda registrada.</h2><p>Cada señal confirmada, recompensa, reserva y settlement deja una marca.</p></div>
      <div className="kv5-timeline">
        {items.length ? items.map((item, index) => (
          <div key={`${item.id}-${index}`} className="kv5-event">
            <span className="kv5-event-mark"><span/></span>
            <div><span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><b>{item.type}</b><small>{item.source || 'Kivora ledger'}</small></div>
            <strong className={item.pointsDelta < 0 ? 'negative' : ''}>{item.pointsDelta > 0 ? '+' : ''}{points(item.pointsDelta)} KP</strong>
          </div>
        )) : <div className="kv5-empty-state"><History size={24}/><span>Aún no hay eventos en tu Chronicle.</span><small>Tu primer reward aparecerá aquí cuando exista actividad verificada.</small></div>}
      </div>
    </section>
  );
}

function SettlementScene({ wallet, config, destination, setDestination, onSubmit, busy, notice }: { wallet: Wallet; config: PlatformConfig; destination: string; setDestination: (v: string) => void; onSubmit: () => void; busy: boolean; notice: string }) {
  return (
    <section className="kv5-scene kv5-settlement">
      <div className="kv5-terminal-core"><div className="kv5-terminal-ring"/><img src="/kivora/ui/settlement-beacon.svg" alt="Settlement Beacon"/><span>TRC20</span></div>
      <div className="kv5-settlement-panel">
        <span className="kv5-console-kicker">SETTLEMENT TERMINAL</span>
        <h2>{points(config.withdrawalMinPoints)} KP <small>≈ ${usdFromPoints(config.withdrawalMinPoints, config.pointsPerUsdDisplay).toFixed(2)}</small></h2>
        <p>Un rail único para comenzar: USDT sobre TRC20. Solicitud manual, revisión y TX hash antes de marcarla pagada.</p>
        <div className="kv5-stepper"><span className="done">1</span><i/><span>2</span><i/><span>3</span><i/><span>4</span><i/><span>5</span></div>
        <div className="kv5-step-labels"><span>Request</span><span>Reserve</span><span>Verify</span><span>Broadcast</span><span>Paid</span></div>
        <label className="kv5-input"><span>USDT · TRC20 DESTINATION</span><input value={destination} onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)} placeholder="T..." inputMode="text" autoComplete="off" /></label>
        <button className="kv5-command primary" onClick={onSubmit} disabled={busy || wallet.availablePoints < config.withdrawalMinPoints}>{busy ? <><Timer size={15}/> RESERVING…</> : <><ArrowRight size={15}/> REQUEST SETTLEMENT</>}</button>
        {notice && <div className="kv5-inline-notice"><Check size={15}/>{notice}</div>}
      </div>
      <div className="kv5-settlement-foot"><span><ShieldCheck size={14}/> TX hash obligatorio al completar el pago</span><span><Coins size={14}/> Una sola moneda / una sola red</span></div>
    </section>
  );
}

export function KivoraLanding({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [space, setSpace] = useState<Scene>('deck');
  const spaces = (Object.keys(sceneDefs) as Scene[]);
  const landingEnvironment = '/kivora/identity/hero-environment.webp';
  return (
    <div className="kv5-landing">
      <div className="kv5-landing-bg" style={{ backgroundImage: `url(${landingEnvironment})` }} aria-hidden="true" />
      <header className="kv5-landing-nav">
        <div className="kv5-brand"><img src="/kivora/ui/kivora-sigil.svg" alt=""/><span><b>KIVORA</b><small>PLAY · EARN · GROW</small></span></div>
        <nav><button onClick={() => setSpace('deck')}>Station</button><button onClick={() => setSpace('field')}>Opportunities</button><button onClick={() => setSpace('vault')}>Vault</button><button onClick={() => setSpace('chronicle')}>Chronicle</button></nav>
        <div className="kv5-landing-actions"><button className="kv5-quiet" onClick={onLogin}>Log in</button><button className="kv5-command compact" onClick={onRegister}>ENTER THE STATION <ArrowRight size={14}/></button></div>
      </header>

      <main>
        <section className="kv5-landing-hero">
          <div className="kv5-hero-copy">
            <span className="kv5-console-kicker">LIVING REWARD STATION</span>
            <h1>Tu atención<br /><em>tiene valor.</em></h1>
            <p>Kivora convierte tu tiempo y tus acciones en un recorrido de oportunidades verificadas. Entra, explora, completa y guarda tus recompensas.</p>
            <div className="kv5-hero-actions"><button className="kv5-command big" onClick={onRegister}>ENTER THE STATION <ArrowRight size={17}/></button><button className="kv5-quiet" onClick={onLogin}>Ya tengo cuenta</button></div>
            <div className="kv5-hero-proof"><span><Radio size={14}/> OPORTUNIDADES</span><span><ShieldCheck size={14}/> VERIFICACIÓN</span><span><Coins size={14}/> RECOMPENSAS</span><span><LockKeyhole size={14}/> SETTLEMENT</span></div>
          </div>
          <div className="kv5-hero-scene">
            <div className="kv5-hero-ring ring-a"/><div className="kv5-hero-ring ring-b"/>
            <div className="kv5-hero-engine"><img src="/kivora/ui/kivora-core.svg" alt="Kivora Engine"/></div>
            <div className="kv5-hero-readout"><span>STATION STATUS</span><b>READY</b><small>5 spaces · 1 reward loop</small></div>
          </div>
        </section>

        <section className="kv5-space-section">
          <div className="kv5-section-head"><span className="kv5-console-kicker">ONE STATION · FIVE SPACES</span><h2>No es un dashboard. Es tu estación.</h2><p>La navegación y la economía comparten el mismo mundo: cada espacio responde a un estado real del sistema.</p></div>
          <div className="kv5-space-strip">
            {spaces.map(key => { const def = sceneDefs[key]; const Icon = def.icon; return (
              <button key={key} className={`kv5-space-item ${space === key ? 'active' : ''}`} onClick={() => setSpace(key)} style={{ '--space-image': `url(${def.environment})`, '--space-accent': def.accent } as CSSProperties}>
                <div className="kv5-space-image"/><div className="kv5-space-glow"/><Icon size={18}/><b>{def.label}</b><small>{def.caption}</small>
              </button>
            );})}
          </div>
        </section>

        <section className="kv5-loop-section">
          <div className="kv5-loop-graphic">
            <div className="kv5-loop-node first"><span>01</span><b>SIGNAL</b><small>Oportunidad detectada</small></div>
            <div className="kv5-loop-node"><span>02</span><b>VERIFY</b><small>Provider confirma</small></div>
            <div className="kv5-loop-node"><span>03</span><b>REWARD</b><small>El valor llega</small></div>
            <div className="kv5-loop-node"><span>04</span><b>VAULT</b><small>Tu saldo se actualiza</small></div>
            <div className="kv5-loop-node"><span>05</span><b>SETTLE</b><small>USDT · TRC20</small></div>
          </div>
          <div className="kv5-section-head centered"><span className="kv5-console-kicker">THE REWARD LOOP</span><h2>La economía es parte de la experiencia.</h2><p>No añadimos adornos a una lista de ofertas. La interfaz hace visible el recorrido real de una recompensa.</p></div>
        </section>

        <section className="kv5-close-section"><span className="kv5-console-kicker">KIVORA</span><h2>Entra. Explora. Gana.</h2><button className="kv5-command big" onClick={onRegister}>ENTER THE STATION <ArrowRight size={17}/></button></section>
      </main>
    </div>
  );
}
