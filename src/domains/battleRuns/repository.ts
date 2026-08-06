import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";
import type { FormationState } from "../../lib/forgeFormation";

export type BattleRunMode = "boss" | "raid";

export interface BattleRunStartResult {
  ok: boolean;
  battle_run_id?: string;
  status?: string;
  seed?: number;
  idempotent?: boolean;
  reason?: string;
}

export interface BattleRunResolveResult {
  ok: boolean;
  battle_run_id?: string;
  status?: string;
  won?: boolean;
  idempotent?: boolean;
  reason?: string;
}

export interface BattleRunResultSnapshot {
  outcome: "completed" | "defeated" | "dismissed";
  champion_died?: boolean;
  damage_dealt?: number;
  total_turns?: number;
  engine?: string;
}

function getFormationSnapshot(formation: FormationState): {
  champion_id: string;
  card_ids: string[];
  reserve_size: number;
  rules_version: string;
} {
  const activeUnits = [formation.vanguard, formation.champion, formation.sentinel]
    .filter((unit): unit is NonNullable<typeof unit> => Boolean(unit));

  return {
    champion_id: formation.champion.id,
    card_ids: [...activeUnits, ...formation.reserve].map((unit) => unit.id),
    reserve_size: formation.reserve.length,
    rules_version: "forge_formation_t5",
  };
}

export async function startBattleRun(
  mode: BattleRunMode,
  targetId: string,
  formation: FormationState,
  idempotencyKey: string,
): Promise<DomainResult<BattleRunStartResult>> {
  const { data, error } = await supabase.rpc("start_battle_run", {
    p_mode: mode,
    p_target_id: targetId,
    p_formation_snapshot: getFormationSnapshot(formation),
    p_seed: null,
    p_idempotency_key: idempotencyKey,
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }

  const result = data as BattleRunStartResult | null;
  if (!result?.ok || !result.battle_run_id) {
    return {
      status: result?.reason === "not_authenticated" ? "blocked_auth" : "ready",
      data: null,
      reason: result?.reason ?? "battle_run_start_failed",
    };
  }

  return { status: "ready", data: result };
}

export async function resolveBattleRun(
  battleRunId: string,
  won: boolean,
  snapshot: BattleRunResultSnapshot,
): Promise<DomainResult<BattleRunResolveResult>> {
  const { data, error } = await supabase.rpc("resolve_battle_run", {
    p_battle_run_id: battleRunId,
    p_won: won,
    p_result_snapshot: {
      ...snapshot,
      won,
      resolved_at: new Date().toISOString(),
    },
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }

  const result = data as BattleRunResolveResult | null;
  if (!result?.ok) {
    return {
      status: result?.reason === "not_authenticated" ? "blocked_auth" : "ready",
      data: null,
      reason: result?.reason ?? "battle_run_resolve_failed",
    };
  }

  return { status: "ready", data: result };
}

export async function abandonBattleRun(
  battleRunId: string,
  snapshot: Pick<BattleRunResultSnapshot, "engine"> = {},
): Promise<DomainResult<BattleRunResolveResult>> {
  const { data, error } = await supabase.rpc("abandon_battle_run", {
    p_battle_run_id: battleRunId,
    p_result_snapshot: {
      ...snapshot,
      outcome: "dismissed",
      resolved_at: new Date().toISOString(),
    },
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }

  const result = data as BattleRunResolveResult | null;
  if (!result?.ok) {
    return {
      status: result?.reason === "not_authenticated" ? "blocked_auth" : "ready",
      data: null,
      reason: result?.reason ?? "battle_run_abandon_failed",
    };
  }

  return { status: "ready", data: result };
}

export function createBattleRunKey(mode: BattleRunMode, targetId: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `battle-run:${mode}:${targetId}:${suffix}`;
}