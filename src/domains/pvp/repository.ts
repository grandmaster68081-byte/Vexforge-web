import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PvpSeason { id:string; season_key:string; name:string; starts_at:string; ends_at:string; active:boolean; }
export interface PvpRanking { id:string; season_id:string; player_id:string; mmr:number; rank_position:number|null; wins:number; losses:number; draws:number; }
export interface PvpMatch { id:string; reference_id:string; player_a:string; player_b:string; winner:string|null; status:string; elo_change_a:number|null; elo_change_b:number|null; created_at:string; resolved_at:string|null; }
export interface ArenaPlayer { player_id:string; display_name:string; level:number|null; mmr:number; wins:number; losses:number; }
export interface BattleOpponent { player_id:string; display_name:string; level:number; deck_size:number; total_power:number; }

export interface BattleTurn {
turn:number;
p_card:string; p_rarity:string; p_power:number;
o_card:string; o_rarity:string; o_power:number;
p_hp:number; o_hp:number;
}
export interface BattleResult {
ok:boolean; reason?:string;
session_id?:string; match_id?:string;
you_won?:boolean; winner_id?:string;
player_name?:string; opponent_name?:string;
player_final_hp?:number; opponent_final_hp?:number;
total_turns?:number; turns?:BattleTurn[];
elo_change?:number;
}

async function getCurrentPlayerId(): Promise<string|null> {
const { data:s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players").select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

export async function listActiveSeasons(): Promise<DomainResult<PvpSeason[]>> {
const { data, error } = await supabase.from("pvp_seasons")
  .select("id,season_key,name,starts_at,ends_at,active").eq("active",true).order("starts_at",{ascending:false});
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:data as PvpSeason[] };
}

export async function listSeasonRankings(seasonId:string): Promise<DomainResult<PvpRanking[]>> {
const { data, error } = await supabase.from("pvp_rankings")
  .select("id,season_id,player_id,mmr,rank_position,wins,losses,draws")
  .eq("season_id",seasonId).order("mmr",{ascending:false}).limit(50);
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:data as PvpRanking[] };
}

export async function listArenaPlayers(): Promise<DomainResult<ArenaPlayer[]>> {
const { data, error } = await supabase.from("players")
  .select("id,display_name,level").limit(30);
if (error) return { status:"ready", data:null, reason:error.message };
const players = (data ?? []).map((p:any) => ({
  player_id:p.id, display_name:p.display_name ?? "Unnamed Warrior",
  level:p.level ?? 1, mmr:1000, wins:0, losses:0,
}));
return { status:"ready", data:players as ArenaPlayer[] };
}

export async function listMyMatches(): Promise<DomainResult<PvpMatch[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status:"blocked_auth", data:null, reason:"Sign in to see your matches." };
const { data, error } = await supabase.from("pvp_matches")
  .select("id,reference_id,player_a,player_b,winner,status,elo_change_a,elo_change_b,created_at,resolved_at")
  .or(`player_a.eq.${playerId},player_b.eq.${playerId}`)
  .order("created_at",{ascending:false}).limit(20);
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:data as PvpMatch[] };
}

export async function listOpponents(): Promise<DomainResult<BattleOpponent[]>> {
const { data:s } = await supabase.auth.getSession();
if (!s.session) return { status:"blocked_auth", data:null, reason:"Sign in to find opponents." };
const { data, error } = await supabase.rpc("vexforge_find_opponents");
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:(data ?? []) as BattleOpponent[] };
}

export async function startMatch(playerA:string, playerB:string): Promise<DomainResult<{matchId:string}>> {
const { data, error } = await supabase.rpc("start_pvp_match", { p_a:playerA, p_b:playerB });
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:{ matchId:data as string } };
}

export async function startBattle(opponentId:string): Promise<DomainResult<BattleResult>> {
const { data:s } = await supabase.auth.getSession();
if (!s.session) return { status:"blocked_auth", data:null, reason:"Sign in to battle." };
const { data, error } = await supabase.rpc("vexforge_start_battle", { p_opponent_id:opponentId });
if (error) return { status:"ready", data:null, reason:error.message };
return { status:"ready", data:data as BattleResult };
}

export async function listOpponentsLegacy(): Promise<DomainResult<ArenaPlayer[]>> {
return listArenaPlayers();
}