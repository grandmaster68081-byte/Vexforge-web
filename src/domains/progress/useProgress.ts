import { useEffect, useState, useCallback } from "react";
import { useSession } from "../../providers/AuthProvider";
import { getProgress, type PlayerProgress } from "./repository";
import type { DomainStatus } from "../../shared/types/domain";

export function useProgress() {
const { session, loading: sessionLoading } = useSession();
const [progress, setProgress] = useState<PlayerProgress | null>(null);
const [status, setStatus] = useState<DomainStatus>("blocked_auth");
const [loading, setLoading] = useState(true);
const [reason, setReason] = useState<string | null>(null);

const fetchProgress = useCallback(async () => {
  if (!session) {
    setStatus("blocked_auth");
    setReason("No auth session. Sign in on the Account page first.");
    setLoading(false);
    return;
  }
  setLoading(true);
  const result = await getProgress();
  setStatus(result.status);
  setProgress(result.data ?? null);
  setReason(result.reason ?? null);
  setLoading(false);
}, [session]);

useEffect(() => {
  if (sessionLoading) return;
  fetchProgress();
}, [session, sessionLoading, fetchProgress]);

// R.3: Refresh energy display after mission execution or any energy change
useEffect(() => {
  window.addEventListener("vexforge:energy-updated", fetchProgress as EventListener);
  return () => window.removeEventListener("vexforge:energy-updated", fetchProgress as EventListener);
}, [fetchProgress]);

return { progress, status, loading, reason, signedIn: !!session };
}
