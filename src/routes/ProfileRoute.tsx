import { useEffect, useState } from "react";
import { useSession } from "../providers/AuthProvider";
import { getProfile, type PlayerProfile } from "../domains/profile/repository";
import { DomainStatusBadge } from "../shared/components/DomainStatus";
import type { DomainStatus } from "../shared/types/domain";

export function ProfileRoute() {
  const { session, loading: sessionLoading } = useSession();
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
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
    getProfile().then((result) => {
      setStatus(result.status);
      setProfile(result.data ?? null);
      setReason(result.reason ?? null);
      setLoading(false);
    });
  }, [session, sessionLoading]);

  return (
    <section>
      <header className="route-header">
        <h1>Profile</h1>
        <DomainStatusBadge status={status} />
      </header>

      {(loading || sessionLoading) && <p className="muted">Loading…</p>}
      {!loading && !sessionLoading && reason && <p className="muted">{reason}</p>}

      {!loading && profile && (
        <div className="empty-state">
          <p>{profile.display_name ?? profile.email ?? profile.id}</p>
          <p className="muted">{profile.role} · {profile.status}</p>
        </div>
      )}
    </section>
  );
}
