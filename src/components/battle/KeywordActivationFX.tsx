// KeywordActivationFX.tsx — VX.1 Keyword Activation Animations
// Muestra una animación visual cuando se activa un keyword durante el combate.
// Se coloca sobre la carta que activa el keyword.

import { useState, useEffect, useCallback } from 'react';
import type { BattleEvent } from '../../lib/battleTypes';

// ─── Keyword visual config ─────────────────────────────────────────────────────
const KW_FX: Record<string, {
  icon: string; label: string; color: string; glow: string;
  animation: string; textColor: string;
}> = {
  Guard:       { icon: '🛡️', label: 'GUARD',        color: '#4a9eff',  glow: 'rgba(74,158,255,0.7)',  animation: 'kw-shield-burst',    textColor: '#fff' },
  Drain:       { icon: '💚',  label: 'DRAIN',        color: '#3ddc84',  glow: 'rgba(61,220,132,0.7)',  animation: 'kw-heal-pulse',      textColor: '#fff' },
  Lifesteal:   { icon: '💚',  label: 'LIFESTEAL',    color: '#3ddc84',  glow: 'rgba(61,220,132,0.7)',  animation: 'kw-heal-pulse',      textColor: '#fff' },
  Surge:       { icon: '⚡',  label: 'SURGE',        color: '#e8b84b',  glow: 'rgba(232,184,75,0.7)',  animation: 'kw-surge-flash',     textColor: '#0a0a12' },
  Rush:        { icon: '⚡',  label: 'RUSH',         color: '#e8b84b',  glow: 'rgba(232,184,75,0.7)',  animation: 'kw-surge-flash',     textColor: '#0a0a12' },
  Veil:        { icon: '🔮',  label: 'VEIL',         color: '#a855f7',  glow: 'rgba(168,85,247,0.7)',  animation: 'kw-veil-shimmer',    textColor: '#fff' },
  Forge:       { icon: '🔨',  label: 'FORGE',        color: '#ff6b35',  glow: 'rgba(255,107,53,0.7)',  animation: 'kw-forge-hammer',    textColor: '#fff' },
  Consecrate:  { icon: '✝️', label: 'CONSECRATE',   color: '#ffd700',  glow: 'rgba(255,215,0,0.7)',   animation: 'kw-holy-burst',      textColor: '#0a0a12' },
  Flux:        { icon: '🌀',  label: 'FLUX',         color: '#a855f7',  glow: 'rgba(168,85,247,0.6)',  animation: 'kw-flux-spin',       textColor: '#fff' },
  Resonance:   { icon: '🎵',  label: 'RESONANCE',    color: '#b08af8',  glow: 'rgba(176,138,248,0.7)', animation: 'kw-resonance-wave',  textColor: '#fff' },
  Poison:      { icon: '☠️', label: 'VENENO',        color: '#a855f7',  glow: 'rgba(168,85,247,0.7)',  animation: 'kw-poison-drip',     textColor: '#fff' },
  DoubleStrike:{ icon: '⚔️', label: 'DOBLE GOLPE',  color: '#ff6b35',  glow: 'rgba(255,107,53,0.8)',  animation: 'kw-double-strike',   textColor: '#fff' },
  shield_block:{ icon: '🛡️', label: 'BLOQUEADO',    color: '#4a9eff',  glow: 'rgba(74,158,255,0.8)',  animation: 'kw-shield-burst',    textColor: '#fff' },
  poison_tick: { icon: '☠️', label: '−HP',           color: '#a855f7',  glow: 'rgba(168,85,247,0.7)',  animation: 'kw-poison-drip',     textColor: '#fff' },
  poisoned:    { icon: '☠️', label: 'ENVENENADO',    color: '#a855f7',  glow: 'rgba(168,85,247,0.7)',  animation: 'kw-poison-drip',     textColor: '#fff' },
  lifesteal:   { icon: '💚',  label: 'DRENAR',       color: '#3ddc84',  glow: 'rgba(61,220,132,0.7)',  animation: 'kw-heal-pulse',      textColor: '#fff' },
  double_strike:{icon: '⚔️', label: '2° GOLPE',     color: '#ff6b35',  glow: 'rgba(255,107,53,0.8)',  animation: 'kw-double-strike',   textColor: '#fff' },
};

interface KeywordFXEntry {
  id: string;
  keyword: string;
  side: 'player' | 'opponent';
  at: number;
}

export function useKeywordFX() {
  const [effects, setEffects] = useState<KeywordFXEntry[]>([]);

  const triggerKeywordFX = useCallback((
    events: BattleEvent[],
    attackerSide: 'a' | 'b',
    attackerKeywords: string[],
  ) => {
    const now = Date.now();
    const newFx: KeywordFXEntry[] = [];

    // From explicit events
    for (const ev of events) {
      const cfg = KW_FX[ev.type];
      if (cfg) {
        newFx.push({
          id: `${ev.type}-${now}-${Math.random()}`,
          keyword: ev.type,
          side: ev.side === 'a' ? 'player' : (ev.side === 'b' ? 'opponent' : (attackerSide === 'a' ? 'player' : 'opponent')),
          at: now,
        });
      }
    }

    // From attacker keywords (Surge, DoubleStrike, etc.)
    for (const kw of attackerKeywords ?? []) {
      if (KW_FX[kw] && !newFx.find(f => f.keyword === kw)) {
        newFx.push({
          id: `${kw}-${now}-${Math.random()}`,
          keyword: kw,
          side: attackerSide === 'a' ? 'player' : 'opponent',
          at: now,
        });
      }
    }

    if (newFx.length) {
      setEffects(prev => [...prev, ...newFx]);
      setTimeout(() => {
        setEffects(prev => prev.filter(e => !newFx.find(n => n.id === e.id)));
      }, 1400);
    }
  }, []);

  return { effects, triggerKeywordFX };
}

