import type { CameraState, RuntimeAudioCue, RuntimeHapticCue } from './types';

export type PackOpeningStage = 'awakening' | 'binding' | 'reveal' | 'complete';

export interface PackTimelineCue {
  id: string;
  stage: PackOpeningStage;
  atMs: number;
  durationMs: number;
  camera: CameraState;
  actor: 'relic-awakens' | 'seal-binds' | 'card-waits' | 'vault-complete';
  vfx: string;
  audio: RuntimeAudioCue;
  haptic: RuntimeHapticCue;
  interactive: boolean;
}

export const PACK_OPENING_TIMELINE: PackTimelineCue[] = [
  {
    id: 'pack:awakening',
    stage: 'awakening',
    atMs: 0,
    durationMs: 900,
    camera: { shot: 'vault', focusX: 0, focusY: 0, zoom: 1.08, durationMs: 620 },
    actor: 'relic-awakens',
    vfx: 'seal-charge',
    audio: 'none',
    haptic: 'selection',
    interactive: false,
  },
  {
    id: 'pack:binding',
    stage: 'binding',
    atMs: 900,
    durationMs: 1050,
    camera: { shot: 'focus', focusX: 0, focusY: -0.06, zoom: 1.04, durationMs: 420 },
    actor: 'seal-binds',
    vfx: 'ownership-sigil',
    audio: 'reveal',
    haptic: 'impact',
    interactive: false,
  },
  {
    id: 'pack:reveal',
    stage: 'reveal',
    atMs: 1950,
    durationMs: 0,
    camera: { shot: 'focus', focusX: 0, focusY: 0, zoom: 1.02, durationMs: 320 },
    actor: 'card-waits',
    vfx: 'identity-reveal',
    audio: 'reveal',
    haptic: 'impact',
    interactive: true,
  },
  {
    id: 'pack:complete',
    stage: 'complete',
    atMs: 1950,
    durationMs: 0,
    camera: { shot: 'wide', focusX: 0, focusY: 0, zoom: 1, durationMs: 360 },
    actor: 'vault-complete',
    vfx: 'vault-seal',
    audio: 'reward',
    haptic: 'success',
    interactive: true,
  },
];

export function packCueForStage(stage: PackOpeningStage): PackTimelineCue {
  return PACK_OPENING_TIMELINE.find((cue) => cue.stage === stage)!;
}

export function packCardRevealCue(index: number, count: number): PackTimelineCue {
  const cue = packCueForStage('reveal');
  return {
    ...cue,
    id: `pack:card:${Math.max(0, Math.floor(index))}:of:${Math.max(1, Math.floor(count))}`,
    haptic: 'impact',
  };
}