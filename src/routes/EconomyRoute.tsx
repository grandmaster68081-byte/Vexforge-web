import { useEffect, useState } from "react";
import { useSession } from "../providers/AuthProvider";
import { getWallet, getRecentLedgerEntries, type PlayerWallet, type LedgerEntry } from "../domains/economy/repository";
import { DomainStatusBadge } from "../shared/components/DomainStatus";
import type { DomainStatus } from "../shared/types/domain";

export function EconomyRoute() {
  const { session, loading: sessionLoading } = useSession();
  const [wallet, setWallet] = useState<PlayerWallet | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [status, setStatus] = useState<DomainStatus>("blocked_auth");
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setStatus("blocked_auth");
      setReason("No auth session. Sign in on the Account page first.");
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([getWallet(), getRecentLedgerEntries()]).then(([walletResult, ledgerResult]) => {
      setStatus(walletResult.status);
      setWallet(walletResult.data ?? null);
      setReason(walletResult.reason ?? null);
      setLedger(ledgerResult.data ?? []);
      setLoading(false);
    });
  }, [session, sessionLoading]);

  return (
    <section>
      <header className="route-header">
        <h1>Economy</h1>
        <DomainStatusBadge status={status} />
      </header>

      {(loading || sessionLoading) && <p className="muted">Loading…</p>}
      {!loading && !sessionLoading && reason && <p className="muted">{reason}</p>}

      {!loading && wallet && (
        <div className="empty-state">
          <p className="stat-row">In-game: {wallet.vex_ingame} · Tradeable: {wallet.vex_tradeable}</p>
        </div>
      )}

      {!loading && ledger.length > 0 && (
        <ul>
          {ledger.map((entry) => (
            <li key={entry.id}>
              {entry.entry_type} · {entry.amount} {entry.currency} · balance {entry.balance_after}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
