import { useEffect, useState } from "react";
import { useSession } from "../providers/AuthProvider";
import { getProgress, type PlayerProgress } from "../domains/progress/repository";
import { DomainStatusBadge } from "../shared/components/DomainStatus";
import type { DomainStatus } from "../shared/types/domain";

export function ProgressRoute() {
  const { session, loading: sessionLoading } = useSession();
  const [progress, setProgress] = useState<PlayerProgress | null>(null);
  const [status, setStatus] = useState<DomainStatus>("blocked_auth");
  const [reason, setReason] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionLoading) return;
    if (!session) {
      setStatus("blocked_auth");
      setReason("No auth session. Sign in on the Account page first.");
      setLoading(false);
      return;
    }
    setLoading(true);
    getProgress().then((result) => {
      setStatus(result.status);
      setProgress(result.data ?? null);
      setReason(result.reason ?? null);
      setLoading(false);
    });
  }, [session, sessionLoading]);

  return (
    <section>
      <header className="route-header">
        <h1>Progress</h1>
        <DomainStatusBadge status={status} />
      </header>

      {(loading || sessionLoading) && <p className="muted">Loading…</p>}
      {!loading && !sessionLoading && reason && <p className="muted">{reason}</p>}

      {!loading && progress && (
        <div className="empty-state">
          <p className="stat-row">Level {progress.level} · {progress.xp}/{progress.xp_to_next} XP</p>
          <p className="stat-row">Energy {progress.energy}/{progress.max_energy}</p>
        </div>
      )}
    </section>
  );
}
