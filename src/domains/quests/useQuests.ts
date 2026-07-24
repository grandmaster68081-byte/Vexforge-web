import { useEffect, useState, useCallback } from "react";
import { useSession } from "../../providers/AuthProvider";
import { getMyDailyQuests, claimDailyQuestReward, type PlayerDailyQuest } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useQuests() {
  const { session, loading: sessionLoading } = useSession();
  const [quests, setQuests] = useState<PlayerDailyQuest[]>([]);
  const [status, setStatus] = useState<DomainStatus>("blocked_auth");
  const [loading, setLoading] = useState(true);
  const [reason, setReason] = useState<string | null>(null);

  const fetchQuests = useCallback(async () => {
    if (!session) {
      setStatus("blocked_auth");
      setReason("No auth session.");
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await getMyDailyQuests();
    setStatus(result.status);
    setQuests(result.data ?? []);
    setReason(result.reason ?? null);
    setLoading(false);
  }, [session]);

  useEffect(() => {
    if (sessionLoading) return;
    fetchQuests();
  }, [session, sessionLoading, fetchQuests]);

  async function claim(questAssignmentId: string) {
    const r = await claimDailyQuestReward(questAssignmentId);
    if (r.ok) fetchQuests();
    return r;
  }

  return { quests, status, loading, reason, signedIn: !!session, claim, refresh: fetchQuests };
}
