import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";
import type { FormationState } from "../../lib/forgeFormation";

export type BattleRunMode = "boss" | "raid";
const BATTLE_RUN_RPC_TIMEOUT_MS = 15_000;
const ACTIVE_BATTLE_RUN_STORAGE_KEY = "vexforge_active_battle_run_v1";

function withBattleRunTimeout<T>(
  request: PromiseLike<T>,
  operation: string,
  onLateValue?: (value: T) => void,
): Promise<T> {
  return new Promise((resolve, reject) => {
    let settled = false;
    let timedOut = false;
    const timer = setTimeout(() => {
      if (settled) return;
      timedOut = true;
      settled = true;
      reject(new Error(`${operation}_timeout`));
    }, BATTLE_RUN_RPC_TIMEOUT_MS);

    request.then(
      (value) => {
        if (timedOut) {
          onLateValue?.(value);
          return;
        }
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

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

interface ActiveBattleRunMarker {
  mode: BattleRunMode;
  targetId: string;
  idempotencyKey: string;
  battleRunId?: string;
}

function readActiveBattleRunMarker(): ActiveBattleRunMarker | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const value = sessionStorage.getItem(ACTIVE_BATTLE_RUN_STORAGE_KEY);
    return value ? JSON.parse(value) as ActiveBattleRunMarker : null;
  } catch {
    return null;
  }
}

export function setActiveBattleRunMarker(marker: ActiveBattleRunMarker): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(ACTIVE_BATTLE_RUN_STORAGE_KEY, JSON.stringify(marker));
  } catch {
    // Session storage is a recovery aid, not an authoritative data store.
  }
}

export function clearActiveBattleRunMarker(battleRunId?: string): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const current = readActiveBattleRunMarker();
    if (!battleRunId || current?.battleRunId === battleRunId) {
      sessionStorage.removeItem(ACTIVE_BATTLE_RUN_STORAGE_KEY);
    }
  } catch {
    // Nothing to do if browser storage is unavailable.
  }
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
  const request = supabase.rpc("start_battle_run", {
      p_mode: mode,
      p_target_id: targetId,
      p_formation_snapshot: getFormationSnapshot(formation),
      p_seed: null,
      p_idempotency_key: idempotencyKey,
  });
  const { data, error } = await withBattleRunTimeout(
    request,
    "start_battle_run",
    (lateResponse) => {
      const lateResult = lateResponse.data as BattleRunStartResult | null;
      if (lateResult?.battle_run_id) {
        // The server may have created the run even though the client timed
        // out. Close that authoritative run instead of leaving it started.
        void abandonBattleRun(lateResult.battle_run_id, { engine: "forge_formation_t5" });
      }
    },
  );

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
  const { data, error } = await withBattleRunTimeout(
    supabase.rpc("resolve_battle_run", {
      p_battle_run_id: battleRunId,
      p_won: won,
      p_result_snapshot: {
        ...snapshot,
        won,
        resolved_at: new Date().toISOString(),
      },
    }),
    "resolve_battle_run",
  );

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
  const { data, error } = await withBattleRunTimeout(
    supabase.rpc("abandon_battle_run", {
      p_battle_run_id: battleRunId,
      p_result_snapshot: {
        ...snapshot,
        outcome: "dismissed",
        resolved_at: new Date().toISOString(),
      },
    }),
    "abandon_battle_run",
  );

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

/**
 * A refresh or a lost connection can discard the in-memory run ID while the
 * authoritative row remains started. Reconcile those owner-scoped rows on
 * route load/reconnect. The current tab's active run is excluded.
 */
export async function recoverStartedBattleRuns(excludeBattleRunId?: string): Promise<number> {
  const marker = readActiveBattleRunMarker();
  if (!marker) return 0;

  const { data, error } = await withBattleRunTimeout(
    supabase
      .from("battle_runs")
      .select("id, idempotency_key")
      .eq("status", "started"),
    "battle_runs_recovery",
  );

  if (error) throw new Error(error.message);

  const row = (data ?? []).find((candidate) =>
    candidate.id === marker.battleRunId ||
    candidate.idempotency_key === marker.idempotencyKey,
  );
  if (!row || row.id === excludeBattleRunId) {
    if (row?.id !== excludeBattleRunId) clearActiveBattleRunMarker();
    return 0;
  }

  const result = await abandonBattleRun(row.id, { engine: "forge_formation_t5" });
  if (!result.data) {
    throw new Error(result.reason ?? "battle_run_recovery_failed");
  }
  clearActiveBattleRunMarker(row.id);
  return 1;
}

export function createBattleRunKey(mode: BattleRunMode, targetId: string): string {
  const suffix = typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `battle-run:${mode}:${targetId}:${suffix}`;
}