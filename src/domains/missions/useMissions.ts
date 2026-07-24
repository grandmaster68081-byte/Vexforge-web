import { useEffect, useRef, useState } from "react";
import { listActiveMissions, executeMission, type Mission, type MissionRunResult } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export interface LastReward   { mission: Mission; data: MissionRunResult; }
export interface SessionStats { count: number; xp: number; vex: number; tvex: number; }

export function useMissions() {
  const [missions, setMissions]     = useState<Mission[]>([]);
  const [status, setStatus]         = useState<DomainStatus>("ready");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [executing, setExecuting]   = useState<string | null>(null);
  const [lastReward, setLastReward] = useState<LastReward | null>(null);
  const [cooldowns, setCooldowns]   = useState<Record<string, number>>({});
  const [executeError, setExecuteError]         = useState<string | null>(null);
  const [completedThisSession, setCompletedThisSession] = useState<Set<string>>(new Set());
  const [sessionStats, setSessionStats] = useState<SessionStats>({ count:0, xp:0, vex:0, tvex:0 });
  const [tick, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const hasCooldowns = Object.keys(cooldowns).length > 0;
    if (hasCooldowns && !tickRef.current)
      tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
    if (!hasCooldowns && tickRef.current) { clearInterval(tickRef.current); tickRef.current = null; }
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, [cooldowns]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listActiveMissions().then(result => {
      if (cancelled) return;
      setStatus(result.status);
      if (result.data)   setMissions(result.data);
      if (result.reason) setError(result.reason);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  function cooldownRemaining(missionId: string): number {
    const expiry = cooldowns[missionId];
    if (!expiry) return 0;
    const remaining = Math.ceil((expiry - Date.now()) / 1000);
    if (remaining <= 0) {
      setCooldowns(prev => { const next = { ...prev }; delete next[missionId]; return next; });
      return 0;
    }
    return remaining;
  }

  async function execute(mission: Mission): Promise<void> {
    if (executing || cooldownRemaining(mission.id) > 0) return;
    setExecuting(mission.id);
    setLastReward(null);
    setExecuteError(null);
    const result = await executeMission(mission.id, mission.name); // U.2: pass name
    setExecuting(null);
    if (!result.data) { setExecuteError(result.reason ?? "Mission execution failed"); return; }
    const reward = result.data;
    window.dispatchEvent(new CustomEvent("vexforge:energy-updated"));
    setCompletedThisSession(prev => new Set([...prev, mission.id]));
    setSessionStats(prev => ({
      count: prev.count + 1,
      xp:   prev.xp   + (reward.xp_reward       ?? 0),
      vex:  prev.vex  + (reward.ingame_reward    ?? 0),
      tvex: prev.tvex + (reward.tradeable_reward ?? 0),
    }));
    setLastReward({ mission, data: reward });
    if ((mission.cooldown_seconds ?? 0) > 0)
      setCooldowns(prev => ({ ...prev, [mission.id]: Date.now() + (mission.cooldown_seconds ?? 0) * 1000 }));
  }

  return {
    missions, status, loading, error, execute, executing,
    lastReward, cooldownRemaining, executeError,
    dismissReward: () => setLastReward(null),
    dismissError:  () => setExecuteError(null),
    tick, completedThisSession, sessionStats,
  };
}
