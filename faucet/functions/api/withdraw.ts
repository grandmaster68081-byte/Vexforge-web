import { allowRate, currentAccount, requireCsrf, rateKey } from './_lib/auth';
import { isValidTronBase58Check } from '../../src/lib/crypto-address';
import type { Env } from './_lib/env';
import { db } from './_lib/supabase';
import { error, json } from './_lib/response';

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  if (!(await requireCsrf(request, current.session))) return error('Security check failed. Refresh the page and try again.', 403);
  if (!(await allowRate(env, `withdraw:${current.account.id}:${await rateKey(request)}`, 5, 3600))) return error('Too many withdrawal requests. Please try again later.', 429);
  const body = await request.json().catch(() => null) as any;
  const amount = Number(body?.amountPoints);
  const asset = String(body?.asset ?? '').trim().toUpperCase();
  const network = String(body?.network ?? '').trim().toUpperCase();
  const destination = String(body?.destination ?? '').trim();
  if (!Number.isFinite(amount) || amount <= 0 || amount > 100000000) return error('Enter a valid withdrawal amount.');
  if (asset !== 'USDT' || network !== 'TRC20') return error('Kivora currently supports USDT on TRC20 only.', 422);
  if (!(await isValidTronBase58Check(destination))) return error('Enter a valid TRON address for the USDT/TRC20 payout rail.', 422);
  const { data, error: rpcError } = await db(env).rpc('request_withdrawal_v2', {
    p_account_id: current.account.id, p_amount_points: amount, p_asset: asset, p_network: network, p_destination: destination,
  });
  if (rpcError) {
    const message = rpcError.message.toLowerCase();
    const clientError = ['minimum', 'insufficient', 'debt', 'supported', 'rail', 'temporarily'].some((part) => message.includes(part));
    return error(clientError ? rpcError.message : 'Could not create withdrawal.', clientError ? 422 : 500);
  }
  return json({ withdrawal: mapWithdrawal(data) }, 201);
};

function mapWithdrawal(x: any) {
  return { id: x.id, amountPoints: Number(x.amount_points), amountUsdReference: Number(x.amount_usd_reference ?? 0), asset: x.asset, network: x.network, destination: x.destination, status: x.status, txHash: x.tx_hash, cryptoAmount: x.crypto_amount == null ? null : Number(x.crypto_amount), paymentRateUsd: x.payment_rate_usd == null ? null : Number(x.payment_rate_usd), adminNote: x.admin_note, createdAt: x.created_at };
}
