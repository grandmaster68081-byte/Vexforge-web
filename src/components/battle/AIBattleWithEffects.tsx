// VexForge AIBattleWithEffects — IA.0+VX.0+VX.1 (Chat 95 — fixed)
// Wrapper component that combines InteractiveBattleBoard with damage float
// effects and keyword animations. Used exclusively for AI battles in PvpRoute.

import { useState, useEffect, useRef } from 'react';
import type { RealBattleResult, BattleTurnData } from '../../lib/battleTypes';
import { InteractiveBattleBoard } from './InteractiveBattleBoard';
import { DamageFloatLayer, KeywordEffectBanner, type DamageFloat, type ActiveEffect } from './BattleEffects';

// ─── Props ────────────────────────────────────────────────────────────────────
interface AIBattleWithEffectsProps {
  result: RealBattleResult;
  opponentName: string;
  onDismiss: () => void;
}

// ─── Effect tracking hook ─────────────────────────────────────────────────────
// Driven by observing turn log length from the result — fires effects when
// the user manually advances turns inside InteractiveBattleBoard.
function useEffectTracker(result: RealBattleResult) {
  const [floats, setFloats] = useState<DamageFloat[]>([]);
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const floatId = useRef(0);
  const effectId = useRef(0);

  // Poll for turn advances using a lightweight interval.
  // InteractiveBattleBoard manages its own state; we re-read turns
  // from result.turns using timing heuristics.
  useEffect(() => {
    if (!result.turns?.length) return;
    let idx = 0;

    const tryFireNextTurn = () => {
      if (idx >= (result.turns?.length ?? 0)) return;
      const turn: BattleTurnData = result.turns![idx];
      idx++;

      const newFloats: DamageFloat[] = [];
      const newEffects: ActiveEffect[] = [];

      // VX.0: Damage float
      if (turn.events.some(e => e.type === 'shield_block')) {
        newFloats.push({ id: ++floatId.current, value: 0, type: 'shield', side: turn.atk_side === 'a' ? 'b' : 'a' });
        newEffects.push({ id: ++effectId.current, type: 'shield', unitName: turn.defender.name, side: turn.atk_side === 'a' ? 'b' : 'a' });
      } else if (turn.damage > 0) {
        const fType: DamageFloat['type'] = turn.type === 'double_strike' ? 'double' : turn.is_crit ? 'crit' : 'damage';
        newFloats.push({ id: ++floatId.current, value: turn.damage, type: fType, side: turn.atk_side === 'a' ? 'b' : 'a' });
        if (turn.is_crit) newEffects.push({ id: ++effectId.current, type: 'crit', unitName: turn.attacker.name, side: turn.atk_side });
        if (turn.type === 'double_strike') newEffects.push({ id: ++effectId.current, type: 'double', unitName: turn.attacker.name, side: turn.atk_side });
      }
      if (turn.lifesteal_heal > 0) {
        newFloats.push({ id: ++floatId.current, value: turn.lifesteal_heal, type: 'heal', side: turn.atk_side });
        newEffects.push({ id: ++effectId.current, type: 'lifesteal', unitName: turn.attacker.name, side: turn.atk_side });
      }
      if (turn.events.some(e => e.type === 'poisoned')) {
        newEffects.push({ id: ++effectId.current, type: 'poison', unitName: turn.defender.name, side: turn.atk_side === 'a' ? 'b' : 'a' });
      }

      if (newFloats.length) {
        setFloats(prev => [...prev, ...newFloats]);
        const ids = newFloats.map(f => f.id);
        setTimeout(() => setFloats(prev => prev.filter(f => !ids.includes(f.id))), 1400);
      }
      if (newEffects.length) {
        setEffects(prev => [...prev, ...newEffects]);
        const ids = newEffects.map(e => e.id);
        setTimeout(() => setEffects(prev => prev.filter(e => !ids.includes(e.id))), 900);
      }
    };

    // Use 380ms — faster than auto-play (850ms) so effects never lag behind turns
    const interval = setInterval(() => {
      // Pause effect firing when tab is hidden to prevent desync
      if (document.hidden) return;
      if (idx < (result.turns?.length ?? 0)) tryFireNextTurn();
    }, 380);

    // Resume from correct position when tab regains focus
    let tabHiddenAt = 0;
    const onVisibilityChange = () => {
      if (!document.hidden) {
        // Skip ahead to catch up: fire any missed turns instantly
        const missedMs = tabHiddenAt > 0 ? Date.now() - tabHiddenAt : 0;
        const missedTurns = Math.floor(missedMs / 380);
        for (let i = 0; i < Math.min(missedTurns, 5) && idx < (result.turns?.length ?? 0); i++) {
          tryFireNextTurn();
        }
        tabHiddenAt = 0;
      } else {
        tabHiddenAt = Date.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [result]);

  return { floats, effects };
}

// ─── Component ────────────────────────────────────────────────────────────────
export function AIBattleWithEffects({
  result, opponentName, onDismiss,
}: AIBattleWithEffectsProps) {
  const { floats, effects } = useEffectTracker(result);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Core battle board */}
      <InteractiveBattleBoard
        result={result}
        opponentName={opponentName}
        onDismiss={onDismiss}
      />

      {/* VX.0: Floating damage numbers overlay */}
      <DamageFloatLayer floats={floats} />

      {/* VX.1: Keyword activation effects */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 80 }}>
        <KeywordEffectBanner effects={effects} />
      </div>
    </div>
  );
}
