import { useState, useEffect, useCallback } from "react";
import { getLeaderboard, getCurrentPlayerId } from "./repository";
import type { RankEntry } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export interface LeaderboardState extends DomainResult<RankEntry[]> {
  myPlayerId: string | null; reload: () => void;
}

export function useLeaderboard(limit = 100): LeaderboardState {
  const [state, setState]       = useState<DomainResult<RankEntry[]>>({ status: "loading", data: null });
  const [myPlayerId, setMyId]   = useState<string | null>(null);
  const [tick, setTick]         = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    Promise.all([getLeaderboard(limit), getCurrentPlayerId()]).then(([result, id]) => {
      if (!mounted) return;
      setState(result);
      setMyId(id);
    });
    return () => { mounted = false; };
  }, [limit, tick]);

  return { ...state, myPlayerId, reload };
}