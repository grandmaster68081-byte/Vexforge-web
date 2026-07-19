import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

/**
* Auth provider — chat 36.
* ensurePlayerRow() calls the SECURITY DEFINER RPC ensure_player_row,
* bypassing the players_no_insert RLS policy safely.
* A Postgres trigger on auth.users also provisions the row server-side on sign-up.
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

async function ensurePlayerRow(userEmail: string): Promise<void> {
try {
  await supabase.rpc("ensure_player_row", {
    p_email: userEmail,
    p_display_name: userEmail.split("@")[0],
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
    if (s?.user) await ensurePlayerRow(s.user.email ?? "");
    setLoading(false);
  });

  const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
    if (cancelled) return;
    setSession(newSession);
    if (event === "SIGNED_IN" && newSession?.user) {
      await ensurePlayerRow(newSession.user.email ?? "");
    }
  });

  return () => {
    cancelled = true;
    subscription.subscription.unsubscribe();
  };
}, []);

async function signIn(email: string, password: string) {
  const { error: e } = await supabase.auth.signInWithPassword({ email, password });
  return { error: e ? e.message : null };
}

async function signUp(email: string, password: string) {
  const { data, error: e } = await supabase.auth.signUp({ email, password });
  if (!e && data.user) await ensurePlayerRow(email);
  return { error: e ? e.message : null };
}

async function signOut() { await supabase.auth.signOut(); }

return (
  <AuthContext.Provider value={{ session, loading, error, signIn, signUp, signOut }}>
    {children}
  </AuthContext.Provider>
);
}

export function useSession() {
const ctx = useContext(AuthContext);
if (!ctx) throw new Error("useSession must be used inside <AuthProvider>");
return ctx;
}
