import { supabase } from "../../lib/supabase";

// ── Types ───────────────────────────────────────────────────────────────
export interface AdminOverview {
  ok: boolean; reason?: string;
  total_players: number; active_players: number;
  total_vex_tradeable: number; total_vex_ingame: number;
  total_cards_distributed: number; unique_player_card_slots: number;
  total_packs_opened: number; total_packs_pending: number;
  deposits_pending: number; deposits_approved: number; deposits_rejected: number;
  total_usdt_received: number; total_vex_from_deposits: number;
  ledger_entries: number;
}

export interface AdminPlayer {
  player_id: string;
  display_name: string | null;
  email: string | null;
  telegram_username: string | null;
  role: string | null;
  status: string | null;
  is_admin: boolean;
  is_super_admin: boolean;
  vex_tradeable: number;
  vex_ingame: number;
  total_cards: number;
  unique_cards: number;
  created_at: string;
}

export interface LedgerEntry {
  id: string;
  entry_type: string;
  currency: string;
  amount: number;
  balance_before: number | null;
  balance_after: number | null;
  source_table: string | null;
  created_at: string;
  player_name: string | null;
  player_email: string | null;
}

// ── Repository ──────────────────────────────────────────────────────────
export async function adminGetOverview(): Promise<{ data: AdminOverview | null; reason?: string }> {
  const { data, error } = await supabase.rpc("vexforge_admin_get_overview");
  if (error) return { data: null, reason: error.message };
  if (!data?.ok) return { data: null, reason: data?.reason ?? "No autorizado" };
  return { data: data as AdminOverview };
}

export async function adminGetPlayers(): Promise<{ data: AdminPlayer[] | null; reason?: string }> {
  const { data, error } = await supabase.rpc("vexforge_admin_get_players");
  if (error) return { data: null, reason: error.message };
  if (!data?.ok) return { data: null, reason: data?.reason ?? "No autorizado" };
  return { data: (data.players ?? []) as AdminPlayer[] };
}

export async function adminGetLedger(limit = 60, offset = 0): Promise<{ data: LedgerEntry[] | null; total: number; reason?: string }> {
  const { data, error } = await supabase.rpc("vexforge_admin_get_ledger", { p_limit: limit, p_offset: offset });
  if (error) return { data: null, total: 0, reason: error.message };
  if (!data?.ok) return { data: null, total: 0, reason: data?.reason ?? "No autorizado" };
  return { data: (data.entries ?? []) as LedgerEntry[], total: data.total ?? 0 };
}