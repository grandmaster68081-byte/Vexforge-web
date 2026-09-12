import { supabase } from "../../lib/supabase";
import type { DomainResult } from "../../shared/types/domain";

export interface NftContract {
  id: string;
  chain_id: number;
  contract_address: string;
  name: string;
  symbol: string;
  max_supply: number;
  status: "pending" | "deployed" | "paused";
  deployed_at: string | null;
  created_at: string;
}

export interface NftWalletLink {
  id: string;
  player_id: string;
  wallet_address: string;
  chain_id: number;
  verified: boolean;
  linked_at: string;
}

export interface NftMintQueueEntry {
  id: string;
  player_id: string;
  card_id: string;
  wallet_address: string;
  status: "pending" | "processing" | "confirmed" | "failed";
  tx_hash: string | null;
  token_id: number | null;
  error_message: string | null;
  requested_at: string;
  processed_at: string | null;
}

/** Returns the active deployed contract, or null if none deployed yet. */
export async function getActiveContract(): Promise<DomainResult<NftContract | null>> {
  const { data, error } = await supabase
    .from("vexforge_nft_contracts")
    .select("*")
    .eq("status", "deployed")
    .order("deployed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftContract | null };
}

/** Returns any contract row (including pending), for display purposes. */
export async function getAnyContract(): Promise<DomainResult<NftContract | null>> {
  const { data, error } = await supabase
    .from("vexforge_nft_contracts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftContract | null };
}

/** Returns the wallet link for the current player, if any. */
export async function getWalletLink(playerId: string): Promise<DomainResult<NftWalletLink | null>> {
  const { data, error } = await supabase
    .from("vexforge_nft_wallet_links")
    .select("*")
    .eq("player_id", playerId)
    .order("linked_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftWalletLink | null };
}

/** Links a wallet address to a player. */
export async function linkWallet(
  playerId: string,
  walletAddress: string,
  chainId: number = 137
): Promise<DomainResult<NftWalletLink>> {
  const { data, error } = await supabase
    .from("vexforge_nft_wallet_links")
    .upsert(
      { player_id: playerId, wallet_address: walletAddress, chain_id: chainId, verified: true },
      { onConflict: "player_id,wallet_address" }
    )
    .select("*")
    .single();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftWalletLink };
}

/** Returns all mint requests for the current player. */
export async function getPlayerMintQueue(playerId: string): Promise<DomainResult<NftMintQueueEntry[]>> {
  const { data, error } = await supabase
    .from("vexforge_nft_mint_queue")
    .select("*")
    .eq("player_id", playerId)
    .order("requested_at", { ascending: false });

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftMintQueueEntry[] };
}

/** Submits a mint request for a card. */
export async function requestMint(
  playerId: string,
  cardId: string,
  walletAddress: string
): Promise<DomainResult<NftMintQueueEntry>> {
  const { data, error } = await supabase
    .from("vexforge_nft_mint_queue")
    .insert({ player_id: playerId, card_id: cardId, wallet_address: walletAddress, status: "pending" })
    .select("*")
    .single();

  if (error) return { status: "ready", data: null, reason: error.message };
  return { status: "ready", data: data as NftMintQueueEntry };
}
