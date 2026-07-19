import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PlayerCardEntry {
player_card_id: string;
card_id: string;
quantity: number;
locked: boolean;
listed: boolean;
name: string;
rarity: string;
faction: string;
power: number;
affinity: number;
prestige: number;
charge: number;
lore: string | null;
code: string;
}

export interface DeckSlot {
slot_number: number;
card_id: string;
name: string;
rarity: string;
faction: string;
power: number;
code: string;
}

async function getCurrentPlayerId(): Promise<string | null> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return null;
const { data } = await supabase.from("players").select("id")
  .eq("auth_user_id", s.session.user.id).maybeSingle();
return data?.id ?? null;
}

export async function getMyCards(): Promise<DomainResult<PlayerCardEntry[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view your cards." };
const { data, error } = await supabase
  .from("player_cards")
  .select(`id, card_id, quantity, locked, listed,
    cards!inner(code, name, rarity, faction, power, affinity, prestige, charge, lore)`)
  .eq("player_id", playerId)
  .gt("quantity", 0)
  .order("quantity", { ascending: false });
if (error) return { status: "ready", data: null, reason: error.message };
const mapped = (data ?? []).map((row: any) => ({
  player_card_id: row.id,
  card_id: row.card_id,
  quantity: row.quantity,
  locked: row.locked,
  listed: row.listed,
  code: row.cards.code,
  name: row.cards.name,
  rarity: row.cards.rarity,
  faction: row.cards.faction,
  power: row.cards.power,
  affinity: row.cards.affinity,
  prestige: row.cards.prestige,
  charge: row.cards.charge,
  lore: row.cards.lore,
}));
return { status: "ready", data: mapped };
}

export async function getMyDeck(): Promise<DomainResult<DeckSlot[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view your deck." };
const { data, error } = await supabase
  .from("player_deck")
  .select(`slot_number, card_id,
    cards!inner(code, name, rarity, faction, power)`)
  .eq("player_id", playerId)
  .order("slot_number", { ascending: true });
if (error) return { status: "ready", data: null, reason: error.message };
const mapped = (data ?? []).map((row: any) => ({
  slot_number: row.slot_number,
  card_id: row.card_id,
  code: row.cards.code,
  name: row.cards.name,
  rarity: row.cards.rarity,
  faction: row.cards.faction,
  power: row.cards.power,
}));
return { status: "ready", data: mapped };
}

export async function saveDeck(cardIds: string[]): Promise<DomainResult<{ slots_saved: number }>> {
const { data: s } = await supabase.auth.getSession();
if (!s.session) return { status: "blocked_auth", data: null, reason: "Sign in to save your deck." };
const { data, error } = await supabase.rpc("save_deck", { p_card_ids: cardIds });
if (error) return { status: "ready", data: null, reason: error.message };
const res = data as { ok: boolean; slots_saved?: number; reason?: string };
if (!res.ok) return { status: "ready", data: null, reason: res.reason ?? "Save failed" };
return { status: "ready", data: { slots_saved: res.slots_saved ?? cardIds.length } };
}

export async function validateDeck(cardIds: string[]): Promise<{
valid: boolean; errors: string[]; card_count: number; mythic_count: number; legendary_count: number;
}> {
const { data } = await supabase.rpc("validate_deck", { p_card_ids: cardIds });
return data ?? { valid: false, errors: ["Validation failed"], card_count: 0, mythic_count: 0, legendary_count: 0 };
}