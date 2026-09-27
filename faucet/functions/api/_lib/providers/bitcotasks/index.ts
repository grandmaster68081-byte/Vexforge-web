import type { Env } from '../../env';
import { bitcoTasksConfigured, loadOffers } from '../../bitcotasks';
import type { EarnItem, ProviderContext, ProviderHealth, RewardsProviderAdapter } from '../types';

export function createBitcoTasksAdapter(env: Env, request: Request): RewardsProviderAdapter {
  const configured = bitcoTasksConfigured(env);
  return {
    id: 'bitcotasks',
    async getHealth(): Promise<ProviderHealth> {
      if (!configured) return 'not_configured';
      try {
        await loadOffers(env, request, 'health-check');
        return 'connected';
      } catch {
        return 'degraded';
      }
    },
    async getInventory(ctx: ProviderContext, category?: string): Promise<EarnItem[]> {
      const all = await loadOffers(env, request, ctx.subId);
      return category ? all.filter((item: any) => item.category === category) : all;
    },
    async getClientConfig(ctx: ProviderContext) {
      return { apiKey: env.BITCOTASKS_API_KEY ?? '', subId: ctx.subId };
    },
    validateProviderUrl(url: string) {
      try { return new URL(url).hostname === 'bitcotasks.com' || new URL(url).hostname.endsWith('.bitcotasks.com'); } catch { return false; }
    },
  };
}
