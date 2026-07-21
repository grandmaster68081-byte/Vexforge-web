import { useEffect, useState, useCallback } from "react";
import { getProfile, type PlayerProfile } from "../profile/repository";
import { getProgress, type PlayerProgress } from "../progress/repository";
import { getWallet, type PlayerWallet } from "../economy/repository";
import { listActiveMissions, type Mission } from "../missions/repository";

/**
 * Dashboard/home aggregator. Reuses each domain's existing repository
 * functions on purpose (no new Supabase queries here) -- avoids duplicating
 * the read logic that profile/progress/economy/missions already own.
 */
export function useHome() {
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [wallet, setWallet] = useState<PlayerWallet | null>(null);
  const [nextMissions, setNextMissions] = useState<Mission[]>([]);
  const [signedIn, setSignedIn] = useState(true);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [profileResult, progressResult, walletResult, missionsResult] = await Promise.all([
      getProfile(),
      getProgress(),
      getWallet(),
      listActiveMissions(),
    ]);

    if (profileResult.status === "blocked_auth") {
      setSignedIn(false);
    } else {
      setSignedIn(true);
      if (profileResult.data) setProfile(profileResult.data);
      if (progressResult.data) setProgress(progressResult.data);
      if (walletResult.data) setWallet(walletResult.data);
    }
    if (missionsResult.data) setNextMissions(missionsResult.data.slice(0, 3));
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { profile, progress, wallet, nextMissions, signedIn, loading, refresh };
}
