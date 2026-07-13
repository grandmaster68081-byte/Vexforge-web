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

export interface OwnedCard {
  id: string; // player_cards.id -- this is what create_listing needs as p_player_card_id
  card_id: string;
  quantity: number;
  locked: boolean;
  listed: boolean;
}

/**
 * Verified real read path (chat 21): RLS policy market_public, SELECT, public, qual = true.
 * FIXED (chat28): the canonical status written by create_listing/buy_listing/cancel_listing
 * is 'active', not 'open' -- the previous filter meant this never returned live listings.
 */
export async function listOpenListings(): Promise<DomainResult<MarketListing[]>> {
  const { data, error } = await supabase
    .from("market_listings")
    .select("id, reference_id, player_id, player_card_id, price, fee, status, expires_at, locked")
    .eq("status", "active")
    .order("price", { ascending: true });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as MarketListing[] };
}

async function getCurrentPlayerId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();
  return data?.id ?? null;
}

/**
 * Cards the signed-in player owns and could list (not already locked/listed).
 * player_cards has a public read_all RLS policy; scoped client-side to the caller's own player_id.
 */
export async function listMyUnlockedCards(): Promise<DomainResult<OwnedCard[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to see your cards." };
  }
  const { data, error } = await supabase
    .from("player_cards")
    .select("id, card_id, quantity, locked, listed")
    .eq("player_id", playerId)
    .eq("locked", false)
    .eq("listed", false);

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as OwnedCard[] };
}

/**
 * WIRED (chat28): goes through the create_listing() RPC on purpose, not a raw INSERT.
 * The RPC re-verifies ownership, locks the card, and sets fee/status correctly.
 * A direct table INSERT would skip all of that (see vexforge_project_decisions,
 * chat28_market_write_path_decision). The direct-INSERT policy (market_write_owner)
 * was dropped in the same chat so this RPC is now the only write path.
 */
export async function createListing(
  playerCardId: string,
  price: number,
  fee = 0
): Promise<DomainResult<{ listingId: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to create a listing." };
  }
  if (!price || price <= 0) {
    return { status: "ready", data: null, reason: "Price must be greater than 0." };
  }

  const referenceId = crypto.randomUUID();
  const { data, error } = await supabase.rpc("create_listing", {
    p_player_id: playerId,
    p_player_card_id: playerCardId,
    p_price: price,
    p_reference_id: referenceId,
    p_fee: fee,
    p_expires_at: null,
    p_metadata: {},
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: { listingId: data as string } };
}

/**
 * WIRED (chat28): buy_listing() RPC handles wallet debit/credit, market fee ledger entry,
 * card ownership transfer, and listing status -- none of that is safe to do client-side.
 */
export async function buyListing(listingId: string): Promise<DomainResult<{ ok: boolean; price: number; fee: number }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to buy." };
  }
  const referenceId = crypto.randomUUID();
  const { data, error } = await supabase.rpc("buy_listing", {
    p_buyer_id: playerId,
    p_listing_id: listingId,
    p_reference_id: referenceId,
    p_metadata: {},
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as { ok: boolean; price: number; fee: number } };
}

/**
 * WIRED (chat28): cancel_listing() RPC re-checks ownership and unlocks the card.
 */
export async function cancelListing(listingId: string): Promise<DomainResult<{ status: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to cancel a listing." };
  }
  const referenceId = crypto.randomUUID();
  const { data, error } = await supabase.rpc("cancel_listing", {
    p_player_id: playerId,
    p_listing_id: listingId,
    p_reference_id: referenceId,
    p_metadata: {},
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: data as { status: string } };
}
