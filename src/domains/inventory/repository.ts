import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface InventoryItem {
  id: string;
  user_id: string;
  item_type: string | null;
  item_name: string | null;
  rarity: string | null;
  quantity: number;
  created_at: string;
}

/**
 * RLS: authenticated_read_own_inventory — user_id = auth.uid()
 * GRANT SELECT applied session 38 (2026-07-18). Table now live via PostgREST.
 * Schema verified: id, user_id, item_type, item_name, rarity, quantity, created_at
 */
export async function getInventory(): Promise<DomainResult<InventoryItem[]>> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) {
    return {
      status: "blocked_auth",
      data: null,
      reason: "Sign in to view your inventory.",
    };
  }

  const { data, error } = await supabase
    .from("inventory")
    .select("id, user_id, item_type, item_name, rarity, quantity, created_at")
    .order("created_at", { ascending: false });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as InventoryItem[] };
}
