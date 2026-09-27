import type { Env } from './_lib/env';
import { json, error } from './_lib/response';
import { currentAccount } from './_lib/auth';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const account = await currentAccount(request, env);
  if (!account) return error('Authentication required.', 401);
  const providerConfigured = Boolean(env.BITCOTASKS_API_KEY && env.BITCOTASKS_BEARER_TOKEN && env.BITCOTASKS_SECRET_KEY);
  return json({ apiKey: providerConfigured ? env.BITCOTASKS_API_KEY : '', subId: account.account.public_id, providerConfigured });
};
