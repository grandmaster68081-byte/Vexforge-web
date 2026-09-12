import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export interface ActiveSeason {
    id: string;
    season_key: string;
    name: string;
    starts_at: string;
    ends_at: string;
    active: boolean;
    reward_json: {
      top3_rewards?: string[];
      xp_bonus?: number;
      [key: string]: unknown;
    };
    }

    export interface SeasonRankEntry {
    rank_position: number;
    player_id: string;
    mmr: number;
    wins: number;
    losses: number;
    draws: number;
    display_name: string;
    is_self?: boolean;
    }

    export interface PlayerSeasonData {
    season: ActiveSeason;
    myRanking: SeasonRankEntry | null;
    leaderboard: SeasonRankEntry[];
    }

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data } = await supabase.from("players")
      .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
    return data?.id ?? null;
    }

    export async function getPlayerSeasonData(): Promise<DomainResult<PlayerSeasonData>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver las recompensas de temporada." };

    // Fetch active season
    const { data: seasons, error: seasonErr } = await supabase
      .from("pvp_seasons")
      .select("id,season_key,name,starts_at,ends_at,active,reward_json")
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1);

    if (seasonErr) return { status: "ready", data: null, reason: seasonErr.message };
    if (!seasons || seasons.length === 0) return { status: "ready", data: null, reason: "No hay temporada activa." };

    const season = seasons[0] as ActiveSeason;

    // Fetch top-10 leaderboard + my own ranking in parallel
    const [lbRes, myRes] = await Promise.all([
      supabase
        .from("pvp_rankings")
        .select("rank_position,player_id,mmr,wins,losses,draws")
        .eq("season_id", season.id)
        .order("rank_position", { ascending: true })
        .limit(10),
      supabase
        .from("pvp_rankings")
        .select("rank_position,player_id,mmr,wins,losses,draws")
        .eq("season_id", season.id)
        .eq("player_id", playerId)
        .maybeSingle(),
    ]);

    if (lbRes.error) return { status: "ready", data: null, reason: lbRes.error.message };

    // Resolve display_names for all player_ids in one query
    const allIds = Array.from(new Set([
      ...(lbRes.data ?? []).map((r: any) => r.player_id as string),
      ...(myRes.data ? [myRes.data.player_id as string] : []),
    ]));

    const { data: playerRows } = await supabase
      .from("players")
      .select("id,display_name")
      .in("id", allIds);

    const nameMap: Record<string, string> = {};
    for (const p of playerRows ?? []) nameMap[p.id] = p.display_name ?? "Guerrero";

    const mapRow = (r: any): SeasonRankEntry => ({
      rank_position: r.rank_position ?? 0,
      player_id:     r.player_id,
      mmr:           r.mmr ?? 1000,
      wins:          r.wins ?? 0,
      losses:        r.losses ?? 0,
      draws:         r.draws ?? 0,
      display_name:  nameMap[r.player_id] ?? "Guerrero",
      is_self:       r.player_id === playerId,
    });

    const leaderboard = (lbRes.data ?? []).map(mapRow);
    const myRanking   = myRes.data ? { ...mapRow(myRes.data), is_self: true } : null;

    return { status: "ready", data: { season, myRanking, leaderboard } };
    }
    