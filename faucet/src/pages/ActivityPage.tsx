import { ArrowDownLeft, History, MinusCircle, PlusCircle, RotateCcw } from 'lucide-react';
import type { LedgerEntry } from '../lib/types';
import { points, shortDate } from '../lib/format';

function iconFor(type: string) {
  if (type === 'reward') return <PlusCircle size={15} />;
  if (type === 'withdrawal') return <ArrowDownLeft size={15} />;
  if (type === 'withdrawal_reversal') return <RotateCcw size={15} />;
  return <MinusCircle size={15} />;
}

export function ActivityPage({ ledger }: { ledger: LedgerEntry[] }) {
  return (
    <div className="page-stack scene-page chronicle-page">
      <section className="scene-page-heading"><div><span className="scene-eyebrow"><History size={12} /> CHRONICLE</span><h1>Your earning evidence.</h1><p>A readable audit trail of rewards, reservations, reversals and adjustments. Nothing is hidden behind a progress animation.</p></div><div className="scene-readonly">LEDGER · READ-ONLY VIEW</div></section>
      <section className="scene-panel chronicle-hero-panel"><div className="chronicle-summary"><span className="scene-eyebrow">ACCOUNT LEDGER</span><strong>{ledger.length}</strong><span>recorded events</span></div><div className="scene-copy"><h2>Separate activity from cash.</h2><p>Reward entries become available only after provider evidence. Withdrawal entries reserve points before any manual USDT/TRC20 payout is sent.</p></div></section>
      <section className="scene-panel timeline-panel"><div className="scene-section-heading"><div><span className="scene-eyebrow">EVENT STREAM</span><h2>Recent events</h2></div></div><div className="full-timeline">{ledger.length ? ledger.map((entry) => <div className="full-event" key={entry.id}><div className={`full-event-icon ${entry.pointsDelta >= 0 ? 'positive' : 'negative'}`}>{iconFor(entry.type)}</div><div className="full-event-body"><div><strong>{entry.source}</strong><span className={`status ${entry.status}`}>{entry.status}</span></div><p>{entry.referenceId ? `Reference ${entry.referenceId}` : 'Kivora ledger event'}</p><small>{shortDate(entry.createdAt)}</small></div><strong className={entry.pointsDelta >= 0 ? 'positive' : 'negative'}>{entry.pointsDelta >= 0 ? '+' : ''}{points(entry.pointsDelta)} KP</strong></div>) : <div className="scene-empty"><History size={24} /><h3>No ledger events yet</h3><span>Complete a verified opportunity and the chronicle will begin filling automatically.</span></div>}</div></section>
      <section className="table-card scene-ledger-table"><div className="table-scroll"><table><thead><tr><th>Time</th><th>Event</th><th>Reference</th><th>Change</th><th>Status</th></tr></thead><tbody>{ledger.map((entry) => <tr key={`table-${entry.id}`}><td>{shortDate(entry.createdAt)}</td><td><span className="activity-type">{iconFor(entry.type)} {entry.source}</span></td><td><code>{entry.referenceId ?? '—'}</code></td><td className={entry.pointsDelta >= 0 ? 'positive' : 'negative'}>{entry.pointsDelta >= 0 ? '+' : ''}{points(entry.pointsDelta)} KP</td><td><span className={`status ${entry.status}`}>{entry.status}</span></td></tr>)}{!ledger.length && <tr><td colSpan={5} className="table-empty">No events recorded yet.</td></tr>}</tbody></table></div></section>
    </div>
  );
}