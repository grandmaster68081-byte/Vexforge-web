import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerProfile {
  id:             string;
  display_name:   string | null;
  email:          string | null;
  role:           string;
  status:         string;
  created_at:     string;
  is_admin:       boolean;
  is_super_admin: boolean;
  telegram_username: string | null;
}

export interface PlayerStats {
  pvp_wins:           number;
  missions_completed: number;
  cards_owned:        number;
  market_sales:       number;
  boss_kills:         number;
  packs_opened:       number;
}

export interface PlayerRank {
  ok:         boolean;
  mmr:        number;
  tier:       string;
  tier_color: string;
  tier_icon:  string;
  tier_min:   number;
  shields:    number;
  wins:       number;
  losses:     number;
  season_id:  string | null;
}

export interface PlayerAchievement {
  achievement_id: string;
  title:       string;
  code:        string;
  category:    string;
  points:      number;
  icon:        string;
  unlocked_at: string;
}

export interface WalletSnapshot {
  vex_ingame:        number;
  vex_tradeable:     number;
  reserved_ingame:   number;
  reserved_tradeable: number;
}

/**
 * RLS: players_self requires auth.uid() = auth_user_id. Read-only from frontend.
 * Wired chat 27. Extended chat 54 (bloque 5.7): +is_admin, +is_super_admin, +telegram_username
 */
export async function getProfile(): Promise<DomainResult<PlayerProfile>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "Inicia sesión en Mi Cuenta para continuar." };
  }
  const { data, error } = await supabase
    .from("players")
    .select("id, display_name, email, role, status, created_at, is_admin, is_super_admin, telegram_username")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();
  if (error) return { status: "ready", data: null, reason: error.message };
  if (!data)  return { status: "ready", data: null, reason: "Sesión activa, pero tu perfil aún no está creado." };
  return { status: "ready", data: data as PlayerProfile };
}

/**
 * get_player_stats RPC — SECURITY DEFINER, authenticated only.
 * Returns: pvp_wins, missions_completed, cards_owned, market_sales, boss_kills, packs_opened.
 */
export async function getPlayerStats(playerId: string): Promise<DomainResult<PlayerStats>> {
  const { data, error } = await supabase.rpc("get_player_stats", { p_player_id: playerId });
  if (error) return { status: "ready", data: null, reason: error.message };
  const d = data as any;
  return {
    status: "ready",
    data: {
      pvp_wins:           Number(d?.pvp_wins           ?? 0),
      missions_completed: Number(d?.missions_completed  ?? 0),
      cards_owned:        Number(d?.cards_owned         ?? 0),
      market_sales:       Number(d?.market_sales        ?? 0),
      boss_kills:         Number(d?.boss_kills          ?? 0),
      packs_opened:       Number(d?.packs_opened        ?? 0),
    },
  };
}

/**
 * get_player_rank RPC — SECURITY DEFINER, authenticated only.
 * Returns tier, mmr, wins, losses, shields, season_id.
 */
export async function getPlayerRank(playerId: string): Promise<DomainResult<PlayerRank>> {
  const { data, error } = await supabase.rpc("get_player_rank", { p_player_id: playerId });
  if (error) return { status: "ready", data: null, reason: error.message };
  const d = data as any;
  if (!d?.ok) return { status: "ready", data: null, reason: d?.reason ?? "Sin datos de rango" };
  return { status: "ready", data: d as PlayerRank };
}

/**
 * Reads player_achievements JOIN achievements — RLS allows player to see their own.
 * achievements.title (not .name) — verified chat 54.
 */
export async function getPlayerAchievements(playerId: string): Promise<DomainResult<PlayerAchievement[]>> {
  const { data, error } = await supabase
    .from("player_achievements")
    .select(`
      id, achievement_id, unlocked_at,
      achievements!inner(code, title, category, points, icon)
    `)
    .eq("player_id", playerId)
    .order("unlocked_at", { ascending: false })
    .limit(20);
  if (error) return { status: "ready", data: null, reason: error.message };
  const mapped = (data ?? []).map((row: any) => ({
    achievement_id: row.achievement_id,
    title:          row.achievements?.title    ?? "",
    code:           row.achievements?.code     ?? "",
    category:       row.achievements?.category ?? "",
    points:         row.achievements?.points   ?? 0,
    icon:           row.achievements?.icon     ?? "🏆",
    unlocked_at:    row.unlocked_at            ?? "",
  }));
  return { status: "ready", data: mapped };
}

/**
 * Reads player_wallet directly — RLS allows player to see their own.
 */
export async function getWalletSnapshot(playerId: string): Promise<DomainResult<WalletSnapshot>> {
  const { data, error } = await supabase
    .from("player_wallet")
    .select("vex_ingame, vex_tradeable, reserved_ingame, reserved_tradeable")
    .eq("player_id", playerId)
    .maybeSingle();
  if (error) return { status: "ready", data: null, reason: error.message };
  return {
    status: "ready",
    data: {
      vex_ingame:        data?.vex_ingame        ?? 0,
      vex_tradeable:     data?.vex_tradeable     ?? 0,
      reserved_ingame:   data?.reserved_ingame   ?? 0,
      reserved_tradeable: data?.reserved_tradeable ?? 0,
    },
  };
}
