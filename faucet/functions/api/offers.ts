import { allowRate, currentAccount, rateKey } from './_lib/auth';
import { bitcoTasksConfigured } from './_lib/bitcotasks';
import type { Env } from './_lib/env';
import { createBitcoTasksAdapter } from './_lib/providers/bitcotasks';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  if (!bitcoTasksConfigured(env)) return error('NOT_CONFIGURED', 503);
  if (!(await allowRate(env, `offers:${current.account.id}:${await rateKey(request)}`, 18, 300))) return error('Opportunity refresh is temporarily rate-limited. Please wait a moment.', 429);
  try {
    const provider = createBitcoTasksAdapter(env, request);
    const offers = await provider.getInventory({ accountId: current.account.id, subId: current.account.public_id, ip: request.headers.get('CF-Connecting-IP') ?? '', userAgent: request.headers.get('User-Agent') ?? 'Kivora/2.1' });
    const unique = new Map<string, any>();
    for (const offer of offers) if (offer.url && provider.validateProviderUrl(offer.url)) unique.set(`${offer.category}:${offer.id}`, offer);
    return json({ provider: provider.id, offers: [...unique.values()].sort((a: any, b: any) => b.reward - a.reward).slice(0, 120), fetchedAt: new Date().toISOString() });
  } catch (cause) {
    console.error('Kivora provider inventory failed', cause);
    return error('Could not load provider inventory.', 502);
  }
};
