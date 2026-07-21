import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PvpSeason { id: string; season_key: string; name: string; starts_at: string; ends_at: string; active: boolean; }
export interface PvpRanking { id: string; season_id: string; player_id: string; display_name: string; level: number | null; mmr: number; rank_position: number | null; wins: number; losses: number; draws: number; win_rate: number; }
export interface PvpMatch { id: string; reference_id: string; player_a: string; player_b: string; winner: string | null; status: string; elo_change_a: number | null; elo_change_b: number | null; created_at: string; resolved_at: string | null; }
export interface ArenaPlayer { player_id: string; display_name: string; level: number | null; mmr: number; wins: number; losses: number; }
export interface BattleOpponent { player_id: string; display_name: string; level: number; deck_size: number; total_power: number; }

export interface BattleTurn {
  turn: number;
  p_card: string; p_rarity: string; p_power: number;
  o_card: string; o_rarity: string; o_power: number;
  p_hp: number; o_hp: number;
}
export interface BattleResult {
  ok: boolean; reason?: string;
  session_id?: string; match_id?: string;
  you_won?: boolean; winner_id?: string;
  player_name?: string; opponent_name?: string;
  player_final_hp?: number; opponent_final_hp?: number;
  total_turns?: number; turns?: BattleTurn[];
  elo_change?: number;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

/**
 * Resolve display names for a list of player UUIDs.
 * Uses get_public_player_names SECURITY DEFINER RPC — bypasses players_self RLS.
 */
async function resolvePlayerNames(playerIds: string[]): Promise<Record<string, { display_name: string; level: number | null; mmr: number }>> {
  if (!playerIds.length) return {};
  const unique = [...new Set(playerIds)];
  const { data, error } = await supabase.rpc("get_public_player_names", { p_player_ids: unique });
  if (error || !data) return {};
  return Object.fromEntries(
    (data as Array<{ id: string; display_name: string; level: number | null; mmr: number }>)
      .map((r) => [r.id, { display_name: r.display_name, level: r.level, mmr: r.mmr }])
  );
}

export async function listActiveSeasons(): Promise<DomainResult<PvpSeason[]>> {
  const { data, error } = await supabase.from("pvp_seasons")
    .select("id,season_key,name,starts_at,ends_at,active").eq("active", true).order("starts_at", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PvpSeason[] };
}

/**
 * List season rankings enriched with display names via get_public_player_names (SECURITY DEFINER).
 * FIX chat45: players_self RLS blocked display names in direct joins.
 */
export async function listSeasonRankings(seasonId: string): Promise<DomainResult<PvpRanking[]>> {
  const { data, error } = await supabase.from("pvp_rankings")
    .select("id,season_id,player_id,mmr,rank_position,wins,losses,draws")
    .eq("season_id", seasonId).order("mmr", { ascending: false }).limit(50);
  if (error) return { status: "ready", data: null, reason: error.message };

  const rows = (data ?? []) as any[];
  if (!rows.length) return { status: "ready", data: [] };

  const names = await resolvePlayerNames(rows.map((r) => r.player_id));
  const total_matches = (r: any) => (r.wins ?? 0) + (r.losses ?? 0) + (r.draws ?? 0);

  return {
    status: "ready",
    data: rows.map((r) => {
      const info = names[r.player_id];
      const played = total_matches(r);
      return {
        id:            r.id,
        season_id:     r.season_id,
        player_id:     r.player_id,
        display_name:  info?.display_name ?? r.player_id.substring(0, 8),
        level:         info?.level ?? null,
        mmr:           r.mmr ?? (info?.mmr ?? 1000),
        rank_position: r.rank_position,
        wins:          r.wins ?? 0,
        losses:        r.losses ?? 0,
        draws:         r.draws ?? 0,
        win_rate:      played > 0 ? Math.round(((r.wins ?? 0) / played) * 100) : 0,
      } as PvpRanking;
    }),
  };
}

/**
 * FIX chat56 BUG-1: was querying players table directly (violates players_self RLS).
 * Now uses get_leaderboard (SECURITY DEFINER) which returns display_name for all ranked players.
 */
export async function listArenaPlayers(): Promise<DomainResult<ArenaPlayer[]>> {
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: 30 });
  if (error) return { status: "ready", data: null, reason: error.message };
  const players = ((data ?? []) as any[]).map((p: any) => ({
    player_id:    p.player_id,
    display_name: p.display_name ?? "Guerrero",
    level:        null,
    mmr:          p.mmr ?? 1000,
    wins:         p.wins ?? 0,
    losses:       p.losses ?? 0,
  }));
  return { status: "ready", data: players as ArenaPlayer[] };
}

export async function listMyMatches(): Promise<DomainResult<PvpMatch[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your matches." };
  const { data, error } = await supabase.from("pvp_matches")
    .select("id,reference_id,player_a,player_b,winner,status,elo_change_a,elo_change_b,created_at,resolved_at")
    .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
    .order("created_at", { ascending: false }).limit(20);
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PvpMatch[] };
}

/**
 * FIX chat56 BUG-2: was calling vexforge_find_opponents (RPC does not exist).
 * Now uses get_leaderboard (SECURITY DEFINER) filtered to exclude the current player.
 */
