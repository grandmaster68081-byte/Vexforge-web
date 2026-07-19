import { useEffect, useState } from "react";
import { useSession } from "../../providers/AuthProvider";
import { getProgress, type PlayerProgress } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useProgress() {
const { session, loading: sessionLoading } = useSession();
const [progress, setProgress] = useState<PlayerProgress | null>(null);
const [status, setStatus] = useState<DomainStatus>("blocked_auth");
const [loading, setLoading] = useState(true);
const [reason, setReason] = useState<string | null>(null);

useEffect(() => {
  if (sessionLoading) return;
  if (!session) {
    setStatus("blocked_auth");
    setReason("No auth session. Sign in on the Account page first.");
    setLoading(false);
    return;
  }
  let cancelled = false;
  setLoading(true);
  getProgress().then((result) => {
    if (cancelled) return;
    setStatus(result.status);
    setProgress(result.data ?? null);
    setReason(result.reason ?? null);
    setLoading(false);
  });
  return () => { cancelled = true; };
}, [session, sessionLoading]);

return { progress, status, loading, reason, signedIn: !!session };
}
