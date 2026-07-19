import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Missing VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY. Copy .env.example to .env."
  );
}

/**
 * The ONE Supabase client for the whole app.
 * Supabase is the single source of truth (see backend/architecture/data-source.md).
 * Never import @supabase/supabase-js anywhere else -- always go through
 * a domain repository, which goes through this client.
 */
export const supabase = createClient(url, anonKey);