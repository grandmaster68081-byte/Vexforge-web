import type { Env } from './_lib/env';
import { db } from './_lib/supabase';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const { data, error: dbError } = await db(env)
      .from('settings')
      .select('key,value')
      .in('key', ['currency_name','points_per_usd_display','withdrawal_min_points','withdrawal_min_usd','target_user_share_bps','bitcotasks_exchange_rate','payout_asset','payout_network','supported_payouts','treasury_asset','treasury_network','treasury_address']);
    if (dbError) return error(dbError.message, 500);
    const map = Object.fromEntries((data ?? []).map((item: any) => [item.key, item.value]));
    const supported = Array.isArray(map.supported_payouts) && map.supported_payouts.length
      ? map.supported_payouts
      : [{ asset: 'USDT', network: 'TRC20' }];
    const providerConfigured = Boolean(env.BITCOTASKS_API_KEY && env.BITCOTASKS_BEARER_TOKEN && env.BITCOTASKS_SECRET_KEY);
    return json({
      currencyName: String(map.currency_name ?? 'Kivora Points').replace(/^"|"$/g, ''),
      pointsPerUsdDisplay: Number(map.points_per_usd_display ?? 1000),
      withdrawalMinPoints: Number(map.withdrawal_min_points ?? 10000),
      withdrawalMinUsd: Number(map.withdrawal_min_usd ?? 10),
      targetUserShareBps: Number(map.target_user_share_bps ?? 3500),
      bitcotasksExchangeRate: Number(map.bitcotasks_exchange_rate ?? 350),
      supportedPayouts: supported,
      payoutAsset: String(map.payout_asset ?? 'USDT'),
      payoutNetwork: String(map.payout_network ?? 'TRC20'),
      providerConfigured,
      treasuryAsset: String(map.treasury_asset ?? 'USDT'),
      treasuryNetwork: String(map.treasury_network ?? 'TRC20'),
      treasuryAddress: String(map.treasury_address ?? 'TLAujgYmQAtFW6BZg4fVs1pUHx6vyX5SJD'),
    });
  } catch (e) {
    return error(e instanceof Error ? e.message : 'Could not load settings.', 500);
  }
};
