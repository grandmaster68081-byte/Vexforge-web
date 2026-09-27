import type { Env } from './_lib/env';
import { db } from './_lib/supabase';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ env }: { env: Env }) => {
  try {
    const { data, error: dbError } = await db(env)
      .from('settings')
      .select('key,value')
      .in('key', ['currency_name', 'points_per_usd_display', 'withdrawal_min_points', 'target_user_share_bps', 'supported_payouts']);
    if (dbError) {
      console.error('Kivora settings query failed', dbError);
      return error('Kivora settings are temporarily unavailable.', 503);
    }
    const map = Object.fromEntries((data ?? []).map((x: any) => [x.key, x.value]));
    return json({
      currencyName: String(map.currency_name ?? 'Kivora Points').replace(/^"|"$/g, ''),
      pointsPerUsdDisplay: Number(map.points_per_usd_display ?? 1000),
      withdrawalMinPoints: Number(map.withdrawal_min_points ?? 5000),
      targetUserShareBps: Number(map.target_user_share_bps ?? 3500),
      supportedPayouts: Array.isArray(map.supported_payouts) ? map.supported_payouts : [],
    });
  } catch (cause) {
    console.error('Kivora settings request failed', cause);
    return error('Kivora settings are temporarily unavailable.', 503);
  }
};