import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Relic {
  id: string;
  code: string;
  name: string;
  effect_type: string | null;
  effect_value: number | null;
  metadata: Record<string, unknown>;
  created_at: string | null;
}

export interface PlayerRelic {
  id: string;           // player_relics.id
  relic_id: string;
  equipped: boolean;
  acquired_at: string;
  relic: Relic;
}

export async function listRelics(): Promise<DomainResult<Relic[]>> {
  const { data, error } = await supabase
    .from("relics")
    .select("id, code, name, effect_type, effect_value, metadata, created_at")
    .order("name", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as Relic[] };
}

export async function getPlayerRelics(): Promise<DomainResult<PlayerRelic[]>> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return { status: "ready", data: [], reason: undefined };

  const { data, error } = await supabase
    .from("player_relics")
    .select(`
      id, relic_id, equipped, acquired_at,
      relic:relics(id, code, name, effect_type, effect_value, metadata, created_at)
    `)
    .order("acquired_at", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };

  const rows: PlayerRelic[] = (data ?? []).map((row: any) => ({
    id: row.id,
    relic_id: row.relic_id,
    equipped: row.equipped,
    acquired_at: row.acquired_at,
    relic: row.relic as Relic,
  }));

  return { status: "ready", data: rows };
}

export async function getEquippedRelics(): Promise<import("../../lib/forgeFormation").EquippedRelic[]> {
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return [];

  const { data, error } = await supabase
    .from("player_relics")
    .select(`
      relic_id, equipped,
      relic:relics(id, code, name, effect_type, effect_value, metadata)
    `)
    .eq("equipped", true);

  if (error || !data) return [];

  return (data as any[]).map((row) => ({
    id: row.relic.id,
    code: row.relic.code,
    name: row.relic.name,
    effect_type: row.relic.effect_type,
    effect_value: row.relic.effect_value,
    metadata: row.relic.metadata ?? {},
  }));
}

export async function claimStarterRelics(): Promise<{ ok: boolean; error?: string }> {
  const { error } = await supabase.rpc("grant_starter_relics");
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function equipRelic(relicId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("equip_relic", { p_relic_id: relicId });
  if (error) return { ok: false, error: error.message };
  const result = data as { ok: boolean; error?: string };
  return result;
}

export async function unequipRelic(relicId: string): Promise<{ ok: boolean; error?: string }> {
  const { data, error } = await supabase.rpc("unequip_relic", { p_relic_id: relicId });
  if (error) return { ok: false, error: error.message };
  const result = data as { ok: boolean; error?: string };
  return result;
}
