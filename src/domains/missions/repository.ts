import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Mission {
  id: string; code: string; name: string;
  region_id: string | null; mission_type: string | null;
  energy_cost: number | null; reward_xp: number | null;
  reward_vex_ingame: number | null; reward_vex_tradeable: number | null;
  cooldown_seconds: number | null; active: boolean;
  mission_order: number | null; difficulty: string | null;
  mission_group: string | null; production_ready: boolean | null;
}

export interface MissionRunResult {
  success: boolean; run_id?: string;
  xp_reward?: number; ingame_reward?: number; tradeable_reward?: number;
  reason?: string; energy?: number; required?: number;
}

export interface ClaimResult {
  success: boolean; xp_applied?: number;
  ingame_applied?: number; tradeable_applied?: number; reason?: string;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data } = await supabase
    .from("players").select("id")
    .eq("auth_user_id", sessionData.session.user.id).maybeSingle();
  return data?.id ?? null;
}

/** U.2 chat79 — fire-and-forget notification on mission success. */
async function insertMissionNotification(
  playerId: string, missionName: string, result: MissionRunResult,
): Promise<void> {
  const parts: string[] = [];
  if ((result.xp_reward       ?? 0) > 0) parts.push(`+${result.xp_reward} XP`);
  if ((result.ingame_reward   ?? 0) > 0) parts.push(`+${result.ingame_reward} VEX`);
  if ((result.tradeable_reward ?? 0) > 0) parts.push(`+${result.tradeable_reward} VEX-T`);
  await supabase.from("player_notifications").insert({
    player_id: playerId, type: "mission_reward",
    title: "Misión completada",
    message: `${missionName}: ${parts.join(" · ") || "recompensa recibida"}`,
    icon: "🎯", link: "/missions", read: false,
  });
}

export async function listActiveMissions(): Promise<DomainResult<Mission[]>> {
  const { data, error } = await supabase
    .from("missions")
    .select("id,code,name,region_id,mission_type,energy_cost,reward_xp,reward_vex_ingame,reward_vex_tradeable,cooldown_seconds,active,mission_order,difficulty,mission_group,production_ready")
    .eq("active", true).order("mission_order", { ascending: true });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as Mission[] };
}

/**
 * R.3 chat78: real energy guard.
 * U.2 chat79: notification on success (fire-and-forget, never awaited).
 */
export async function executeMission(
  missionId: string, missionName = "Misión",
): Promise<DomainResult<MissionRunResult>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to run missions." };

  const { data, error } = await supabase.rpc("execute_mission", {
    p_player: playerId, p_mission: missionId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };

  const result = data as MissionRunResult | null;
  if (!result?.success) return { status: "ready", data: null, reason: result?.reason ?? "execution_failed" };

  if (result.run_id) {
    const referenceId = `web-claim-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
    await claimMissionReward(result.run_id, playerId, referenceId);
  }
  insertMissionNotification(playerId, missionName, result); // U.2: never await
  return { status: "ready", data: { success: true, ...result } };
}

export async function claimMissionReward(
  runId: string, playerId: string, referenceId: string,
): Promise<DomainResult<ClaimResult>> {
  const { data, error } = await supabase.rpc("claim_mission_reward", {
    p_mission_run_id: runId, p_player_id: playerId, p_reference_id: referenceId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { success: true, ...(data as object ?? {}) } as ClaimResult };
}
