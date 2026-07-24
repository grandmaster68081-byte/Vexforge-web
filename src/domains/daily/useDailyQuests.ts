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
    // pendingRewards=true means the RPC fallback fired (direct UPDATE) — rewards may not have applied.
    // This path should never occur in normal operation (claim_daily_quest RPC is stable).
    if ((res.data as any).pendingRewards) {
      setClaimMsg("Misión completada. Las recompensas se aplicarán en breve.");
    } else {
      setClaimMsg("¡Recompensa reclamada!");
    }
    await load();
  } else { setClaimMsg(res.reason ?? "No se pudo reclamar."); }
  setClaiming(null);
}, [load]);

return { quests, loading, error, claiming, claimMsg, claim, reload: load };
}
