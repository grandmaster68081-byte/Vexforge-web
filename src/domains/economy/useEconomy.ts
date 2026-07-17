import { useEffect, useState } from "react";
    import { useSession } from "../../providers/AuthProvider";
    import { getWallet, getRecentLedgerEntries, type PlayerWallet, type LedgerEntry } from "./repository";
    import type { DomainStatus } from "../../shared/types/domain";

    export function useEconomy() {
    const { session, loading: sessionLoading } = useSession();
    const [wallet, setWallet] = useState<PlayerWallet | null>(null);
    const [ledger, setLedger] = useState<LedgerEntry[]>([]);
    const [status, setStatus] = useState<DomainStatus>("blocked_auth");
    const [loading, setLoading] = useState(true);
    const [reason, setReason] = useState<string | null>(null);

    useEffect(() => {
      if (sessionLoading) return;
      if (!session) {
        setStatus("blocked_auth");
        setReason("No auth session. Sign in on the Account page first.");
        setLoading(false);
        return;
      }
      let cancelled = false;
      setLoading(true);
      Promise.all([getWallet(), getRecentLedgerEntries()]).then(([w, l]) => {
        if (cancelled) return;
        setStatus(w.status);
        setWallet(w.data ?? null);
        setLedger(l.data ?? []);
        setReason(w.reason ?? null);
        setLoading(false);
      });
      return () => { cancelled = true; };
    }, [session, sessionLoading]);

    return { wallet, ledger, status, loading, reason, signedIn: !!session };
    }
    