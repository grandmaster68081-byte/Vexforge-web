import { currentAccount, requireCsrf, allowRate, rateKey } from './_lib/auth';
import type { Env } from './_lib/env';
import { db } from './_lib/supabase';
import { error, json } from './_lib/response';

const TRON_BASE58 = /^T[1-9A-HJ-NP-Za-km-z]{33}$/;

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
  if (asset !== 'USDT' || network !== 'TRC20') return error('Only USDT on TRC20 is enabled in the initial Kivora payout rail.', 422);
  if (destination.length !== 34 || !TRON_BASE58.test(destination)) return error('The USDT TRC20 destination format is not valid.', 422);
  const client = db(env);
  const { data: settings, error: settingsError } = await client.from('settings').select('value').eq('key', 'supported_payouts').maybeSingle();
  if (settingsError) return error('Could not verify supported payout destinations.', 500);
  const supported = Array.isArray(settings?.value) && settings.value.length ? settings.value : [{ asset: 'USDT', network: 'TRC20' }];
  const supportedPair = supported.some((item: any) => String(item?.asset ?? '').toUpperCase() === 'USDT' && String(item?.network ?? '').toUpperCase() === 'TRC20');
  if (!supportedPair) return error('USDT TRC20 is not currently enabled.', 422);
  const { data: result, error: rpcError } = await client.rpc('request_withdrawal_v2', {
    p_account_id: current.account.id,
    p_amount_points: amount,
    p_asset: 'USDT',
    p_network: 'TRC20',
    p_destination: destination,
  });
  if (rpcError) return error(rpcError.message.includes('minimum') || rpcError.message.includes('insufficient') || rpcError.message.includes('debt') || rpcError.message.includes('supported') ? rpcError.message : 'Could not create withdrawal.', 422);
  return json({ withdrawal: mapWithdrawal(result) }, 201);
};

function mapWithdrawal(value: any) {
  return { id: value.id, amountPoints: Number(value.amount_points), asset: value.asset, network: value.network, destination: value.destination, status: value.status, txHash: value.tx_hash, adminNote: value.admin_note, createdAt: value.created_at };
}
