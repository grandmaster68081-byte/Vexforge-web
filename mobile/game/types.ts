import type { BattleEvent, BattleResult, BattleUnitState } from '../src/types/api';
import type { PresentationKind } from '../src/engine/presentation';

export type ActorMotion =
  | 'idle'
  | 'attacking'
  | 'taking-hit'
  | 'casting'
  | 'guarding'
  | 'healing'
  | 'defeated'
  | 'revealing';

export type CameraShot = 'wide' | 'focus' | 'impact' | 'boss' | 'victory' | 'defeat' | 'vault';
export type RuntimeAudioCue = 'attack' | 'impact' | 'shield' | 'reward' | 'reveal' | 'fusion' | 'none';
export type RuntimeHapticCue = 'selection' | 'impact' | 'success' | 'warning' | 'none';

export interface ScenePoint {
  x: number;
  y: number;
  depth: number;
}

export interface CameraState {
  shot: CameraShot;
  focusX: number;
  focusY: number;
  zoom: number;
  durationMs: number;
}

export interface ProjectedPoint {
  x: number;
  y: number;
  scale: number;
  zIndex: number;
}

export interface SceneActor {
  id: string;
  side: 'player' | 'enemy';
  unit: BattleUnitState;
  position: ScenePoint;
  motion: ActorMotion;
}

export interface RuntimeCue {
  id: string;
  index: number;
  atMs: number;
  durationMs: number;
  event: BattleEvent;
  kind: PresentationKind;
  camera: CameraState;
  vfx: string;
  audio: RuntimeAudioCue;
  haptic: RuntimeHapticCue;
  actorMotion: Record<string, ActorMotion>;
}

export type GameFlowStage = 'world' | 'battle' | 'result';
export type GameFlowSource = 'training' | 'pvp';

export type GameFlowResult =
  | { authority: 'local-training'; outcome: 'victory' | 'defeat' | 'draw' }
  | { authority: 'server'; result: BattleResult };

export interface GameFlowState {
  stage: GameFlowStage;
  source: GameFlowSource;
  encounterId: string;
  result?: GameFlowResult;
}