import { currentAccount } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { error, json } from '../_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  const client = db(env);
  await client.rpc('settle_due_rewards_v2', { p_account_id: current.account.id });
  const [{ data: wallet }, { data: withdrawals }] = await Promise.all([
    client.from('wallets').select('available_points,pending_points,withdrawal_reserved_points,lifetime_earned_points,lifetime_withdrawn_points,debt_points').eq('account_id', current.account.id).single(),
    client.from('withdrawals').select('id,amount_points,asset,network,destination,status,tx_hash,admin_note,created_at').eq('account_id', current.account.id).order('created_at', { ascending: false }).limit(30),
  ]);
  if (!wallet) return error('Wallet unavailable.', 500);
  return json({
    wallet: { availablePoints: Number(wallet.available_points), pendingPoints: Number(wallet.pending_points), withdrawalReservedPoints: Number(wallet.withdrawal_reserved_points ?? 0), lifetimeEarnedPoints: Number(wallet.lifetime_earned_points), lifetimeWithdrawnPoints: Number(wallet.lifetime_withdrawn_points), debtPoints: Number(wallet.debt_points ?? 0) },
    withdrawals: (withdrawals ?? []).map(mapWithdrawal),
  });
};
function mapWithdrawal(value: any) { return { id: value.id, amountPoints: Number(value.amount_points), asset: value.asset, network: value.network, destination: value.destination, status: value.status, txHash: value.tx_hash, adminNote: value.admin_note, createdAt: value.created_at }; }
