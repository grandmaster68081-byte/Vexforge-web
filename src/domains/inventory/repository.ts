import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerCard {
player_card_id: string;
card_id: string;
quantity: number;
locked: boolean;
listed: boolean;
source_tracking: string | null;
name: string;
code: string;
rarity: string;
faction: string;
specialization: string | null;
power: number;
affinity: number;
image_url: string | null;
synergy_json: Record<string,any> | null;
fusion_enabled: boolean;
marketable: boolean;
}

export async function getCurrentPlayerId(): Promise<string | null> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players")
  .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

export async function getPlayerCollection(): Promise<DomainResult<PlayerCard[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view your collection." };

const { data, error } = await supabase
  .from("player_cards")
  .select(`
    id,
    card_id,
    quantity,
    locked,
    listed,
    source_tracking,
    cards!inner(id, code, name, rarity, faction, specialization, power, affinity,
      image_url, synergy_json, fusion_enabled, marketable)
  `)
  .eq("player_id", playerId)
  .gt("quantity", 0)
  .order("card_id");

if (error) return { status: "ready", data: null, reason: error.message };

const mapped = (data ?? []).map((row: any) => ({
  player_card_id: row.id,
  card_id: row.card_id,
  quantity: row.quantity,
  locked: row.locked,
  listed: row.listed,
  source_tracking: row.source_tracking,
  name: row.cards?.name ?? "",
  code: row.cards?.code ?? "",
  rarity: row.cards?.rarity ?? "Common",
  faction: row.cards?.faction ?? "",
  specialization: row.cards?.specialization ?? null,
  power: row.cards?.power ?? 0,
  affinity: row.cards?.affinity ?? 0,
  image_url: row.cards?.image_url ?? null,
  synergy_json: row.cards?.synergy_json ?? null,
  fusion_enabled: row.cards?.fusion_enabled ?? false,
  marketable: row.cards?.marketable ?? false,
}));

return { status: "ready", data: mapped };
}