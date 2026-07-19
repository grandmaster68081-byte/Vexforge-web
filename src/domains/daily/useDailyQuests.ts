import { useEffect, useState, useCallback } from "react";
import { getMyDailyQuests, claimDailyQuest, type PlayerDailyQuest } from "./repository";

export function useDailyQuests() {
const [quests, setQuests] = useState<PlayerDailyQuest[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
const [claiming, setClaiming] = useState<string | null>(null);
const [claimMsg, setClaimMsg] = useState<string | null>(null);

const load = useCallback(async () => {
  setLoading(true);
  const res = await getMyDailyQuests();
  if (res.data) setQuests(res.data);
  setError(res.reason ?? null);
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

const claim = useCallback(async (questId: string) => {
  setClaiming(questId); setClaimMsg(null);
  const res = await claimDailyQuest(questId);
  if (res.data?.claimed) {
    setClaimMsg("¡Recompensa reclamada!");
    await load();
  } else { setClaimMsg(res.reason ?? "Claim failed"); }
  setClaiming(null);
}, [load]);

return { quests, loading, error, claiming, claimMsg, claim, reload: load };
}