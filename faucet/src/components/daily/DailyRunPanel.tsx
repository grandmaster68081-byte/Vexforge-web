import { ArrowUpRight, Compass, RefreshCw, TimerReset } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { EarnItem } from '../../lib/types';

export function DailyRunPanel({ onOpen }: { onOpen: (item: EarnItem) => void }) {
  const [items, setItems] = useState<(EarnItem & { lane: string; pointsPerMinute?: number })[]>([]);
  const [status, setStatus] = useState('loading');
  const load = async () => { setStatus('loading'); try { const result = await api.recommendations(); setItems(result.recommendations.slice(0, 3)); setStatus(result.status); } catch { setStatus('unavailable'); } };
  useEffect(() => { void load(); }, []);
  return <section className="daily-run-panel"><div className="daily-run-heading"><div><span className="kicker"><Compass size={12}/> DAILY RUN</span><h2>Recommended next actions</h2><p>Ranked from live BitcoTasks facts only. No estimated approval or payout is added.</p></div><button className="icon-button" onClick={() => void load()} aria-label="Refresh recommendations"><RefreshCw size={15}/></button></div>{status === 'loading' ? <div className="daily-run-loading"><RefreshCw className="spin" size={16}/> Loading live recommendations…</div> : items.length ? <div className="daily-run-grid">{items.map(item => <button className="daily-run-card" key={`${item.category}-${item.id}`} onClick={() => onOpen(item)}><span className="daily-run-lane">{item.lane}</span><strong>{item.title}</strong><span>{item.reward.toLocaleString()} {item.currencyName}{item.pointsPerMinute ? ` · ${Math.round(item.pointsPerMinute)}/min` : ''}</span><small>{item.durationSeconds ? <><TimerReset size={12}/> {Math.ceil(item.durationSeconds / 60)} min</> : 'Provider duration unavailable'} <ArrowUpRight size={13}/></small></button>)}</div> : <div className="daily-run-empty">BitcoTasks recommendations are unavailable. Browse the live inventory below when the provider reconnects.</div>}</section>;
}
