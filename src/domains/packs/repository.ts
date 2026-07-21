import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface PackCatalogEntry {
pack_key: string;
pack_name: string;
price_usdt: number;
active: boolean;
notes: string | null;
metadata: {
  card_count?: number;
  rarity_weights?: Record<string, number>;
} | null;
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

export interface OpenedCard {
card_id: string;
name: string;
rarity: string;
faction: string;
power: number;
image_url?: string | null;
quantity_change?: number;
}

export interface OpenPackResult {
ok: boolean;
cards?: OpenedCard[];
pack_key?: string;
card_count?: number;
reason?: string;
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

export async function listActivePacks(): Promise<DomainResult<PackCatalogEntry[]>> {
const { data, error } = await supabase
  .from("vexforge_pack_catalog")
  .select("pack_key, pack_name, price_usdt, active, notes, metadata")
  .eq("active", true)
  .order("price_usdt", { ascending: true });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as PackCatalogEntry[] };
}

export async function listMyOrders(): Promise<DomainResult<PackOrder[]>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to see your orders." };
const { data, error } = await supabase
  .from("vexforge_pack_orders")
  .select("id, pack_key, price_usdt, status, payment_reference, tx_hash, created_at")
  .eq("player_id", playerId)
  .order("created_at", { ascending: false });
if (error) return { status: "ready", data: null, reason: error.message };
return { status: "ready", data: data as PackOrder[] };
}

export async function createPackOrder(
packKey: string,
playerWalletAddress: string
): Promise<DomainResult<{ orderId: string }>> {
const playerId = await getCurrentPlayerId();
if (!playerId) return { status: "blocked_auth", data: null, reason: "Sign in to order a pack." };
if (!playerWalletAddress) return { status: "ready", data: null, reason: "A wallet address is required." };
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

export async function openPack(orderId: string): Promise<DomainResult<OpenPackResult>> {
const { data: sessionData } = await supabase.auth.getSession();
if (!sessionData.session) return { status: "blocked_auth", data: null, reason: "Sign in to open packs." };
const { data, error } = await supabase.rpc("vexforge_open_pack", { p_order_id: orderId });
if (error) return { status: "ready", data: null, reason: error.message };
const result = data as OpenPackResult;
return { status: "ready", data: result };
}