import { requireAdmin, requireCsrf } from '../../_lib/auth';
import type { Env } from '../../_lib/env';
import { db } from '../../_lib/supabase';
import { error, json } from '../../_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await requireAdmin(request, env);
  if ('error' in current) return current.error;
  const client = db(env);
  const [summary, movements, settlements] = await Promise.all([
    client.rpc('admin_summary_v2'),
    client.from('treasury_movements').select('id,movement_type,asset,network,amount_crypto,usd_reference,reference_id,withdrawal_id,provider_settlement_id,tx_hash,note,created_at').order('created_at', { ascending: false }).limit(100),
    client.from('provider_settlements').select('id,provider,period_start,period_end,gross_activity_usd,net_received_usd_equivalent,settlement_asset,settlement_network,settlement_amount_crypto,provider_fee_crypto,settlement_reference,received_at,source_note,created_at').order('received_at', { ascending: false }).limit(50),
  ]);
  if (summary.error || movements.error || settlements.error) {
    console.error('Kivora treasury query failed', summary.error ?? movements.error ?? settlements.error);
    return error('Treasury data is temporarily unavailable.', 503);
  }
  return json({ summary: summary.data ?? {}, movements: movements.data ?? [], settlements: settlements.data ?? [] });
};

export const onRequestPost = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await requireAdmin(request, env);
  if ('error' in current) return current.error;
  if (!(await requireCsrf(request, current.session))) return error('Security check failed.', 403);
  const body = await request.json().catch(() => null) as any;
  const action = String(body?.action ?? '');
  const client = db(env);
  if (action === 'settlement') {
    const { data, error: rpcError } = await client.rpc('admin_record_provider_settlement', {
      p_admin_account_id: current.account.id,
      p_provider: 'bitcotasks',
      p_period_start: body.periodStart ?? null,
      p_period_end: body.periodEnd ?? null,
      p_gross_activity_usd: Number(body.grossActivityUsd ?? 0),
      p_net_received_usd_equivalent: Number(body.netReceivedUsd ?? 0),
      p_asset: String(body.asset ?? 'USDT').toUpperCase(),
      p_network: String(body.network ?? 'TRC20'),
      p_amount_crypto: Number(body.amountCrypto ?? 0),
      p_provider_fee_crypto: Number(body.providerFeeCrypto ?? 0),
      p_reference: body.reference ? String(body.reference).slice(0, 300) : null,
      p_note: body.note ? String(body.note).slice(0, 1000) : null,
    });
    if (rpcError) return error('Provider settlement could not be recorded.', 422);
    return json({ settlement: data }, 201);
  }
  if (action === 'movement') {
    const { data, error: rpcError } = await client.rpc('admin_record_treasury_movement', {
      p_admin_account_id: current.account.id,
      p_movement_type: String(body.movementType ?? 'adjustment'),
      p_asset: String(body.asset ?? 'USDT').toUpperCase(),
      p_network: String(body.network ?? 'TRC20'),
      p_amount_crypto: Number(body.amountCrypto ?? 0),
      p_usd_reference: body.usdReference == null ? null : Number(body.usdReference),
      p_reference_id: body.referenceId ? String(body.referenceId).slice(0, 300) : null,
      p_withdrawal_id: body.withdrawalId ?? null,
      p_provider_settlement_id: body.providerSettlementId ?? null,
      p_tx_hash: body.txHash ? String(body.txHash).slice(0, 300) : null,
      p_note: body.note ? String(body.note).slice(0, 1000) : null,
    });
    if (rpcError) return error('Treasury movement could not be recorded.', 422);
    return json({ movement: data }, 201);
  }
  return error('Unsupported treasury action.');
};
