import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: string;
  status: string;
  created_at: string;
}

/**
 * Verified real read path (chat 21, verified_read_path_specs_v1):
 * RLS policy players_self requires auth.uid() = auth_user_id.
 * players_no_insert/no_update/no_delete confirm this table is
 * backend-managed -- read only from the frontend.
 * Wired chat 27 once a real auth provider existed (src/providers/AuthProvider.tsx).
 */
export async function getProfile(): Promise<DomainResult<PlayerProfile>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "No auth session. Sign in on the Account page first." };
  }

  const { data, error } = await supabase
    .from("players")
    .select("id, display_name, email, role, status, created_at")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  if (!data) {
    return {
      status: "ready",
      data: null,
      reason: "Signed in, but no players row exists yet for this auth user. Player provisioning is not part of this pass.",
    };
  }
  return { status: "ready", data: data as PlayerProfile };
}