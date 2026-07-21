import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

// ── Types ───────────────────────────────────────────────────────────────
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
  balance_before: number | null;
  balance_after: number | null;
  source_table: string | null;
  metadata: Record<string,any> | null;
  created_at: string;
}

export interface EconomyStats {
  ok: boolean;
  entry_count: number;
  total_credited: number;
  total_debited: number;
  net_ingame: number;
  net_tradeable: number;
  largest_credit: number;
  by_type: { entry_type: string; currency: string; count: number; total_amount: number }[];
}

// ── Repository ──────────────────────────────────────────────────────────
/**
 * Read-only by design. economy_ledger has RLS write-guard (ledger_no_write).
 * player_wallet has RLS write-guard (wallet_no_write).
 * Verified read path: wallet_self + player_read_own_ledger policies.
 */
export async function getWallet(): Promise<DomainResult<PlayerWallet>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status:"blocked_auth", data:null, reason:"Inicia sesión para ver tu cartera." };
  const { data, error } = await supabase
    .from("player_wallet")
    .select("id, player_id, vex_ingame, vex_tradeable, reserved_ingame, reserved_tradeable")
    .maybeSingle();
  if (error) return { status:"ready", data:null, reason:error.message };
  if (!data)  return { status:"ready", data:null, reason:"Sin monedero. Reinicia sesión." };
  return { status:"ready", data: data as PlayerWallet };
}

export async function getLedgerEntries(
  limit = 30, offset = 0
): Promise<DomainResult<LedgerEntry[]>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status:"blocked_auth", data:null, reason:"Inicia sesión para ver el ledger." };
  const { data, error } = await supabase
    .from("economy_ledger")
    .select("id, entry_type, currency, amount, balance_before, balance_after, source_table, metadata, created_at")
    .order("created_at", { ascending:false })
    .range(offset, offset + limit - 1);
  if (error) return { status:"ready", data:null, reason:error.message };
  return { status:"ready", data: (data ?? []) as LedgerEntry[] };
}

export async function getEconomyStats(): Promise<DomainResult<EconomyStats>> {
  const { data, error } = await supabase.rpc("vexforge_get_my_economy_stats");
  if (error) return { status:"ready", data:null, reason:error.message };
  if (!data?.ok) return { status:"ready", data:null, reason:data?.reason ?? "No autorizado" };
  return { status:"ready", data: data as EconomyStats };
}