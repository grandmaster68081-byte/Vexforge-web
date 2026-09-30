import type { QualityTier } from '../types/game';
import { QUALITY_BUDGETS } from './quality';

export function canPreloadAnotherCard(currentDecodedCount: number, tier: QualityTier) {
  return currentDecodedCount < QUALITY_BUDGETS[tier].maxConcurrentCardImages;
}

export function resolveDisplayScale(tier: QualityTier) {
  return QUALITY_BUDGETS[tier].preferredBackgroundScale;
}
