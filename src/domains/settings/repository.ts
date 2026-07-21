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

export type SettingsUpdate = Partial<Omit<PlayerSettings, "player_id">>;

/**
 * Verified real read path (chat 21, verified_read_path_specs_v1):
 * player_own_settings policy (ALL, authenticated, player_id matches
 * players.auth_user_id). Confirmed columns: telegram_enabled,
 * notifications_enabled, language, timezone, ui_mode.
 * Wired chat 27 once a real auth provider existed.
 */
export async function getSettings(): Promise<DomainResult<PlayerSettings>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "Inicia sesión en Mi Cuenta para continuar." };
  }

  const { data, error } = await supabase
    .from("player_settings")
    .select("player_id, telegram_enabled, notifications_enabled, language, timezone, ui_mode")
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  if (!data) {
    return { status: "ready", data: null, reason: "Sesión activa, pero no se encontraron ajustes de jugador." };
  }
  return { status: "ready", data: data as PlayerSettings };
}

/**
 * Write path — chat33.
 * player_own_settings policy is ALL (not just SELECT), owner-scoped.
 * Uses UPDATE directly — no RPC needed for settings (non-sensitive, no
 * economy/card mutations). Patch is partial: only fields provided are updated.
 */
export async function updateSettings(patch: SettingsUpdate): Promise<DomainResult<PlayerSettings>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return { status: "blocked_auth", data: null, reason: "Inicia sesión para continuar." };
  }

  // Resolve player_id for the WHERE clause
  const { data: playerRow } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();

  if (!playerRow) {
    return { status: "ready", data: null, reason: "No se encontró tu perfil de jugador." };
  }

  const { data, error } = await supabase
    .from("player_settings")
    .update(patch)
    .eq("player_id", playerRow.id)
    .select("player_id, telegram_enabled, notifications_enabled, language, timezone, ui_mode")
    .maybeSingle();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as PlayerSettings };
}