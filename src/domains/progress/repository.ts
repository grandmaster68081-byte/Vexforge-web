import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerProgress {
  id: string;
  player_id: string;
  level: number;
  xp: number;
  xp_to_next: number;
  energy: number;
  max_energy: number;
  tutorial_step: number;
  starter_region: string | null;
}

/**
 * Verified real read path (chat 21, verified_read_path_specs_v1):
 * RLS policy progress_self: auth.uid() = players.auth_user_id via join to players.
 * A bare select on player_progress is correctly scoped by RLS itself --
 * no manual join needed here.
 * Wired chat 27 once a real auth provider existed.
 */
export async function getProgress(): Promise<DomainResult<PlayerProgress>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "No auth session. Sign in on the Account page first." };
  }

  const { data, error } = await supabase
    .from("player_progress")
    .select("id, player_id, level, xp, xp_to_next, energy, max_energy, tutorial_step, starter_region")
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  if (!data) {
    return { status: "ready", data: null, reason: "Signed in, but no player_progress row exists yet for this player." };
  }
  return { status: "ready", data: data as PlayerProgress };
}