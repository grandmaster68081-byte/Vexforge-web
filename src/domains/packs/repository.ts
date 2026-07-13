import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PackCatalogEntry {
  pack_key: string;
  pack_name: string;
  price_usdt: number;
  active: boolean;
  notes: string | null;
}

export interface PackOrder {
  id: string;
  pack_key: string;
  price_usdt: number;
  status: string;
  payment_reference: string | null;
  tx_hash: string | null;
  created_at: string;
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
 * VERIFIED chat 30: RLS policy read_all on vexforge_pack_catalog (SELECT, public, qual=true).
 * Anon-safe, no auth required.
 */
export async function listActivePacks(): Promise<DomainResult<PackCatalogEntry[]>> {
  const { data, error } = await supabase
    .from("vexforge_pack_catalog")
    .select("pack_key, pack_name, price_usdt, active, notes")
    .eq("active", true)
    .order("price_usdt", { ascending: true });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PackCatalogEntry[] };
}

/**
 * VERIFIED chat 30: RLS policy player_read_own_orders on vexforge_pack_orders
 * (SELECT, authenticated, qual = players.auth_user_id = auth.uid() via player_id join).
 */
export async function listMyOrders(): Promise<DomainResult<PackOrder[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to see your pack orders." };
  }
  const { data, error } = await supabase
    .from("vexforge_pack_orders")
    .select("id, pack_key, price_usdt, status, payment_reference, tx_hash, created_at")
    .eq("player_id", playerId)
    .order("created_at", { ascending: false });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as PackOrder[] };
}

/**
 * WIRED chat 30: goes through vexforge_create_pack_order() RPC (SECURITY DEFINER, fixed
 * search_path, verified in the chat30 RPC audit) -- never a direct INSERT. This is a real
 * crypto (USDT) payment order: the RPC is responsible for recording the treasury wallet
 * address and payment reference correctly. p_player_wallet_address is the buyer's own
 * payout/refund address, supplied by the player, not looked up automatically.
 */
export async function createPackOrder(
  packKey: string,
  playerWalletAddress: string
): Promise<DomainResult<{ orderId: string }>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to order a pack." };
  }
  if (!playerWalletAddress) {
    return { status: "ready", data: null, reason: "A payout wallet address is required." };
  }

  const paymentReference = crypto.randomUUID();
  const { data, error } = await supabase.rpc("vexforge_create_pack_order", {
    p_player_id: playerId,
    p_pack_key: packKey,
    p_payment_reference: paymentReference,
    p_player_wallet_address: playerWalletAddress,
  });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: { orderId: data as string } };
}
