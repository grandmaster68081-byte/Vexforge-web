import type { QualityTier } from '../types/game';

export interface RuntimePerformanceBudget {
  targetFps: number;
  maxAnimatedUnits: number;
  maxBattleParticles: number;
  maxPrefetchCards: number;
  backgroundScale: number;
}

export const RUNTIME_PERFORMANCE_BUDGETS: Record<QualityTier, RuntimePerformanceBudget> = {
  LOW: { targetFps: 30, maxAnimatedUnits: 4, maxBattleParticles: 10, maxPrefetchCards: 3, backgroundScale: 0.62 },
  MEDIUM: { targetFps: 45, maxAnimatedUnits: 6, maxBattleParticles: 18, maxPrefetchCards: 6, backgroundScale: 0.82 },
  HIGH: { targetFps: 60, maxAnimatedUnits: 8, maxBattleParticles: 28, maxPrefetchCards: 10, backgroundScale: 1 },
};

export function assertPerformanceBudget(tier: QualityTier, activeUnits: number, particleCount: number, prefetchedCards: number) {
  const budget = RUNTIME_PERFORMANCE_BUDGETS[tier];
  return {
    ok: activeUnits <= budget.maxAnimatedUnits && particleCount <= budget.maxBattleParticles && prefetchedCards <= budget.maxPrefetchCards,
    budget,
  };
}
