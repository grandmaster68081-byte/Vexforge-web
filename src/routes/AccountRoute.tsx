import { useState } from "react";
    import { Link } from "react-router-dom";
    import { useSession } from "../providers/AuthProvider";
    import { supabase } from "../lib/supabase";

    const COVER_URL =
    "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/cover/main.jpg";

    type Mode = "signIn" | "signUp" | "resetPassword";

    export function AccountRoute() {
    const { session, loading, error, signIn, signUp, signOut } = useSession();
    const [email, setEmail]         = useState("");
    const [password, setPassword]   = useState("");
    const [mode, setMode]           = useState<Mode>("signIn");
    const [formError, setFormError] = useState<string | null>(null);
    const [info, setInfo]           = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);

    function switchMode(next: Mode) {
      setMode(next);
      setFormError(null);
      setInfo(null);
    }

    if (loading) {
      return (
        <section className="auth-cover" style={{ backgroundImage: `url(${COVER_URL})` }}>
          <div className="auth-cover-panel">
            <header className="route-header"><h1>Account</h1></header>
            <p className="muted">Checking session…</p>
          </div>
        </section>
      );
    }

    if (session) {
      return (
        <section className="auth-cover" style={{ backgroundImage: `url(${COVER_URL})` }}>
          <div className="auth-cover-panel">
            <header className="route-header"><h1>Account</h1></header>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div className="stat-card" style={{ gap: 4 }}>
                <p className="muted" style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>
                  Signed in as
                </p>
                <p style={{ fontWeight: 600, wordBreak: "break-all" }}>{session.user.email ?? session.user.id}</p>
              </div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <Link to="/profile"  className="btn-small">👤 Profile</Link>
                <Link to="/progress" className="btn-small">📈 Progress</Link>
                <Link to="/economy"  className="btn-small">💰 Economy</Link>
                <Link to="/settings" className="btn-small">⚙️ Settings</Link>
              </div>
              <button
                onClick={() => signOut()}
                className="btn-small"
                style={{ alignSelf: "flex-start", background: "#e3573f14", borderColor: "#e3573f44", color: "#e3573f" }}
              >
                Sign out
              </button>
            </div>
          </div>
        </section>
      );
    }

    // ── Reset password form ───────────────────────────────────────────────────
    if (mode === "resetPassword") {
      async function handleReset(e: React.FormEvent) {
        e.preventDefault();
        setFormError(null);
        setInfo(null);
        setSubmitting(true);
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin + "/account",
        });
        setSubmitting(false);
        if (resetErr) { setFormError(resetErr.message); return; }
        setInfo("Revisa tu correo — te enviamos un enlace para restablecer tu contraseña.");
      }

      return (
        <section className="auth-cover" style={{ backgroundImage: `url(${COVER_URL})` }}>
          <div className="auth-cover-panel">
            <header className="route-header"><h1>Restablecer contraseña</h1></header>
            <form onSubmit={handleReset} className="auth-form">
              <label>
                Email
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="tu@correo.com" />
              </label>
              {formError && <p className="error">{formError}</p>}
              {info    && <p className="muted" style={{ fontSize: 13 }}>{info}</p>}
              <div className="auth-form-actions">
                <button type="submit" disabled={submitting}>
                  {submitting ? "Enviando…" : "Enviar enlace de reset"}
                </button>
                <button type="button" className="link-button" onClick={() => switchMode("signIn")}>
                  ← Volver a Sign in
                </button>
              </div>
            </form>
          </div>
        </section>
      );
    }

    // ── Sign in / Sign up form ────────────────────────────────────────────────
    async function handleSubmit(e: React.FormEvent) {
      e.preventDefault();
      setFormError(null);
      setInfo(null);
      setSubmitting(true);
      const action = mode === "signIn" ? signIn : signUp;
      const { error: actionErr } = await action(email, password);
      setSubmitting(false);
      if (actionErr) { setFormError(actionErr); return; }
      if (mode === "signUp") {
        setInfo("Cuenta creada. Revisa tu correo si se requiere confirmación, luego inicia sesión.");
      }
    }

    return (
      <section className="auth-cover" style={{ backgroundImage: `url(${COVER_URL})` }}>
        <div className="auth-cover-panel">
          <header className="route-header"><h1>Account</h1></header>

          <form onSubmit={handleSubmit} className="auth-form">
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={6} required />
            </label>

            {(formError || error) && <p className="error">{formError ?? error}</p>}
            {info && <p className="muted" style={{ fontSize: 13 }}>{info}</p>}

            <div className="auth-form-actions">
              <button type="submit" disabled={submitting}>
                {submitting ? "…" : mode === "signIn" ? "Sign in" : "Create account"}
              </button>
              <button type="button" className="link-button"
                onClick={() => switchMode(mode === "signIn" ? "signUp" : "signIn")}>
                {mode === "signIn" ? "¿Sin cuenta? Regístrate" : "¿Ya tienes cuenta? Sign in"}
              </button>
              {mode === "signIn" && (
                <button type="button" className="link-button" style={{ fontSize: 12, opacity: 0.7 }}
                  onClick={() => switchMode("resetPassword")}>
                  ¿Olvidaste tu contraseña?
                </button>
              )}
            </div>
          </form>
        </div>
      </section>
    );
    }
    