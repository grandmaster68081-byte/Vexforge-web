import { ArrowDownLeft, History, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';
import type { LedgerEntry } from '../lib/types';
import { points, shortDate } from '../lib/format';
import { ChronicleRail } from '../kivora-v4';

function iconFor(type: string) {
  if (type === 'reward') return <PlusCircle size={15} />;
  if (type === 'withdrawal') return <ArrowDownLeft size={15} />;
  if (type === 'withdrawal_reversal') return <RotateCcw size={15} />;
  return <MinusCircle size={15} />;
}

function toneFor(entry: LedgerEntry): 'cyan' | 'lime' | 'violet' | 'gold' {
  if (entry.type === 'withdrawal') return 'violet';
  if (entry.type === 'withdrawal_reversal') return 'gold';
  if (entry.status === 'pending') return 'gold';
  return entry.pointsDelta >= 0 ? 'lime' : 'cyan';
}

export function ActivityPage({ ledger }: { ledger: LedgerEntry[] }) {
  const events = ledger.slice(0, 8).map((entry) => ({ time: shortDate(entry.createdAt), title: entry.source, detail: `${entry.pointsDelta >= 0 ? '+' : ''}${points(entry.pointsDelta)} KP · ${entry.status}`, tone: toneFor(entry) }));
  return (
    <div className="page-stack scene-page v4-chronicle-page">
      <section className="scene-page-heading"><div><span className="scene-eyebrow"><History size={12} /> CHRONICLE · EVENT RAIL</span><h1>Your earning evidence.</h1><p>A readable audit trail of rewards, reservations, reversals and adjustments. The station remembers every movement.</p></div><div className="scene-readonly">LEDGER · READ-ONLY VIEW</div></section>
      <section className="scene-panel chronicle-hero-panel"><div className="chronicle-summary"><span className="scene-eyebrow">ACCOUNT LEDGER</span><strong>{ledger.length}</strong><span>recorded events</span></div><div className="scene-copy"><h2>Separate activity from cash.</h2><p>Reward entries become available only after provider evidence. Withdrawal entries reserve points before any manual USDT/TRC20 payout is sent.</p></div></section>
      <section className="scene-panel chronicle-rail-panel"><div className="scene-section-heading"><div><span className="scene-eyebrow">EVENT STREAM</span><h2>Recent transitions</h2></div><span className="scene-readonly">SOURCE DATA</span></div>{events.length ? <ChronicleRail events={events} /> : <div className="scene-empty"><History size={24} /><h3>No ledger events yet</h3><span>Complete a verified opportunity and the chronicle will begin filling automatically.</span></div>}</section>
      <section className="table-card scene-ledger-table"><div className="table-scroll"><table><thead><tr><th>Time</th><th>Event</th><th>Reference</th><th>Change</th><th>Status</th></tr></thead><tbody>{ledger.map((entry) => <tr key={`table-${entry.id}`}><td>{shortDate(entry.createdAt)}</td><td><span className="activity-type">{iconFor(entry.type)} {entry.source}</span></td><td><code>{entry.referenceId ?? '—'}</code></td><td className={entry.pointsDelta >= 0 ? 'positive' : 'negative'}>{entry.pointsDelta >= 0 ? '+' : ''}{points(entry.pointsDelta)} KP</td><td><span className={`status ${entry.status}`}>{entry.status}</span></td></tr>)}{!ledger.length && <tr><td colSpan={5} className="table-empty">No events recorded yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
}