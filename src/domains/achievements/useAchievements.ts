import { useState, useEffect, useCallback } from "react";
    import { getAllAchievements, getMyAchievements, getPlayerStats, type Achievement, type PlayerAchievement } from "./repository";

    export interface UseAchievementsReturn {
    allAchs: Achievement[]; myAchs: PlayerAchievement[]; stats: Record<string, number>;
    loading: boolean; error: string | null; blockedAuth: boolean; statsError: string | null; reload: () => void;
    }

    export function useAchievements(): UseAchievementsReturn {
    const [allAchs, setAll]         = useState<Achievement[]>([]);
    const [myAchs, setMy]           = useState<PlayerAchievement[]>([]);
    const [stats, setStats]         = useState<Record<string, number>>({});
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState<string | null>(null);
    const [blockedAuth, setBlocked] = useState(false);
    const [statsError, setStatsErr] = useState<string | null>(null);

    const load = useCallback(async () => {
      setLoading(true); setError(null); setBlocked(false); setStatsErr(null);
      const [a, m, s] = await Promise.all([getAllAchievements(), getMyAchievements(), getPlayerStats()]);
      if (a.data)        setAll(a.data);
      else if (a.reason) setError(a.reason);
      if (m.status === "blocked_auth") setBlocked(true);
      else if (m.data)   setMy(m.data);
      if (s.status === "blocked_auth") { /* expected when not logged in */ }
      else if (s.data)   setStats(s.data);
      else if (s.reason) setStatsErr(s.reason);
      setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);
    return { allAchs, myAchs, stats, loading, error, blockedAuth, statsError, reload: load };
    }