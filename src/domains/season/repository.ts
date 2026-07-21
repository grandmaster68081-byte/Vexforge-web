import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface SeasonTier {
  tier: number; xp_required: number; is_premium: boolean;
  reward: Record<string, any>; unlocked: boolean;
}

export interface SeasonProgress {
  ok: boolean; season_name?: string; season_number?: number;
  end_at?: string; player_xp?: number; current_tier?: number;
  is_premium?: boolean; tiers?: SeasonTier[]; reason?: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

/**
 * get_season_progress is SECURITY DEFINER.
 * Auto-creates player_season_pass row on first call.
 * Returns ok:false + reason if no active season.
 */
export async function getSeasonProgress(): Promise<DomainResult<SeasonProgress>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para ver tu pase de temporada." };
  const { data, error } = await supabase.rpc("get_season_progress", { p_player_id: playerId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as SeasonProgress };
}
export interface SeasonRanking {
  rank_position: number;
  mmr: number;
  wins: number;
  losses: number;
  draws: number;
  season_key: string;
  player_id: string;
  display_name?: string;
}

export async function getSeasonRankings(seasonKey?: string): Promise<DomainResult<SeasonRanking[]>> {
  let query = supabase
    .from("season_rankings")
    .select("rank_position, mmr, wins, losses, draws, season_key, player_id")
    .order("rank_position", { ascending: true })
    .limit(100);
  if (seasonKey) query = query.eq("season_key", seasonKey);
  const { data, error } = await query;
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as SeasonRanking[] };
}

export async function getMySeasonRanking(seasonKey?: string): Promise<DomainResult<SeasonRanking | null>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tu posición." };
  let query = supabase
    .from("season_rankings")
    .select("rank_position, mmr, wins, losses, draws, season_key, player_id")
    .eq("player_id", playerId);
  if (seasonKey) query = query.eq("season_key", seasonKey);
  const { data, error } = await query.maybeSingle();
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as SeasonRanking | null };
}