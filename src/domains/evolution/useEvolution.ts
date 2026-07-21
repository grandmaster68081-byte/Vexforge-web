import { useState, useEffect, useCallback } from "react";
import { getEvolutionPaths, evolveCard, getCurrentPlayerId } from "./repository";
import type { EvoPath } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useEvolution() {
  const [paths, setPaths]       = useState<DomainResult<EvoPath[]>>({ status: "loading", data: null });
  const [authed, setAuthed]     = useState(false);
  const [evolving, setEvolving] = useState(false);
  const [evoMsg, setEvoMsg]     = useState<string | null>(null);
  const [tick, setTick]         = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    getCurrentPlayerId().then(id => { if (mounted) setAuthed(!!id); });
    getEvolutionPaths().then(r => { if (mounted) setPaths(r); });
    return () => { mounted = false; };
  }, [tick]);

  const evolve = useCallback(async (cardId: string) => {
    setEvolving(true); setEvoMsg(null);
    const result = await evolveCard(cardId);
    setEvolving(false);
    if (result.status === "blocked_auth")  setEvoMsg("Inicia sesion para evolucionar cartas.");
    else if (result.data?.ok)              { setEvoMsg(result.data.message ?? "Carta evolucionada!"); reload(); }
    else                                   setEvoMsg(result.reason ?? result.data?.message ?? "Error al evolucionar.");
  }, [reload]);

  return { paths, authed, evolving, evoMsg, evolve, reload };
}