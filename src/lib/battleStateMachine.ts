// VexForge BattleStateMachine v1.0 — EPICA Q.4 (chat76)
// Turn-by-turn state machine for interactive PvP battles.
// The RPC resolves all turns at once; this hook exposes them step by step
// with player-controlled pacing, auto-play, and drag-to-attack mechanics.

import { useState, useCallback, useRef, useEffect } from 'react';
import type { RealBattleResult, BattleTurnData } from './battleTypes';

export type TurnPhase =
  | 'IDLE'        // Waiting for player to attack
  | 'SELECTING'   // Player is dragging their card
  | 'ANIMATING'   // Turn animating (450ms window)
  | 'COMPLETE';   // Battle ended

export interface TurnSnapshot {
  idx: number;
  data: BattleTurnData;
  playerHp: number;
  opponentHp: number;
}

export interface BattleMachineState {
  phase: TurnPhase;
  turnIdx: number;
  totalTurns: number;
  currentTurn: BattleTurnData | null;
  revealedTurns: TurnSnapshot[];
  playerHp: number;
  opponentHp: number;
  playerMaxHp: number;
  opponentMaxHp: number;
  isDragging: boolean;
  isAutoPlaying: boolean;
  won: boolean | null;
  eloChange: number;
}

export interface BattleMachineActions {
  advance: () => void;
  startDrag: () => void;
  endDrag: (dropped: boolean) => void;
  autoPlay: (intervalMs?: number) => void;
  stopAutoPlay: () => void;
  reset: () => void;
}

// Extract HP for a given side from a turn — side a = player, b = opponent
function extractHp(turn: BattleTurnData, side: 'player' | 'opponent'): number {
  if (side === 'player') {
    return turn.atk_side === 'a'
      ? (turn.attacker?.hp ?? 100)
      : (turn.defender?.hp ?? 100);
  }
  return turn.atk_side === 'b'
    ? (turn.attacker?.hp ?? 100)
    : (turn.defender?.hp ?? 100);
}

export function useBattleStateMachine(
  result: RealBattleResult | null,
  autoPlayMs = 850,
): [BattleMachineState, BattleMachineActions] {
  const turns = result?.turns ?? [];
  const total = turns.length;

  const [phase,    setPhase]   = useState<TurnPhase>(total > 0 ? 'IDLE' : 'COMPLETE');
  const [turnIdx,  setTurnIdx] = useState(0);
  const [revealed, setRevealed]= useState<TurnSnapshot[]>([]);
  const [dragging, setDragging]= useState(false);
  const [autoOn,   setAutoOn]  = useState(false);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const playerMaxHp   = 100;
  const opponentMaxHp = 100;
  const lastSnap = revealed[revealed.length - 1];
  const playerHp   = lastSnap?.playerHp   ?? playerMaxHp;
  const opponentHp = lastSnap?.opponentHp ?? opponentMaxHp;

  const revealTurn = useCallback((idx: number) => {
    if (idx >= total) return;
    const t = turns[idx];
    setRevealed(prev => [
      ...prev,
      { idx, data: t, playerHp: extractHp(t, 'player'), opponentHp: extractHp(t, 'opponent') },
    ]);
  }, [total, turns]);

  const advance = useCallback(() => {
    if (phase !== 'IDLE' && phase !== 'SELECTING') return;
    if (turnIdx >= total) { setPhase('COMPLETE'); return; }
    setDragging(false);
    setPhase('ANIMATING');
    setTimeout(() => {
      revealTurn(turnIdx);
      const next = turnIdx + 1;
      if (next >= total) { setTurnIdx(next); setPhase('COMPLETE'); }
      else               { setTurnIdx(next); setPhase('IDLE'); }
    }, 450);
  }, [phase, turnIdx, total, revealTurn]);

  const startDrag = useCallback(() => {
    if (phase === 'IDLE') { setPhase('SELECTING'); setDragging(true); }
  }, [phase]);

  const endDrag = useCallback((dropped: boolean) => {
    setDragging(false);
    if (!dropped) { setPhase('IDLE'); return; }
    // advance() handles the phase transition
    setPhase('IDLE');
    // Use timeout to let state settle before advance
    setTimeout(() => {
      setPhase(p => {
        if (p !== 'IDLE') return p;
        return 'ANIMATING';
      });
    }, 0);
    advance();
  }, [advance]);

  const autoPlay = useCallback((ms = autoPlayMs) => {
    if (autoRef.current) return;
    setAutoOn(true);
    let cur = turnIdx;
    autoRef.current = setInterval(() => {
      if (cur >= total) {
        clearInterval(autoRef.current!); autoRef.current = null;
        setAutoOn(false); setPhase('COMPLETE'); return;
      }
      revealTurn(cur);
      cur++;
      setTurnIdx(cur);
      if (cur >= total) {
        clearInterval(autoRef.current!); autoRef.current = null;
        setAutoOn(false); setPhase('COMPLETE');
      }
    }, ms);
  }, [autoPlayMs, total, turnIdx, revealTurn]);

  const stopAutoPlay = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
    setAutoOn(false); setPhase('IDLE');
  }, []);

  const reset = useCallback(() => {
    if (autoRef.current) { clearInterval(autoRef.current); autoRef.current = null; }
    setPhase(total > 0 ? 'IDLE' : 'COMPLETE');
    setTurnIdx(0); setRevealed([]); setDragging(false); setAutoOn(false);
  }, [total]);

  useEffect(() => () => { if (autoRef.current) clearInterval(autoRef.current); }, []);

  const state: BattleMachineState = {
    phase, turnIdx, totalTurns: total,
    currentTurn: turns[turnIdx] ?? null,
    revealedTurns: revealed,
    playerHp, opponentHp, playerMaxHp, opponentMaxHp,
    isDragging: dragging, isAutoPlaying: autoOn,
    won: phase === 'COMPLETE' && result ? (result.you_won ?? false) : null,
    eloChange: result?.elo_change ?? 0,
  };

  return [state, { advance, startDrag, endDrag, autoPlay, stopAutoPlay, reset }];
}
