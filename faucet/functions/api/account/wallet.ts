import { currentAccount } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';
import { mapWallet } from './me';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  const { error: settlementError } = await db(env).rpc('settle_due_rewards_v2', { p_account_id: current.account.id });
  if (settlementError) { console.error('Kivora wallet settlement failed', settlementError); return error('Rewards are temporarily unavailable. Please try again later.', 503); }
  const client = db(env);
  const [{ data: wallet }, { data: withdrawals }] = await Promise.all([
    client.from('wallets').select('available_points,pending_points,reward_pending_points,withdrawal_reserved_points,lifetime_earned_points,lifetime_withdrawn_points,debt_points').eq('account_id', current.account.id).single(),
    client.from('withdrawals').select('id,amount_points,amount_usd_reference,asset,network,destination,status,tx_hash,crypto_amount,payment_rate_usd,admin_note,created_at').eq('account_id', current.account.id).order('created_at', { ascending: false }).limit(30),
  ]);
  if (!wallet) return error('Wallet unavailable.', 500);
  return json({ wallet: mapWallet(wallet), withdrawals: (withdrawals ?? []).map(mapWithdrawal) });
};

function mapWithdrawal(x: any) { return { id: x.id, amountPoints: Number(x.amount_points), amountUsdReference: Number(x.amount_usd_reference ?? 0), asset: x.asset, network: x.network, destination: x.destination, status: x.status, txHash: x.tx_hash, cryptoAmount: x.crypto_amount == null ? null : Number(x.crypto_amount), paymentRateUsd: x.payment_rate_usd == null ? null : Number(x.payment_rate_usd), adminNote: x.admin_note, createdAt: x.created_at }; }
