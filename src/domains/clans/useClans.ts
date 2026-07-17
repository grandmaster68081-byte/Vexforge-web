import { useEffect, useState, useCallback } from "react";
import {
  listTopClans,
  listClanMembers,
  listMyClanWars,
  type Clan,
  type ClanMember,
  type ClanWar,
} from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useClans() {
  const [clans, setClans] = useState<Clan[]>([]);
  const [members, setMembers] = useState<ClanMember[]>([]);
  const [wars, setWars] = useState<ClanWar[]>([]);
  const [selectedClanId, setSelectedClanId] = useState<string | null>(null);
  const [status, setStatus] = useState<DomainStatus>("ready");
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [clansResult, warsResult] = await Promise.all([
      listTopClans(),
      listMyClanWars(),
    ]);
    setClans(clansResult.data ?? []);
    setWars(warsResult.data ?? []);
    if (warsResult.status === "blocked_auth") {
      setStatus("blocked_auth");
      setReason(warsResult.reason ?? null);
    } else {
      setStatus("ready");
      setReason(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const selectClan = useCallback(async (clanId: string) => {
    setSelectedClanId(clanId);
    const result = await listClanMembers(clanId);
    setMembers(result.data ?? []);
  }, []);

  return { clans, members, wars, selectedClanId, status, reason, loading, selectClan, reload: load };
}
