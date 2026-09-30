import type { ContentBudget, QualityTier } from '../types/game';

export const QUALITY_BUDGETS: Record<QualityTier, ContentBudget> = {
  LOW: { tier: 'LOW', maxConcurrentCardImages: 3, maxParticleLayers: 1, preferredBackgroundScale: 0.62 },
  MEDIUM: { tier: 'MEDIUM', maxConcurrentCardImages: 6, maxParticleLayers: 3, preferredBackgroundScale: 0.82 },
  HIGH: { tier: 'HIGH', maxConcurrentCardImages: 10, maxParticleLayers: 5, preferredBackgroundScale: 1 },
};

export function normalizeQuality(value: string | undefined): QualityTier {
  if (value === 'LOW' || value === 'HIGH') return value;
  return 'MEDIUM';
}
