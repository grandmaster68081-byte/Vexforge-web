import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../providers/AuthProvider";
import { supabase } from "../lib/supabase";
import { ForgeIcon, type ForgeIconName } from "../shared/components/ForgeIcon";
import { storageAsset } from "../lib/assetManifest";

const COVER_URL = storageAsset("cover/main.jpg");
const LOGO_URL  = storageAsset("logo/IMG_20260606_040509_906.jpg");
type Mode = "signIn" | "signUp" | "resetPassword";
const ACCOUNT_LINKS: Array<{ to: string; icon: ForgeIconName; label: string }> = [
  { to: "/profile", icon: "profile", label: "Perfil" },
  { to: "/progress", icon: "progress", label: "Progreso" },
  { to: "/economy", icon: "economy", label: "Economía" },
  { to: "/settings", icon: "settings", label: "Configuración" },
];

export function AccountRoute() {
  const { session, loading, signIn, signUp, signOut } = useSession();
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode]         = useState<Mode>("signIn");
  const [busy, setBusy]         = useState(false);
  const [message, setMessage]   = useState<string | null>(null);
  const [err, setErr]           = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setErr(null); setMessage(null);
    if (mode === "resetPassword") {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      setBusy(false);
      if (error) setErr(error.message);
      else setMessage("¡Enlace enviado! Revisa tu correo para recuperar el acceso.");
      return;
    }
    const result = mode === "signIn" ? await signIn(email, password) : await signUp(email, password);
    setBusy(false);
    if (result?.error) setErr(typeof result.error === "string" ? result.error : (result.error as any).message ?? String(result.error));
    else if (mode === "signUp") setMessage("¡Cuenta creada! Revisa tu correo para confirmar tu registro.");
  }

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "80vh" }}>
      <div style={{ width: 36, height: 36, borderRadius: "50%", border: "3px solid rgba(201,144,31,0.2)", borderTopColor: "var(--ember-gold)", animation: "spin 0.8s linear infinite" }} />
    </div>
  );

  if (session) return (
    <section>
      <div className="hero-banner" style={{ backgroundImage: `url(${COVER_URL})`, height: 220 }}>
        <div className="hero-banner-overlay" style={{ alignItems: "flex-start", padding: "clamp(24px,5vw,40px) clamp(16px,5vw,48px)" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ember-gold)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, marginBottom: 10 }}>Forja</p>
          <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: "clamp(1.5rem,4vw,3rem)", fontWeight: 900, margin: 0 }}>Mi Cuenta</h1>
        </div>
      </div>
      <div style={{ padding: "clamp(20px,5vw,40px) clamp(16px,5vw,48px) 48px", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "18px 20px", marginBottom: 24,
          background: "linear-gradient(135deg,rgba(61,220,132,0.08),rgba(61,220,132,0.02))",
          border: "1px solid rgba(61,220,132,0.25)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%",
            background: "rgba(61,220,132,0.15)", border: "2px solid rgba(61,220,132,0.3)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#3ddc84", flexShrink: 0 }}>
            <ForgeIcon name="check" size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, color: "#3ddc84", fontFamily: '"Rajdhani",sans-serif',
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Sesión Activa</p>
            <p style={{ fontSize: 13, margin: 0, wordBreak: "break-all", color: "var(--fg-base)", overflow: "hidden", textOverflow: "ellipsis" }}>
              {session.user?.email}
            </p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 10, marginBottom: 24 }}>
          {ACCOUNT_LINKS.map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: "none" }}>
              <div style={{
                padding: "16px 14px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "var(--radius-md)", cursor: "pointer",
                transition: "border-color .15s, background .15s, transform .15s",
                textAlign: "center",
              }}
              onMouseEnter={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "rgba(201,144,31,0.3)"; d.style.background = "rgba(201,144,31,0.05)"; d.style.transform = "translateY(-2px)"; }}
              onMouseLeave={e => { const d = e.currentTarget as HTMLDivElement; d.style.borderColor = "rgba(255,255,255,0.06)"; d.style.background = "rgba(255,255,255,0.02)"; d.style.transform = ""; }}
              >
                <ForgeIcon name={l.icon} size={22} style={{ display: "block", margin: "0 auto 8px", color: "var(--ember-gold)" }} />
                <span style={{ fontSize: 12, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, color: "var(--fg-base)", letterSpacing: "0.04em" }}>{l.label}</span>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut()}
          style={{
            padding: "12px 28px", borderRadius: "var(--radius-md)",
            border: "1px solid rgba(227,87,63,0.35)", background: "rgba(227,87,63,0.06)",
            color: "#e3573f", cursor: "pointer", fontSize: 13,
            fontFamily: '"Rajdhani",sans-serif', fontWeight: 700,
            transition: "background 0.2s, border-color 0.2s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(227,87,63,0.12)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(227,87,63,0.06)"; }}
        >
          Cerrar Sesión
        </button>
      </div>
    </section>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: `url(${COVER_URL})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative", padding: "16px 0" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(6,6,12,0.82)", backdropFilter: "blur(3px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, margin: "0 16px", padding: "clamp(24px,5vw,36px) clamp(20px,5vw,32px)", background: "rgba(12,12,22,0.97)", border: "1px solid rgba(201,144,31,0.25)", borderRadius: "var(--radius-lg)", boxShadow: "0 24px 60px rgba(0,0,0,0.6), 0 0 60px rgba(201,144,31,0.06)" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <img src={LOGO_URL} alt="VEXFORGE" style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid rgba(201,144,31,0.4)", objectFit: "cover", marginBottom: 14 }} />
          <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: 20, fontWeight: 900, margin: "0 0 4px" }}>VEXFORGE</h1>
          <p className="muted" style={{ fontSize: 12, margin: 0 }}>
            {mode === "signIn" ? "Entra a la Forja" : mode === "signUp" ? "Únete al reino de hierro" : "Recupera tu acceso"}
          </p>
        </div>

        {mode !== "resetPassword" && (
          <div style={{ display: "flex", borderRadius: "var(--radius-md)", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", marginBottom: 24, padding: 3 }}>
            {(["signIn", "signUp"] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setErr(null); setMessage(null); }}
                style={{ flex: 1, padding: "8px 12px", border: "none", borderRadius: "calc(var(--radius-md) - 2px)", cursor: "pointer", fontSize: 13, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, background: mode === m ? "rgba(201,144,31,0.2)" : "transparent", color: mode === m ? "var(--ember-gold)" : "var(--fg-muted)", transition: "all 0.15s" }}>
                {m === "signIn" ? "Iniciar Sesión" : "Crear Cuenta"}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input type="email" required placeholder="Correo electrónico" value={email} onChange={e => setEmail(e.target.value)}
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "12px 14px", color: "var(--fg-base)", fontSize: 14, width: "100%", outline: "none" }} />
          {mode !== "resetPassword" && (
            <input type="password" required placeholder="Contraseña" value={password} onChange={e => setPassword(e.target.value)}
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "var(--radius-md)", padding: "12px 14px", color: "var(--fg-base)", fontSize: 14, width: "100%", outline: "none" }} />
          )}
          {err     && <p style={{ fontSize: 12, color: "#e3573f", margin: "2px 0" }}>{err}</p>}
          {message && <p style={{ fontSize: 12, color: "#3ddc84",  margin: "2px 0" }}>{message}</p>}
          <button type="submit" className="btn btn-primary" disabled={busy}
            style={{ marginTop: 4, fontSize: 14, padding: "13px 0", width: "100%" }}>
            {busy ? "…" : mode === "resetPassword" ? "Enviar Enlace" : mode === "signIn" ? "Entrar a la Forja" : "Crear Cuenta"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: 20 }}>
          {mode !== "resetPassword" ? (
            <button onClick={() => { setMode("resetPassword"); setErr(null); setMessage(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--fg-muted)" }}>
              ¿Olvidaste tu contraseña?
            </button>
          ) : (
            <button onClick={() => { setMode("signIn"); setErr(null); setMessage(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--fg-muted)" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                <ForgeIcon name="chevron-left" size={14} />
                Volver al inicio de sesión
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}