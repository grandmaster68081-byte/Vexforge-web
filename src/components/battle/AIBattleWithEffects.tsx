// VexForge AIBattleWithEffects — IA.0+VX.0+VX.1 (Chat 95)
    // Wrapper component that combines InteractiveBattleBoard with damage float
    // effects and keyword animations. Used exclusively for AI battles in PvpRoute.

    import { useState, useEffect, useRef } from 'react';
    import type { RealBattleResult, BattleTurnData } from '../../lib/battleTypes';
    import type { AIDifficulty } from '../../lib/aiBattleEngine';
    import { InteractiveBattleBoard } from './InteractiveBattleBoard';
    import { DamageFloatLayer, KeywordEffectBanner, type DamageFloat, type ActiveEffect } from './BattleEffects';

    // ─── Props ────────────────────────────────────────────────────────────────────
    interface AIBattleWithEffectsProps {
    result: RealBattleResult;
    difficulty: AIDifficulty;
    opponentName: string;
    onDismiss: () => void;
    onRevenge: () => void;
    }

    // ─── Effect tracking hook ─────────────────────────────────────────────────────
    // Driven by observing turn log length from the result — fires effects when
    // the user manually advances turns inside InteractiveBattleBoard.
    function useEffectTracker(result: RealBattleResult) {
    const [floats, setFloats] = useState<DamageFloat[]>([]);
    const [effects, setEffects] = useState<ActiveEffect[]>([]);
    const lastRevealedRef = useRef<number>(0);
    let floatId = useRef(0);
    let effectId = useRef(0);

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

      // Listen for DOM mutations as a proxy for turn advances
      // Fallback: poll every 1.2s (approximate turn animation duration)
      const interval = setInterval(() => {
        if (idx < (result.turns?.length ?? 0)) tryFireNextTurn();
      }, 1200);

      return () => clearInterval(interval);
    }, [result]);

    return { floats, effects };
    }

    // ─── Component ────────────────────────────────────────────────────────────────
    export function AIBattleWithEffects({
    result, difficulty, opponentName, onDismiss, onRevenge,
    }: AIBattleWithEffectsProps) {
    const { floats, effects } = useEffectTracker(result);

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* Core battle board */}
        <InteractiveBattleBoard
          result={result}
          opponentName={opponentName}
          onDismiss={onDismiss}
          onRevenge={onRevenge}
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
    