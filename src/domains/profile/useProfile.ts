import { useEffect, useState, useCallback } from "react";
import { useSession } from "../../providers/AuthProvider";
import {
  getProfile, getPlayerStats, getPlayerRank, getPlayerAchievements, getWalletSnapshot,
  type PlayerProfile, type PlayerStats, type PlayerRank,
  type PlayerAchievement, type WalletSnapshot,
} from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export type { PlayerProfile, PlayerStats, PlayerRank, PlayerAchievement, WalletSnapshot };

export interface UseProfileResult {
  profile:      PlayerProfile | null;
  stats:        PlayerStats | null;
  rank:         PlayerRank | null;
  achievements: PlayerAchievement[];
  wallet:       WalletSnapshot | null;
  totalPoints:  number;
  loading:      boolean;
  statsLoading: boolean;
  status:       DomainStatus;
  reason:       string | null;
  signedIn:     boolean;
  reload:       () => void;
}

/**
 * Bloque 5.7: Extended profile hook.
 * Loads profile first, then fans out to stats/rank/achievements/wallet in parallel.
 * All secondary data is tied to the player's own id (from getProfile).
 */
export function useProfile(): UseProfileResult {
  const { session, loading: sessionLoading } = useSession();
  const [profile,      setProfile]      = useState<PlayerProfile | null>(null);
  const [stats,        setStats]        = useState<PlayerStats | null>(null);
  const [rank,         setRank]         = useState<PlayerRank | null>(null);
  const [achievements, setAchievements] = useState<PlayerAchievement[]>([]);
  const [wallet,       setWallet]       = useState<WalletSnapshot | null>(null);
  const [status,       setStatus]       = useState<DomainStatus>("blocked_auth");
  const [loading,      setLoading]      = useState(true);
  const [statsLoading, setStatsLoading] = useState(false);
  const [reason,       setReason]       = useState<string | null>(null);
  const [tick,         setTick]         = useState(0);

  const reload = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setStatus("blocked_auth");
      setReason("Inicia sesión en Mi Cuenta para continuar.");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setStats(null);
    setRank(null);
    setAchievements([]);
    setWallet(null);

    getProfile().then((result) => {
      if (cancelled) return;
      setStatus(result.status);
      setProfile(result.data ?? null);
      setReason(result.reason ?? null);
      setLoading(false);

      const playerId = result.data?.id;
      if (!playerId) return;

      setStatsLoading(true);
      Promise.all([
        getPlayerStats(playerId),
        getPlayerRank(playerId),
        getPlayerAchievements(playerId),
        getWalletSnapshot(playerId),
      ]).then(([statsR, rankR, achR, walR]) => {
        if (cancelled) return;
        if (statsR.data) setStats(statsR.data);
        if (rankR.data)  setRank(rankR.data);
        if (achR.data)   setAchievements(achR.data);
        if (walR.data)   setWallet(walR.data);
        setStatsLoading(false);
      });
    });

    return () => { cancelled = true; };
  }, [session, sessionLoading, tick]);

  const totalPoints = achievements.reduce((acc, a) => acc + a.points, 0);

  return {
    profile, stats, rank, achievements, wallet,
    totalPoints, loading, statsLoading, status, reason,
    signedIn: !!session, reload,
  };
}
