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
  player_id?: string; // T3: returned by startMissionRun for later claim
}

export interface ClaimResult {
  success: boolean; xp_applied?: number;
  ingame_applied?: number; tradeable_applied?: number; reason?: string;
  claimed?: boolean; idempotent?: boolean; mission_run_id?: string;
  reference_id?: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data } = await supabase
    .from("players").select("id")
    .eq("auth_user_id", sessionData.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function listActiveMissions(): Promise<DomainResult<Mission[]>> {
  const { data, error } = await supabase
    .from("missions")
    .select("id,code,name,region_id,mission_type,energy_cost,reward_xp,reward_vex_ingame,reward_vex_tradeable,cooldown_seconds,active,mission_order,difficulty,mission_group,production_ready,system_locked")
    .eq("active", true)
    .eq("system_locked", false)
    .eq("production_ready", true).order("mission_order", { ascending: true });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as Mission[] };
}

/**
 * T3: Start a mission run (deducts energy, creates mission_run in pending state).
 * Returns run_id + player_id so the caller can claim rewards after a battle victory.
 * Does NOT auto-claim — use claimMissionReward after a ForgeFormation win.
 */
export async function startMissionRun(
  missionId: string,
): Promise<DomainResult<MissionRunResult>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to run missions." };

  const { data, error } = await supabase.rpc("execute_mission", {
    p_player: playerId, p_mission: missionId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };

  const result = data as MissionRunResult | null;
  if (!result?.success) return { status: "ready", data: null, reason: result?.reason ?? "execution_failed" };

  return { status: "ready", data: { ...result, success: true, player_id: playerId } };
}

/**
 * R.3 chat78: real energy guard.
 * Mission completion notification is emitted by the authoritative DB trigger.
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
    const referenceId = `mission:${result.run_id}`;
    const claim = await claimMissionReward(result.run_id, playerId, referenceId);
    if (!claim.data?.success) {
      return {
        status: "ready",
        data: null,
        reason: claim.reason ?? "mission_settlement_failed",
      };
    }
  }
  return { status: "ready", data: { ...result, success: true } };
}

export async function claimMissionReward(
  runId: string, playerId: string, referenceId: string,
): Promise<DomainResult<ClaimResult>> {
  const { data, error } = await supabase.rpc("claim_mission_reward", {
    p_mission_run_id: runId, p_player_id: playerId, p_reference_id: referenceId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  const result = data as (ClaimResult & { ok?: boolean }) | null;
  if (!result || (result.success !== true && result.ok !== true)) {
    return { status: "ready", data: null, reason: result?.reason ?? "mission_settlement_failed" };
  }
  return { status: "ready", data: { ...result, success: true } as ClaimResult };
}
