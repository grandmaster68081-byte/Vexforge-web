import { supabase } from "../../lib/supabase";
    import type { DomainResult } from "../../shared/types/domain";

    export interface Clan {
    id: string;
    code: string;
    name: string;
    leader_player_id: string;
    prestige: number;
    contribution_total: number;
    }

    export interface ClanMember {
    id: string;
    clan_id: string;
    player_id: string;
    display_name: string | null;
    role: string;
    joined_at: string;
    contribution_accumulated: number;
    }

    export interface ClanWar {
    id: string;
    reference_id: string;
    clan_a_id: string;
    clan_b_id: string;
    status: string;
    created_at: string;
    resolved_at: string | null;
    }

    async function getCurrentPlayerId(): Promise<string | null> {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;
    const { data } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", sessionData.session.user.id)
      .maybeSingle();
    return data?.id ?? null;
    }

    /** VERIFIED chat 32: clans_public RLS (SELECT, public). Read-only — no write RPCs defined. */
    export async function listTopClans(): Promise<DomainResult<Clan[]>> {
    const { data, error } = await supabase
      .from("clans")
      .select("id, code, name, leader_player_id, prestige, contribution_total")
      .order("prestige", { ascending: false })
      .limit(50);
    if (error) return { status: "ready", data: null, reason: error.message };
    return { status: "ready", data: data as Clan[] };
    }

    /**
    * VERIFIED chat 32: read_all RLS on clan_members.
    * Attempts to join players!player_id for display_name.
    * players_self RLS means only the current user's own row returns a name;
    * all other members gracefully fall back to null → UUID shown in route.
    */
    export async function listClanMembers(clanId: string): Promise<DomainResult<ClanMember[]>> {
    const { data, error } = await supabase
      .from("clan_members")
      .select("id, clan_id, player_id, role, joined_at, contribution_accumulated, players!player_id(display_name)")
      .eq("clan_id", clanId)
      .order("contribution_accumulated", { ascending: false });

    if (error) {
      // Fallback without join
      const { data: fb, error: fbErr } = await supabase
        .from("clan_members")
        .select("id, clan_id, player_id, role, joined_at, contribution_accumulated")
        .eq("clan_id", clanId)
        .order("contribution_accumulated", { ascending: false });
      if (fbErr) return { status: "ready", data: null, reason: fbErr.message };
      return { status: "ready", data: (fb ?? []).map((r: any) => ({ ...r, display_name: null })) as ClanMember[] };
    }

    return {
      status: "ready",
      data: (data as any[]).map((row) => ({
        id: row.id, clan_id: row.clan_id, player_id: row.player_id,
        display_name: row.players?.display_name ?? null,
        role: row.role, joined_at: row.joined_at,
        contribution_accumulated: row.contribution_accumulated,
      })) as ClanMember[],
    };
    }

    /** VERIFIED chat 32: read_all RLS on clan_wars. Filtered to signed-in player's clan. */
    export async function listMyClanWars(): Promise<DomainResult<ClanWar[]>> {
    const playerId = await getCurrentPlayerId();
    if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your clan's wars." };

    const { data: membership } = await supabase
      .from("clan_members").select("clan_id").eq("player_id", playerId).maybeSingle();
    if (!membership) return { status: "ready", data: [] };

    const { data, error } = await supabase
      .from("clan_wars")
      .select("id, reference_id, clan_a_id, clan_b_id, status, created_at, resolved_at")
      .or(`clan_a_id.eq.${membership.clan_id},clan_b_id.eq.${membership.clan_id}`)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) return { status: "ready", data: null, reason: error.message };
    return { status: "ready", data: data as ClanWar[] };
    }
    