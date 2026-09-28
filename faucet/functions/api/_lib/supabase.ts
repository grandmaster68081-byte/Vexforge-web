import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Env } from './env';

export function db(env: Env): SupabaseClient {
  const key = env.SUPABASE_SECRET_KEY ?? env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env.SUPABASE_URL || !key) throw new Error('Supabase server credentials are not configured.');
  return createClient(env.SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } }).schema('faucet');
}
