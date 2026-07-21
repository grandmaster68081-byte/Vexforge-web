import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Clan {
  id: string; code: string; name: string;
  prestige: number; contribution_total: number;
  leader_player_id: string; created_at: string;
  metadata: Record<string, unknown>;
}
export interface ClanMember {
  id: string; player_id: string; role: string;
  contribution_accumulated: number; joined_at: string;
  display_name: string;
}
export interface ClanWar {
  id: string; reference_id: string; status: string;
  clan_a_id: string; clan_b_id: string;
  clan_a_name: string; clan_b_name: string;
  created_at: string; resolved_at: string | null;
  rewards_json: Record<string, unknown>;
}
export interface PlayerClanData {
  myClan:       Clan | null;
  myMembership: ClanMember | null;
  members:      ClanMember[];
  activeWars:   ClanWar[];
  allClans:     Clan[];
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players")
    .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getPlayerClanData(): Promise<DomainResult<PlayerClanData>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver los Clanes." };

  const { data: membershipRows } = await supabase
    .from("clan_members")
    .select("id,player_id,clan_id,role,contribution_accumulated,joined_at")
    .eq("player_id", playerId)
    .limit(1);

  const myMembershipRaw = membershipRows?.[0] ?? null;

  let myClanData: Clan | null = null;
  let membersData: ClanMember[] = [];
  let activeWarsData: ClanWar[] = [];
  let allClansData: Clan[] = [];

  if (myMembershipRaw) {
    const clanId = myMembershipRaw.clan_id;
    const [clanRes, membersRes, warsRes] = await Promise.all([
      supabase.from("clans").select("*").eq("id", clanId).maybeSingle(),
      supabase.from("clan_members")
        .select("id,player_id,role,contribution_accumulated,joined_at")
        .eq("clan_id", clanId).order("contribution_accumulated", { ascending: false }).limit(20),
      supabase.from("clan_wars")
        .select("*")
        .or(`clan_a_id.eq.${clanId},clan_b_id.eq.${clanId}`)
        .order("created_at", { ascending: false }).limit(10),
    ]);

    myClanData = clanRes.data as Clan ?? null;

    const memberIds = (membersRes.data ?? []).map((m: any) => m.player_id as string);
    let nameMap: Record<string, string> = {};
    if (memberIds.length > 0) {
      const { data: players } = await supabase.from("players")
        .select("id,display_name").in("id", memberIds);
      for (const p of players ?? []) nameMap[p.id] = p.display_name ?? "Guerrero";
    }
    membersData = (membersRes.data ?? []).map((m: any) => ({
      ...m, display_name: nameMap[m.player_id] ?? "Guerrero",
    })) as ClanMember[];

    const warClanIds = [...new Set((warsRes.data ?? []).flatMap((w: any) => [w.clan_a_id, w.clan_b_id] as string[]))];
    let clanNameMap: Record<string, string> = {};
    if (warClanIds.length > 0) {
      const { data: clans } = await supabase.from("clans").select("id,name").in("id", warClanIds);
      for (const c of clans ?? []) clanNameMap[c.id] = c.name;
    }
    activeWarsData = (warsRes.data ?? []).map((w: any) => ({
      ...w,
      clan_a_name: clanNameMap[w.clan_a_id] ?? "Clan A",
      clan_b_name: clanNameMap[w.clan_b_id] ?? "Clan B",
    })) as ClanWar[];
  } else {
    const { data: allClans } = await supabase.from("clans")
      .select("*").order("prestige", { ascending: false }).limit(20);
    allClansData = (allClans ?? []) as Clan[];
  }

  const myMembership: ClanMember | null = myMembershipRaw
    ? { ...myMembershipRaw, display_name: membersData.find(m => m.player_id === playerId)?.display_name ?? "Guerrero" }
    : null;

  return {
    status: "ready",
    data: { myClan: myClanData, myMembership, members: membersData, activeWars: activeWarsData, allClans: allClansData },
  };
}

// ---- E.2.c: Guild Wars ----

export async function startGuildWar(
  opponentClanId: string
): Promise<DomainResult<{ ok: boolean; war_id?: string; message?: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para iniciar una guerra." };

  // Get own clan
  const { data: memberRow } = await supabase.from("clan_members")
    .select("clan_id").eq("player_id", playerId).limit(1).maybeSingle();
  if (!memberRow?.clan_id) return { status: "ready", data: { ok: false, message: "No perteneces a un Clan." } };

  const { data, error } = await supabase.rpc("vexforge_start_guild_war", {
    p_clan_a_id: memberRow.clan_id,
    p_clan_b_id: opponentClanId,
    p_metadata: {},
  });

  if (error) return { status: "ready", data: { ok: false, message: error.message } };
  const res = data as any;
  const ok = res?.ok !== false && !res?.error;
  return {
    status: "ready",
    data: { ok, war_id: res?.war_id ?? res?.id, message: ok ? "¡Guerra declarada!" : (res?.reason ?? res?.message ?? "Error al iniciar la guerra.") },
  };
}

export async function joinClan(
  clanId: string
): Promise<DomainResult<{ ok: boolean; message?: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para unirte a un Clan." };

  const { data, error } = await supabase.rpc("join_clan", {
    p_clan_id: clanId,
    p_player_id: playerId,
  });

  if (error) return { status: "ready", data: { ok: false, message: error.message } };
  const res = data as any;
  const ok = res?.ok !== false && !res?.error;
  return { status: "ready", data: { ok, message: ok ? "¡Te uniste al Clan!" : (res?.reason ?? "Error al unirse.") } };
}

export async function leaveClan(): Promise<DomainResult<{ ok: boolean; message?: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión primero." };

  const { data, error } = await supabase.rpc("leave_clan", { p_player_id: playerId });
  if (error) return { status: "ready", data: { ok: false, message: error.message } };
  const res = data as any;
  const ok = res?.ok !== false && !res?.error;
  return { status: "ready", data: { ok, message: ok ? "Saliste del Clan." : (res?.reason ?? "Error al salir.") } };
}

export async function createClan(
  name: string,
  description: string
): Promise<DomainResult<{ ok: boolean; clan_id?: string; message?: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para crear un Clan." };

  const { data, error } = await supabase.rpc("create_clan", {
    p_name: name.trim(),
    p_description: description.trim(),
  });

  if (error) return { status: "ready", data: { ok: false, message: error.message } };
  const res = data as any;
  const ok = res?.ok !== false && !res?.error;
  return { status: "ready", data: { ok, clan_id: res?.clan_id ?? res?.id, message: ok ? "¡Clan creado!" : (res?.reason ?? "Error al crear el Clan.") } };
}
