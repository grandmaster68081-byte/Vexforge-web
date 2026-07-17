import { useState } from "react";
import { useSettings } from "../domains/settings/useSettings";
import { SkeletonRows } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_settings.jpg";

function Toggle({ label, description, checked, onChange, disabled }: {
label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean;
}) {
return (
  <div className="settings-row">
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>{label}</p>
      {description && <p className="muted" style={{ fontSize: 12 }}>{description}</p>}
    </div>
    <button role="switch" aria-checked={checked} onClick={() => !disabled && onChange(!checked)}
      disabled={disabled} className={`settings-toggle ${checked ? "settings-toggle-on" : ""}`}>
      <span className="settings-toggle-thumb" />
    </button>
  </div>
);
}

export function SettingsRoute() {
const { settings, loading, saving, reason, saveError, save, signedIn } = useSettings();
const [saved, setSaved] = useState(false);

async function handleToggle(key: string, value: boolean) {
  setSaved(false);
  const ok = await save({ [key]: value } as any);
  if (ok) setSaved(true);
}

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay">
        <h1>Settings</h1>
      </div>
    </div>

    {loading && <SkeletonRows rows={5} />}

    {!loading && !signedIn && (
      <div className="empty-state">
        <p>You are not signed in.</p>
        <p className="muted"><Link to="/account">Go to Account</Link> to sign in.</p>
      </div>
    )}

    {!loading && signedIn && !settings && reason && (
      <div className="empty-state"><p className="muted">{reason}</p></div>
    )}

    {!loading && settings && (
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {saveError && <p className="error">{saveError}</p>}
        {saved && !saveError && <p className="success">Settings saved.</p>}

        <div>
          <h2 style={{ marginBottom: 16 }}>Notifications</h2>
          <div className="settings-section">
            <Toggle label="In-App Notifications" description="Alerts for rewards, PvP results and missions."
              checked={settings.notifications_enabled} onChange={(v) => handleToggle("notifications_enabled", v)} disabled={saving} />
            <Toggle label="Telegram Integration" description="Sync activity with your Telegram account."
              checked={settings.telegram_enabled} onChange={(v) => handleToggle("telegram_enabled", v)} disabled={saving} />
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: 16 }}>Preferences</h2>
          <div className="settings-section">
            <div className="settings-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Language</p>
                <p className="muted" style={{ fontSize: 12 }}>Display language for the app.</p>
              </div>
              <span style={{ fontSize: 13, color: "#e8e8e8", background: "#ffffff0c", padding: "4px 12px", borderRadius: 6 }}>{settings.language}</span>
            </div>
            <div className="settings-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>Timezone</p>
                <p className="muted" style={{ fontSize: 12 }}>Used for scheduled events and missions.</p>
              </div>
              <span style={{ fontSize: 13, color: "#e8e8e8", background: "#ffffff0c", padding: "4px 12px", borderRadius: 6 }}>{settings.timezone}</span>
            </div>
            <div className="settings-row">
              <div>
                <p style={{ fontSize: 14, fontWeight: 500, marginBottom: 2 }}>UI Mode</p>
                <p className="muted" style={{ fontSize: 12 }}>Interface display mode.</p>
              </div>
              <span style={{ fontSize: 13, color: "#e8702a", background: "#e8702a11", padding: "4px 12px", borderRadius: 6, fontWeight: 600 }}>{settings.ui_mode}</span>
            </div>
          </div>
        </div>
      </div>
    )}
  </section>
);
}
