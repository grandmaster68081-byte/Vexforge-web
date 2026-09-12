import { useEffect, useState, useCallback } from "react";
import { useSession } from "../../providers/AuthProvider";
import {
  getWallet, getLedgerEntries, getEconomyStats,
  type PlayerWallet, type LedgerEntry, type EconomyStats,
} from "./repository";

const PAGE_SIZE = 30;

export function useEconomy() {
  const { session, loading: sessionLoading } = useSession();

  const [wallet, setWallet]         = useState<PlayerWallet | null>(null);
  const [stats, setStats]           = useState<EconomyStats | null>(null);
  const [ledger, setLedger]         = useState<LedgerEntry[]>([]);
  const [ledgerTotal, setLedgerTotal] = useState(0);
  const [page, setPage]             = useState(0);
  const [loading, setLoading]       = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [reason, setReason]         = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    const [w, s, l] = await Promise.all([
      getWallet(),
      getEconomyStats(),
      getLedgerEntries(PAGE_SIZE, 0),
    ]);
    setWallet(w.data ?? null);
    setStats(s.data ?? null);
    setLedger(l.data ?? []);
    setLedgerTotal(s.data?.entry_count ?? 0);
    setReason(w.reason ?? null);
    setPage(0);
    setLoading(false);
  }, []);

  const loadMore = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    const res = await getLedgerEntries(PAGE_SIZE, nextPage * PAGE_SIZE);
    if (res.data) {
      setLedger(prev => [...prev, ...res.data!]);
      setPage(nextPage);
    }
    setLoadingMore(false);
  }, [page, loadingMore]);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setLoading(false);
      return;
    }
    loadInitial();
  }, [session, sessionLoading]);

  return {
    wallet, stats, ledger, ledgerTotal,
    loading, loadingMore,
    reason, signedIn: !!session,
    reload: loadInitial, loadMore,
    hasMore: ledger.length < ledgerTotal,
  };
}