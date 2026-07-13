import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PvpSeason {
  id: string;
  season_key: string;
  name: string;
  starts_at: string;
  ends_at: string;
  active: boolean;
}

export interface PvpRanking {
  id: string;
  season_id: string;
  player_id: string;
  mmr: number;
  rank_position: number | null;
  wins: number;
  losses: number;
  draws: number;
}

export interface PvpMatch {
  id: string;
  reference_id: string;
  player_a: string;
  player_b: string;
  winner: string | null;
  status: string;
  elo_change_a: number | null;
  elo_change_b: number | null;
  created_at: string;
  resolved_at: string | null;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * VERIFIED chat 30: RLS policy public_read_pvp_seasons (SELECT, anon+authenticated, qual=true).
 * Anon-safe, no auth required.
 */
export async function listActiveSeasons(): Promise<DomainResult<PvpSeason[]>> {
  const { data, error } = await supabase
    .from("pvp_seasons")
    .select("id, season_key, name, starts_at, ends_at, active")
    .eq("active", true)
    .order("starts_at", { ascending: false });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PvpSeason[] };
}

/**
 * VERIFIED chat 30: RLS policy public_read_pvp_rankings (SELECT, anon+authenticated, qual=true).
 * Anon-safe leaderboard read, no auth required.
 */
export async function listSeasonRankings(seasonId: string): Promise<DomainResult<PvpRanking[]>> {
  const { data, error } = await supabase
    .from("pvp_rankings")
    .select("id, season_id, player_id, mmr, rank_position, wins, losses, draws")
    .eq("season_id", seasonId)
    .order("mmr", { ascending: false })
    .limit(50);

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PvpRanking[] };
}

/**
 * VERIFIED chat 30: RLS policy read_all on pvp_matches (SELECT, public, qual=true).
 * Filtered client-side to the signed-in player's own matches (player_a or player_b).
 */
export async function listMyMatches(): Promise<DomainResult<PvpMatch[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to see your matches." };
  }
  const { data, error } = await supabase
    .from("pvp_matches")
    .select("id, reference_id, player_a, player_b, winner, status, elo_change_a, elo_change_b, created_at, resolved_at")
    .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PvpMatch[] };
}

/**
 * WIRED chat 30: goes through the resolve_pvp_match() RPC (SECURITY DEFINER, fixed search_path,
 * verified in the chat30 RPC audit), not a raw UPDATE. The RPC applies ELO changes and rewards
 * -- a direct table write would skip all of that, same reasoning as the market domain's RPC-only
 * write path (see vexforge_project_decisions, chat28_market_write_path_decision).
 */
export async function resolveMatch(matchId: string): Promise<DomainResult<{ ok: boolean }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to resolve a match." };
  }
  const idempotencyKey = crypto.randomUUID();
  const { data, error } = await supabase.rpc("resolve_pvp_match", {
    p_match_id: matchId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as { ok: boolean } };
}
