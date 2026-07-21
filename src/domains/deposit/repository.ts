import { supabase } from "../../lib/supabase";

export interface DepositRecord {
  id: string;
  amount_usdt: number;
  vex_credited: number;
  chain: string;
  token_symbol: string;
  tx_hash: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
}

export interface SubmitDepositPayload {
  amount_usdt: number;
  chain: string;
  token_symbol: string;
  tx_hash: string;
  payer_wallet_address: string;
}

export interface SubmitDepositResult {
  ok: boolean;
  deposit_id?: string;
  vex_pending?: number;
  reason?: string;
}

export async function submitDeposit(payload: SubmitDepositPayload): Promise<SubmitDepositResult> {
  const { data, error } = await supabase.rpc("vexforge_submit_deposit", {
    p_amount_usdt:          payload.amount_usdt,
    p_chain:                payload.chain,
    p_token_symbol:         payload.token_symbol,
    p_tx_hash:              payload.tx_hash,
    p_payer_wallet_address: payload.payer_wallet_address,
  });
  if (error) return { ok: false, reason: error.message };
  return data as SubmitDepositResult;
}

export async function getMyDeposits(): Promise<DepositRecord[]> {
  const { data, error } = await supabase.rpc("vexforge_get_my_deposits");
  if (error || !data) return [];
  return data as DepositRecord[];
}

export async function getWalletBalance(): Promise<{ vex_ingame: number; vex_tradeable: number } | null> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data: player } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", session.session.user.id)
    .maybeSingle();
  if (!player) return null;
  const { data: wallet } = await supabase
    .from("player_wallet")
    .select("vex_ingame, vex_tradeable")
    .eq("player_id", player.id)
    .maybeSingle();
  return wallet
    ? { vex_ingame: Number(wallet.vex_ingame), vex_tradeable: Number(wallet.vex_tradeable) }
    : null;
}
