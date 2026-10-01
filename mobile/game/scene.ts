import type { BattleEvent, BattleUnitState } from '../src/types/api';
import type { PresentationKind } from '../src/engine/presentation';
import type { ActorMotion, CameraState, ProjectedPoint, SceneActor, ScenePoint } from './types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export const WIDE_CAMERA: CameraState = {
  shot: 'wide',
  focusX: 0,
  focusY: 0,
  zoom: 1,
  durationMs: 360,
};

function cameraTargetForEvent(kind: PresentationKind, event?: BattleEvent | null): string | undefined {
  if (!event) return undefined;
  if (kind === 'boss' || kind === 'victory') return event.actor_id ?? event.target_id ?? undefined;
  return event.target_id ?? event.actor_id ?? undefined;
}

export function cameraForPresentation(kind: PresentationKind, event?: BattleEvent | null): CameraState {
  let camera: CameraState;
  switch (kind) {
    case 'boss':
      camera = { shot: 'boss', focusX: 0, focusY: -0.12, zoom: 1.12, durationMs: 680 };
      break;
    case 'attack':
    case 'cast':
      camera = { shot: 'impact', focusX: 0, focusY: 0, zoom: 1.075, durationMs: 340 };
      break;
    case 'victory':
      camera = { shot: 'victory', focusX: 0, focusY: 0, zoom: 1.035, durationMs: 520 };
      break;
    case 'defeat':
      camera = { shot: 'defeat', focusX: 0, focusY: 0.04, zoom: 1.025, durationMs: 520 };
      break;
    case 'guard':
    case 'heal':
      camera = { shot: 'focus', focusX: 0, focusY: 0, zoom: 1.045, durationMs: 360 };
      break;
    default:
      camera = WIDE_CAMERA;
  }
  const focusActorId = cameraTargetForEvent(kind, event);
  return focusActorId ? { ...camera, focusActorId } : { ...camera };
}

export function projectScenePoint(
  point: ScenePoint,
  viewport: { width: number; height: number },
  camera: CameraState = WIDE_CAMERA,
): ProjectedPoint {
  const depth = clamp(point.depth, 0, 1);
  const perspective = 0.84 + depth * 0.3;
  return {
    x: viewport.width * 0.5 + (point.x - camera.focusX) * viewport.width * 0.36 * camera.zoom * perspective,
    y: viewport.height * 0.52 + (point.y - camera.focusY) * viewport.height * 0.29 * camera.zoom * perspective + (0.5 - depth) * viewport.height * 0.11,
    scale: clamp(perspective * camera.zoom, 0.66, 1.42),
    zIndex: Math.round(depth * 100),
  };
}

function motionForUnit(
  unit: BattleUnitState,
  event: BattleEvent | null,
  kind: PresentationKind,
): ActorMotion {
  const status = String(unit.status ?? '').toLowerCase();
  if (status === 'defeated' || status === 'dead' || Number(unit.hp ?? 1) <= 0) return 'defeated';
  if (!event) return 'idle';
  if (unit.id === event.actor_id) {
    if (kind === 'boss') return 'phase';
    if (kind === 'victory') return 'victory';
    if (kind === 'defeat') return 'defeated';
    if (kind === 'status') return 'status';
    if (kind === 'attack') return 'attacking';
    if (kind === 'cast') return 'casting';
    if (kind === 'guard') return 'guarding';
    if (kind === 'heal') return 'healing';
  }
  if (unit.id === event.target_id) {
    if (kind === 'heal') return 'healing';
    if (kind === 'guard') return 'guarding';
    if (kind === 'defeat') return 'defeated';
    if (kind === 'boss') return 'staggered';
    if (kind === 'status') return 'status';
    if (kind === 'attack' || kind === 'cast') return 'taking-hit';
  }
  return 'idle';
}

export function buildSceneActors(
  units: BattleUnitState[],
  event: BattleEvent | null,
  kind: PresentationKind,
): SceneActor[] {
  const grouped: Record<'player' | 'enemy', BattleUnitState[]> = { player: [], enemy: [] };
  for (const unit of units) {
    const side = ['player', 'you'].includes(String(unit.side ?? '').toLowerCase()) ? 'player' : 'enemy';
    grouped[side].push(unit);
  }

  return (['enemy', 'player'] as const).flatMap((side) => grouped[side].map((unit, index) => {
    const column = index % 4;
    const row = Math.floor(index / 4);
    const backToFront = side === 'enemy' ? row : 1 - row;
    const position: ScenePoint = {
      x: (column - 1.5) * 0.47,
      y: side === 'enemy' ? -0.62 + row * 0.19 : 0.62 - row * 0.19,
      depth: clamp(side === 'enemy' ? 0.2 + backToFront * 0.12 : 0.58 + backToFront * 0.12, 0, 1),
    };
    return { id: unit.id, side, unit, position, motion: motionForUnit(unit, event, kind) };
  }));
}

export function actorMotionsForEvent(
  units: BattleUnitState[],
  event: BattleEvent | null,
  kind: PresentationKind,
): Record<string, ActorMotion> {
  return Object.fromEntries(buildSceneActors(units, event, kind).map((actor) => [actor.id, actor.motion]));
}

export function defaultCameraForScene(): CameraState {
  return { ...WIDE_CAMERA };
}