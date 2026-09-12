import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Cosmetic {
  id: string; code: string; name: string; cosmetic_type: string;
  description: string; rarity: string; preview_url: string | null;
  obtainable_via: string[]; metadata: Record<string, any>;
}
export interface PlayerCosmetic {
  id: string; player_id: string; cosmetic_id: string;
  equipped: boolean; obtained_via: string; obtained_at: string;
}
export interface PlayerActiveBoost {
  id: string; player_id: string; boost_type: string;
  multiplier: number; expires_at: string; created_at: string;
}
export interface PlayerConsumable {
  id: string; player_id: string; item_key: string; quantity: number; created_at: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function listCosmetics(): Promise<DomainResult<Cosmetic[]>> {
  const { data, error } = await supabase.from("cosmetics")
    .select("id, code, name, cosmetic_type, description, rarity, preview_url, obtainable_via, metadata")
    .eq("active", true).order("rarity").order("name");
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as Cosmetic[] };
}

export async function getMyCosmetics(): Promise<DomainResult<PlayerCosmetic[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view your cosmetics." };
  const { data, error } = await supabase.from("player_cosmetics")
    .select("id, player_id, cosmetic_id, equipped, obtained_via, obtained_at")
    .eq("player_id", playerId);
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as PlayerCosmetic[] };
}

/** Boosts XP activos del jugador. Solo devuelve los que no han expirado. */
export async function getMyActiveBoosts(): Promise<DomainResult<PlayerActiveBoost[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus boosts." };
  const { data, error } = await supabase
    .from("player_active_boosts")
    .select("id, player_id, boost_type, multiplier, expires_at, created_at")
    .eq("player_id", playerId)
    .gt("expires_at", new Date().toISOString())
    .order("expires_at", { ascending: true });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as PlayerActiveBoost[] };
}

/** Consumibles del jugador (raid_key, etc.) con cantidad > 0. */
export async function getMyConsumables(): Promise<DomainResult<PlayerConsumable[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus consumibles." };
  const { data, error } = await supabase
    .from("player_consumables")
    .select("id, player_id, item_key, quantity, created_at")
    .eq("player_id", playerId)
    .gt("quantity", 0)
    .order("created_at", { ascending: false });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as PlayerConsumable[] };
}

export async function equipCosmetic(cosmeticId: string, slot: string): Promise<DomainResult<{ ok: boolean }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para equipar." };
  const { error } = await supabase.rpc("equip_cosmetic", { p_cosmetic_id: cosmeticId, p_slot: slot });
  if (error) return { status: "ready", data: { ok: false }, reason: error.message };
  return { status: "ready", data: { ok: true } };
}

export async function unequipCosmetic(cosmeticId: string): Promise<DomainResult<{ ok: boolean }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para desequipar." };
  const { error } = await supabase.from("equipped_cosmetics")
    .delete().eq("player_id", playerId).eq("cosmetic_id", cosmeticId);
  if (error) return { status: "ready", data: { ok: false }, reason: error.message };
  return { status: "ready", data: { ok: true } };
}