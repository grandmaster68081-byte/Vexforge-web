import { useState, useEffect, useCallback } from "react";
import { getMyWithdrawals, getMyTradeableBalance, requestWithdrawal } from "./repository";
import type { WithdrawalRequest, TradeableBalance } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useWithdrawal() {
  const [withdrawals, setWithdrawals] = useState<DomainResult<WithdrawalRequest[]>>({ status: "loading", data: null });
  const [balance, setBalance]         = useState<TradeableBalance | null>(null);
  const [requesting, setRequesting]   = useState(false);
  const [tick, setTick]               = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    getMyWithdrawals().then(r    => { if (mounted) setWithdrawals(r); });
    getMyTradeableBalance().then(r => { if (mounted) setBalance(r); });
    return () => { mounted = false; };
  }, [tick]);

  const request = useCallback(async (amount: number) => {
    setRequesting(true);
    const result = await requestWithdrawal(amount);
    setRequesting(false);
    if (result.ok) reload();
    return result;
  }, [reload]);

  return { withdrawals, balance, requesting, request, reload };
}