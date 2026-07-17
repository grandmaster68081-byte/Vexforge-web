import { useEffect, useState } from "react";
import { listActiveMissions, type Mission } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useMissions() {
const [missions, setMissions] = useState<Mission[]>([]);
const [status, setStatus] = useState<DomainStatus>("ready");
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

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

return { missions, status, loading, error };
}
