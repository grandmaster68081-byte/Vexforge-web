import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Cosmetic {
  id: string; code: string; name: string; cosmetic_type: string;
  description: string; rarity: string; obtainable_via: string[]; metadata: Record<string, any>;
}

export interface PlayerCosmetic {
  id: string; player_id: string; cosmetic_id: string;
  equipped: boolean; obtained_via: string; obtained_at: string;
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
    .select("id, code, name, cosmetic_type, description, rarity, obtainable_via, metadata")
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
  // Direct table delete — no RPC for unequip; player_cosmetics has RLS self policy
  const { error } = await supabase.from("equipped_cosmetics")
    .delete().eq("player_id", playerId).eq("cosmetic_id", cosmeticId);
  if (error) return { status: "ready", data: { ok: false }, reason: error.message };
  return { status: "ready", data: { ok: true } };
}
