import { useState } from "react";
import { Link } from "react-router-dom";
import { useSession } from "../providers/AuthProvider";

const COVER_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/cover/main.jpg";

export function AccountRoute() {
  const { session, loading, error, signIn, signUp, signOut } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [formError, setFormError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
              <Link to="/profile" className="btn-small">👤 Profile</Link>
              <Link to="/progress" className="btn-small">📈 Progress</Link>
              <Link to="/economy" className="btn-small">💰 Economy</Link>
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setInfo(null);
    setSubmitting(true);
    const action = mode === "signIn" ? signIn : signUp;
    const { error } = await action(email, password);
    setSubmitting(false);
    if (error) { setFormError(error); return; }
    if (mode === "signUp") {
      setInfo("Account created. Check your email if confirmation is required, then sign in.");
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
            <button
              type="button"
              className="link-button"
              onClick={() => { setMode(mode === "signIn" ? "signUp" : "signIn"); setFormError(null); setInfo(null); }}
            >
              {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
