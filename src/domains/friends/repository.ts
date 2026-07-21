import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Friendship {
id: string; player_a_id: string; player_b_id: string;
status: "pending" | "accepted"; initiated_by: string; created_at: string;
friend_id: string; display_name: string; level: number;
}
export interface DirectChallenge {
id: string; challenger_id: string; challenged_id: string;
challenger_name?: string; status: string; created_at: string;
}

async function getMyPlayerId(): Promise<string | null> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players").select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

async function resolveNames(ids: string[]) {
if (!ids.length) return new Map<string, any>();
const { data } = await supabase.rpc("get_public_player_names", { p_player_ids: ids });
return new Map((data ?? []).map((n: any) => [n.id, n]));
}

export async function listMyFriends(): Promise<DomainResult<Friendship[]>> {
const myId = await getMyPlayerId();
if (!myId) return { status: "ready", data: null, reason: "Inicia sesión para continuar" };
const { data, error } = await supabase.from("friendships")
  .select("id,player_a_id,player_b_id,initiated_by,created_at").eq("status", "accepted")
  .or("player_a_id.eq." + myId + ",player_b_id.eq." + myId);
if (error) return { status: "ready", data: null, reason: error.message };
const friendIds = (data ?? []).map((f: any) => f.player_a_id === myId ? f.player_b_id : f.player_a_id);
const nameMap = await resolveNames(friendIds);
return {
  status: "ready", data: (data ?? []).map((f: any) => {
    const fid = f.player_a_id === myId ? f.player_b_id : f.player_a_id;
    const info: any = nameMap.get(fid) ?? {};
    return { ...f, status: "accepted" as const, friend_id: fid, display_name: info.display_name ?? "Guerrero", level: info.level ?? 1 };
  })
};
}

export async function listPendingReceived(): Promise<DomainResult<Friendship[]>> {
const myId = await getMyPlayerId();
if (!myId) return { status: "ready", data: null, reason: "Inicia sesión para continuar" };
const { data, error } = await supabase.from("friendships")
  .select("id,player_a_id,player_b_id,initiated_by,created_at").eq("status", "pending")
  .or("player_a_id.eq." + myId + ",player_b_id.eq." + myId).neq("initiated_by", myId);
if (error) return { status: "ready", data: null, reason: error.message };
const senderIds = (data ?? []).map((f: any) => f.initiated_by);
const nameMap = await resolveNames(senderIds);
return {
  status: "ready", data: (data ?? []).map((f: any) => {
    const info: any = nameMap.get(f.initiated_by) ?? {};
    return { ...f, status: "pending" as const, friend_id: f.initiated_by, display_name: info.display_name ?? "Guerrero", level: info.level ?? 1 };
  })
};
}

export async function listPendingChallenges(): Promise<DomainResult<DirectChallenge[]>> {
const myId = await getMyPlayerId();
if (!myId) return { status: "ready", data: null, reason: "Inicia sesión para continuar" };
const { data, error } = await supabase.from("direct_challenges")
  .select("id,challenger_id,challenged_id,status,created_at")
  .eq("challenged_id", myId).eq("status", "pending").order("created_at", { ascending: false });
if (error) return { status: "ready", data: null, reason: error.message };
if (!data?.length) return { status: "ready", data: [] };
const nameMap = await resolveNames(data.map((c: any) => c.challenger_id));
return { status: "ready", data: data.map((c: any) => ({ ...c, challenger_name: (nameMap.get(c.challenger_id) as any)?.display_name ?? "Guerrero" })) };
}

export async function sendFriendRequest(targetId: string): Promise<{ ok: boolean; reason?: string }> {
const { data, error } = await supabase.rpc("send_friend_request", { p_target_id: targetId });
if (error) return { ok: false, reason: error.message };
return data as { ok: boolean; reason?: string };
}
export async function acceptRequest(fid: string): Promise<{ ok: boolean }> {
const { data } = await supabase.rpc("accept_friend_request", { p_friendship_id: fid });
return (data ?? { ok: false }) as { ok: boolean };
}
export async function declineRequest(fid: string): Promise<{ ok: boolean }> {
const { data } = await supabase.rpc("decline_friend_request", { p_friendship_id: fid });
return (data ?? { ok: false }) as { ok: boolean };
}
export async function sendChallenge(challengedId: string): Promise<{ ok: boolean; reason?: string }> {
const { data, error } = await supabase.rpc("send_challenge", { p_challenged_id: challengedId });
if (error) return { ok: false, reason: error.message };
return data as { ok: boolean; reason?: string };
}
export async function respondToChallenge(cid: string, accept: boolean): Promise<{ ok: boolean }> {
const { data } = await supabase.rpc("respond_to_challenge", { p_challenge_id: cid, p_accept: accept });
return (data ?? { ok: false }) as { ok: boolean };
}