import { AlertTriangle, ArrowDownToLine, CheckCircle2, ShieldCheck } from 'lucide-react';
import { FormEvent, useMemo, useState } from 'react';
import type { PlatformConfig, Wallet } from '../lib/types';
import { points } from '../lib/format';
import { SettlementTerminal } from '../kivora-v4';

function validTronShape(value: string) { return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value.trim()); }

export function WithdrawPage({ wallet, config, onSubmit, onNavigate }: { wallet: Wallet; config: PlatformConfig; onSubmit: (p: any) => Promise<void>; onNavigate: (p: string) => void }) {
  const [amount, setAmount] = useState('');
  const [destination, setDestination] = useState('');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const selected = { asset: config.payoutAsset || 'USDT', network: config.payoutNetwork || 'TRC20' };
  const can = useMemo(() => { const n = Number(amount); return Number.isFinite(n) && n >= config.withdrawalMinPoints && n <= wallet.availablePoints && validTronShape(destination); }, [amount, wallet.availablePoints, config.withdrawalMinPoints, destination]);
  const submit = async (e: FormEvent) => {
    e.preventDefault(); setStatus(''); const n = Number(amount);
    if (n < config.withdrawalMinPoints) return setStatus(`Minimum withdrawal is ${points(config.withdrawalMinPoints)} points.`);
    if (n > wallet.availablePoints) return setStatus('You do not have enough available points.');
    if (!validTronShape(destination)) return setStatus('Enter a valid TRON address for the USDT/TRC20 payout rail.');
    setBusy(true); try { await onSubmit({ amountPoints: n, asset: selected.asset, network: selected.network, destination: destination.trim() }); setStatus('Withdrawal submitted for manual review.'); setAmount(''); setDestination(''); } catch (err) { setStatus(err instanceof Error ? err.message : 'Could not submit withdrawal.'); } finally { setBusy(false); }
  };
  return <div className="page-stack narrow scene-page v4-settlement-page">
    <section className="scene-hero settlement-page-hero"><div className="scene-hero-copy"><span className="scene-eyebrow"><ArrowDownToLine size={12}/> SETTLEMENT TERMINAL</span><h1>One rail. <em>Three gates.</em></h1><p>USDT on TRC20 is the launch rail. Points reserve immediately and payouts are sent manually after treasury review.</p></div></section>
    <div className="withdraw-layout">
      <form className="form-card" onSubmit={submit}><div className="form-balance"><span>Available balance</span><strong>{points(wallet.availablePoints)} KP</strong></div><div className="rail-lock"><span>Fixed payout rail</span><strong>{selected.asset} · {selected.network}</strong><small>Minimum {points(config.withdrawalMinPoints)} KP · ${config.withdrawalMinUsd.toFixed(2)} reference</small></div><label>Amount<div className="input-with-suffix"><input value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder={`${config.withdrawalMinPoints}`} /><span>KP</span></div></label><div className="quick-amounts">{[.25, .5, 1].map(p => <button type="button" key={p} onClick={() => setAmount(String(Math.floor(wallet.availablePoints * p)))}>{Math.round(p * 100)}%</button>)}</div><label>TRON destination address<input value={destination} onChange={e => setDestination(e.target.value)} placeholder="T…" autoComplete="off" /></label><div className="withdraw-security"><ShieldCheck size={18} /><div><strong>Verify before submitting</strong><span>Kivora validates the TRON address shape, but you remain responsible for the destination. Manual payouts are never automatically signed.</span></div></div>{status && <div className={`notice ${status.includes('submitted') ? 'success' : 'error'}`}>{status.includes('submitted') ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}<span>{status}</span></div>}<div className="form-actions"><button type="button" className="secondary-button" onClick={() => onNavigate('/wallet')}>Back to Vault</button><button className="primary-button" disabled={!can || busy}>{busy ? 'Submitting…' : `Request ${points(Number(amount) || 0)} KP`}</button></div></form>
      <aside className="withdraw-side"><SettlementTerminal points={Number(amount) || 0} asset={selected.asset} network={selected.network} destination={destination || 'Awaiting TRON destination'} state="requested" /><div><span className="scene-eyebrow">HOW IT MOVES</span><h3>Three gates before a payout leaves Kivora.</h3></div><div className="flow-step"><b>01</b><div><strong>Reserve</strong><span>Points move from available to withdrawal-reserved.</span></div></div><div className="flow-step"><b>02</b><div><strong>Review</strong><span>An admin verifies destination, treasury balance and provider settlement evidence.</span></div></div><div className="flow-step"><b>03</b><div><strong>Broadcast</strong><span>The owner sends USDT manually and records the transaction hash.</span></div></div></aside>
    </div>
  </div>;
}
