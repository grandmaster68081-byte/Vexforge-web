import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import {
  getAnyContract,
  getWalletLink,
  linkWallet,
  getPlayerMintQueue,
  requestMint,
  type NftContract,
  type NftWalletLink,
  type NftMintQueueEntry,
} from "./repository";

/** MetaMask chain ID for Polygon Mainnet */
const POLYGON_CHAIN_ID = "0x89"; // 137 in hex

export interface UseNftResult {
  contract: NftContract | null;
  contractLoading: boolean;
  contractDeployed: boolean;
  walletAddress: string | null;
  walletLink: NftWalletLink | null;
  mintQueue: NftMintQueueEntry[];
  isAuth: boolean;
  playerId: string | null;
  connecting: boolean;
  connectError: string | null;
  mintError: string | null;
  connectWallet: () => Promise<void>;
  requestCardMint: (cardId: string) => Promise<void>;
  refresh: () => void;
}

export function useNft(): UseNftResult {
  const [contract, setContract]           = useState<NftContract | null>(null);
  const [contractLoading, setContractLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [walletLink, setWalletLink]       = useState<NftWalletLink | null>(null);
  const [mintQueue, setMintQueue]         = useState<NftMintQueueEntry[]>([]);
  const [isAuth, setIsAuth]               = useState(false);
  const [playerId, setPlayerId]           = useState<string | null>(null);
  const [connecting, setConnecting]       = useState(false);
  const [connectError, setConnectError]   = useState<string | null>(null);
  const [mintError, setMintError]         = useState<string | null>(null);
  const [tick, setTick]                   = useState(0);

  const refresh = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let cancelled = false;
    setContractLoading(true);

    Promise.all([
      getAnyContract(),
      supabase.auth.getSession(),
    ]).then(async ([contractResult, sessionResult]) => {
      if (cancelled) return;
      setContract(contractResult.data ?? null);
      setContractLoading(false);

      const session = sessionResult.data?.session;
      const hasAuth = !!session;
      setIsAuth(hasAuth);

      if (hasAuth) {
        const { data: player } = await supabase
          .from("players")
          .select("id")
          .eq("auth_user_id", session!.user.id)
          .single();

        if (cancelled) return;
        if (player) {
          setPlayerId(player.id);
          const [walletResult, mintResult] = await Promise.all([
            getWalletLink(player.id),
            getPlayerMintQueue(player.id),
          ]);
          if (cancelled) return;
          setWalletLink(walletResult.data ?? null);
          setMintQueue(mintResult.data ?? []);
        }
      }
    });

    return () => { cancelled = true; };
  }, [tick]);

  const connectWallet = useCallback(async () => {
    setConnectError(null);
    setConnecting(true);
    try {
      const eth = (window as any).ethereum;
      if (!eth) throw new Error("MetaMask no está instalado. Instálalo en metamask.io");

      // Request account access
      const accounts: string[] = await eth.request({ method: "eth_requestAccounts" });
      const address = accounts[0];
      if (!address) throw new Error("No se obtuvo cuenta de MetaMask");

      // Switch to Polygon Mainnet
      try {
        await eth.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: POLYGON_CHAIN_ID }],
        });
      } catch (switchErr: any) {
        // Chain not added — add it
        if (switchErr.code === 4902) {
          await eth.request({
            method: "wallet_addEthereumChain",
            params: [{
              chainId: POLYGON_CHAIN_ID,
              chainName: "Polygon Mainnet",
              nativeCurrency: { name: "MATIC", symbol: "MATIC", decimals: 18 },
              rpcUrls: ["https://polygon-rpc.com/"],
              blockExplorerUrls: ["https://polygonscan.com/"],
            }],
          });
        } else {
          throw switchErr;
        }
      }

      setWalletAddress(address);

      // Save link to Supabase if authenticated
      if (playerId) {
        const result = await linkWallet(playerId, address, 137);
        if (result.data) setWalletLink(result.data);
        else if (result.reason) throw new Error(result.reason);
      }
    } catch (err: any) {
      setConnectError(err.message ?? "Error al conectar wallet");
    } finally {
      setConnecting(false);
    }
  }, [playerId]);

  const requestCardMint = useCallback(async (cardId: string) => {
    setMintError(null);
    if (!playerId) { setMintError("Debes iniciar sesión primero"); return; }
    if (!walletAddress && !walletLink?.wallet_address) {
      setMintError("Conecta tu wallet primero"); return;
    }
    const addr = walletAddress ?? walletLink!.wallet_address;
    const result = await requestMint(playerId, cardId, addr);
    if (result.reason) { setMintError(result.reason); return; }
    refresh();
  }, [playerId, walletAddress, walletLink, refresh]);

  return {
    contract,
    contractLoading,
    contractDeployed: contract?.status === "deployed",
    walletAddress: walletAddress ?? walletLink?.wallet_address ?? null,
    walletLink,
    mintQueue,
    isAuth,
    playerId,
    connecting,
    connectError,
    mintError,
    connectWallet,
    requestCardMint,
    refresh,
  };
}
