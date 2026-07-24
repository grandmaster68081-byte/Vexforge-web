import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface SeasonTier {
  tier: number; xp_required: number; is_premium: boolean;
  reward: Record<string, any>; unlocked: boolean;
  claimed?: boolean;
}

export interface SeasonProgress {
  ok: boolean; season_name?: string; season_number?: number;
  end_at?: string; player_xp?: number; current_tier?: number;
  is_premium?: boolean; tiers?: SeasonTier[]; reason?: string;
}

export interface ClaimResult {
  ok: boolean;
  rewards_granted?: Record<string, any>;
  vex_granted?: number;
  reason?: string;
}

// AO.3 — Resultado de crear una orden de Season Pass Premium
export interface SeasonPassOrderData {
  ok: boolean;
  order_id?: string;
  price_usdt?: number;
  treasury_wallet_address?: string;
  chain?: string;
  token_symbol?: string;
  token_standard?: string;
  idempotent_replay?: boolean;
  status?: string;
  fulfillment_status?: string;
  reason?: string;
}

export async function getCurrentPlayerId(): Promise<string | null> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return null;
  const { data } = await supabase.from("players").select("id")
    .eq("auth_user_id", s.session.user.id).maybeSingle();
  return data?.id ?? null;
}

export async function getSeasonProgress(): Promise<DomainResult<SeasonProgress>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para ver tu pase de temporada." };
  const { data, error } = await supabase.rpc("get_season_progress", { p_player_id: playerId });
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as SeasonProgress };
}

export async function claimSeasonTierReward(tier: number): Promise<DomainResult<ClaimResult>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) return { status: "blocked_auth", data: null, reason: "Inicia sesion para reclamar." };
  const { data, error } = await supabase.rpc("claim_season_pass_reward", {
    p_player_id: playerId,
    p_tier: tier,
  });
  if (error) return { status: "ready", data: { ok: false, reason: error.message } };
  return { status: "ready", data: (data ?? { ok: true }) as ClaimResult };
}

export async function claimAllUnlockedTiers(unclaimedTiers: number[]): Promise<{
  claimed: number[]; failed: number[];
}> {
  const claimed: number[] = [];
  const failed: number[] = [];
  for (const t of unclaimedTiers) {
    const res = await claimSeasonTierReward(t);
    if (res.data?.ok) claimed.push(t);
    else failed.push(t);
  }
  return { claimed, failed };
}

/**
 * AO.3 — Crea una orden de compra para Season Pass Premium.
 * Usa vexforge_create_shop_order. El fulfilment ocurre cuando el admin aprueba
 * en AdminShopOrdersRoute — vexforge_approve_shop_order setea is_premium=true automaticamente.
 */
export async function createSeasonPassOrder(): Promise<DomainResult<SeasonPassOrderData>> {
  const reference = "season-pass-" + (
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : String(Date.now()) + "-" + Math.random().toString(36).slice(2)
  );
  const { data, error } = await supabase.rpc("vexforge_create_shop_order", {
    p_item_key: "season_pass_premium",
    p_client_reference: reference,
    p_payment_reference: null,
    p_tx_hash: null,
    p_payer_wallet_address: null,
  });
  if (error) return { status: "ready", data: { ok: false, reason: error.message } };
  return { status: "ready", data: data as SeasonPassOrderData };
}

/**
 * AO.3 — Envía prueba de pago para una orden de Season Pass.
 * El admin aprueba y vexforge_approve_shop_order activa is_premium=true.
 */
export async function submitSeasonPassPayment(
  orderId: string,
  txHash: string,
  payerWallet: string,
): Promise<{ ok: boolean; reason?: string }> {
  const { data, error } = await supabase.rpc("vexforge_submit_shop_order_payment", {
    p_order_id: orderId,
    p_tx_hash: txHash.trim(),
    p_payer_wallet_address: payerWallet.trim(),
    p_payment_reference: null,
  });
  if (error) return { ok: false, reason: error.message };
  return (data ?? { ok: true }) as { ok: boolean; reason?: string };
}

/**
 * AO.3 — Verifica si el jugador ya tiene una orden pendiente de Season Pass (no rechazada).
 */
export async function getMyPendingSeasonPassOrder(): Promise<{
  hasPending: boolean;
  orderId?: string;
  status?: string;
  fulfillmentStatus?: string;
  txSubmitted?: boolean;
  treasuryWallet?: string;
}> {
  const { data, error } = await supabase.rpc("vexforge_get_my_shop_orders", { p_limit: 30 });
  if (error || !Array.isArray(data)) return { hasPending: false };
  const orders = data as Array<Record<string, any>>;
  const spOrder = orders.find(
    o => o.item_key === "season_pass_premium" && o.status !== "rejected"
  );
  if (!spOrder) return { hasPending: false };
  return {
    hasPending: true,
    orderId: spOrder.id,
    status: spOrder.status,
    fulfillmentStatus: spOrder.fulfillment_status,
    txSubmitted: !!spOrder.tx_hash,
    treasuryWallet: spOrder.treasury_wallet_address,
  };
}

export interface SeasonRanking {
  rank_position: number;
  mmr: number;
  wins: number;
  losses: number;
  draws: number;
  season_key: string;
  player_id: string;
  display_name?: string;
}

export async function getSeasonRankings(seasonKey?: string): Promise<DomainResult<SeasonRanking[]>> {
  let query = supabase
    .from("season_rankings")
    .select("rank_position, mmr, wins, losses, draws, season_key, player_id")
    .order("rank_position", { ascending: true })
    .limit(100);
  if (seasonKey) query = query.eq("season_key", seasonKey);
  const { data, error } = await query;
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: (data ?? []) as SeasonRanking[] };
}

export async function getMySeasonRanking(seasonKey?: string): Promise<DomainResult<SeasonRanking | null>> {
  const { data: s } = await supabase.auth.getSession();
  if (!s.session) return { status: "blocked_auth", data: null, reason: "No auth session." };
  const { data: player } = await supabase.from("players")
    .select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
  if (!player) return { status: "blocked_auth", data: null, reason: "Player not found." };
  let query = supabase
    .from("season_rankings")
    .select("rank_position, mmr, wins, losses, draws, season_key, player_id")
    .eq("player_id", player.id);
  if (seasonKey) query = query.eq("season_key", seasonKey);
  const { data, error } = await query.maybeSingle();
  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as SeasonRanking | null };
}
