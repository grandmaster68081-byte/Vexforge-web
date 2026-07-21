import { useState, useEffect, useCallback } from "react";
import { listWorldBosses, getMyEncounters, attackWorldBoss, getCurrentPlayerId } from "./repository";
import type { WorldBoss, BossEncounter } from "./repository";
import type { DomainResult } from "../../shared/types/domain";

export function useBosses() {
  const [bosses, setBosses]         = useState<DomainResult<WorldBoss[]>>({ status: "loading", data: null });
  const [encounters, setEncounters] = useState<DomainResult<BossEncounter[]>>({ status: "loading", data: null });
  const [authed, setAuthed]         = useState(false);
  const [attacking, setAttacking]   = useState(false);
  const [attackMsg, setAttackMsg]   = useState<string | null>(null);
  const [tick, setTick]             = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    getCurrentPlayerId().then(id => { if (mounted) setAuthed(!!id); });
    listWorldBosses().then(r => { if (mounted) setBosses(r); });
    getMyEncounters().then(r => { if (mounted) setEncounters(r); });
    return () => { mounted = false; };
  }, [tick]);

  const attack = useCallback(async (bossId: string) => {
    setAttacking(true); setAttackMsg(null);
    const result = await attackWorldBoss(bossId);
    setAttacking(false);
    if (result.status === "blocked_auth")      setAttackMsg("Inicia sesion para atacar jefes.");
    else if (result.data?.ok)                  { setAttackMsg("Ataque exitoso!"); reload(); }
    else                                        setAttackMsg(result.reason ?? "Error en el ataque.");
  }, [reload]);

  return { bosses, encounters, authed, attacking, attackMsg, attack, reload };
}