import { ArrowRight, CheckCircle2, ChevronRight, Clock3, Flame, Gift, ShieldCheck, Sparkles, Target, WalletCards, Zap } from 'lucide-react';
import type { EarnItem, LedgerEntry, PlatformConfig, User, Wallet } from '../lib/types';
import { points, shortDate, usdFromPoints } from '../lib/format';
import { KivoraCore, OpportunityGate } from '../kivora-v4';

function metrics(entries: LedgerEntry[]) {
  const today = new Date();
  const todayEntries = entries.filter((entry) => new Date(entry.createdAt).toDateString() === today.toDateString());
  const days = new Set(entries.filter((entry) => entry.type === 'reward' && entry.pointsDelta > 0).map((entry) => new Date(entry.createdAt).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date(today);
  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (!days.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    streak,
    todayRewards: todayEntries.filter((entry) => entry.type === 'reward' && entry.pointsDelta > 0).length,
    todayPoints: todayEntries.filter((entry) => entry.type === 'reward' && entry.pointsDelta > 0).reduce((sum, entry) => sum + entry.pointsDelta, 0),
  };
}

function level(pointsEarned: number) {
  const levels = [0, 1000, 5000, 15000, 40000, 100000];
  let index = 0;
  for (let i = 0; i < levels.length; i += 1) if (pointsEarned >= levels[i]) index = i;
  const current = levels[index];
  const next = levels[index + 1] ?? current;
  return {
    name: ['Newcomer', 'Spark', 'Momentum', 'Orbit', 'Pulse', 'Nova'][index],
    next,
    progress: next === current ? 100 : Math.min(100, ((pointsEarned - current) / (next - current)) * 100),
  };
}

const laneNames = ['QUICK', 'CORE', 'HIGH YIELD'];
const fieldArt = ['/assets/kivora-v4/opportunity_field.webp', '/assets/kivora-v4/opportunity_field_scene.webp', '/assets/kivora-v4/reward_flow.webp'];

export function OverviewPage({ user, wallet, offers, config, entries, onNavigate }: { user: User; wallet: Wallet; offers: EarnItem[]; config: PlatformConfig; entries: LedgerEntry[]; onNavigate: (p: string) => void }) {
  const m = metrics(entries);
  const l = level(wallet.lifetimeEarnedPoints);
  const opportunities = [...offers].sort((a, b) => b.reward - a.reward).slice(0, 3);
  const recent = entries.slice(0, 4);

  return (
    <div className="page-stack scene-page command-deck">
      <section className="scene-hero command-hero">
        <div className="scene-hero-copy">
          <span className="scene-eyebrow"><Sparkles size={12} /> COMMAND DECK · DAILY RUN</span>
          <h1>Keep the signal. <em>Choose your move.</em></h1>
          <p>Kivora is your operating station for verified opportunities. Read the signal, enter a gate, and let provider evidence move value into the ledger.</p>
          <div className="scene-actions">
            <button className="primary-button" onClick={() => onNavigate('/earn')}>Enter Opportunity Field <ArrowRight size={16} /></button>
            <button className="secondary-button" onClick={() => onNavigate('/wallet')}>Open Vault <WalletCards size={15} /></button>
          </div>
          <div className="scene-proof"><span><CheckCircle2 size={13} /> Provider verification first</span><span><ShieldCheck size={13} /> Manual USDT/TRC20 settlement</span></div>
          <div className="command-run-card command-run-card-inline">
            <div className="scene-card-top"><span>TODAY'S RUN</span><span className="scene-live-dot" />{m.todayRewards} / 3 complete</div>
            <strong className="run-score">{m.todayRewards}<small>/3</small></strong>
            <p>A focused session, not a promise of earnings.</p>
            <div className="scene-progress"><i style={{ width: `${Math.min(100, (m.todayRewards / 3) * 100)}%` }} /></div>
            <div className="run-metrics"><div><small>STREAK</small><strong>{m.streak} day{m.streak === 1 ? '' : 's'}</strong></div><div><small>KP TODAY</small><strong>{points(m.todayPoints)}</strong></div><div><small>LIVE INVENTORY</small><strong>{offers.length}</strong></div></div>
          </div>
        </div>
        <div className="command-core-stage">
          <KivoraCore availablePoints={wallet.availablePoints} />
          <div className="command-core-caption"><span>CORE READOUT</span><strong>{points(wallet.availablePoints)} KP AVAILABLE</strong></div>
        </div>
      </section>

      <section className="scene-panel opportunity-field-panel">
        <div className="scene-section-heading"><div><span className="scene-eyebrow"><Target size={12} /> OPPORTUNITY FIELD</span><h2>Signals ready for entry.</h2><p>Current provider inventory is routed into distinct station lanes. The reward stays visible before you begin.</p></div><button className="text-button" onClick={() => onNavigate('/earn')}>See all opportunities <ChevronRight size={15} /></button></div>
        <div className="opportunity-lanes">
          {opportunities.map((offer, index) => (
            <OpportunityGate
              key={`${offer.category}-${offer.id}`}
              title={offer.title}
              category={`${laneNames[index] ?? 'LIVE'} · ${offer.category}`}
              rewardPoints={offer.reward}
              imageUrl={offer.image || fieldArt[index % fieldArt.length]}
              meta={offer.durationSeconds ? `${Math.ceil(offer.durationSeconds / 60)} min · ${offer.source}` : `${offer.source} · requirements visible inside`}
              accent={index === 0 ? 'cyan' : index === 1 ? 'violet' : 'gold'}
              onOpen={() => onNavigate('/earn')}
            />
          ))}
          {!opportunities.length && <div className="scene-empty"><Gift size={22} /><strong>Provider inventory is not available yet.</strong><span>Live opportunities will appear here when eligible campaigns return.</span></div>}
        </div>
      </section>

      <section className="scene-split-grid">
        <div className="scene-panel vault-snapshot">
          <div className="scene-section-heading"><div><span className="scene-eyebrow"><WalletCards size={12} /> VAULT</span><h2>{points(wallet.availablePoints)} KP</h2><p>${usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay).toFixed(2)} display reference · internal ledger</p></div><button className="text-button" onClick={() => onNavigate('/wallet')}>Open vault <ChevronRight size={15} /></button></div>
          <div className="vault-stats"><div><small>AVAILABLE</small><strong>{points(wallet.availablePoints)}</strong></div><div><small>PENDING</small><strong>{points(wallet.pendingPoints)}</strong></div><div><small>RESERVED</small><strong>{points(wallet.withdrawalReservedPoints)}</strong></div><div><small>NEXT LEVEL</small><strong>{l.next ? points(l.next) : 'MAX'}</strong></div></div>
          <div className="scene-progress"><i style={{ width: `${l.progress}%` }} /></div>
          <small className="progress-note">{l.name} · {l.next ? `${points(Math.max(0, l.next - wallet.lifetimeEarnedPoints))} KP to next level` : 'Top tier reached'}</small>
        </div>
        <div className="scene-panel chronicle-snapshot">
          <div className="scene-section-heading"><div><span className="scene-eyebrow"><Clock3 size={12} /> CHRONICLE</span><h2>Evidence arriving.</h2></div><button className="text-button" onClick={() => onNavigate('/activity')}>Open chronicle <ChevronRight size={15} /></button></div>
          <div className="scene-timeline">
            {recent.length ? recent.map((entry) => <div className="scene-event" key={entry.id}><span className={`event-marker ${entry.pointsDelta >= 0 ? 'positive' : 'negative'}`}>{entry.pointsDelta >= 0 ? '+' : '−'}</span><div><strong>{entry.source}</strong><span>{shortDate(entry.createdAt)} · {entry.status}</span></div><b className={entry.pointsDelta >= 0 ? 'positive' : 'negative'}>{entry.pointsDelta >= 0 ? '+' : ''}{points(entry.pointsDelta)}</b></div>) : <div className="scene-empty compact"><Clock3 size={18} /><span>Your verified activity will appear here.</span></div>}
          </div>
        </div>
      </section>

      <section className="scene-trust-grid"><div><Zap size={16} /><strong>Reward integrity</strong><span>Credits arrive after provider verification.</span></div><div><ShieldCheck size={16} /><strong>Settlement boundary</strong><span>USDT is sent only after manual review.</span></div><div><Flame size={16} /><strong>Daily rhythm</strong><span>Progress signals do not promise bonus payouts.</span></div></section>
      <span className="sr-only">{user.username}</span>
    </div>
  );
}