import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerShard {
  id: string;
  player_id: string;
  shard_rarity: string;
  quantity: number;
  updated_at: string;
}

// Shard values per rarity (grant on duplicate open) & forge thresholds
export const SHARD_VALUES: Record<string, { grant: number; forge: number }> = {
  Common:    { grant:    25, forge:   100 },
  Uncommon:  { grant:    75, forge:   400 },
  Rare:      { grant:   200, forge:  1200 },
  Epic:      { grant:   500, forge:  4000 },
  Legendary: { grant:  1000, forge: 15000 },
  Mythic:    { grant:  2500, forge: 50000 },
};

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getMyShards(): Promise<DomainResult<PlayerShard[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesión para ver tus fragmentos." };
  const { data, error } = await supabase
    .from("vexforge_player_shards")
    .select("id, player_id, shard_rarity, quantity, updated_at")
    .eq("player_id", playerId)
    .order("shard_rarity");
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as PlayerShard[] };
}

export async function grantShardsForDuplicate(
  rarity: string,
  amount: number,
): Promise<{ ok: boolean; reason?: string }> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { ok: false, reason: "not_authenticated" };
  const { error } = await supabase.from("vexforge_player_shards").upsert(
    { player_id: playerId, shard_rarity: rarity, quantity: amount },
    { onConflict: "player_id,shard_rarity" },
  );
  return { ok: !error, reason: error?.message };
}

export async function getOwnedCardIds(playerId: string): Promise<string[]> {
  const { data } = await supabase
    .from("player_cards")
    .select("card_id")
    .eq("player_id", playerId)
    .gt("quantity", 0);
  return (data ?? []).map((r: any) => r.card_id as string);
}
