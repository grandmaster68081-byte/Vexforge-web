import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface FusableCard {
  playerCardId: string; // player_cards.id
  cardId: string;
  name: string;
  rarity: string;
  quantity: number;
}

export interface FusionPolicy {
  neededCards: number;
  requiredShards: number;
  ingameCost: number;
  targetRarity: string;
}

export interface TargetCard {
  id: string;
  name: string;
  rarity: string;
}

export interface ShardBalance {
  rarity: string;
  quantity: number;
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
 * WIRED (this session): backend was verified ready -- vexforge_fusion_policy(text) RPC
 * exists (created in chat28, granted to authenticated), vexforge_apply_fusion(...) exists,
 * SECURITY DEFINER, granted to authenticated. The prior "blocked_no_path" status in
 * vexforge_web_registry was stale relative to the actual schema. Re-verified directly
 * against pg_proc + information_schema.routine_privileges before wiring this.
 *
 * Cards the signed-in player owns that are eligible as a fusion *source*
 * (fusion_enabled = true on the card definition, not locked/listed).
 */
export async function listMyFusableCards(): Promise<DomainResult<FusableCard[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to see your cards." };
  }

  const { data: owned, error: ownedError } = await supabase
    .from("player_cards")
    .select("id, card_id, quantity, locked, listed")
    .eq("player_id", playerId)
    .eq("locked", false)
    .eq("listed", false)
    .gt("quantity", 0);

  if (ownedError) {
    return { status: "ready", data: null, reason: ownedError.message };
  }
  if (!owned || owned.length === 0) {
    return { status: "ready", data: [] };
  }

  const cardIds = owned.map((c) => c.card_id);
  const { data: defs, error: defsError } = await supabase
    .from("cards")
    .select("id, name, rarity, fusion_enabled")
    .in("id", cardIds)
    .eq("fusion_enabled", true);

  if (defsError) {
    return { status: "ready", data: null, reason: defsError.message };
  }

  const defsById = new Map((defs ?? []).map((d) => [d.id, d]));
  const fusable: FusableCard[] = owned
    .filter((c) => defsById.has(c.card_id))
    .map((c) => {
      const def = defsById.get(c.card_id)!;
      return {
        playerCardId: c.id,
        cardId: c.card_id,
        name: def.name as string,
        rarity: def.rarity as string,
        quantity: c.quantity as number,
      };
    });

  return { status: "ready", data: fusable };
}

/**
 * Resolves the active fusion path for a given source rarity via the
 * vexforge_fusion_policy(text) RPC (SECURITY DEFINER, table-backed, single
 * active row per source_rarity as verified in vexforge_card_fusion_policy).
 */
export async function getFusionPolicy(sourceRarity: string): Promise<DomainResult<FusionPolicy>> {
  const { data, error } = await supabase.rpc("vexforge_fusion_policy", {
    p_source_rarity: sourceRarity,
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) {
    return { status: "ready", data: null, reason: `No active fusion path defined for rarity "${sourceRarity}".` };
  }
  return {
    status: "ready",
    data: {
      neededCards: row.needed_cards,
      requiredShards: row.required_shards ?? 0,
      ingameCost: Number(row.ingame_cost),
      targetRarity: row.target_rarity,
    },
  };
}

/** Candidate target cards for a resolved target rarity (fusion result picker). */
export async function listTargetCandidates(targetRarity: string): Promise<DomainResult<TargetCard[]>> {
  const { data, error } = await supabase
    .from("cards")
    .select("id, name, rarity")
    .eq("rarity", targetRarity)
    .eq("fusion_enabled", true)
    .eq("active", true);

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return { status: "ready", data: (data ?? []) as TargetCard[] };
}

/** Player's own shard balances (RLS: player_own_shards, authenticated, scoped to own player_id). */
export async function listMyShards(): Promise<DomainResult<ShardBalance[]>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to see your shards." };
  }
  const { data, error } = await supabase
    .from("vexforge_player_shards")
    .select("shard_rarity, quantity")
    .eq("player_id", playerId);

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }
  return {
    status: "ready",
    data: (data ?? []).map((s) => ({ rarity: s.shard_rarity as string, quantity: s.quantity as number })),
  };
}

/**
 * Applies a fusion through vexforge_apply_fusion(...), which does all validation,
 * card burn/mint, shard burn, VEX debit, ledger entry and fusion log write atomically
 * server-side. No direct table writes from the client -- same principle as market's
 * create_listing/buy_listing/cancel_listing.
 */
export async function applyFusion(
  sourceCardId: string,
  targetCardId: string
): Promise<DomainResult<{
  ok: boolean;
  reason?: string;
  sourceRarity?: string;
  targetRarity?: string;
  neededCards?: number;
  requiredShards?: number;
  ingameCost?: number;
}>> {
  const playerId = await getCurrentPlayerId();
  if (!playerId) {
    return { status: "blocked_auth", data: null, reason: "Sign in to fuse cards." };
  }

  const { data, error } = await supabase.rpc("vexforge_apply_fusion", {
    p_player_id: playerId,
    p_source_card_id: sourceCardId,
    p_target_card_id: targetCardId,
  });

  if (error) {
    return { status: "ready", data: null, reason: error.message };
  }

  return {
    status: "ready",
    data: {
      ok: data.ok,
      reason: data.reason,
      sourceRarity: data.source_rarity,
      targetRarity: data.target_rarity,
      neededCards: data.needed_cards,
      requiredShards: data.required_shards,
      ingameCost: data.ingame_cost,
    },
  };
}