interface KeywordActivationFXProps {
  effects: KeywordFXEntry[];
}

export function KeywordActivationFX({ effects }: KeywordActivationFXProps) {
  if (!effects.length) return null;

  return (
    <>
      <style>{`
        @keyframes kw-shield-burst {
          0%   { opacity:0; transform:scale(0.4) translateY(10px); }
          20%  { opacity:1; transform:scale(1.15) translateY(-8px); }
          60%  { opacity:1; transform:scale(1) translateY(-12px); }
          100% { opacity:0; transform:scale(0.9) translateY(-24px); }
        }
        @keyframes kw-heal-pulse {
          0%   { opacity:0; transform:scale(0.5) translateY(8px); }
          25%  { opacity:1; transform:scale(1.2) translateY(-6px); }
          70%  { opacity:1; transform:scale(1) translateY(-14px); }
          100% { opacity:0; transform:scale(0.8) translateY(-28px); }
        }
        @keyframes kw-surge-flash {
          0%   { opacity:0; transform:scale(0.3) rotate(-10deg); }
          15%  { opacity:1; transform:scale(1.3) rotate(5deg); }
          50%  { opacity:1; transform:scale(1.1) rotate(0deg); }
          100% { opacity:0; transform:scale(0.9) translateY(-20px); }
        }
        @keyframes kw-veil-shimmer {
          0%   { opacity:0; transform:scale(0.8); filter:blur(4px); }
          20%  { opacity:1; transform:scale(1.1); filter:blur(0px); }
          70%  { opacity:0.8; transform:scale(1); }
          100% { opacity:0; transform:scale(1.05) translateY(-10px); }
        }
        @keyframes kw-forge-hammer {
          0%   { opacity:0; transform:scale(0.6) translateY(16px); }
          10%  { opacity:1; transform:scale(1.4) translateY(-4px); }
          20%  { transform:scale(0.95) translateY(2px); }
          50%  { transform:scale(1.05) translateY(-8px); opacity:1; }
          100% { opacity:0; transform:scale(0.9) translateY(-18px); }
        }
        @keyframes kw-holy-burst {
          0%   { opacity:0; transform:scale(0.5); }
          15%  { opacity:1; transform:scale(1.4); filter:brightness(1.5); }
          50%  { opacity:0.9; transform:scale(1.1); }
          100% { opacity:0; transform:scale(1.2) translateY(-16px); }
        }
        @keyframes kw-flux-spin {
          0%   { opacity:0; transform:scale(0.5) rotate(0deg); }
          20%  { opacity:1; transform:scale(1.2) rotate(180deg); }
          70%  { opacity:0.8; transform:scale(1) rotate(270deg); }
          100% { opacity:0; transform:scale(0.8) rotate(360deg) translateY(-20px); }
        }
        @keyframes kw-resonance-wave {
          0%   { opacity:0; transform:scale(1); }
          15%  { opacity:1; transform:scale(1.3); }
          40%  { transform:scale(0.9); }
          70%  { transform:scale(1.1); opacity:0.7; }
          100% { opacity:0; transform:scale(1.2) translateY(-16px); }
        }
        @keyframes kw-poison-drip {
          0%   { opacity:0; transform:scale(0.7) translateY(-6px); }
          20%  { opacity:1; transform:scale(1.1) translateY(4px); }
          60%  { opacity:0.9; transform:scale(1) translateY(10px); }
          100% { opacity:0; transform:scale(0.8) translateY(22px); }
        }
        @keyframes kw-double-strike {
          0%   { opacity:0; transform:scale(0.5) rotate(-15deg); }
          10%  { opacity:1; transform:scale(1.3) rotate(5deg); }
          20%  { transform:scale(0.9) rotate(-3deg); }
          35%  { opacity:1; transform:scale(1.2) rotate(3deg); }
          50%  { transform:scale(1) rotate(0deg); }
          100% { opacity:0; transform:scale(0.9) translateY(-16px); }
        }
      `}</style>
      {effects.map(fx => {
        const cfg = KW_FX[fx.keyword];
        if (!cfg) return null;
        const isPlayer = fx.side === 'player';
        return (
          <div
            key={fx.id}
            style={{
              position: 'absolute',
              left: '50%',
              top: isPlayer ? '65%' : '28%',
              transform: 'translate(-50%, -50%)',
              zIndex: 150,
              pointerEvents: 'none',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
              animation: `${cfg.animation} 1.3s cubic-bezier(0.22,1,0.36,1) forwards`,
              filter: `drop-shadow(0 0 12px ${cfg.glow}) drop-shadow(0 0 24px ${cfg.glow})`,
            }}
          >
            <div style={{ fontSize: 32 }}>{cfg.icon}</div>
            <div style={{
              background: cfg.color,
              color: cfg.textColor,
              borderRadius: 20, padding: '3px 10px',
              fontSize: 9, fontWeight: 900,
              fontFamily: '"Cinzel",serif', letterSpacing: '0.14em',
              boxShadow: `0 0 16px ${cfg.glow}, 0 0 32px ${cfg.glow}`,
              whiteSpace: 'nowrap',
            }}>{cfg.label}</div>
          </div>
        );
      })}
    </>
  );
}
