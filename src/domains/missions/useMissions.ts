import { useEffect, useRef, useState } from "react";
import { listActiveMissions, executeMission, type Mission, type MissionRunResult } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export interface LastReward {
mission: Mission;
data: MissionRunResult;
}

export function useMissions() {
const [missions, setMissions] = useState<Mission[]>([]);
const [status, setStatus] = useState<DomainStatus>("ready");
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

// Execution state
const [executing, setExecuting] = useState<string | null>(null); // missionId currently running
const [lastReward, setLastReward] = useState<LastReward | null>(null);
const [cooldowns, setCooldowns] = useState<Record<string, number>>({}); // missionId → unix ms expiry
const [executeError, setExecuteError] = useState<string | null>(null);

// Countdown ticker — updates every second while any cooldown is active
const [tick, setTick] = useState(0);
const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

useEffect(() => {
  const hasCooldowns = Object.keys(cooldowns).length > 0;
  if (hasCooldowns && !tickRef.current) {
    tickRef.current = setInterval(() => setTick(t => t + 1), 1000);
  }
  if (!hasCooldowns && tickRef.current) {
    clearInterval(tickRef.current);
    tickRef.current = null;
  }
  return () => {
    if (tickRef.current) clearInterval(tickRef.current);
  };
}, [cooldowns]);

useEffect(() => {
  let cancelled = false;
  setLoading(true);
  listActiveMissions().then((result) => {
    if (cancelled) return;
    setStatus(result.status);
    if (result.data) setMissions(result.data);
    if (result.reason) setError(result.reason);
    setLoading(false);
  });
  return () => { cancelled = true; };
}, []);

/** Returns seconds remaining on cooldown, or 0 if ready. */
function cooldownRemaining(missionId: string): number {
  const expiry = cooldowns[missionId];
  if (!expiry) return 0;
  const remaining = Math.ceil((expiry - Date.now()) / 1000);
  if (remaining <= 0) {
    // Expired — clean up lazily
    setCooldowns(prev => {
      const next = { ...prev };
      delete next[missionId];
      return next;
    });
    return 0;
  }
  return remaining;
}

async function execute(mission: Mission): Promise<void> {
  if (executing || cooldownRemaining(mission.id) > 0) return;
  setExecuting(mission.id);
  setLastReward(null);
  setExecuteError(null);

  const result = await executeMission(mission.id);

  setExecuting(null);

  if (!result.data) {
    setExecuteError(result.reason ?? "Mission execution failed");
    return;
  }

  setLastReward({ mission, data: result.data });

  if ((mission.cooldown_seconds ?? 0) > 0) {
    setCooldowns(prev => ({
      ...prev,
      [mission.id]: Date.now() + (mission.cooldown_seconds ?? 0) * 1000,
    }));
  }
}

function dismissReward() {
  setLastReward(null);
}

function dismissError() {
  setExecuteError(null);
}

return {
  missions,
  status,
  loading,
  error,
  execute,
  executing,
  lastReward,
  cooldownRemaining,
  executeError,
  dismissReward,
  dismissError,
  tick, // expose so components re-render on countdown
};
}
