import { useState } from "react";
import { useSettings } from "../domains/settings/useSettings";
import { SkeletonRows } from "../shared/components/Skeleton";
import { Link } from "react-router-dom";

const BG_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/heroes/hero_settings.jpg";

function Toggle({ label, description, checked, onChange, disabled }: { label: string; description?: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
return (
  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 22px", background: "var(--layer-1)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)" }}>
    <div>
      <p style={{ fontSize: 14, fontWeight: 600, margin: "0 0 3px", fontFamily: '"Rajdhani",sans-serif' }}>{label}</p>
      {description && <p className="muted" style={{ fontSize: 12, margin: 0 }}>{description}</p>}
    </div>
    <button role="switch" aria-checked={checked} disabled={disabled} onClick={() => onChange(!checked)}
      style={{ width: 46, height: 26, borderRadius: 13, border: "none", cursor: disabled ? "not-allowed" : "pointer", background: checked ? "var(--ember-gold)" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0, opacity: disabled ? 0.5 : 1 }}>
      <span style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left 0.2s" }} />
    </button>
  </div>
);
}

export function SettingsRoute() {
const { settings, loading, saving, reason, saveError, save, signedIn } = useSettings();
const [notify, setNotify] = useState<boolean | null>(null);
const [savedOk, setSavedOk] = useState(false);

const notifyVal = notify ?? settings?.notifications_enabled ?? false;
const dirty     = notify !== null;

async function handleSave() {
  setSavedOk(false);
  const ok = await save({ notifications_enabled: notifyVal });
  if (ok) setSavedOk(true);
}

return (
  <section>
    <div className="hero-banner" style={{ backgroundImage: `url(${BG_URL})` }}>
      <div className="hero-banner-overlay" style={{ alignItems: "flex-start", padding: "40px 48px" }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ember-gold)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, marginBottom: 10 }}>─── Forge Control ───</p>
        <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: "clamp(2.4rem,5vw,3.8rem)", fontWeight: 900, margin: 0 }}>Settings</h1>
        <p style={{ marginTop: 14, fontSize: 15, color: "var(--fg-muted)", maxWidth: 400 }}>Configure your forge preferences.</p>
      </div>
    </div>
    <div style={{ padding: "40px 48px 48px", maxWidth: 600 }}>
      {loading ? <SkeletonRows rows={3} /> : !signedIn ? (
        <div style={{ textAlign: "center", padding: "60px 24px" }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>⚙️</div>
          <p style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 16, color: "var(--ember-gold)", marginBottom: 8 }}>Sign In Required</p>
          <p className="muted" style={{ fontSize: 13, marginBottom: 24 }}>Sign in to manage your settings.</p>
          <Link to="/account" className="btn btn-primary" style={{ fontSize: 13 }}>Sign In</Link>
        </div>
      ) : (
        <>
          <h2 className="forge-section-header">Preferences</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 28 }}>
            <Toggle label="Notifications" description="Receive updates about missions, PvP, and market activity." checked={notifyVal} onChange={v => { setNotify(v); setSavedOk(false); }} disabled={saving} />
          </div>
          {reason    && <p className="muted"  style={{ fontSize: 12, marginBottom: 14 }}>{reason}</p>}
          {saveError && <p style={{ fontSize: 12, color: "#e3573f", marginBottom: 14 }}>{saveError}</p>}
          {savedOk   && <p style={{ fontSize: 12, color: "#3ddc84", marginBottom: 14 }}>✓ Settings saved</p>}
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !dirty} style={{ fontSize: 13, opacity: dirty ? 1 : 0.6 }}>{saving ? "Saving…" : "Save Settings"}</button>
        </>
      )}
    </div>
  </section>
);
}