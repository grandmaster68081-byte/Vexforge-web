import type { Env } from './_lib/env';
import { db } from './_lib/supabase';
import { error, json } from './_lib/response';

const DEFAULTS = {
  currencyName: 'Kivora Points',
  pointsPerUsdDisplay: 1000,
  targetUserShareBps: 3500,
  bitcotasksExchangeRate: 350,
  withdrawalMinPoints: 10000,
  withdrawalMinUsd: 10,
  payoutAsset: 'USDT',
  payoutNetwork: 'TRC20',
};

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const { data, error: dbError } = await db(env).from('settings').select('key,value').in('key', [
      'currency_name', 'points_per_usd_display', 'target_user_share_bps', 'bitcotasks_exchange_rate',
      'withdrawal_min_points', 'withdrawal_min_usd', 'payout_asset', 'payout_network', 'supported_payouts',
    ]);
    if (dbError) {
      console.error('Kivora settings query failed', dbError);
      return error('Kivora settings are temporarily unavailable.', 503);
    }
    const map = Object.fromEntries((data ?? []).map((x: any) => [x.key, x.value]));
    const stringSetting = (key: string, fallback: string) => String(map[key] ?? JSON.stringify(fallback)).replace(/^"|"$/g, '') || fallback;
    const numberSetting = (key: string, fallback: number) => Number(map[key] ?? fallback);
    const payoutAsset = stringSetting('payout_asset', DEFAULTS.payoutAsset);
    const payoutNetwork = stringSetting('payout_network', DEFAULTS.payoutNetwork);
    return json({
      currencyName: stringSetting('currency_name', DEFAULTS.currencyName),
      pointsPerUsdDisplay: numberSetting('points_per_usd_display', DEFAULTS.pointsPerUsdDisplay),
      targetUserShareBps: numberSetting('target_user_share_bps', DEFAULTS.targetUserShareBps),
      bitcotasksExchangeRate: numberSetting('bitcotasks_exchange_rate', DEFAULTS.bitcotasksExchangeRate),
      withdrawalMinPoints: numberSetting('withdrawal_min_points', DEFAULTS.withdrawalMinPoints),
      withdrawalMinUsd: numberSetting('withdrawal_min_usd', DEFAULTS.withdrawalMinUsd),
      payoutAsset,
      payoutNetwork,
      supportedPayouts: [{ asset: payoutAsset, network: payoutNetwork }],
      provider: 'bitcotasks',
      providerConfigured: Boolean(env.BITCOTASKS_API_KEY && env.BITCOTASKS_BEARER_TOKEN && env.BITCOTASKS_SECRET_KEY),
    });
  } catch (cause) {
    console.error('Kivora settings request failed', cause);
    return error('Kivora settings are temporarily unavailable.', 503);
  }
};
