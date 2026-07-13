import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
 * Real Supabase Auth provider (email/password), wired chat 27.
 * This is the first non-shell auth implementation for this project --
 * previously src/providers/README.md deliberately left this empty because
 * there was no real auth config to base it on. Supabase Auth's email
 * provider is enabled by default on every project and needs no extra
 * backend configuration, so this does not touch schema/RLS/functions.
 *
 * Unblocks (once a user actually signs in): profile, progress, economy,
 * settings -- all of which already have correct RLS scoped to
 * auth.uid() = players.auth_user_id. This provider does not create rows in
 * `players` itself -- that is out of scope for this pass (see
 * backend/pending/auth-and-writes.md history). If a signed-in auth user has
 * no matching players row yet, domain repositories will simply return an
 * empty result, not an error.
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

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    supabase.auth.getSession().then(({ data, error }) => {
      if (cancelled) return;
      if (error) setError(error.message);
      setSession(data.session);
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? error.message : null };
  }

  async function signUp(email: string, password: string) {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error ? error.message : null };
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
