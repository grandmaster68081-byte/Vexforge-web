import type { BattleEvent } from '../types/api';
import { classifyBattleEvent, type PresentationKind } from './presentation.ts';

export interface BattleSequenceFrame {
  index: number;
  event: BattleEvent;
  kind: PresentationKind;
  durationMs: number;
  interruptible: boolean;
  priority: number;
}

const DURATIONS: Record<PresentationKind, number> = {
  boss: 1250,
  victory: 1150,
  defeat: 1050,
  attack: 560,
  cast: 640,
  guard: 520,
  heal: 520,
  status: 500,
  neutral: 360,
};

const PRIORITY: Record<PresentationKind, number> = {
  boss: 100,
  victory: 95,
  defeat: 94,
  cast: 70,
  attack: 65,
  guard: 55,
  heal: 55,
  status: 50,
  neutral: 10,
};

export function buildBattleSequence(events: BattleEvent[] | null | undefined): BattleSequenceFrame[] {
  return (events ?? []).map((event, index) => {
    const kind = classifyBattleEvent(event);
    return {
      index,
      event,
      kind,
      durationMs: DURATIONS[kind],
      interruptible: !['boss', 'victory', 'defeat'].includes(kind),
      priority: PRIORITY[kind],
    };
  });
}

export function clampBattleCursor(cursor: number, length: number) {
  if (!length) return 0;
  return Math.max(0, Math.min(length - 1, Math.floor(cursor)));
}

export function nextBattleCursor(cursor: number, length: number) {
  return clampBattleCursor(cursor + 1, length);
}

export function previousBattleCursor(cursor: number, length: number) {
  return clampBattleCursor(cursor - 1, length);
}

export function battlePlaybackDelay(frame: BattleSequenceFrame | undefined, speed: 0.75 | 1 | 1.5 | 2) {
  if (!frame) return 0;
  return Math.max(180, Math.round(frame.durationMs / speed));
}
