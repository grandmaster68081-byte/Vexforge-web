import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface RankEntry {
  rank_position: number; player_id: string; display_name: string;
  mmr: number; wins: number; losses: number; draws: number;
  win_rate: number; updated_at: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

/** get_leaderboard is SECURITY DEFINER — returns display names for all players, bypassing players_self RLS. */
export async function getLeaderboard(limit = 100): Promise<DomainResult<RankEntry[]>> {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: limit });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as RankEntry[] };
}