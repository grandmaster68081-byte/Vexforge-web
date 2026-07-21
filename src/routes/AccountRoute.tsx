import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../providers/AuthProvider";
import { supabase } from "../lib/supabase";

const COVER_URL = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/cover/main.jpg";
const LOGO_URL  = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/logo/IMG_20260606_040509_906.jpg";
type Mode = "signIn" | "signUp" | "resetPassword";

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
        <div className="hero-banner-overlay" style={{ alignItems: "flex-start", padding: "40px 48px" }}>
          <p style={{ fontSize: 11, letterSpacing: "0.14em", color: "var(--ember-gold)", textTransform: "uppercase", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, marginBottom: 10 }}>─── Forja ───</p>
          <h1 style={{ fontFamily: '"Cinzel Decorative",serif', fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, margin: 0 }}>Mi Cuenta</h1>
        </div>
      </div>
      <div style={{ padding: "40px 48px 48px", maxWidth: 560 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18, padding: "22px 26px", marginBottom: 28, background: "linear-gradient(135deg,rgba(61,220,132,0.08),rgba(61,220,132,0.02))", border: "1px solid rgba(61,220,132,0.25)", borderRadius: "var(--radius-lg)" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(61,220,132,0.15)", border: "2px solid rgba(61,220,132,0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#3ddc84", flexShrink: 0 }}>✓</div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 12, color: "#3ddc84", fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Sesión Activa</p>
            <p style={{ fontSize: 14, margin: 0, wordBreak: "break-all" }}>{session.user?.email}</p>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
          {[
            { to: "/profile",  icon: "👤", label: "Perfil"        },
            { to: "/progress", icon: "📈", label: "Progreso"      },
            { to: "/economy",  icon: "💰", label: "Economía"      },
            { to: "/settings", icon: "⚙️", label: "Configuración" },
          ].map(l => (
            <Link key={l.to} to={l.to} style={{ textDecoration: "none" }}>
              <div style={{ padding: "18px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "var(--radius-md)", cursor: "pointer", transition: "border-color .15s" }}>
                <span style={{ fontSize: 20, display: "block", marginBottom: 6 }}>{l.icon}</span>
                <span style={{ fontSize: 13, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, color: "var(--fg-base)" }}>{l.label}</span>
              </div>
            </Link>
          ))}
        </div>
        <button
          onClick={() => signOut()}
          style={{ padding: "12px 28px", borderRadius: "var(--radius-md)", border: "1px solid rgba(227,87,63,0.35)", background: "rgba(227,87,63,0.06)", color: "#e3573f", cursor: "pointer", fontSize: 13, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}
        >
          Cerrar Sesión
        </button>
      </div>
    </section>
  );

  return (
    <div style={{ minHeight: "calc(100vh - 60px)", display: "flex", alignItems: "center", justifyContent: "center", backgroundImage: `url(${COVER_URL})`, backgroundSize: "cover", backgroundPosition: "center", position: "relative" }}>
      <div style={{ position: "absolute", inset: 0, background: "rgba(6,6,12,0.78)", backdropFilter: "blur(2px)" }} />
      <div style={{ position: "relative", zIndex: 1, width: "100%", maxWidth: 400, margin: "0 16px", padding: "36px 32px", background: "rgba(12,12,22,0.96)", border: "1px solid rgba(201,144,31,0.25)", borderRadius: "var(--radius-lg)", boxShadow: "0 24px 60px rgba(0,0,0,0.5)" }}>
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
              ← Volver al inicio de sesión
            </button>
          )}
        </div>
      </div>
    </div>
  );
}