import { useState, useEffect, useCallback } from "react";
import { listWorldBosses, getMyEncounters, getCurrentPlayerId } from "./repository";
import type { WorldBoss, BossEncounter } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useBosses() {
  const [bosses, setBosses]         = useState<DomainResult<WorldBoss[]>>({ status: "loading", data: null });
  const [encounters, setEncounters] = useState<DomainResult<BossEncounter[]>>({ status: "loading", data: null });
  const [authed, setAuthed]         = useState(false);
  const [tick, setTick]             = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    getCurrentPlayerId().then(id => { if (mounted) setAuthed(!!id); });
    listWorldBosses().then(r => { if (mounted) setBosses(r); });
    getMyEncounters().then(r => { if (mounted) setEncounters(r); });
    return () => { mounted = false; };
  }, [tick]);

  return { bosses, encounters, authed, reload };
}