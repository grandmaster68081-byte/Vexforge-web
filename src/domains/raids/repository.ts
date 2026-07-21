import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface RaidRun {
  id: string;
  raid_code: string;
  region_id: string;
  status: "pending" | "active" | "completed" | "failed";
  started_at: string | null;
  ended_at: string | null;
  metadata: {
    name?: string;
    difficulty?: string;
    max_participants?: number;
    reward_multiplier?: number;
  };
  created_at: string;
}

export interface RaidParticipant {
  id: string;
  raid_run_id: string;
  player_id: string;
  contribution: number;
  status: string;
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function listActiveRaids(): Promise<DomainResult<RaidRun[]>> {
  const { data, error } = await supabase
    .from("raid_runs")
    .select("id, raid_code, region_id, status, started_at, ended_at, metadata, created_at")
    .in("status", ["pending", "active"])
    .order("created_at", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as RaidRun[] };
}

export async function listMyRaids(): Promise<DomainResult<RaidRun[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus raids." };
  const { data: parts } = await supabase
    .from("raid_participants").select("raid_run_id").eq("player_id", playerId);
  const ids = (parts ?? []).map((p: any) => p.raid_run_id);
  if (!ids.length) return { status: "ready", data: [] };
  const { data, error } = await supabase
    .from("raid_runs")
    .select("id, raid_code, region_id, status, started_at, ended_at, metadata, created_at")
    .in("id", ids).order("created_at", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as RaidRun[] };
}

export async function getRaidParticipants(raidRunId: string): Promise<DomainResult<RaidParticipant[]>> {
  const { data, error } = await supabase
    .from("raid_participants")
    .select("id, raid_run_id, player_id, contribution, status")
    .eq("raid_run_id", raidRunId)
    .order("contribution", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as RaidParticipant[] };
}

export async function joinRaid(raidRunId: string): Promise<DomainResult<{ ok: boolean; reason?: string }>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status: "blocked_auth", data: null, reason: "Inicia sesión para unirte." };
  const { data, error } = await supabase.rpc("vexforge_join_raid", { p_raid_run_id: raidRunId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as { ok: boolean; reason?: string } };
}

export async function contributeToRaid(
  raidRunId: string, contribution: number = 1
): Promise<DomainResult<{ ok: boolean; reason?: string }>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status: "blocked_auth", data: null, reason: "Inicia sesión." };
  const { data, error } = await supabase.rpc("vexforge_contribute_raid", {
    p_raid_run_id: raidRunId, p_contribution: contribution,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as { ok: boolean; reason?: string } };
}

export async function completeRaid(raidRunId: string): Promise<DomainResult<{ ok: boolean; reason?: string }>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status: "blocked_auth", data: null, reason: "Inicia sesión." };
  const { data, error } = await supabase.rpc("vexforge_complete_raid", { p_raid_run_id: raidRunId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as { ok: boolean; reason?: string } };
}