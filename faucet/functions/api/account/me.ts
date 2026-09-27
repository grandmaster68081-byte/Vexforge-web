import { currentAccount } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { db } from '../_lib/supabase';
import { json } from '../_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return json({ user: null, wallet: null, csrfToken: null });
  const { data: wallet } = await db(env).from('wallets').select('available_points,pending_points,reward_pending_points,withdrawal_reserved_points,lifetime_earned_points,lifetime_withdrawn_points,debt_points').eq('account_id', current.account.id).single();
  return json({
    user: { id: current.account.id, publicId: current.account.public_id, username: current.account.username, email: current.account.email, role: current.account.role },
    wallet: wallet ? mapWallet(wallet) : null,
    csrfToken: null,
  });
};

export function mapWallet(x: any) {
  return { availablePoints: Number(x.available_points), pendingPoints: Number(x.pending_points), rewardPendingPoints: Number(x.reward_pending_points ?? x.pending_points ?? 0), withdrawalReservedPoints: Number(x.withdrawal_reserved_points ?? 0), lifetimeEarnedPoints: Number(x.lifetime_earned_points), lifetimeWithdrawnPoints: Number(x.lifetime_withdrawn_points), debtPoints: Number(x.debt_points ?? 0) };
}
