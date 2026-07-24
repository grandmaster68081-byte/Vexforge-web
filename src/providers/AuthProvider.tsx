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

const REFERRAL_STORAGE_KEY = "vexforge_pending_referral";

function rememberReferralCodeFromUrl() {
  const code = new URLSearchParams(window.location.search).get("ref")?.trim();
  if (code) localStorage.setItem(REFERRAL_STORAGE_KEY, code);
}

async function processPendingReferral(authUserId: string): Promise<void> {
  const referralCode = localStorage.getItem(REFERRAL_STORAGE_KEY);
  if (!referralCode) return;

  const { data, error } = await supabase.rpc("process_referral_on_register", {
    p_referral_code: referralCode,
    p_referred_auth_id: authUserId,
  });

  if (!error && data?.ok) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
    return;
  }

  if (!error && ["invalid_or_self_code", "referrer_limit_reached"].includes(data?.reason)) {
    localStorage.removeItem(REFERRAL_STORAGE_KEY);
  }
}

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
  rememberReferralCodeFromUrl();

  supabase.auth.getSession().then(async ({ data, error: sessionErr }) => {
    if (cancelled) return;
    if (sessionErr) setError(sessionErr.message);
    const s = data.session;
    setSession(s);
    if (s?.user) {
      await ensurePlayerRow(s.user.email ?? "");
      await processPendingReferral(s.user.id);
    }
    setLoading(false);
  });

  const { data: subscription } = supabase.auth.onAuthStateChange(async (event, newSession) => {
    if (cancelled) return;
    setSession(newSession);
    if (event === "SIGNED_IN" && newSession?.user) {
      await ensurePlayerRow(newSession.user.email ?? "");
      await processPendingReferral(newSession.user.id);
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
  rememberReferralCodeFromUrl();
  const { data, error: e } = await supabase.auth.signUp({ email, password });
  if (!e && data.user) {
    await ensurePlayerRow(email);
    if (data.session) await processPendingReferral(data.user.id);
  }
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
