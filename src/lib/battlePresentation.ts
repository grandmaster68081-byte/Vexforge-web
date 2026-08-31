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

export interface BattlePresentationCue {
  event: BattleEvent['type'];
  label: string;
  color: string;
  shape: 'shield-burst' | 'poison-drip' | 'heal-pulse' | 'double-strike';
  audioKeyword: 'Guard' | 'Poison' | 'Drain' | null;
  particleKeyword: 'Guard' | 'Poison' | 'Drain' | 'DoubleStrike';
  target: 'attacker' | 'defender';
  durationMs: number;
}

const BATTLE_EVENT_CUES: Record<BattleEvent['type'], BattlePresentationCue> = {
  shield_block: { event: 'shield_block', label: 'BLOQUEADO', color: '#4a9eff', shape: 'shield-burst', audioKeyword: 'Guard', particleKeyword: 'Guard', target: 'defender', durationMs: 720 },
  poisoned: { event: 'poisoned', label: 'ENVENENADO', color: '#a855f7', shape: 'poison-drip', audioKeyword: 'Poison', particleKeyword: 'Poison', target: 'defender', durationMs: 760 },
  poison_tick: { event: 'poison_tick', label: '−HP', color: '#a855f7', shape: 'poison-drip', audioKeyword: 'Poison', particleKeyword: 'Poison', target: 'defender', durationMs: 620 },
  poison_death: { event: 'poison_death', label: 'VENENO', color: '#a855f7', shape: 'poison-drip', audioKeyword: 'Poison', particleKeyword: 'Poison', target: 'defender', durationMs: 900 },
  lifesteal: { event: 'lifesteal', label: 'DRENAR', color: '#3ddc84', shape: 'heal-pulse', audioKeyword: 'Drain', particleKeyword: 'Drain', target: 'attacker', durationMs: 680 },
  double_strike: { event: 'double_strike', label: '2° GOLPE', color: '#ff6b35', shape: 'double-strike', audioKeyword: null, particleKeyword: 'DoubleStrike', target: 'defender', durationMs: 820 },
};

export function getBattlePresentationCue(event: BattleEvent): BattlePresentationCue {
  return BATTLE_EVENT_CUES[event.type];
}

export interface BattleArenaProfile {
  id: 'war-forge' | 'arcane-nexus' | 'holy-bastion' | 'shadow-veil' | 'wild-frontier' | 'trade-citadel' | 'neutral-forge';
  background: string;
  fog: string;
  terrain: 'embers' | 'runes' | 'halo' | 'mist' | 'wind' | 'coins' | 'static';
}

const BATTLE_ARENA_PROFILES: Record<string, BattleArenaProfile> = {
  Guerrero: { id: 'war-forge', background: 'radial-gradient(ellipse at 50% 0%, #301015 0%, #0b0710 48%, #030308 100%)', fog: 'rgba(232,64,64,0.16)', terrain: 'embers' },
  Mago: { id: 'arcane-nexus', background: 'radial-gradient(ellipse at 50% 0%, #211342 0%, #0a0718 48%, #030308 100%)', fog: 'rgba(168,85,247,0.16)', terrain: 'runes' },
  'Paladín': { id: 'holy-bastion', background: 'radial-gradient(ellipse at 50% 0%, #3a2c12 0%, #0d0a08 48%, #030308 100%)', fog: 'rgba(232,184,75,0.15)', terrain: 'halo' },
  'Pícaro': { id: 'shadow-veil', background: 'radial-gradient(ellipse at 50% 0%, #102b20 0%, #050c0c 48%, #030308 100%)', fog: 'rgba(61,201,107,0.14)', terrain: 'mist' },
  Explorador: { id: 'wild-frontier', background: 'radial-gradient(ellipse at 50% 0%, #102c2b 0%, #050d12 48%, #030308 100%)', fog: 'rgba(93,232,138,0.13)', terrain: 'wind' },
  Comerciante: { id: 'trade-citadel', background: 'radial-gradient(ellipse at 50% 0%, #34220d 0%, #0d0906 48%, #030308 100%)', fog: 'rgba(245,213,133,0.14)', terrain: 'coins' },
  default: { id: 'neutral-forge', background: 'radial-gradient(ellipse at 50% 0%, #0f0820 0%, #060610 55%, #030308 100%)', fog: 'rgba(74,158,255,0.12)', terrain: 'static' },
};

export function getBattleArenaProfile(faction: string | null | undefined): BattleArenaProfile {
  return BATTLE_ARENA_PROFILES[faction ?? 'default'] ?? BATTLE_ARENA_PROFILES.default;
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

export interface BattlePresentationCursor {
  phase: string;
  hasImpact: boolean;
  hasCurrentTurn: boolean;
  hasAttackCue?: boolean;
  result: 'victory' | 'defeat' | 'unknown';
}

export function resolveBattlePresentationState(cursor: BattlePresentationCursor): BattlePresentationState {
  if (cursor.phase === 'error') return 'reconnect';
  if (cursor.phase === 'champion_summon') return 'summon';
  if (cursor.phase === 'intro') return 'intro';
  if (cursor.phase === 'reserve') return 'reserve_entry';
  if (cursor.phase === 'champion_dead') return 'death';
  if (cursor.phase === 'done') return cursor.result === 'victory' ? 'victory' : cursor.result === 'defeat' ? 'defeat' : 'reconnect';
  if (cursor.phase === 'battle') {
    if (cursor.hasImpact) return 'impact';
    if (cursor.hasAttackCue) return 'attack';
    return cursor.hasCurrentTurn ? 'target_lock' : 'idle';
  }
  return 'idle';
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