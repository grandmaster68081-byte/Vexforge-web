import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerSettings {
  player_id: string;
  telegram_enabled: boolean;
  notifications_enabled: boolean;
  language: string;
  timezone: string;
  ui_mode: string;
}

/**
 * Verified real read path (chat 21, verified_read_path_specs_v1):
 * player_own_settings policy (ALL, authenticated, player_id matches
 * players.auth_user_id). Confirmed columns: telegram_enabled,
 * notifications_enabled, language, timezone, ui_mode.
 * Wired chat 27 once a real auth provider existed. Write is technically
 * allowed by the ALL policy scoped to owner, but not implemented in this
 * pass -- read-only for now, matching the other newly-wired domains.
 */
export async function getSettings(): Promise<DomainResult<PlayerSettings>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "No auth session. Sign in on the Account page first." };
  }

  const { data, error } = await supabase
    .from("player_settings")
    .select("player_id, telegram_enabled, notifications_enabled, language, timezone, ui_mode")
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  if (!data) {
    return { status: "ready", data: null, reason: "Signed in, but no player_settings row exists yet for this player." };
  }
  return { status: "ready", data: data as PlayerSettings };
}
