import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Clan {
id: string; code: string; name: string; leader_player_id: string;
prestige: number; contribution_total: number; metadata: Record<string,any>;
member_count?: number;
}
export interface ClanMember {
id: string; player_id: string; role: string;
contribution_accumulated: number; joined_at: string;
player_name?: string;
}

async function getCurrentPlayerId(): Promise<string|null> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players")
  .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

export async function listClans(): Promise<DomainResult<Clan[]>> {
const { data, error } = await supabase.from("clans")
  .select("id,code,name,leader_player_id,prestige,contribution_total,metadata")
  .order("prestige", { ascending: false }).limit(50);
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: (data??[]) as Clan[] };
}

export async function getMyClan(): Promise<DomainResult<{ clan: Clan; members: ClanMember[]; my_role: string } | null>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your clan." };
const { data: mem } = await supabase.from("clan_members")
  .select("clan_id, role").eq("player_id", playerId).maybeSingle();
if (!mem) return { status: "ready", data: null };
const [{ data: clan }, { data: members }] = await Promise.all([
  supabase.from("clans").select("*").eq("id", mem.clan_id).maybeSingle(),
  supabase.from("clan_members")
    .select("id,player_id,role,contribution_accumulated,joined_at")
    .eq("clan_id", mem.clan_id).order("contribution_accumulated", { ascending: false }),
]);
return { status: "ready", data: clan ? { clan: clan as Clan, members: (members??[]) as ClanMember[], my_role: mem.role } : null };
}

export async function joinClan(clanId: string): Promise<DomainResult<{ ok: boolean; reason?: string }>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Not authenticated." };
const { data, error } = await supabase.rpc("join_clan", { p_clan_id: clanId, p_player_id: playerId });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as any };
}

export async function leaveClan(): Promise<DomainResult<{ ok: boolean }>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Not authenticated." };
const { data, error } = await supabase.rpc("leave_clan", { p_player_id: playerId });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as any };
}

export interface ClanWar {
  id: string; attacker_clan_id: string; defender_clan_id: string;
  status: string; started_at: string; ended_at: string | null;
}

export async function listClanMembers(clanId: string): Promise<DomainResult<ClanMember[]>> {
  const { data, error } = await supabase.from("clan_members")
    .select("id,player_id,role,contribution_accumulated,joined_at")
    .eq("clan_id", clanId).order("contribution_accumulated", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as ClanMember[] };
}

export async function listMyClanWars(): Promise<DomainResult<ClanWar[]>> {
  return { status: "ready", data: [] };
}