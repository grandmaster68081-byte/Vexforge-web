import { useEffect, useState, useCallback } from "react";
import {
listActiveSeasons, listSeasonRankings, listMyMatches, listOpponents, startBattle,
type PvpSeason, type PvpRanking, type PvpMatch, type BattleOpponent, type BattleResult,
} from "./repository";

export function usePvp() {
const [seasons, setSeasons] = useState<PvpSeason[]>([]);
const [rankings, setRankings] = useState<PvpRanking[]>([]);
const [matches, setMatches] = useState<PvpMatch[]>([]);
const [opponents, setOpponents] = useState<BattleOpponent[]>([]);
const [loading, setLoading] = useState(true);
const [opponentsLoading, setOpponentsLoading] = useState(false);
const [battling, setBattling] = useState(false);
const [battleResult, setBattleResult] = useState<BattleResult|null>(null);
const [error, setError] = useState<string|null>(null);
const [playerId, setPlayerId] = useState<string|null>(null);

const load = useCallback(async () => {
  setLoading(true);
  const { data:s } = await (await import("../../lib/supabase")).supabase.auth.getSession();
  if (s.session) {
    const { data } = await (await import("../../lib/supabase")).supabase
      .from("players").select("id").eq("auth_user_id",s.session.user.id).maybeSingle();
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
  setLoading(false);
}, []);

useEffect(() => { load(); }, [load]);

const loadOpponents = useCallback(async () => {
  setOpponentsLoading(true);
  const res = await listOpponents();
  if (res.data) setOpponents(res.data);
  setOpponentsLoading(false);
  return res;
}, []);

const battle = useCallback(async (opponentId:string) => {
  setBattling(true); setBattleResult(null);
  const res = await startBattle(opponentId);
  if (res.data) setBattleResult(res.data);
  else setBattleResult({ ok:false, reason:res.reason ?? "Battle failed" });
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