import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerWallet {
  id: string;
  player_id: string;
  vex_ingame: number;
  vex_tradeable: number;
  reserved_ingame: number;
  reserved_tradeable: number;
}

export interface LedgerEntry {
  id: string;
  entry_type: string;
  currency: string;
  amount: number;
  balance_after: number;
  created_at: string;
}

/**
 * Verified real read path (chat 21, verified_read_path_specs_v1):
 * player_wallet.wallet_self and economy_ledger.player_read_own_ledger both
 * require auth.uid() = players.auth_user_id. Both tables are write-protected
 * at the RLS level (wallet_no_write, ledger_no_write) -- confirmed matches
 * table comments ("ECONOMY CORE - NO DIRECT FRONTEND WRITES",
 * "IMMUTABLE FINANCIAL SOURCE OF TRUTH"). This repository is read-only by
 * design; it must never grow a write function.
 * Wired chat 27 once a real auth provider existed.
 */
export async function getWallet(): Promise<DomainResult<PlayerWallet>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "No auth session. Sign in on the Account page first." };
  }

  const { data, error } = await supabase
    .from("player_wallet")
    .select("id, player_id, vex_ingame, vex_tradeable, reserved_ingame, reserved_tradeable")
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  if (!data) {
    return { status: "ready", data: null, reason: "Signed in, but no player_wallet row exists yet for this player." };
  }
  return { status: "ready", data: data as PlayerWallet };
}

export async function getRecentLedgerEntries(limit = 20): Promise<DomainResult<LedgerEntry[]>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "No auth session. Sign in on the Account page first." };
  }

  const { data, error } = await supabase
    .from("economy_ledger")
    .select("id, entry_type, currency, amount, balance_after, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: (data ?? []) as LedgerEntry[] };
}