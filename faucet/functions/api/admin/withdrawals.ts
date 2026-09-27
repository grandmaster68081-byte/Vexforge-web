import { requireAdmin } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await requireAdmin(request, env);
  if ('error' in current) return current.error;
  const { data, error: dbError } = await db(env).from('withdrawals').select('id,account_id,amount_points,amount_usd_reference,asset,network,destination,status,tx_hash,crypto_amount,payment_rate_usd,payment_rate_source,admin_note,created_at').in('status', ['pending', 'approved']).order('created_at', { ascending: false }).limit(100);
  if (dbError) { console.error('Kivora admin withdrawals query failed', dbError); return error('Admin withdrawals are temporarily unavailable.', 503); }
  return json({ withdrawals: (data ?? []).map(mapWithdrawal) });
};

export function mapWithdrawal(x: any) { return { id: x.id, accountId: x.account_id, amountPoints: Number(x.amount_points), amountUsdReference: Number(x.amount_usd_reference ?? 0), asset: x.asset, network: x.network, destination: x.destination, status: x.status, txHash: x.tx_hash, cryptoAmount: x.crypto_amount == null ? null : Number(x.crypto_amount), paymentRateUsd: x.payment_rate_usd == null ? null : Number(x.payment_rate_usd), paymentRateSource: x.payment_rate_source, adminNote: x.admin_note, createdAt: x.created_at }; }
