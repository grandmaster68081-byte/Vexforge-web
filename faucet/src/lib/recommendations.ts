export type Opportunity = {
  id: string;
  reward: number;
  durationSeconds?: number;
  boosted?: boolean;
  category: string;
  available?: number;
};

export function rewardPerMinute(item: Opportunity): number | undefined {
  if (!item.durationSeconds || item.durationSeconds <= 0) return undefined;
  return item.reward / (item.durationSeconds / 60);
}

export function rankOpportunities(items: Opportunity[]): Opportunity[] {
  return [...items].sort((a, b) => {
    const aE = rewardPerMinute(a);
    const bE = rewardPerMinute(b);
    if (aE !== undefined && bE !== undefined && bE !== aE) return bE - aE;
    if (Boolean(b.boosted) !== Boolean(a.boosted)) return Number(Boolean(b.boosted)) - Number(Boolean(a.boosted));
    return b.reward - a.reward;
  });
}

// Product lanes must be derived only from provider-supplied facts.
export function laneFor(item: Opportunity): 'Quick' | 'Core' | 'High Yield' {
  if (item.durationSeconds && item.durationSeconds <= 10 * 60) return 'Quick';
  if (item.reward >= 1000) return 'High Yield';
  return 'Core';
}
