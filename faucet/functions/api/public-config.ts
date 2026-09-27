import type { Env } from './_lib/env';
import { currentAccount } from './_lib/auth';
import { bitcoTasksConfigured } from './_lib/bitcotasks';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const account = await currentAccount(request, env);
  if (!account) return error('Authentication required.', 401);
  const configured = bitcoTasksConfigured(env);
  if (!configured) return json({ provider: 'bitcotasks', status: 'not_configured', providerConfigured: false });
  return json({
    provider: 'bitcotasks',
    status: 'connected',
    providerConfigured: true,
    apiKey: env.BITCOTASKS_API_KEY,
    subId: account.account.public_id,
  });
};
