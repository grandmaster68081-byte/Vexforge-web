import { allowRate, currentAccount, rateKey } from './_lib/auth';
import type { Env } from './_lib/env';
import { createBitcoTasksAdapter } from './_lib/providers/bitcotasks';
import { laneFor, rankOpportunities, rewardPerMinute } from '../../src/lib/recommendations';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  if (!(await allowRate(env, `recommendations:${current.account.id}:${await rateKey(request)}`, 12, 300))) {
    return error('Recommendations are temporarily rate-limited.', 429);
  }
  try {
    const provider = createBitcoTasksAdapter(env, request);
    const items = await provider.getInventory({
      accountId: current.account.id,
      subId: current.account.public_id,
      ip: request.headers.get('CF-Connecting-IP') ?? '',
      userAgent: request.headers.get('User-Agent') ?? 'Kivora/2.1',
    });
    const ranked = rankOpportunities(items as any[]).slice(0, 60).map((item: any) => ({
      ...item,
      lane: laneFor(item),
      pointsPerMinute: rewardPerMinute(item),
    }));
    return json({ provider: provider.id, status: 'connected', recommendations: ranked });
  } catch (cause) {
    console.error('Kivora recommendations failed', cause);
    return json({ provider: 'bitcotasks', status: 'unavailable', recommendations: [] });
  }
};
