import { ArrowDownToLine, CircleHelp, Coins, History, ShieldCheck, WalletCards } from 'lucide-react';
import type { PlatformConfig, Wallet, Withdrawal } from '../lib/types';
import { maskAddress, points, shortDate, usdFromPoints } from '../lib/format';
import { SettlementTerminal } from '../kivora-v4';

function level(pointsEarned: number) {
  const levels = [0, 1000, 5000, 15000, 40000, 100000];
  let index = 0;
  for (let i = 0; i < levels.length; i += 1) if (pointsEarned >= levels[i]) index = i;
  return { name: ['Newcomer', 'Spark', 'Momentum', 'Orbit', 'Pulse', 'Nova'][index], next: levels[index + 1] ?? null, progress: levels[index + 1] ? Math.min(100, ((pointsEarned - levels[index]) / (levels[index + 1] - levels[index])) * 100) : 100 };
}

function settlementState(status: string): 'requested' | 'reserved' | 'review' | 'paid' {
  if (status === 'paid' || status === 'confirmed') return 'paid';
  if (status === 'approved') return 'review';
  if (status === 'pending') return 'reserved';
  return 'requested';
}

export function WalletPage({ wallet, withdrawals, config, onNavigate }: { wallet: Wallet; withdrawals: Withdrawal[]; config: PlatformConfig; onNavigate: (p: string) => void }) {
  const currentLevel = level(wallet.lifetimeEarnedPoints);
  const latest = withdrawals[0];
  return <div className="page-stack scene-page v4-vault-page">
    <section className="scene-hero vault-page-hero">
      <div className="scene-hero-copy"><span className="scene-eyebrow"><WalletCards size={12} /> VAULT CHAMBER</span><h1>Hold the signal inside Kivora's <em>ledger.</em></h1><p>Available, pending and reserved points are separate zones. External crypto only moves after a manual review at the Settlement Terminal.</p></div>
      <div className="v4-vault-object" aria-label="Vault chamber visual" />
    </section>

    <section className="v4-vault-balance">
      <div><span className="scene-eyebrow">AVAILABLE BALANCE</span><h2>Ready for a settlement request</h2><strong>{points(wallet.availablePoints)} KP</strong><span>${usdFromPoints(wallet.availablePoints, config.pointsPerUsdDisplay).toFixed(2)} display reference · {currentLevel.name} level</span><div className="scene-progress"><i style={{ width: `${Math.min(100, Math.max(5, wallet.availablePoints / config.withdrawalMinPoints * 100))}%` }} /></div><div className="scene-actions"><button className="primary-button" onClick={() => onNavigate('/withdraw')}><ArrowDownToLine size={14} /> Request payout</button><button className="secondary-button" onClick={() => onNavigate('/activity')}><History size={14} /> Open chronicle</button></div></div>
      <div className="vault-zones"><div className="vault-zone available"><small>AVAILABLE</small><strong>{points(wallet.availablePoints)}</strong><span>ready for a request</span></div><div className="vault-zone pending"><small>PENDING VERIFICATION</small><strong>{points(wallet.pendingPoints)}</strong><span>awaiting provider settlement</span></div><div className="vault-zone reserved"><small>RESERVED FOR PAYOUT</small><strong>{points(wallet.withdrawalReservedPoints)}</strong><span>held for manual review</span></div><div className="vault-zone"><small>LIFETIME WITHDRAWN</small><strong>{points(wallet.lifetimeWithdrawnPoints)}</strong><span>paid points to date</span></div></div>
    </section>

    <div className="wallet-notice"><ShieldCheck size={18} /><div><strong>No private keys are stored.</strong><span>Your Kivora balance is an internal rewards ledger; external crypto wallets are used only when you submit a payout destination.</span></div></div>
    {wallet.debtPoints > 0 && <div className="wallet-notice debt"><ShieldCheck size={18} /><div><strong>Settlement balance: {points(wallet.debtPoints)} KP</strong><span>A provider reversal exceeded the available balance. Withdrawals stay locked until that settlement balance is cleared.</span></div></div>}

    <section className="scene-panel settlement-note"><div><span className="scene-eyebrow">SETTLEMENT · ONE RAIL</span><h2>{config.payoutAsset} · {config.payoutNetwork}</h2><p>The payout asset and network match the publisher settlement rail. The app does not custody private keys.</p></div><button className="secondary-button" onClick={() => onNavigate('/withdraw')}>Open Settlement Terminal <ArrowDownToLine size={15} /></button></section>

    {latest && <section className="scene-panel vault-latest-settlement"><div className="scene-section-heading"><div><span className="scene-eyebrow">LATEST PROCEDURE</span><h2>Settlement status</h2></div><span className="scene-readonly">{latest.status.toUpperCase()}</span></div><SettlementTerminal points={latest.amountPoints} asset={latest.asset} network={latest.network} destination={maskAddress(latest.destination)} state={settlementState(latest.status)} /></section>}

    <section><div className="scene-section-heading"><div><span className="scene-eyebrow"><History size={12} /> PAYOUT HISTORY</span><h2>Manual requests</h2></div><button className="text-button" onClick={() => onNavigate('/activity')}>View chronicle <History size={15} /></button></div><div className="table-card"><div className="table-scroll"><table><thead><tr><th>Date</th><th>Asset</th><th>Destination</th><th>Points</th><th>Status</th></tr></thead><tbody>{withdrawals.map((withdrawal) => <tr key={withdrawal.id}><td>{shortDate(withdrawal.createdAt)}</td><td><strong>{withdrawal.asset}</strong><small>{withdrawal.network}</small></td><td><code>{maskAddress(withdrawal.destination)}</code></td><td>{points(withdrawal.amountPoints)}</td><td><span className={`status ${withdrawal.status}`}>{withdrawal.status}</span></td></tr>)}{!withdrawals.length && <tr><td colSpan={5} className="table-empty">No payout requests yet.</td></tr>}</tbody></table></div></div></section>

    <section className="payout-methods"><div className="method-heading"><span className="scene-eyebrow">SUPPORTED DESTINATIONS</span><h2>Fixed publisher rail</h2></div><div className="method-pills">{config.supportedPayouts.map((method) => <div key={`${method.asset}-${method.network}`}><Coins size={15} /><strong>{method.asset}</strong><span>{method.network}</span></div>)}</div><div className="small-note"><CircleHelp size={14} /> Minimum withdrawal: {points(config.withdrawalMinPoints)} KP. Payouts are reviewed manually.</div></section>
  </div>;
}