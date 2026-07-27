import { useEffect, useState, useCallback } from "react";
import {
  listActiveSeasons, listSeasonRankings, listMyMatches, listOpponents, startRealBattle,
  type PvpSeason, type PvpRanking, type PvpMatch, type BattleOpponent,
} from "./repository";
import type { RealBattleResult } from "../../lib/battleTypes";

/** Reject after `ms` milliseconds — used to prevent infinite spinner. */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`PvP load tiempo de espera agotado después de ${ms}ms`)), ms)
    ),
  ]);
}

export function usePvp() {
  const [seasons, setSeasons]               = useState<PvpSeason[]>([]);
  const [rankings, setRankings]             = useState<PvpRanking[]>([]);
  const [matches, setMatches]               = useState<PvpMatch[]>([]);
  const [opponents, setOpponents]           = useState<BattleOpponent[]>([]);
  const [loading, setLoading]               = useState(true);
  const [opponentsLoading, setOpponentsLoading] = useState(false);
  const [battling, setBattling]             = useState(false);
  const [battleResult, setBattleResult]     = useState<RealBattleResult | null>(null);
  const [error, setError]                   = useState<string | null>(null);
  const [playerId, setPlayerId]             = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Quick auth pre-check before loading all data
      const { supabase } = await import('../../lib/supabase');
      const { data: { session: preSession } } = await supabase.auth.getSession();
      if (!preSession) { setLoading(false); return; }
      await withTimeout(
        (async () => {
          const { data: s } = await supabase.auth.getSession();
          if (s.session) {
            const { data } = await supabase
              .from("players").select("id").eq("auth_user_id", s.session.user.id).maybeSingle();
            setPlayerId(data?.id ?? null);
          }
          const [seasonRes, matchRes] = await Promise.all([listActiveSeasons(), listMyMatches()]);
          if (seasonRes.data) {
            setSeasons(seasonRes.data);
            if (seasonRes.data[0]) {
              const rankRes = await listSeasonRankings(seasonRes.data[0].id);
              if (rankRes.data) setRankings(rankRes.data);
            }
          }
          if (matchRes.data) setMatches(matchRes.data);
          setError(seasonRes.reason ?? matchRes.reason ?? null);
        })(),
        8000
      );
    } catch (err) {
      const isTimeout = err instanceof Error && err.message.includes("timed out");
      setError(isTimeout ? "Tiempo de espera agotado. Verifica tu conexión." : "Error cargando datos de PvP.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadOpponents = useCallback(async () => {
    setOpponentsLoading(true);
    try {
      const res = await listOpponents();
      if (res.data) setOpponents(res.data);
      return res;
    } finally {
      setOpponentsLoading(false);
    }
  }, []);

  // F.2.c — usa motor real vexforge_battle_resolve
  const battle = useCallback(async (opponentId: string) => {
    setBattling(true);
    setBattleResult(null);
    const res = await startRealBattle(opponentId);
    if (res.data) {
      setBattleResult(res.data);
    } else {
      setBattleResult({ ok: false, error: res.reason ?? "Battle failed" });
    }
    setBattling(false);
    await load();
    return res;
  }, [load]);

  const dismissBattle = useCallback(() => setBattleResult(null), []);

  return {
    seasons, rankings, matches, opponents, loading, opponentsLoading,
    battling, battleResult, error, playerId,
    load, loadOpponents, battle, dismissBattle,
  };
}
