import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Achievement {
id: string; code: string; title: string; description: string;
category: string; points: number; reward_vex_ingame: number;
reward_xp: number; icon: string; hidden: boolean;
}
export interface PlayerAchievement {
achievement_id: string;
unlocked_at: string;
achievement: Achievement | null;
}

async function getCurrentPlayerId(): Promise<string | null> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players")
  .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

export async function getAllAchievements(): Promise<DomainResult<Achievement[]>> {
const { data, error } = await supabase.from("achievements")
  .select("id,code,title,description,category,points,reward_vex_ingame,reward_xp,icon,hidden")
  .eq("hidden", false).order("category").order("points");
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as Achievement[] };
}

export async function getMyAchievements(): Promise<DomainResult<PlayerAchievement[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see achievements." };
const { data, error } = await supabase.from("player_achievements")
  .select("achievement_id, unlocked_at, achievement:achievements!inner(id,code,title,description,category,points,reward_vex_ingame,reward_xp,icon,hidden)")
  .eq("player_id", playerId)
  .order("unlocked_at", { ascending: false });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: (data ?? []) as unknown as PlayerAchievement[] };
}

export async function getPlayerStats(): Promise<DomainResult<Record<string,number>>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Not authenticated." };
const { data, error } = await supabase.rpc("get_player_stats", { p_player_id: playerId });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as Record<string,number> };
}

/** Fire-and-forget: retroactively grant any achievements the player already earned */
export async function checkMyAchievements(): Promise<void> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return;
await supabase.rpc("check_my_achievements").catch(() => {});
}