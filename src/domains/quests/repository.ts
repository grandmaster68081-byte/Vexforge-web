import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyQuestDef {
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
  id: string;           // player_daily_quests.id
  quest_id: string;
  assigned_date: string;
  status: "active" | "completed" | "claimed";
  progress: number;
  completed_at: string | null;
  claimed_at: string | null;
  quest: DailyQuestDef | null;
}

export interface QuestClaimResult {
  claimed: boolean;
  xp_applied?: number;
  vex_applied?: number;
  reason?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", s.session.user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/** Today's date in YYYY-MM-DD local format */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Repository ───────────────────────────────────────────────────────────────

/**
 * Load today's daily quests for the authenticated player.
 * Calls assign_daily_quests first (idempotent — only fills up to 3 if missing),
 * then reads player_daily_quests joined with daily_quests for today.
 *
 * RLS: player_daily_quests has pdq_own (player sees own rows).
 *      daily_quests has daily_quests_public (everyone can read).
 */
export async function loadDailyQuests(): Promise<DomainResult<PlayerDailyQuest[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus misiones diarias." };

  // Assign quests for today (idempotent)
  await supabase.rpc("assign_daily_quests", { p_player_id: playerId });

  const today = todayStr();
  const { data, error } = await supabase
    .from("player_daily_quests")
    .select(
      "id, quest_id, assigned_date, status, progress, completed_at, claimed_at, " +
      "quest:quest_id ( quest_key, title, description, quest_type, target_count, reward_vex_ingame, reward_xp, weight )"
    )
    .eq("assigned_date", today)
    .order("created_at", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };

  return { status: "ready", data: data as unknown as PlayerDailyQuest[] };
}

/**
 * Claim rewards for a completed daily quest.
 * RPC: claim_daily_quest(p_player_quest_id uuid)
 * Returns { claimed, xp_applied, vex_applied } or { claimed: false, reason }
 */
export async function claimDailyQuest(
  playerQuestId: string
): Promise<DomainResult<QuestClaimResult>> {
  const { data, error } = await supabase.rpc("claim_daily_quest", {
    p_player_quest_id: playerQuestId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as QuestClaimResult };
}
