import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface MarketListing {
  id: string;
  reference_id: string;
  player_id: string;
  player_card_id: string;
  price: number;
  fee: number;
  status: string;
  expires_at: string | null;
  locked: boolean;
}

/**
 * Verified real read path (chat 21): RLS policy market_public,
 * SELECT, public, qual = true.
 */
export async function listOpenListings(): Promise<DomainResult<MarketListing[]>> {
  const { data, error } = await supabase
    .from("market_listings")
    .select("id, reference_id, player_id, player_card_id, price, fee, status, expires_at, locked")
    .eq("status", "open")
    .order("price", { ascending: true });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as MarketListing[] };
}

/**
 * NOT IMPLEMENTED ON PURPOSE.
 * market_write_owner (INSERT, public) exists but its owner-scoping qual was
 * not fully verified in chat 21, and there is no auth session to scope it to
 * yet. Wire this only after auth exists and the INSERT policy qual is
 * re-checked. See backend/pending/auth-and-writes.md.
 */
export async function createListing(): Promise<DomainResult<never>> {
  return {
    status: "blocked_auth",
    data: null,
    reason:
      "createListing intentionally not implemented: needs a real auth session plus verification of market_write_owner's INSERT qual before any write path is trusted.",
  };
}
