import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface DailyQuest {
id: string;
quest_key: string;
title: string;
description: string;
quest_type: string;
target_count: number;
reward_vex_ingame: number;
reward_xp: number;
weight: number;
}

export interface PlayerDailyQuest {
id: string;
quest_id: string;
assigned_date: string;
status: string;
progress: number;
completed_at: string | null;
claimed_at: string | null;
quest: DailyQuest | null;
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
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see daily quests." };
// Assign if not yet assigned today
await supabase.rpc("assign_daily_quests", { p_player_id: playerId });
const today = new Date().toISOString().split("T")[0];
const { data, error } = await supabase
  .from("player_daily_quests")
  .select(`id, quest_id, assigned_date, status, progress, completed_at, claimed_at,
    quest:daily_quests!inner(id, quest_key, title, description, quest_type, target_count, reward_vex_ingame, reward_xp, weight)`)
  .eq("player_id", playerId)
  .eq("assigned_date", today)
  .order("status", { ascending: false });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: (data ?? []) as unknown as PlayerDailyQuest[] };
}

export async function claimDailyQuest(playerQuestId: string): Promise<DomainResult<{ claimed: boolean }>> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return { status: "blocked_auth", data: null, reason: "Sign in to claim rewards." };
const { error } = await supabase.from("player_daily_quests")
  .update({ claimed_at: new Date().toISOString(), status: "claimed" })
  .eq("id", playerQuestId)
  .eq("status", "completed");
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: { claimed: true } };
}