export async function listOpponents(): Promise<DomainResult<BattleOpponent[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to find opponents." };
  const { data, error } = await supabase.rpc("get_leaderboard", { p_limit: 20 });
  if (error) return { status: "ready", data: null, reason: error.message };
  const opponents = ((data ?? []) as any[])
    .filter((p) => p.player_id !== playerId)
    .slice(0, 15)
    .map((p) => ({
      player_id:    p.player_id,
      display_name: p.display_name ?? "Guerrero",
      level:        1,
      deck_size:    0,
      total_power:  p.mmr ?? 0,
    })) as BattleOpponent[];
  return { status: "ready", data: opponents };
}

/**
 * FIX chat56 BUG-3: was calling vexforge_start_battle (RPC does not exist).
 * Now uses start_pvp_match(p_a, p_b) which resolves immediately and returns the match UUID.
 */
export async function startBattle(opponentId: string): Promise<DomainResult<BattleResult>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to battle." };

  // start_pvp_match(p_a uuid, p_b uuid) → returns match_id uuid
  const { data: matchId, error } = await supabase.rpc("start_pvp_match", {
    p_a: playerId,
    p_b: opponentId,
  });
  if (error) return { status: "ready", data: { ok: false, reason: error.message } };

  // Read match result (own match — RLS allows)
  const { data: match } = await supabase.from("pvp_matches")
    .select("id,winner,player_a,player_b,elo_change_a,elo_change_b")
    .eq("id", matchId as string).maybeSingle();

  const youWon = (match?.winner ?? null) === playerId;
  const names = await resolvePlayerNames([opponentId]);
  const eloChange = youWon ? (match?.elo_change_a ?? 0) : (match?.elo_change_b ?? 0);

  return {
    status: "ready",
    data: {
      ok:            true,
      match_id:      (matchId as string) ?? undefined,
      you_won:       youWon,
      winner_id:     match?.winner ?? undefined,
      player_name:   "Tú",
      opponent_name: names[opponentId]?.display_name ?? "Oponente",
      elo_change:    eloChange ?? 0,
    } as BattleResult,
  };
}


    // ── D.2 — Enriched Match History ────────────────────────────────────────

    export interface EnrichedMatch {
    id:               string;
    created_at:       string;
    status:           string;
    outcome:          "win" | "loss" | "draw" | "pending";
    opponent_id:      string;
    opponent_name:    string;
    opponent_mmr:     number;
    my_elo_change:    number | null;
    my_power:         number | null;
    opponent_power:   number | null;
    rewards_json:     Record<string, unknown>;
    is_player_a:      boolean;
    }

    export async function getEnrichedMatchHistory(): Promise<DomainResult<EnrichedMatch[]>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tu historial." };

    const { data: rawMatches, error } = await supabase
      .from("pvp_matches")
      .select("id,created_at,status,winner,player_a,player_b,elo_change_a,elo_change_b,power_snapshot_a,power_snapshot_b,rewards_json")
      .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { status: "ready", data: null, reason: error.message };

    const opponentIds = (rawMatches ?? []).map((m: any) =>
      m.player_a === playerId ? m.player_b : m.player_a
    );
    const nameMap = await resolvePlayerNames(opponentIds);

    const matches: EnrichedMatch[] = (rawMatches ?? []).map((m: any) => {
      const isA     = m.player_a === playerId;
      const oppId   = isA ? m.player_b : m.player_a;
      const eloMe   = isA ? m.elo_change_a : m.elo_change_b;
      const myPower = isA ? (m.power_snapshot_a?.total_power ?? null) : (m.power_snapshot_b?.total_power ?? null);
      const oppPower = isA ? (m.power_snapshot_b?.total_power ?? null) : (m.power_snapshot_a?.total_power ?? null);

      let outcome: EnrichedMatch["outcome"] = "pending";
      if (m.status === "draw") outcome = "draw";
      else if (m.winner === playerId) outcome = "win";
      else if (m.winner && m.winner !== playerId) outcome = "loss";

      return {
        id:             m.id,
        created_at:     m.created_at,
        status:         m.status,
        outcome,
        opponent_id:    oppId,
        opponent_name:  nameMap[oppId]?.display_name ?? "Guerrero",
        opponent_mmr:   nameMap[oppId]?.mmr ?? 1000,
        my_elo_change:  eloMe ?? null,
        my_power:       myPower,
        opponent_power: oppPower,
        rewards_json:   m.rewards_json ?? {},
        is_player_a:    isA,
      };
    });

    return { status: "ready", data: matches };
    }
    

    // ─── F.2.b — REAL BATTLE ENGINE INTEGRATION ───────────────────────────────────
    import type { RealBattleResult } from '../../lib/battleTypes';
    export type { RealBattleResult };

    /**
    * startRealBattle — calls vexforge_battle_resolve RPC (Épica F motor real).
    * Returns full turn log, derived stats, keyword combat, ELO update.
    */
    export async function startRealBattle(opponentId: string): Promise<DomainResult<RealBattleResult>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: 'blocked_auth', data: null, reason: 'Inicia sesión para batallar.' };

    const key = `pvp_real_${playerId}_${opponentId}_${Date.now()}`;
    const { data, error } = await supabase.rpc('vexforge_battle_resolve', {
      p_challenger_id: playerId,
      p_opponent_id:   opponentId,
      p_idempotency_key: key,
    });

    if (error) return { status: 'ready', data: null, reason: error.message };
    const result = data as RealBattleResult;
    if (!result?.ok) return { status: 'ready', data: null, reason: result?.error ?? 'battle_failed' };
    return { status: 'ready', data: result };
    }
    