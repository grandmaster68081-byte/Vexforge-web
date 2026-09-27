import MD5 from 'crypto-js/md5';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error } from '../_lib/response';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => handle(request, env);
export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => handle(request, env);

async function handle(request: Request, env: Env) {
  const sourceIp = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '';
  if (sourceIp !== (env.BITCOTASKS_POSTBACK_IP ?? '45.14.135.48')) return error('Unauthorized provider source.', 403);
  let payload: Record<string, unknown>;
  try { payload = request.method === 'POST' ? await readBody(request) : Object.fromEntries(new URL(request.url).searchParams.entries()); }
  catch { return error('Invalid provider payload.', 400); }
  const subId = String(payload.subId ?? '').trim();
  const transId = String(payload.transId ?? '').trim();
  const rewardRaw = String(payload.reward ?? '').trim();
  const status = Number(payload.status ?? 0);
  const signature = String(payload.signature ?? '').trim().toLowerCase();
  const reward = Number(rewardRaw);
  if (!subId || !transId || !signature || !/^\d+(?:\.\d+)?$/.test(rewardRaw) || !Number.isFinite(reward) || reward <= 0) return error('Missing or invalid required postback fields.', 400);
  if (status !== 1 && status !== 2) return error('Unsupported postback status.', 400);
  if (!timingSafeEqual(MD5(`${subId}${transId}${rewardRaw}${env.BITCOTASKS_SECRET_KEY}`).toString().toLowerCase(), signature)) return error("Signature doesn't match.", 403);
  const { data: account } = await db(env).from('accounts').select('id').eq('public_id', subId).maybeSingle();
  if (!account) return error('Unknown user.', 404);
  const { error: rpcError } = await db(env).rpc('apply_bitcotasks_postback_v2', {
    p_account_id: account.id, p_trans_id: transId, p_offer_name: String(payload.offer_name ?? ''), p_offer_type: String(payload.offer_type ?? ''),
    p_reward: reward, p_reward_name: String(payload.reward_name ?? ''), p_reward_value: Number(payload.reward_value ?? 0), p_payout_usd: Number(payload.payout ?? 0),
    p_user_ip: String(payload.userIp ?? ''), p_country: String(payload.country ?? ''), p_status: status, p_debug: Number(payload.debug ?? 0), p_raw_payload: payload,
  });
  if (rpcError) { console.error('Kivora provider postback was not recorded', rpcError); return error('Provider reward could not be recorded.', 422); }
  return new Response('ok', { status: 200, headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' } });
}

function timingSafeEqual(a: string, b: string) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }
async function readBody(request: Request) { const contentType = request.headers.get('content-type') ?? ''; if (contentType.includes('application/json')) return await request.json() as Record<string, unknown>; return Object.fromEntries(await request.formData()); }
