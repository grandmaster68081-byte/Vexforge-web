import { currentAccount } from './_lib/auth';
import type { Env } from './_lib/env';
import { createBitcoTasksAdapter } from './_lib/providers/bitcotasks';
import { error, json } from './_lib/response';

export const onRequestGet = async ({ request, env }: { request: Request; env: Env }) => {
  const current = await currentAccount(request, env);
  if (!current) return error('Authentication required.', 401);
  const provider = createBitcoTasksAdapter(env, request);
  const status = await provider.getHealth();
  return json({ provider: provider.id, status, checkedAt: new Date().toISOString() });
};
