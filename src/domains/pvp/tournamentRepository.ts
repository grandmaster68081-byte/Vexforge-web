import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export interface TournamentSeed {
    seed: number; player_id: string; display_name: string;
    mmr: number; wins: number; losses: number;
    }
    export interface BracketMatch {
    matchId: string; round: number;
    seedA: TournamentSeed | null; seedB: TournamentSeed | null;
    favoriteId: string | null;
    }
    export interface WeeklyTournamentData {
    season_name: string; ends_at: string;
    seeds: TournamentSeed[]; bracket: BracketMatch[]; total_players: number;
    }

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: s } = await supabase.auth.getSession();
    if (!s.session) return null;
    const { data } = await supabase.from("players")
      .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
    return data?.id ?? null;
    }

    function buildBracket(seeds: TournamentSeed[]): BracketMatch[] {
    const s = seeds.slice(0, 8);
    const n = s.length;
    const bracket: BracketMatch[] = [];
    const r1Winners: TournamentSeed[] = [];
    for (let i = 0; i < Math.floor(n / 2); i++) {
      const a = s[i], b = s[n - 1 - i];
      bracket.push({ matchId: `r1_${i}`, round: 1, seedA: a, seedB: b, favoriteId: a.mmr >= b.mmr ? a.player_id : b.player_id });
      r1Winners.push(a.mmr >= b.mmr ? a : b);
    }
    if (n % 2 === 1) r1Winners.push(s[Math.floor(n / 2)]);
    const r2Winners: TournamentSeed[] = [];
    for (let i = 0; i < Math.floor(r1Winners.length / 2); i++) {
      const a = r1Winners[i], b = r1Winners[r1Winners.length - 1 - i];
      bracket.push({ matchId: `r2_${i}`, round: 2, seedA: a, seedB: b, favoriteId: a.mmr >= b.mmr ? a.player_id : b.player_id });
      r2Winners.push(a.mmr >= b.mmr ? a : b);
    }
    if (r1Winners.length % 2 === 1) r2Winners.push(r1Winners[Math.floor(r1Winners.length / 2)]);
    if (r2Winners.length >= 2) {
      bracket.push({ matchId: 'final', round: 3, seedA: r2Winners[0], seedB: r2Winners[1], favoriteId: r2Winners[0].mmr >= r2Winners[1].mmr ? r2Winners[0].player_id : r2Winners[1].player_id });
    }
    return bracket;
    }

    export async function getWeeklyTournamentData(): Promise<DomainResult<WeeklyTournamentData>> {
    const [seasonRes, rankingsRes] = await Promise.all([
      supabase.from("pvp_seasons").select("id,name,ends_at").eq("active", true).limit(1),
      supabase.from("pvp_rankings").select("player_id,mmr,rank_position,wins,losses")
        .order("rank_position", { ascending: true }).limit(8),
    ]);
    if (seasonRes.error) return { status: "ready", data: null, reason: seasonRes.error.message };
    const season = seasonRes.data?.[0];
    const raw = rankingsRes.data ?? [];
    const ids = raw.map((r: any) => r.player_id as string);
    let nameMap: Record<string, string> = {};
    if (ids.length > 0) {
      const { data: players } = await supabase.from("players").select("id,display_name").in("id", ids);
      for (const p of players ?? []) nameMap[p.id] = p.display_name ?? "Guerrero";
    }
    const seeds: TournamentSeed[] = raw.map((r: any, i: number) => ({
      seed: i + 1, player_id: r.player_id, display_name: nameMap[r.player_id] ?? "Guerrero",
      mmr: r.mmr ?? 1000, wins: r.wins ?? 0, losses: r.losses ?? 0,
    }));
    return { status: "ready", data: { season_name: season?.name ?? "Season Activa", ends_at: season?.ends_at ?? "", seeds, bracket: buildBracket(seeds), total_players: raw.length } };
    }
    