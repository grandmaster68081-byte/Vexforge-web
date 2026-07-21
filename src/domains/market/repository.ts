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
  card_name: string | null;
  card_rarity: string | null;
}

export interface OwnedCard {
  id: string;          // player_cards.id (= player_card_id)
  card_id: string;
  card_name: string | null;
  card_rarity: string | null;  // v5.13: added rarity for sell form display
  quantity: number;
  locked: boolean;
  listed: boolean;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return null;
  const { data } = await supabase
    .from("players")
    .select("id")
    .eq("auth_user_id", sessionData.session.user.id)
    .maybeSingle();
  return data?.id ?? null;
}

export async function listOpenListings(): Promise<DomainResult<MarketListing[]>> {
  const { data, error } = await supabase
    .from("market_listings")
    .select(`
      id, reference_id, player_id, player_card_id,
      price, fee, status, expires_at, locked,
      player_cards!player_card_id(cards!card_id(name, rarity))
    `)
    .eq("status", "active")
    .order("price", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };

  return {
    status: "ready",
    data: (data as any[]).map((row) => ({
      id:             row.id,
      reference_id:   row.reference_id,
      player_id:      row.player_id,
      player_card_id: row.player_card_id,
      price:          row.price,
      fee:            row.fee,
      status:         row.status,
      expires_at:     row.expires_at,
      locked:         row.locked,
      card_name:      row.player_cards?.cards?.name ?? null,
      card_rarity:    row.player_cards?.cards?.rarity ?? null,
    })) as MarketListing[],
  };
}

/**
 * v5.13 FIX: now includes rarity from the cards join so the sell form
 * can show the rarity badge when a card is selected.
 */
export async function listMyCards(): Promise<DomainResult<OwnedCard[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to view your cards." };

  const { data, error } = await supabase
    .from("player_cards")
    .select("id, card_id, quantity, locked, listed, cards!card_id(name, rarity)")
    .eq("player_id", playerId)
    .eq("listed", false)
    .eq("locked", false);

  if (error) return { status: "ready", data: null, reason: error.message };
  return {
    status: "ready",
    data: (data as any[]).map((row) => ({
      id:          row.id,
      card_id:     row.card_id,
      card_name:   row.cards?.name ?? null,
      card_rarity: row.cards?.rarity ?? null,
      quantity:    row.quantity,
      locked:      row.locked,
      listed:      row.listed,
    })) as OwnedCard[],
  };
}

/**
 * Creates a market listing via the create_listing SECURITY DEFINER RPC.
 * Direct INSERT is blocked by the market_no_write RLS policy (qual: false).
 * RPC signature: create_listing(p_player_id, p_player_card_id, p_price, p_reference_id, p_fee, p_expires_at, p_metadata)
 */
export async function createListing(
  playerCardId: string,
  price: number,
  _fee?: number,
): Promise<DomainResult<{ listingId: string }>> {
  if (price <= 0) return { status: "ready", data: null, reason: "El precio debe ser mayor que 0." };
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to create a listing." };

  const referenceId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { data, error } = await supabase.rpc("create_listing", {
    p_player_id:      playerId,
    p_player_card_id: playerCardId,
    p_price:          price,
    p_reference_id:   referenceId,
    p_fee:            _fee ?? 0,
    p_expires_at:     null,
    p_metadata:       {},
  });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { listingId: data as string } };
}

/**
 * Buy a listing.
 * Verified signature: buy_listing(p_buyer_id, p_listing_id, p_metadata, p_reference_id)
 */
export async function buyListing(listingId: string): Promise<DomainResult<{ ok: boolean }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to buy." };

  const referenceId = `web-buy-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.rpc("buy_listing", {
    p_buyer_id:     playerId,
    p_listing_id:   listingId,
    p_metadata:     {},
    p_reference_id: referenceId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { ok: true } };
}

/**
 * Cancel own listing.
 * Verified signature: cancel_listing(p_listing_id, p_metadata, p_player_id, p_reference_id)
 */
export async function cancelListing(listingId: string): Promise<DomainResult<{ ok: boolean }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to cancel." };

  const referenceId = `web-cancel-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const { error } = await supabase.rpc("cancel_listing", {
    p_listing_id:   listingId,
    p_metadata:     {},
    p_player_id:    playerId,
    p_reference_id: referenceId,
  });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { ok: true } };
}
