import { useState, useEffect, useCallback } from "react";
import {
  getPlayerClanData, startGuildWar, joinClan, leaveClan, createClan,
} from "./clanRepository";
import type { PlayerClanData, ClanWar, Clan } from "./clanRepository";
import type { DomainResult } from "../../shared/types/domain";

export type { PlayerClanData, ClanWar, Clan };

export function useClans() {
  const [clanData, setClanData] = useState<DomainResult<PlayerClanData>>({ status: "loading", data: null });
  const [authed, setAuthed]     = useState<boolean | null>(null);
  const [tick, setTick]         = useState(0);
  const reload = useCallback(() => setTick(t => t + 1), []);

  useEffect(() => {
    let mounted = true;
    setClanData({ status: "loading", data: null });
    getPlayerClanData().then(res => {
      if (!mounted) return;
      setClanData(res);
      setAuthed(res.status !== "blocked_auth");
    });
    return () => { mounted = false; };
  }, [tick]);

  const startWar = useCallback(async (opponentClanId: string) => {
    const res = await startGuildWar(opponentClanId);
    if (res.data?.ok) reload();
    return res;
  }, [reload]);

  const join = useCallback(async (clanId: string) => {
    const res = await joinClan(clanId);
    if (res.data?.ok) reload();
    return res;
  }, [reload]);

  const leave = useCallback(async () => {
    const res = await leaveClan();
    if (res.data?.ok) reload();
    return res;
  }, [reload]);

  const create = useCallback(async (name: string, description: string) => {
    const res = await createClan(name, description);
    if (res.data?.ok) reload();
    return res;
  }, [reload]);

  return { clanData, authed, reload, startWar, join, leave, create };
}
