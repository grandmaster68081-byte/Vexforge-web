// VexForge BattleEffects — VX.0 + VX.1 (Chat 95)
// Floating damage numbers and keyword activation animations.
// Used as overlay components inside PvpRoute / InteractiveBattleBoard wrappers.

import { useState, useEffect, useRef } from 'react';
import type { BattleTurnData } from '../../lib/battleTypes';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';

// ─── VX.0: Floating Damage Numbers ────────────────────────────────────────────
export interface DamageFloat {
  id: number;
  value: number;
  type: 'damage' | 'crit' | 'heal' | 'shield' | 'double';
  side: 'a' | 'b';
}

let _floatId = 0;

export function useDamageFloats(currentTurn: BattleTurnData | null) {
  const [floats, setFloats] = useState<DamageFloat[]>([]);
  const prevTurnRef = useRef<number>(-1);

  useEffect(() => {
    if (!currentTurn || currentTurn.turn === prevTurnRef.current) return;
    prevTurnRef.current = currentTurn.turn;

    const newFloats: DamageFloat[] = [];

    if (currentTurn.events.some(e => e.type === 'shield_block')) {
      newFloats.push({ id: ++_floatId, value: 0, type: 'shield', side: currentTurn.atk_side === 'a' ? 'b' : 'a' });
    } else if (currentTurn.damage > 0) {
      newFloats.push({
        id: ++_floatId,
        value: currentTurn.damage,
        type: currentTurn.type === 'double_strike' ? 'double' : currentTurn.is_crit ? 'crit' : 'damage',
        side: currentTurn.atk_side === 'a' ? 'b' : 'a',
      });
    }

    if (currentTurn.lifesteal_heal > 0) {
      newFloats.push({ id: ++_floatId, value: currentTurn.lifesteal_heal, type: 'heal', side: currentTurn.atk_side });
    }

    if (!newFloats.length) return;
    setFloats(prev => [...prev, ...newFloats]);

    const ids = newFloats.map(f => f.id);
    const timer = setTimeout(() => {
      setFloats(prev => prev.filter(f => !ids.includes(f.id)));
    }, 1400);
    return () => clearTimeout(timer);
  }, [currentTurn]);

  return { floats };
}

const FLOAT_STYLE: Record<DamageFloat['type'], { color: string; fontSize: number; label?: string }> = {
  damage: { color: '#ff6b6b', fontSize: 22 },
  crit:   { color: '#e8b84b', fontSize: 30, label: 'CRIT!' },
  heal:   { color: '#3ddc84', fontSize: 18 },
  shield: { color: '#4a9eff', fontSize: 20, label: 'BLOQUEADO' },
  double: { color: '#a855f7', fontSize: 20, label: '×2' },
};

interface DamageFloatLayerProps {
  floats: DamageFloat[];
  /** Layout helper: which side of the board is 'a' (player) */
  playerSide?: 'left' | 'right';
}

