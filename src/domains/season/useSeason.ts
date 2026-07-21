import { useState, useEffect, useCallback } from "react";
import { getSeasonProgress } from "./repository";
import type { SeasonProgress } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useSeason() {
  const [state, setState] = useState<DomainResult<SeasonProgress>>({ status: "loading", data: null });
  const [tick, setTick]   = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    getSeasonProgress().then(r => { if (mounted) setState(r); });
    return () => { mounted = false; };
  }, [tick]);

  return { ...state, reload };
}