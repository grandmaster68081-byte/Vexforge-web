import type { BattleEvent } from '../types/api';
import { classifyBattleEvent, type PresentationKind } from './presentation';
import type { SceneVariant } from '../core/constants';

export type CinematicMoment = 'intro' | 'boss' | 'attack' | 'status' | 'victory' | 'defeat' | 'pack' | 'fusion' | 'evolution' | 'mission' | 'season';

export interface CinematicPlan {
  moment: CinematicMoment;
  scene: SceneVariant;
  durationMs: number;
  skippable: boolean;
  intensity: 'restrained' | 'impact' | 'major';
}

export function planSceneCinematic(scene: SceneVariant, moment: CinematicMoment): CinematicPlan {
  const major = ['boss', 'victory', 'defeat', 'pack', 'season'].includes(moment);
  return { moment, scene, durationMs: major ? 2400 : 1750, skippable: true, intensity: major ? 'major' : moment === 'attack' || moment === 'status' ? 'impact' : 'restrained' };
}

export function planBattleCinematic(event: BattleEvent | null): CinematicPlan | null {
  if (!event) return null;
  const kind = classifyBattleEvent(event) as PresentationKind;
  if (kind === 'boss') return planSceneCinematic('arena', 'boss');
  if (kind === 'victory') return planSceneCinematic('arena', 'victory');
  if (kind === 'defeat') return planSceneCinematic('arena', 'defeat');
  if (kind === 'status') return planSceneCinematic('arena', 'status');
  if (kind === 'attack' || kind === 'cast') return planSceneCinematic('arena', 'attack');
  return null;
}
