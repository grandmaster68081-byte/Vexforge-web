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
  id: string;
  card_id: string;
  card_name: string | null;
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

/**
 * Fetches active listings with card name via nested FK join.
 * Falls back to base query without join if PostgREST rejects the hint syntax.
 */
export async function listOpenListings(): Promise<DomainResult<MarketListing[]>> {
  const { data, error } = await supabase
    .from("market_listings")
    .select(`
      id, reference_id, player_id, player_card_id,
      price, fee, status, expires_at, locked,
      player_cards!player_card_id(
        cards!card_id(name, rarity)
      )
    `)
    .eq("status", "active")
    .order("price", { ascending: true });

  if (error) {
    const { data: fb, error: fbErr } = await supabase
      .from("market_listings")
      .select("id, reference_id, player_id, player_card_id, price, fee, status, expires_at, locked")
      .eq("status", "active")
      .order("price", { ascending: true });
    if (fbErr) return { status: "ready", data: null, reason: fbErr.message };
    return {
      status: "ready",
      data: (fb ?? []).map((r: any) => ({ ...r, card_name: null, card_rarity: null })) as MarketListing[],
    };
  }

  const listings = (data as any[]).map((row) => {
    const card = row.player_cards?.cards;
    return {
      id: row.id, reference_id: row.reference_id,
      player_id: row.player_id, player_card_id: row.player_card_id,
      price: row.price, fee: row.fee, status: row.status,
      expires_at: row.expires_at, locked: row.locked,
      card_name: card?.name ?? null,
      card_rarity: card?.rarity ?? null,
    } as MarketListing;
  });

  return { status: "ready", data: listings };
}

/** Owned cards the signed-in player can list (not locked, not already listed). */
export async function listMyUnlockedCards(): Promise<DomainResult<OwnedCard[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your cards." };

  const { data, error } = await supabase
    .from("player_cards")
    .select("id, card_id, quantity, locked, listed, cards!card_id(name)")
    .eq("player_id", playerId)
    .eq("locked", false)
    .eq("listed", false);

  if (error) return { status: "ready", data: null, reason: error.message };

  return {
    status: "ready",
    data: (data as any[]).map((row) => ({
      id: row.id, card_id: row.card_id,
      card_name: row.cards?.name ?? null,
      quantity: row.quantity, locked: row.locked, listed: row.listed,
    })) as OwnedCard[],
  };
}

/**
 * Create a market listing via direct INSERT.
 * The player_own_cards INSERT policy allows owners to list their own unlocked cards.
 * Reference ID is generated client-side to guarantee idempotency on retry.
 */
export async function createListing(
  playerCardId: string,
  price: number,
  _fee?: number,
): Promise<DomainResult<{ listingId: string }>> {
  if (price <= 0) return { status: "ready", data: null, reason: "Price must be greater than 0." };

  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to create a listing." };

  const referenceId = `web-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const { data, error } = await supabase
    .from("market_listings")
    .insert({
      player_id: playerId,
      player_card_id: playerCardId,
      price,
      fee: 0,
      status: "active",
      reference_id: referenceId,
      locked: false,
      metadata: {},
    })
    .select("id")
    .single();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { listingId: data.id } };
}

/** Buy a listing — uses RPC buy_listing (verified working). */
export async function buyListing(
  listingId: string,
): Promise<DomainResult<{ ok: boolean }>> {
  const { error } = await supabase.rpc("buy_listing", { p_listing_id: listingId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { ok: true } };
}

/** Cancel a listing — uses RPC cancel_listing (verified working). */
export async function cancelListing(
  listingId: string,
): Promise<DomainResult<{ ok: boolean }>> {
  const { error } = await supabase.rpc("cancel_listing", { p_listing_id: listingId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { ok: true } };
}
