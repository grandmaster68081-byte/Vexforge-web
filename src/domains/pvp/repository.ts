import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";
import type { RealBattleResult } from '../../lib/battleTypes';
export type { RealBattleResult };

export interface PvpSeason { id: string; season_key: string; name: string; starts_at: string; ends_at: string; active: boolean; }
export interface PvpRanking { id: string; season_id: string; player_id: string; display_name: string; level: number | null; mmr: number; rank_position: number | null; wins: number; losses: number; draws: number; win_rate: number; }
export interface PvpMatch { id: string; reference_id: string; player_a: string; player_b: string; winner: string | null; status: string; elo_change_a: number | null; elo_change_b: number | null; created_at: string; resolved_at: string | null; }
export interface ArenaPlayer { player_id: string; display_name: string; level: number | null; mmr: number; wins: number; losses: number; }
/**
 * VE-PVP-4-LEGACY-START-RETIRED: no synthetic `level`. Every value comes from
 * get_pvp_opponents; total_power carries the authoritative MMR.
 */
export interface BattleOpponent { player_id: string; display_name: string; deck_size: number; total_power: number; wins: number; losses: number; }

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
 * VE-PVP-3-OPPONENT-ROSTER: canonical roster source.
 * Was get_leaderboard (only players with a pvp_rankings row -> empty roster) and it
 * faked level/deck_size. Now uses get_pvp_opponents (SECURITY DEFINER), which already
 * excludes the caller, admins and simulation accounts, and requires a real deck (>= 5 cards).
 * No synthetic values: deck_size and mmr come from the database.
 */
export async function listOpponents(): Promise<DomainResult<BattleOpponent[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to find opponents." };
  const { data, error } = await supabase.rpc("get_pvp_opponents", { p_limit: 20 });
  if (error) return { status: "ready", data: null, reason: error.message };
  const opponents = ((data ?? []) as any[])
    .filter((p) => p.player_id !== playerId && (p.deck_size ?? 0) >= 5)
    .slice(0, 15)
    .map((p) => ({
      player_id:    p.player_id,
      display_name: p.display_name ?? "Guerrero",
      deck_size:    Number(p.deck_size ?? 0),
      total_power:  Number(p.mmr ?? 1000),
      wins:         Number(p.wins ?? 0),
      losses:       Number(p.losses ?? 0),
    })) as BattleOpponent[];
  return { status: "ready", data: opponents };
}

/**
 * VE-PVP-4-LEGACY-START-RETIRED
 * The legacy startBattle() helper (RPC start_pvp_match) was removed: that RPC is
 * granted to service_role only, so from the browser it could never resolve a match,
 * and it produced no turn log, rewards or ELO for the player. The single authoritative
 * PvP entry point is startRealBattle() -> vexforge_battle_resolve (see below).
 */

// ── D.2 — Enriched Match History ──────────────────────────────────────────────

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
    const isA      = m.player_a === playerId;
    const oppId    = isA ? m.player_b : m.player_a;
    const eloMe    = isA ? m.elo_change_a : m.elo_change_b;
    const myPower  = isA ? (m.power_snapshot_a?.total_power ?? null) : (m.power_snapshot_b?.total_power ?? null);
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

// ─── T6: Formation snapshot storage ──────────────────────────────────────────

/**
 * storeFormationSnapshot — almacena el snapshot de formación del challenger
 * en pvp_matches después de que battle_resolve devuelve el match_id.
 * Silencia errores — es telemetría, no bloquea el flujo.
 */
export async function storeFormationSnapshot(
  matchId: string,
  formation: object,
): Promise<void> {
  try {
    await supabase.rpc('vexforge_pvp_store_formation', {
      p_match_id:  matchId,
      p_formation: formation,
    });
  } catch { /* silent — telemetría no crítica */ }
}

// ─── T6: Forfeit (abandono mid-batalla) ───────────────────────────────────────

/**
 * pvpForfeit — registra abandono del challenger.
 * Challenger pierde ELO, oponente gana ELO por walkover.
 * Idempotente — misma key devuelve el resultado cacheado.
 */
export async function pvpForfeit(
  opponentId: string,
  idempotencyKey: string,
): Promise<DomainResult<{ elo_change: number; match_id: string }>> {
  const { data, error } = await supabase.rpc('vexforge_pvp_forfeit', {
    p_opponent_id:     opponentId,
    p_idempotency_key: idempotencyKey,
  });

  if (error) return { status: 'ready', data: null, reason: error.message };
  const result = data as { ok: boolean; elo_change?: number; match_id?: string; error?: string };
  if (!result?.ok) return { status: 'ready', data: null, reason: result?.error ?? 'forfeit_failed' };
  return {
    status: 'ready',
    data: { elo_change: result.elo_change ?? -15, match_id: result.match_id ?? '' },
  };
}

// ─── T6: Leaderboard QA-filtrado (oculta cuentas admin/QA) ──────────────────

export interface PublicRankEntry {
  player_id: string;
  display_name: string;
  mmr: number;
  wins: number;
  losses: number;
  draws: number;
  rank_position: number | null;
}

/**
 * listPublicRankings — usa get_public_pvp_rankings (SECURITY DEFINER).
 * Excluye automáticamente cuentas is_admin / is_qa del leaderboard.
 */
export async function listPublicRankings(
  seasonId: string,
  limit = 50,
): Promise<DomainResult<PublicRankEntry[]>> {
  const { data, error } = await supabase.rpc('get_public_pvp_rankings', {
    p_season_id: seasonId,
    p_limit:     limit,
  });

  if (error) return { status: 'ready', data: null, reason: error.message };
  return { status: 'ready', data: (data ?? []) as PublicRankEntry[] };
}
