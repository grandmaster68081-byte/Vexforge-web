import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Mission {
  id: string;
  code: string;
  name: string;
  region_id: string;
  mission_type: string;
  energy_cost: number;
  reward_xp: number;
  reward_vex_ingame: number;
  reward_vex_tradeable: number;
  cooldown_seconds: number;
  active: boolean;
  mission_order: number;
  difficulty: string;
  mission_group: string | null;
  production_ready: boolean | null;
}

/**
 * Verified real read path (chat 21): RLS policy missions_public,
 * SELECT, public, qual = true. missions_no_write blocks all writes.
 */
export async function listActiveMissions(): Promise<DomainResult<Mission[]>> {
  const { data, error } = await supabase
    .from("missions")
    .select(
      "id, code, name, region_id, mission_type, energy_cost, reward_xp, reward_vex_ingame, reward_vex_tradeable, cooldown_seconds, active, mission_order, difficulty, mission_group, production_ready"
    )
    .eq("active", true)
    .order("mission_order", { ascending: true });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as Mission[] };
}
