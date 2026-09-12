import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerDailyQuest {
  id: string;
  quest_id: string;
  assigned_date: string;
  status: string;
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  quest: {
    id: string;
    quest_key: string;
    title: string;
    description: string;
    quest_type: string;
    target_count: number;
    reward_vex_ingame: number;
    reward_xp: number;
    weight: number;
  } | null;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players")
    .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getMyDailyQuests(): Promise<DomainResult<PlayerDailyQuest[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "No auth session." };
  const { data, error } = await supabase
    .from("player_daily_quests")
    .select("*, quest:daily_quests(*)")
    .eq("player_id", playerId)
    .order("assigned_date", { ascending: false });
  if (error) return { status: "blocked_no_path", data: null, reason: error.message };
  return { status: "ready", data: data as PlayerDailyQuest[] };
}

export async function claimDailyQuestReward(questAssignmentId: string): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc("claim_daily_quest", { p_quest_assignment_id: questAssignmentId });
  if (error) return { ok: false, reason: error.message };
  return { ok: true, ...(data as object) };
}
