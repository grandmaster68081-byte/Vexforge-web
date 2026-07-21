import { useState, useCallback } from "react";
import {
  submitDeposit, getMyDeposits, getWalletBalance,
  type SubmitDepositPayload, type SubmitDepositResult, type DepositRecord,
} from "./repository";

export interface UseDepositState {
  balance: { vex_ingame: number; vex_tradeable: number } | null;
  deposits: DepositRecord[];
  loading: boolean;
  submitting: boolean;
  submitResult: SubmitDepositResult | null;
  load: () => Promise<void>;
  submit: (payload: SubmitDepositPayload) => Promise<SubmitDepositResult>;
  reset: () => void;
}

export function useDeposit(): UseDepositState {
  const [balance, setBalance]           = useState<UseDepositState["balance"]>(null);
  const [deposits, setDeposits]         = useState<DepositRecord[]>([]);
  const [loading, setLoading]           = useState(false);
  const [submitting, setSubmitting]     = useState(false);
  const [submitResult, setSubmitResult] = useState<SubmitDepositResult | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [bal, deps] = await Promise.all([getWalletBalance(), getMyDeposits()]);
    setBalance(bal);
    setDeposits(deps);
    setLoading(false);
  }, []);

  const submit = useCallback(async (payload: SubmitDepositPayload): Promise<SubmitDepositResult> => {
    setSubmitting(true);
    const result = await submitDeposit(payload);
    setSubmitResult(result);
    if (result.ok) {
      const deps = await getMyDeposits();
      setDeposits(deps);
    }
    setSubmitting(false);
    return result;
  }, []);

  const reset = useCallback(() => setSubmitResult(null), []);

  return { balance, deposits, loading, submitting, submitResult, load, submit, reset };
}
