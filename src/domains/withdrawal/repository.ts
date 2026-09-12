import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface WithdrawalRequest {
  id: string;
  player_id: string;
  tradeable_amount: number;
  usdt_gross: number;
  fee_usdt: number;
  usdt_net: number;
  status: "pending_review" | "approved" | "rejected";
  rejected_reason: string | null;
  payout_tx_hash: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface RequestWithdrawalResult {
  ok: boolean;
  request_id?: string;
  usdt_gross?: number;
  fee_usdt?: number;
  usdt_net?: number;
  reason?: string;
}

export interface TradeableBalance {
  balance: number;
  locked: number;
  pending: boolean;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getMyWithdrawals(): Promise<DomainResult<WithdrawalRequest[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null };
  const { data, error } = await supabase
    .from("vexforge_withdrawal_requests_official")
    .select("id,player_id,tradeable_amount,usdt_gross,fee_usdt,usdt_net,status,rejected_reason,payout_tx_hash,created_at,processed_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as WithdrawalRequest[] };
}

export async function getMyTradeableBalance(): Promise<TradeableBalance | null> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return null;
  const { data, error } = await supabase
    .from("player_economy_state")
    .select("trade_balance,trade_balance_locked,withdrawal_pending")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    balance: Number(data.trade_balance ?? 0),
    locked:  Number(data.trade_balance_locked ?? 0),
    pending: !!data.withdrawal_pending,
  };
}

export async function requestWithdrawal(tradeableAmount: number): Promise<RequestWithdrawalResult> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { ok: false, reason: "Inicia sesion para retirar." };
  const { data, error } = await supabase.rpc("vexforge_request_withdrawal", {
    p_player_id:        playerId,
    p_tradeable_amount: tradeableAmount,
  });
  if (error) return { ok: false, reason: error.message };
  const res = data as Record<string, unknown>;
  return {
    ok:         Boolean(res?.ok),
    request_id: res?.request_id as string | undefined,
    usdt_gross: res?.usdt_gross as number | undefined,
    fee_usdt:   res?.fee_usdt   as number | undefined,
    usdt_net:   res?.usdt_net   as number | undefined,
    reason:     res?.reason     as string | undefined,
  };
}