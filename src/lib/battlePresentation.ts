import type { BattleEvent, BattleTurnData } from './battleTypes';

// VE-P0.0 — authoritative presentation vocabulary. These states never mutate battle data.
export const BATTLE_PRESENTATION_STATES = [
  'intro', 'formation_ready', 'summon', 'idle', 'target_lock', 'anticipation',
  'attack', 'impact', 'damage', 'keyword', 'death', 'reserve_entry',
  'boss_phase', 'victory', 'defeat', 'reward', 'reconnect',
] as const;

export type BattlePresentationState = typeof BATTLE_PRESENTATION_STATES[number];
export type PresentationPhase = 'intro' | 'board' | 'result' | 'fallback';
export type PresentationFallback = 'full' | 'reduced' | 'minimal' | 'static';
export type PresentationReconnect = 'resume' | 'restart' | 'static';

export interface BattlePresentationSource {
  ok?: boolean;
  turns?: BattleTurnData[];
  you_won?: boolean;
}

export interface BattlePresentationStep {
  state: BattlePresentationState;
  phase: PresentationPhase;
  sourceTurn?: number;
  entryMs: number;
  holdMs: number;
  exitMs: number;
  cancel: 'resume' | 'skip' | 'dismiss';
  replay: 'resume' | 'restart';
  refresh: 'preserve' | 'rebuild';
  reconnect: PresentationReconnect;
  fallback: Exclude<PresentationFallback, 'full'>;
}

export interface BattlePresentationContract {
  version: 've-p0-presentation-v1';
  source: 'real_battle_result';
  fallback: PresentationFallback;
  timeline: BattlePresentationStep[];
}

const step = (state: BattlePresentationState, phase: PresentationPhase, sourceTurn?: number): BattlePresentationStep => ({
  state, phase, sourceTurn, entryMs: 120, holdMs: 520, exitMs: 180,
  cancel: 'resume', replay: 'restart', refresh: 'preserve', reconnect: 'resume', fallback: 'minimal',
});

function keywordEvent(event: BattleEvent): boolean {
  return event.type === 'shield_block' || event.type === 'poisoned' || event.type === 'lifesteal' ||
    event.type === 'poison_tick' || event.type === 'poison_death' || event.type === 'double_strike';
}

function turnSteps(turn: BattleTurnData): BattlePresentationStep[] {
  const steps: BattlePresentationStep[] = [
    step('idle', 'board', turn.turn),
    step('target_lock', 'board', turn.turn),
    step('anticipation', 'board', turn.turn),
    step('attack', 'board', turn.turn),
  ];
  if (turn.damage > 0) steps.push(step('impact', 'board', turn.turn), step('damage', 'board', turn.turn));
  if (turn.events.some(keywordEvent)) steps.push(step('keyword', 'board', turn.turn));
  if (turn.is_kill) steps.push(step('death', 'board', turn.turn));
  return steps;
}

export function createBattlePresentationContract(result: BattlePresentationSource): BattlePresentationContract {
  const timeline: BattlePresentationStep[] = [step('intro', 'intro'), step('formation_ready', 'intro'), step('summon', 'intro')];
  if (result.ok === false) {
    timeline.push({ ...step('reconnect', 'fallback'), cancel: 'dismiss', reconnect: 'static', fallback: 'static' });
    return { version: 've-p0-presentation-v1', source: 'real_battle_result', fallback: 'static', timeline };
  }
  for (const turn of result.turns ?? []) timeline.push(...turnSteps(turn));
  if (result.you_won === true) timeline.push(step('victory', 'result'));
  else if (result.you_won === false) timeline.push(step('defeat', 'result'));
  else timeline.push({ ...step('reconnect', 'fallback'), cancel: 'dismiss', reconnect: 'static', fallback: 'static' });
  const fallback = result.you_won === true || result.you_won === false ? 'full' : 'static';
  return { version: 've-p0-presentation-v1', source: 'real_battle_result', fallback, timeline };
}