export type ProviderHealth = 'connected' | 'degraded' | 'unavailable' | 'not_configured';

export interface ProviderContext {
  accountId: string;
  subId: string;
  ip: string;
  userAgent: string;
}

export interface EarnItem {
  id: string;
  title: string;
  description: string;
  category: string;
  reward: number;
  currencyName: string;
  url: string;
  durationSeconds?: number;
  boosted?: boolean;
  goals?: Array<{ name: string; description?: string; virtualCurrencyValue?: number }>;
}

export interface RewardsProviderAdapter {
  readonly id: string;
  getHealth(): Promise<ProviderHealth>;
  getInventory(ctx: ProviderContext, category?: string): Promise<EarnItem[]>;
  getClientConfig(ctx: ProviderContext): Promise<{ apiKey: string; subId: string }>;
  validateProviderUrl(url: string): boolean;
}
