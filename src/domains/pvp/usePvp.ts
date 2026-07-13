import { useEffect, useState, useCallback } from "react";
import {
  listActiveSeasons,
  listSeasonRankings,
  listMyMatches,
  resolveMatch,
  type PvpSeason,
  type PvpRanking,
  type PvpMatch,
} from "./repository";

export function usePvp() {
  const [seasons, setSeasons] = useState<PvpSeason[]>([]);
  const [rankings, setRankings] = useState<PvpRanking[]>([]);
  const [matches, setMatches] = useState<PvpMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const seasonsResult = await listActiveSeasons();
    if (seasonsResult.data) setSeasons(seasonsResult.data);
    if (seasonsResult.reason) setError(seasonsResult.reason);

    if (seasonsResult.data && seasonsResult.data.length > 0) {
      const rankingsResult = await listSeasonRankings(seasonsResult.data[0].id);
      if (rankingsResult.data) setRankings(rankingsResult.data);
    }

    const matchesResult = await listMyMatches();
    if (matchesResult.data) setMatches(matchesResult.data);
    // not signed in / no matches is a normal state, not an error banner

    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function resolve(matchId: string) {
    setPending(true);
    setActionError(null);
    const result = await resolveMatch(matchId);
    if (result.reason) setActionError(result.reason);
    setPending(false);
    await refresh();
    return result;
  }

  return { seasons, rankings, matches, loading, error, actionError, pending, resolve };
}
