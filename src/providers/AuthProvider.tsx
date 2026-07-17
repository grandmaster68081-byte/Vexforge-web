import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
 * Real Supabase Auth provider (email/password) — chat 27 + chat 35 auto-provisioning.
 *
 * On every SIGNED_IN event (sign-in, sign-up, page refresh with active session),
 * ensurePlayerRow() runs silently:
 *   1. Checks if a `players` row already exists for auth.uid().
 *   2. If not, INSERTs a new row so every signed-in user immediately has a profile.
 *   3. Errors are caught and swallowed — provisioning failure never breaks the auth flow.
 *
 * This resolves the blocker documented in backend/pending/auth-and-writes.md:
 * "No player row auto-provisioning on sign-up".
 */

interface AuthContextValue {
  session: Session | null;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensurePlayerRow(userId: string, userEmail: string): Promise<void> {
  try {
    const { data: existing } = await supabase
      .from("players")
      .select("id")
      .eq("auth_user_id", userId)
      .maybeSingle();

    if (existing) return; // already provisioned

    await supabase.from("players").insert({
      auth_user_id: userId,
      email: userEmail,
      display_name: userEmail.split("@")[0],
      role: "player",
      status: "active",
      source_system: "web",
    });
  } catch {
    // Non-fatal: session stays valid even if provisioning fails
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(async ({ data, error: sessionErr }) => {
      if (cancelled) return;
      if (sessionErr) setError(sessionErr.message);
      const s = data.session;
      setSession(s);
      if (s?.user) {
        await ensurePlayerRow(s.user.id, s.user.email ?? "");
      }
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (cancelled) return;
      setSession(newSession);
      if ((event === "SIGNED_IN") && newSession?.user) {
        await ensurePlayerRow(newSession.user.id, newSession.user.email ?? "");
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    return { error: signInErr ? signInErr.message : null };
  }

  async function signUp(email: string, password: string) {
    const { data, error: signUpErr } = await supabase.auth.signUp({ email, password });
    if (!signUpErr && data.user) {
      await ensurePlayerRow(data.user.id, email);
    }
    return { error: signUpErr ? signUpErr.message : null };
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ session, loading, error, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useSession must be used inside <AuthProvider>");
  }
  return ctx;
}
