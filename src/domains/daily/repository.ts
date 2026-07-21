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

/**
 * Assign today's quests (if not yet assigned) then fetch them.
 * RPC assign_daily_quests(p_player_id) is idempotent — safe to call every load.
 */
export async function getMyDailyQuests(): Promise<DomainResult<PlayerDailyQuest[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus misiones diarias." };

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

/**
 * Claim rewards for a completed daily quest.
 *
 * BUG-2 RESOLVED (chat48 — 2026-07-19): claim_daily_quest RPC exists and is OFFICIAL.
 * Verified chat57/bloque-5.23: probe returns { claimed: false, reason: "Quest not found..." }
 * for non-existent IDs — the RPC executes correctly and applies VEX + XP rewards atomically.
 *
 * The RPC is tried first; the direct UPDATE fallback is kept as defensive code only.
 * Signature: claim_daily_quest(p_player_quest_id uuid) → { claimed: boolean, reason?: string }
 */
export async function claimDailyQuest(playerQuestId: string): Promise<DomainResult<{ claimed: boolean; pendingRewards?: boolean }>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status: "blocked_auth", data: null, reason: "Inicia sesión para reclamar recompensas." };

  // RPC primary path — exists and works (BUG-2 RESOLVED chat48)
  const { data: rpcData, error: rpcError } = await supabase.rpc("claim_daily_quest", {
    p_player_quest_id: playerQuestId,
  });
  if (!rpcError && rpcData) {
    return { status: "ready", data: { claimed: true } };
  }

  // Fallback (defensive): direct UPDATE if RPC fails for any unexpected reason
  const { error } = await supabase
    .from("player_daily_quests")
    .update({ claimed_at: new Date().toISOString(), status: "claimed" })
    .eq("id", playerQuestId)
    .eq("status", "completed");

  if (error) return { status: "ready", data: null, reason: error.message };

  // pendingRewards: true signals UI to show warning (RPC failed, rewards may not have applied)
  return { status: "ready", data: { claimed: true, pendingRewards: true } };
}