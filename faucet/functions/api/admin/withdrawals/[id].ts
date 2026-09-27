import { requireAdmin, requireCsrf } from '../../_lib/auth';
import type { Env } from '../../_lib/env';
import { db } from '../../_lib/supabase';
import { error, json } from '../../_lib/response';

export const onRequestPost = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const current = await requireAdmin(request, env);
  if ('error' in current) return current.error;
  if (!(await requireCsrf(request, current.session))) return error('Security check failed.', 403);
  const body = await request.json().catch(() => null) as any;
  const action = String(body?.action ?? '');
  if (!['approve', 'reject', 'paid'].includes(action)) return error('Invalid action.');
  if (action === 'paid' && (!String(body?.txHash ?? '').trim() || !(Number(body?.cryptoAmount) > 0))) return error('Transaction hash and crypto payment amount are required before marking a payout paid.');
  const { data, error: rpcError } = await db(env).rpc('admin_update_withdrawal_v2', {
    p_withdrawal_id: params.id, p_admin_account_id: current.account.id, p_action: action, p_note: body?.note ? String(body.note).slice(0, 500) : null, p_tx_hash: body?.txHash ? String(body.txHash).slice(0, 300) : null,
    p_crypto_amount: body?.cryptoAmount == null ? null : Number(body.cryptoAmount), p_payment_rate_usd: body?.paymentRateUsd == null ? null : Number(body.paymentRateUsd), p_payment_rate_source: body?.paymentRateSource ? String(body.paymentRateSource).slice(0, 100) : null, p_fee_crypto: Number(body?.feeCrypto ?? 0),
  });
  if (rpcError) { console.error('Kivora admin withdrawal action failed', rpcError); return error(rpcError.message.includes('treasury') ? rpcError.message : 'The withdrawal could not be updated. Please refresh and try again.', 422); }
  return json({ withdrawal: map(data) });
};

function map(x: any) { return { id: x.id, amountPoints: Number(x.amount_points), amountUsdReference: Number(x.amount_usd_reference ?? 0), asset: x.asset, network: x.network, destination: x.destination, status: x.status, txHash: x.tx_hash, cryptoAmount: x.crypto_amount == null ? null : Number(x.crypto_amount), paymentRateUsd: x.payment_rate_usd == null ? null : Number(x.payment_rate_usd), adminNote: x.admin_note, createdAt: x.created_at }; }