export function DamageFloatLayer({ floats, playerSide = 'right' }: DamageFloatLayerProps) {
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 50 }}>
      <style>{`
        @keyframes vx-float-up {
          0%   { opacity: 1;   transform: translateY(0)   scale(1.2); }
          20%  { opacity: 1;   transform: translateY(-12px) scale(1);   }
          80%  { opacity: 0.9; transform: translateY(-44px) scale(0.9); }
          100% { opacity: 0;   transform: translateY(-64px) scale(0.8); }
        }
      `}</style>
      {floats.map(f => {
        const cfg   = FLOAT_STYLE[f.type];
        // Position: side 'b' (opponent) is opposite to player
        const left  = f.side === 'a'
          ? (playerSide === 'left' ? '25%' : '75%')
          : (playerSide === 'left' ? '75%' : '25%');
        const top = '40%';

        return (
          <div key={f.id} style={{
            position: 'absolute', left, top,
            transform: 'translateX(-50%)',
            animation: 'vx-float-up 1.4s ease-out forwards',
            pointerEvents: 'none',
            textAlign: 'center',
          }}>
            {f.type !== 'damage' && f.type !== 'heal' && cfg.label && (
              <div style={{
                fontSize: 10, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800,
                color: cfg.color, letterSpacing: '0.1em',
                textShadow: `0 0 12px ${cfg.color}`,
                marginBottom: 2,
              }}>
                {cfg.label}
              </div>
            )}
            <div style={{
              fontSize: cfg.fontSize,
              fontFamily: '"Cinzel",serif', fontWeight: 900,
              color: cfg.color,
              textShadow: `0 0 20px ${cfg.color}, 0 2px 6px rgba(0,0,0,0.9)`,
              lineHeight: 1,
            }}>
              {f.type === 'heal' ? '+' : f.type === 'shield' ? (
                <ForgeIcon name="shield" size={cfg.fontSize} strokeWidth={1.7} style={{ verticalAlign: '-0.15em' }} />
              ) : '-'}{f.value || ''}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── VX.1: Keyword Activation Effects ────────────────────────────────────────
export interface ActiveEffect {
  id: number;
  type: 'poison' | 'shield' | 'lifesteal' | 'double' | 'rush' | 'crit';
  unitName: string;
  side: 'a' | 'b';
}

let _effectId = 0;

export function useKeywordEffects(currentTurn: BattleTurnData | null) {
  const [effects, setEffects] = useState<ActiveEffect[]>([]);
  const prevRef = useRef<number>(-1);

  useEffect(() => {
    if (!currentTurn || currentTurn.turn === prevRef.current) return;
    prevRef.current = currentTurn.turn;

    const newEffects: ActiveEffect[] = [];

    for (const ev of currentTurn.events) {
      if (ev.type === 'poisoned')      newEffects.push({ id:++_effectId, type:'poison',    unitName: ev.unit ?? '', side: ev.side ?? 'b' });
      if (ev.type === 'shield_block')  newEffects.push({ id:++_effectId, type:'shield',    unitName: ev.unit ?? '', side: ev.side ?? 'b' });
      if (ev.type === 'lifesteal')     newEffects.push({ id:++_effectId, type:'lifesteal', unitName: ev.unit ?? '', side: currentTurn.atk_side });
      if (ev.type === 'double_strike') newEffects.push({ id:++_effectId, type:'double',    unitName: ev.unit ?? '', side: currentTurn.atk_side });
    }
    if (currentTurn.is_crit && currentTurn.damage > 0) {
      newEffects.push({ id:++_effectId, type:'crit', unitName: currentTurn.attacker.name, side: currentTurn.atk_side });
    }

    if (!newEffects.length) return;
    setEffects(prev => [...prev, ...newEffects]);

    const ids = newEffects.map(e => e.id);
    const timer = setTimeout(() => setEffects(prev => prev.filter(e => !ids.includes(e.id))), 800);
    return () => clearTimeout(timer);
  }, [currentTurn]);

  return { effects };
}

const EFFECT_ICON: Record<ActiveEffect['type'], ForgeIconName> = {
  poison:    'skull',
  shield:    'shield',
  lifesteal: 'heart',
  double:    'attack',
  rush:      'energy',
  crit:      'spark',
};

const EFFECT_COLOR: Record<ActiveEffect['type'], string> = {
  poison:    '#3ddc84',
  shield:    '#4a9eff',
  lifesteal: '#3ddc84',
  double:    '#a855f7',
  rush:      '#e8b84b',
  crit:      '#e8b84b',
};

interface KeywordEffectBannerProps {
  effects: ActiveEffect[];
}

export function KeywordEffectBanner({ effects }: KeywordEffectBannerProps) {
  if (!effects.length) return null;
  return (
    <div style={{
      position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
      display: 'flex', gap: 8, alignItems: 'center', zIndex: 60,
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes vx-kw-pop {
          0%   { opacity: 0; transform: translateY(16px) scale(0.6); }
          35%  { opacity: 1; transform: translateY(-4px) scale(1.12); }
          65%  { transform: translateY(0) scale(1); }
          100% { opacity: 0; transform: translateY(-12px) scale(0.9); }
        }
        @keyframes vx-kw-crit {
          0%   { opacity: 0; transform: scale(0.3) rotate(-10deg); }
          30%  { opacity: 1; transform: scale(1.2) rotate(3deg); }
          65%  { transform: scale(1) rotate(0deg); }
          100% { opacity: 0; transform: scale(0.8) translateY(-20px); }
        }
        @keyframes vx-kw-shield {
          0%   { opacity: 0; transform: scale(0.5); }
          40%  { opacity: 1; transform: scale(1.15); }
          100% { opacity: 0; transform: scale(1.4) translateY(-10px); }
        }
        @keyframes vx-kw-heal {
          0%   { opacity: 0; transform: translateY(8px); }
          30%  { opacity: 1; transform: translateY(-6px) scale(1.08); }
          100% { opacity: 0; transform: translateY(-24px) scale(0.9); }
        }
      `}</style>
      {effects.map(e => {
        const anim = e.type === 'crit' ? 'vx-kw-crit 0.9s ease-out forwards'
          : e.type === 'shield' ? 'vx-kw-shield 0.9s ease-out forwards'
          : e.type === 'lifesteal' ? 'vx-kw-heal 0.9s ease-out forwards'
          : 'vx-kw-pop 0.9s ease-out forwards';
        const label = e.type === 'lifesteal' ? 'Drenaje'
          : e.type === 'shield' ? 'Bloqueado'
          : e.type === 'poison' ? 'Veneno'
          : e.type === 'double' ? 'Doble Golpe'
          : e.type === 'crit' ? '¡CRÍTICO!'
          : 'Rush';
        return (
          <div key={e.id} style={{
            animation: anim,
            background: `${EFFECT_COLOR[e.type]}28`,
            border: `1px solid ${EFFECT_COLOR[e.type]}88`,
            borderRadius: 10, padding: '5px 14px',
            fontFamily: '"Rajdhani",sans-serif',
            fontSize: e.type === 'crit' ? 15 : 12,
            fontWeight: 800,
            color: EFFECT_COLOR[e.type],
            display: 'flex', alignItems: 'center', gap: 6,
            backdropFilter: 'blur(6px)',
            boxShadow: `0 0 16px ${EFFECT_COLOR[e.type]}55, 0 2px 8px rgba(0,0,0,0.5)`,
            letterSpacing: '0.06em',
          }}>
            <ForgeIcon name={EFFECT_ICON[e.type]} size={e.type === 'crit' ? 16 : 14} strokeWidth={1.8} />
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}