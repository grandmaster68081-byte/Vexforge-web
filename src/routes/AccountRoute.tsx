import { useState } from "react";
import { useSession } from "../providers/AuthProvider";

const COVER_URL =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets/cover/main.jpg";

/**
 * Minimal real sign-in/sign-up UI for Supabase Auth (email/password).
 * This is the only place in the app a user can create a session -- profile,
 * progress, economy and settings routes just read useSession() and rely on
 * this having run first.
 */
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
      <section>
        <header className="route-header">
          <h1>Account</h1>
        </header>
        <p className="muted">Checking session…</p>
      </section>
    );
  }

  if (session) {
    return (
      <section>
        <header className="route-header">
          <h1>Account</h1>
        </header>
        <div className="empty-state">
          <p>Signed in as {session.user.email ?? session.user.id}.</p>
          <button onClick={() => signOut()}>Sign out</button>
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
    if (error) {
      setFormError(error);
      return;
    }
    if (mode === "signUp") {
      setInfo("Account created. Check your email if confirmation is required, then sign in.");
    }
  }

  return (
    <section className="auth-cover" style={{ backgroundImage: `url(${COVER_URL})` }}>
      <div className="auth-cover-panel">
        <header className="route-header">
          <h1>Account</h1>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
          </label>

          {(formError || error) && <p className="error">{formError ?? error}</p>}
          {info && <p className="muted">{info}</p>}

          <div className="auth-form-actions">
            <button type="submit" disabled={submitting}>
              {mode === "signIn" ? "Sign in" : "Create account"}
            </button>
            <button
              type="button"
              className="link-button"
              onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
            >
              {mode === "signIn" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
