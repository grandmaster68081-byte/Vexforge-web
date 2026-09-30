import { Image } from 'expo-image';
import type { QualityTier } from '../types/game';
import { QUALITY_BUDGETS } from '../core/quality';

export async function prefetchCardArtwork(urls: string[], tier: QualityTier) {
  const unique = Array.from(new Set(urls.filter(Boolean))).slice(0, QUALITY_BUDGETS[tier].maxConcurrentCardImages);
  if (!unique.length) return true;
  return Image.prefetch(unique, { cachePolicy: tier === 'HIGH' ? 'memory-disk' : 'disk' });
}
