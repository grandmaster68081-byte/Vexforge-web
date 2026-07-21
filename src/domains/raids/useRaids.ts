import { useCallback, useEffect, useState } from "react";
import {
  listActiveRaids, listMyRaids, joinRaid, contributeToRaid, completeRaid,
  type RaidRun,
} from "./repository";

export function useRaids() {
  const [activeRaids, setActiveRaids] = useState<RaidRun[]>([]);
  const [myRaids, setMyRaids] = useState<RaidRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState<string | null>(null);
  const [contributing, setContributing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [activeR, myR] = await Promise.all([listActiveRaids(), listMyRaids()]);
    setActiveRaids(activeR.data ?? []);
    setMyRaids(myR.data ?? []);
    setError(activeR.reason ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const join = useCallback(async (raidRunId: string): Promise<{ ok: boolean; reason?: string }> => {
    setJoining(raidRunId);
    const res = await joinRaid(raidRunId);
    setJoining(null);
    if (res.data?.ok) await load();
    return res.data ?? { ok: false, reason: res.reason ?? "Error al unirse al raid" };
  }, [load]);

  const contribute = useCallback(async (raidRunId: string, amount = 1): Promise<{ ok: boolean; reason?: string }> => {
    setContributing(raidRunId);
    const res = await contributeToRaid(raidRunId, amount);
    setContributing(null);
    if (res.data?.ok) await load();
    return res.data ?? { ok: false, reason: res.reason ?? "Error al contribuir" };
  }, [load]);

  const complete = useCallback(async (raidRunId: string): Promise<{ ok: boolean; reason?: string }> => {
    const res = await completeRaid(raidRunId);
    if (res.data?.ok) await load();
    return res.data ?? { ok: false, reason: res.reason ?? "Error al completar el raid" };
  }, [load]);

  return { activeRaids, myRaids, loading, joining, contributing, error, join, contribute, complete, reload: load };
}