import { requireAdmin, requireCsrf } from '../../_lib/auth';
import type { Env } from '../../_lib/env';
import { db } from '../../_lib/supabase';
import { error, json } from '../../_lib/response';
export const onRequestPost = async ({ request, env, params }: { request: Request; env: Env; params: { id: string } }) => {
  const current = await requireAdmin(request, env); if ('error' in current) return current.error;
  if (!(await requireCsrf(request, current.session))) return error('Security check failed.', 403);
  const body = await request.json().catch(() => null) as any; const action = String(body?.action ?? '');
  if (!['approve','reject','paid'].includes(action)) return error('Invalid action.');
  if (action === 'paid' && !String(body?.txHash ?? '').trim()) return error('Transaction hash is required before marking a payout paid.');
  const { data, error: rpcError } = await db(env).rpc('admin_update_withdrawal_v2', { p_withdrawal_id: params.id, p_admin_account_id: current.account.id, p_action: action, p_note: body?.note ? String(body.note).slice(0,500) : null, p_tx_hash: body?.txHash ? String(body.txHash).slice(0,300) : null });
  if (rpcError) return error(rpcError.message,422); return json({withdrawal:mapWithdrawal(data)});
};
function mapWithdrawal(value:any){return {id:value.id,amountPoints:Number(value.amount_points),asset:value.asset,network:value.network,destination:value.destination,status:value.status,txHash:value.tx_hash,adminNote:value.admin_note,createdAt:value.created_at};}
