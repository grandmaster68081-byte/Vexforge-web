import type { BattleResult } from '../src/types/api';
import type { GameFlowResult, GameFlowSource, GameFlowState } from './types';

export function createGameFlow(source: GameFlowSource, encounterId: string): GameFlowState {
  if (!encounterId.trim()) throw new Error('Encounter id is required.');
  return { stage: 'world', source, encounterId };
}

export function enterGameBattle(flow: GameFlowState): GameFlowState {
  if (flow.stage !== 'world') throw new Error(`Cannot enter battle from ${flow.stage}.`);
  return { ...flow, stage: 'battle', result: undefined };
}

export function finishGameBattle(flow: GameFlowState, result: GameFlowResult): GameFlowState {
  if (flow.stage !== 'battle') throw new Error(`Cannot finish battle from ${flow.stage}.`);
  if (flow.source === 'pvp') {
    if (result.authority !== 'server' || !result.result.ok) {
      throw new Error('PvP results must come from the authoritative battle resolver.');
    }
  } else if (result.authority !== 'local-training') {
    throw new Error('Training results must remain presentation-only.');
  }
  return { ...flow, stage: 'result', result };
}

export function returnToWorld(flow: GameFlowState): GameFlowState {
  if (flow.stage !== 'result') throw new Error(`Cannot return to world from ${flow.stage}.`);
  return { ...flow, stage: 'world', result: undefined };
}

export function isAuthoritativeResult(result: GameFlowResult | undefined): result is { authority: 'server'; result: BattleResult } {
  return result?.authority === 'server' && result.result.ok === true;
}