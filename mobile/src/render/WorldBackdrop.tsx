import React from 'react';
import type { QualityTier } from '../types/game';
import type { SceneVariant } from '../core/constants';
import { VexforgeSceneStage } from './VexforgeSceneStage';

/** Canonical world renderer. The background stays fixed; only independent depth planes animate. */
export function WorldBackdrop({ variant, tier }: { variant: SceneVariant; tier: QualityTier }) {
  return <VexforgeSceneStage variant={variant} tier={tier} />;
}
