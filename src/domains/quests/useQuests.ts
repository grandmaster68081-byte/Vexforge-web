import { useEffect, useState, useCallback } from "react";
import { useSession } from "../../providers/AuthProvider";
import { getMyDailyQuests, claimDailyQuestReward, type PlayerDailyQuest } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export interface ClaimResult {
  claimed: boolean;
  xp_applied?: number;
  vex_applied?: number;
  reason?: string;
}

export interface LastClaim {
  questId: string;
  result: ClaimResult;
}

/** Seconds until next midnight UTC (when daily quests reset). */
export function secondsUntilMidnightUTC(): number {
  const now = new Date();
  const midnight = new Date();
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}

export function useQuests() {
  const { session, loading: sessionLoading } = useSession();
  const [quests, setQuests]       = useState<PlayerDailyQuest[]>([]);
  const [status, setStatus]       = useState<DomainStatus>("blocked_auth");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [claiming, setClaiming]   = useState<string | null>(null);
  const [lastClaim, setLastClaim] = useState<LastClaim | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!session) {
      setStatus("blocked_auth");
      setError(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getMyDailyQuests();
    setStatus(result.status);
    setQuests(result.data ?? []);
    setError(result.reason ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (sessionLoading) return;
    fetchQuests();
  }, [session, sessionLoading, fetchQuests]);

  const claim = useCallback(async (questAssignmentId: string) => {
    setClaiming(questAssignmentId);
    const r = await claimDailyQuestReward(questAssignmentId);
    const claimResult: ClaimResult = {
      claimed: r.ok,
      xp_applied:  (r as any).xp_applied,
      vex_applied: (r as any).vex_applied,
      reason: r.reason,
    };
    setLastClaim({ questId: questAssignmentId, result: claimResult });
    setClaiming(null);
    if (r.ok) fetchQuests();
    return r;
  }, [fetchQuests]);

  const dismissClaim = useCallback(() => setLastClaim(null), []);

  // Derived counts
  const claimedCount = quests.filter(q => q.status === "claimed").length;
  const totalQuests  = quests.length;

  // Returns seconds until daily quests reset (midnight UTC)
  const secondsUntilReset = useCallback(() => secondsUntilMidnightUTC(), []);

  return {
    quests, status, loading, error,
    // legacy alias
    reason: error,
    signedIn: !!session,
    claiming,
    lastClaim,
    claim,
    dismissClaim,
    claimedCount,
    totalQuests,
    secondsUntilReset,
    refresh: fetchQuests,
  };
}
