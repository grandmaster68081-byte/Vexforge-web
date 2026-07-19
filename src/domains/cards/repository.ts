import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface Card {
  id: string;
  code: string;
  name: string;
  rarity: string;
  faction: string;
  specialization: string | null;
  power: number;
  affinity: number;
  prestige: number;
  charge: number;
  lore: string | null;
  image_url: string | null;
  region_id: string | null;
  active: boolean;
  supply: number;
  minted: number;
  is_founder: boolean;
  is_legendary: boolean;
  card_tier: string | null;
  card_domain: string | null;
  marketable: boolean;
  fusion_enabled: boolean;
  release_status: string;
}

/**
 * Verified real read path (chat 21, vexforge_project_documents.verified_read_path_specs_v1):
 * RLS policy cards_public: SELECT, public, qual = true.
 * Table cards_no_write blocks all writes for public -- reads only, by design.
 */
export async function listActiveCards(): Promise<DomainResult<Card[]>> {
  const { data, error } = await supabase
    .from("cards")
    .select(
      "id, code, name, rarity, faction, specialization, power, affinity, prestige, charge, lore, image_url, region_id, active, supply, minted, is_founder, is_legendary, card_tier, card_domain, marketable, fusion_enabled, release_status"
    )
    .eq("active", true)
    .order("name", { ascending: true });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as Card[] };
}

export async function getCardByCode(code: string): Promise<DomainResult<Card>> {
  const { data, error } = await supabase
    .from("cards")
    .select("*")
    .eq("code", code)
    .single();

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as Card };
}