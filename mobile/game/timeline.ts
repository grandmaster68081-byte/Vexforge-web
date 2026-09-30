import type { BattleEvent } from '../src/types/api';
import type { BattleUnitState } from '../src/types/api';
import { battlePlaybackDelay, buildBattleSequence, type BattleSequenceFrame } from '../src/engine/battleDirector.ts';
import type { PresentationKind } from '../src/engine/presentation';
import { cameraForPresentation, actorMotionsForEvent } from './scene.ts';
import type { RuntimeAudioCue, RuntimeCue, RuntimeHapticCue } from './types';

function audioFor(kind: PresentationKind): RuntimeAudioCue {
  if (kind === 'attack') return 'attack';
  if (kind === 'guard' || kind === 'heal' || kind === 'cast') return 'shield';
  if (kind === 'victory') return 'reward';
  if (kind === 'boss') return 'reveal';
  if (kind === 'defeat' || kind === 'status') return 'impact';
  return 'none';
}

function hapticFor(kind: PresentationKind): RuntimeHapticCue {
  if (kind === 'victory') return 'success';
  if (kind === 'defeat') return 'warning';
  if (kind === 'boss' || kind === 'attack' || kind === 'cast') return 'impact';
  if (kind === 'guard' || kind === 'heal') return 'selection';
  return 'none';
}

function vfxFor(kind: PresentationKind): string {
  return ({
    boss: 'boss-phase',
    victory: 'victory-burst',
    defeat: 'defeat-fade',
    attack: 'impact-shockwave',
    cast: 'arcane-cast',
    guard: 'shield-ring',
    heal: 'restore-pulse',
    status: 'status-aura',
    neutral: 'event-pulse',
  } satisfies Record<PresentationKind, string>)[kind];
}

export function buildRuntimeTimeline(
  events: BattleEvent[] | null | undefined,
  units: BattleUnitState[] = [],
): RuntimeCue[] {
  let atMs = 0;
  const frames: BattleSequenceFrame[] = buildBattleSequence(events);
  return frames.map((frame) => {
    const event = frame.event;
    const cue: RuntimeCue = {
      id: `battle:${frame.index}:${event.event_type}:${event.actor_id ?? 'scene'}:${event.target_id ?? 'none'}`,
      index: frame.index,
      atMs,
      durationMs: frame.durationMs,
      event,
      kind: frame.kind,
      camera: cameraForPresentation(frame.kind),
      vfx: vfxFor(frame.kind),
      audio: audioFor(frame.kind),
      haptic: hapticFor(frame.kind),
      actorMotion: actorMotionsForEvent(units, event, frame.kind),
    };
    atMs += frame.durationMs;
    return cue;
  });
}

export function runtimeCueForEvent(
  event: BattleEvent | null | undefined,
  index = 0,
): RuntimeCue | null {
  if (!event) return null;
  const cue = buildRuntimeTimeline([event])[0];
  return cue ? { ...cue, id: `event:${index}:${cue.id}`, index } : null;
}

export function activeRuntimeCue(cues: RuntimeCue[], elapsedMs: number): RuntimeCue | null {
  if (!cues.length) return null;
  const elapsed = Math.max(0, elapsedMs);
  let active = cues[0];
  for (const cue of cues) {
    if (cue.atMs > elapsed) break;
    active = cue;
  }
  return active;
}

export function runtimePlaybackDelay(cue: RuntimeCue | undefined, speed: 0.75 | 1 | 1.5 | 2): number {
  if (!cue) return 0;
  return battlePlaybackDelay({ ...cue, interruptible: true, priority: 0 }, speed);
}