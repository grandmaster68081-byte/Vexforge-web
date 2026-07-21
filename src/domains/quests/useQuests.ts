import { useCallback, useEffect, useState } from "react";
import {
  loadDailyQuests, claimDailyQuest,
  type PlayerDailyQuest, type QuestClaimResult,
} from "./repository";

export interface QuestClaim {
  playerQuestId: string;
  result: QuestClaimResult;
}

export function useQuests() {
  const [quests, setQuests]         = useState<PlayerDailyQuest[]>([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [claiming, setClaiming]     = useState<string | null>(null); // playerQuestId being claimed
  const [lastClaim, setLastClaim]   = useState<QuestClaim | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await loadDailyQuests();
    if (res.data)   setQuests(res.data);
    if (res.reason) setError(res.reason);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const claim = useCallback(async (playerQuestId: string) => {
    setClaiming(playerQuestId);
    setLastClaim(null);
    const res = await claimDailyQuest(playerQuestId);
    if (res.data) {
      setLastClaim({ playerQuestId, result: res.data });
      // Optimistically update status locally
      setQuests(prev =>
        prev.map(q =>
          q.id === playerQuestId
            ? { ...q, status: "claimed", claimed_at: new Date().toISOString() }
            : q
        )
      );
    } else {
      setError(res.reason ?? "No se pudo reclamar la recompensa.");
    }
    setClaiming(null);
  }, []);

  const dismissClaim = useCallback(() => setLastClaim(null), []);

  /** Seconds until next daily reset (midnight local) */
  function secondsUntilReset(): number {
    const now   = new Date();
    const reset = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
    return Math.max(0, Math.floor((reset.getTime() - now.getTime()) / 1000));
  }

  const allClaimed  = quests.length > 0 && quests.every(q => q.status === "claimed");
  const claimedCount = quests.filter(q => q.status === "claimed").length;
  const totalQuests  = quests.length;

  return {
    quests, loading, error, claiming, lastClaim,
    load, claim, dismissClaim,
    allClaimed, claimedCount, totalQuests, secondsUntilReset,
  };
}
