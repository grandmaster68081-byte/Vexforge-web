import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface WorldBoss {
  id: string; boss_code: string; name: string; region_id: string | null;
  tier: string; power_level: number; hp: number;
  reward_pool: Record<string, any>; active: boolean;
  metadata: Record<string, any>; created_at: string;
  image_url?: string | null;
}

export interface BossEncounter {
  id: string; world_boss_id: string; player_id: string;
  damage: number; reward_json: Record<string, any>;
  status: string; created_at: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function listWorldBosses(): Promise<DomainResult<WorldBoss[]>> {
  const { data, error } = await supabase.from("world_bosses")
    .select("id, boss_code, name, region_id, tier, power_level, hp, reward_pool, active, metadata, created_at, image_url")
    .eq("active", true).order("tier").order("name");
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as WorldBoss[] };
}

export async function getMyEncounters(): Promise<DomainResult<BossEncounter[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view encounters." };
  const { data, error } = await supabase.from("world_boss_encounters")
    .select("id, world_boss_id, player_id, damage, reward_json, status, created_at")
    .eq("player_id", playerId).order("created_at", { ascending: false }).limit(50);
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as BossEncounter[] };
}

export async function attackWorldBoss(bossId: string): Promise<DomainResult<{ ok: boolean; message?: string; reward?: Record<string, any> }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para atacar." };
  const { data, error } = await supabase.rpc("attack_world_boss", { p_boss_id: bossId, p_player_id: playerId });
  if (error) return { status: "ready", data: { ok: false, message: error.message }, reason: error.message };
  const res = data as any;
  const ok = res?.status === "completed" || res?.ok !== false;
  const reward = res?.reward_json ?? res?.reward ?? null;
  return { status: "ready", data: { ok, reward, message: ok ? "Ataque exitoso!" : (res?.reason ?? "Error en el ataque.") } };
}
