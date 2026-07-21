import { useState } from "react";
import { useSettings } from "../domains/settings/useSettings";
import { PageLoader } from "../shared/components/PageLoader";
import { BlockedAuthState } from "../shared/components/BlockedAuthState";
import { Link } from "react-router-dom";
import { useToast } from "../shared/context/ToastContext";

function Toggle({ label, description, checked, onChange, disabled }: {
  label: string; description?: string; checked: boolean;
  onChange: (v: boolean) => void; disabled?: boolean;
}) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 18px", background: "#1a1a2e", borderRadius: 10, gap: 16 }}>
      <div style={{ flex: 1 }}>
        <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13, marginBottom: description ? 3 : 0 }}>{label}</div>
        {description && <div style={{ color: "#555", fontSize: 11, lineHeight: 1.4 }}>{description}</div>}
      </div>
      <button onClick={() => !disabled && onChange(!checked)} disabled={disabled} role="switch" aria-checked={checked}
        style={{ width: 44, height: 24, borderRadius: 12, border: "none", cursor: disabled ? "not-allowed" : "pointer", background: checked ? "#e8b84b" : "#2a2a3a", position: "relative", flexShrink: 0, transition: "background .2s" }}>
        <div style={{ position: "absolute", top: 3, left: checked ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .2s" }} />
      </button>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <h2 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 16, margin: 0 }}>{title}</h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );
}

const UI_MODES = ["dark", "amoled"];
const LANGUAGES = [{ v: "es", l: "Español" }, { v: "en", l: "English" }];

export function SettingsRoute() {
  const { settings, loading, saving, reason, saveError, save, signedIn } = useSettings();
  const { addToast } = useToast();
  const [notify,    setNotify]    = useState<boolean | null>(null);
  const [telegram,  setTelegram]  = useState<boolean | null>(null);
  const [uiMode,    setUiMode]    = useState<string | null>(null);
  const [language,  setLanguage]  = useState<string | null>(null);

  const notifyVal  = notify   ?? settings?.notifications_enabled ?? false;
  const telegramVal = telegram ?? settings?.telegram_enabled     ?? false;
  const uiModeVal  = uiMode   ?? settings?.ui_mode              ?? "dark";
  const langVal    = language ?? settings?.language             ?? "es";
  const dirty = notify !== null || telegram !== null || uiMode !== null || language !== null;

  const handleSave = async () => {
    const ok = await save({ notifications_enabled: notifyVal, telegram_enabled: telegramVal, ui_mode: uiModeVal, language: langVal });
    if (ok) addToast("success", "✓ Configuración guardada");
    else addToast("error", "Error al guardar", saveError ?? "Error desconocido");
  };

  const selectSt = (active: boolean): React.CSSProperties => ({
    padding: "8px 18px", borderRadius: 8, border: `1px solid ${active ? "#e8b84b44" : "#2a2a3a"}`,
    background: active ? "#e8b84b22" : "transparent", color: active ? "#e8b84b" : "#555",
    fontWeight: 700, fontSize: 12, cursor: "pointer",
  });

  if (loading)    return <PageLoader />;
  if (!signedIn)  return <BlockedAuthState message="Inicia sesión para gestionar la configuración de tu cuenta." />;

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "32px 16px" }}>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "#e8b84b", textTransform: "uppercase", fontFamily: "Rajdhani,sans-serif", fontWeight: 700, marginBottom: 8 }}>─── Forge Control ───</p>
        <h1 style={{ fontFamily: "Cinzel,serif", color: "#e8e8f0", fontSize: 26, margin: "0 0 4px" }}>⚙️ Configuración</h1>
        <p style={{ color: "#666", margin: 0, fontSize: 12 }}>Gestiona tus preferencias de Forjador.</p>
      </div>

      <Section title="Notificaciones" icon="🔔">
        <Toggle label="Notificaciones globales" description="Recibe avisos sobre misiones, eventos y recompensas pendientes." checked={notifyVal} onChange={v => { setNotify(v); }} disabled={saving} />
        <Toggle label="Integración Telegram" description="Recibe alertas en tu Telegram vinculado a la cuenta." checked={telegramVal} onChange={v => { setTelegram(v); }} disabled={saving} />
      </Section>

      <Section title="Apariencia" icon="🎨">
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: "#888", fontSize: 10, fontWeight: 700, marginBottom: 10 }}>MODO DE INTERFAZ</div>
          <div style={{ display: "flex", gap: 8 }}>
            {UI_MODES.map(m => <button key={m} onClick={() => { setUiMode(m); }} style={selectSt(uiModeVal === m)}>{m === "dark" ? "🌙 Dark" : "⬛ AMOLED"}</button>)}
          </div>
        </div>
        <div style={{ background: "#1a1a2e", borderRadius: 10, padding: "14px 18px" }}>
          <div style={{ color: "#888", fontSize: 10, fontWeight: 700, marginBottom: 10 }}>IDIOMA</div>
          <div style={{ display: "flex", gap: 8 }}>
            {LANGUAGES.map(({ v, l }) => <button key={v} onClick={() => { setLanguage(v); }} style={selectSt(langVal === v)}>{l}</button>)}
          </div>
        </div>
      </Section>

      <Section title="Cuenta" icon="👤">
        {[{ label: "Perfil de Forjador", desc: "Ver y editar tu identidad pública", to: "/profile" },
          { label: "Depósitos y Economía", desc: "Historial de transacciones y balance", to: "/economy" },
          { label: "Cosméticos Equipados", desc: "Cambiar marcos, avatares y tableros", to: "/cosmetics" }].map(item => (
          <div key={item.to} style={{ background: "#1a1a2e", borderRadius: 10, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ color: "#e8e8f0", fontWeight: 700, fontSize: 13 }}>{item.label}</div>
              <div style={{ color: "#555", fontSize: 11 }}>{item.desc}</div>
            </div>
            <Link to={item.to} style={{ color: "#e8b84b", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>Ver →</Link>
          </div>
        ))}
      </Section>

      <div style={{ borderTop: "1px solid #1a1a2e", paddingTop: 24 }}>
        {reason    && <p style={{ fontSize: 12, color: "#888", marginBottom: 10 }}>{reason}</p>}
        {saveError && <p style={{ fontSize: 12, color: "#e3573f", marginBottom: 10 }}>{saveError}</p>}

        <button onClick={handleSave} disabled={saving || !dirty} style={{ padding: "11px 28px", borderRadius: 10, border: "none", fontFamily: "Cinzel,serif", fontWeight: 800, fontSize: 13, cursor: dirty && !saving ? "pointer" : "not-allowed", background: dirty ? "linear-gradient(135deg,#e8b84b,#c9901f)" : "#1a1a2e", color: dirty ? "#0a0a12" : "#444", transition: "all .2s" }}>
          {saving ? "Guardando…" : "Guardar Cambios"}
        </button>
      </div>
    </main>
  );
}
