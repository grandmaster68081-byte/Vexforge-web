import { useEffect, useState } from "react";
import { useSession } from "../providers/AuthProvider";
import { getSettings, type PlayerSettings } from "../domains/settings/repository";
import { DomainStatusBadge } from "../shared/components/DomainStatus";
import type { DomainStatus } from "../shared/types/domain";

export function SettingsRoute() {
  const { session, loading: sessionLoading } = useSession();
  const [settings, setSettings] = useState<PlayerSettings | null>(null);
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
    getSettings().then((result) => {
      setStatus(result.status);
      setSettings(result.data ?? null);
      setReason(result.reason ?? null);
      setLoading(false);
    });
  }, [session, sessionLoading]);

  return (
    <section>
      <header className="route-header">
        <h1>Settings</h1>
        <DomainStatusBadge status={status} />
      </header>

      {(loading || sessionLoading) && <p className="muted">Loading…</p>}
      {!loading && !sessionLoading && reason && <p className="muted">{reason}</p>}

      {!loading && settings && (
        <div className="empty-state">
          <p className="stat-row">Language: {settings.language} · UI mode: {settings.ui_mode}</p>
          <p className="stat-row">Notifications: {settings.notifications_enabled ? "on" : "off"} · Telegram: {settings.telegram_enabled ? "on" : "off"}</p>
        </div>
      )}
    </section>
  );
}
