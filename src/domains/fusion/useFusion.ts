import { useCallback, useEffect, useMemo, useState } from "react";
import {
  listMyFusableCards,
  listMyShards,
  getFusionPolicy,
  listTargetCandidates,
  applyFusion,
  type FusableCard,
  type ShardBalance,
  type FusionPolicy,
  type TargetCard,
} from "./repository";

export function useFusion() {
  const [myCards, setMyCards] = useState<FusableCard[]>([]);
  const [shards, setShards] = useState<ShardBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedSourceId, setSelectedSourceId] = useState<string>("");
  const [policy, setPolicy] = useState<FusionPolicy | null>(null);
  const [targets, setTargets] = useState<TargetCard[]>([]);
  const [selectedTargetId, setSelectedTargetId] = useState<string>("");
  const [policyLoading, setPolicyLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [lastResult, setLastResult] = useState<{ ok: boolean; reason?: string } | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [cardsResult, shardsResult] = await Promise.all([listMyFusableCards(), listMyShards()]);
    if (cardsResult.data) setMyCards(cardsResult.data);
    if (cardsResult.reason && cardsResult.status !== "blocked_auth") setError(cardsResult.reason);
    if (shardsResult.data) setShards(shardsResult.data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const selectedSource = useMemo(
    () => myCards.find((c) => c.playerCardId === selectedSourceId) ?? null,
    [myCards, selectedSourceId]
  );

  useEffect(() => {
    setSelectedTargetId("");
    setPolicy(null);
    setTargets([]);
    if (!selectedSource) return;

    let cancelled = false;
    setPolicyLoading(true);
    (async () => {
      const policyResult = await getFusionPolicy(selectedSource.rarity);
      if (cancelled) return;
      if (policyResult.data) {
        setPolicy(policyResult.data);
        const targetResult = await listTargetCandidates(policyResult.data.targetRarity);
        if (!cancelled && targetResult.data) setTargets(targetResult.data);
      } else {
        setActionError(policyResult.reason ?? "No fusion path available for this card's rarity.");
      }
      setPolicyLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [selectedSource]);

  function shardsFor(rarity: string): number {
    return shards.find((s) => s.rarity === rarity)?.quantity ?? 0;
  }

  async function fuse() {
    if (!selectedSource || !selectedTargetId) return;
    setPending(true);
    setActionError(null);
    setLastResult(null);
    const result = await applyFusion(selectedSource.cardId, selectedTargetId);
    if (result.reason) setActionError(result.reason);
    if (result.data) setLastResult({ ok: result.data.ok, reason: result.data.reason });
    setPending(false);
    setSelectedSourceId("");
    await refresh();
  }

  return {
    myCards,
    shards,
    loading,
    error,
    selectedSourceId,
    setSelectedSourceId,
    selectedSource,
    policy,
    policyLoading,
    targets,
    selectedTargetId,
    setSelectedTargetId,
    shardsFor,
    actionError,
    pending,
    lastResult,
    fuse,
  };
}