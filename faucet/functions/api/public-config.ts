import type { Env } from './_lib/env';
import { currentAccount } from './_lib/auth';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const account = await currentAccount(request, env);
  if (!account) return error('Authentication required.', 401);
  const configured = Boolean(env.BITCOTASKS_API_KEY && env.BITCOTASKS_BEARER_TOKEN && env.BITCOTASKS_SECRET_KEY);
  if (!env.BITCOTASKS_API_KEY) return error('Reward provider is not configured yet.', 503);
  return json({ provider: 'bitcotasks', status: configured ? 'connected' : 'not_configured', apiKey: env.BITCOTASKS_API_KEY, subId: account.account.public_id });
};
