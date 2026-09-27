import { requireAdmin } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await requireAdmin(request, env);
  if ('error' in current) return current.error;
  const { data, error: rpcError } = await db(env).rpc('admin_summary_v2');
  if (rpcError) { console.error('Kivora admin summary failed', rpcError); return error('Admin summary is temporarily unavailable.', 503); }
  return json(data ?? {});
};
