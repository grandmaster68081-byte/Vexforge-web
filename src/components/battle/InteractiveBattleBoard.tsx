// VexForge InteractiveBattleBoard v2.0 — DOMINION ARENA EDITION
// Épica visual overhaul: arena cinematica, cartas grandes, haz de ataque,
// zonas de facción, partículas atmosféricas. Inspirado en Yu-Gi-Oh Master Duel.

import { useRef, useCallback, useState, useEffect, type CSSProperties } from 'react';
import type { RealBattleResult, BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import { CardAttackCinematic } from './CardAttackCinematic';

// Faction-to-icon map — KEYWORD_ICON maps mechanics (Guard, Surge…), not factions
const FACTION_ICON: Record<string, string> = {
  Guerrero:    '⚔️',
  Mago:        '🔮',
  'Paladín':   '🛡️',
  'Pícaro':    '🗡️',
  Explorador:  '🏹',
  Comerciante: '💰',
};
import { useBattleStateMachine, type TurnPhase, type TurnSnapshot } from '../../lib/battleStateMachine';
import { KeywordChip } from './KeywordTooltip';
import { AudioEngine } from '../../lib/audioEngine';

// ─── Constantes ────────────────────────────────────────────────────────────────
const HP_COLOR = (pct: number) =>
  pct > 0.55 ? '#3ddc84' : pct > 0.25 ? '#f59e0b' : '#ff3333';

const STORAGE = 'https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets';

const FACTION_ZONE: Record<string, { primary: string; glow: string; gradient: string; arenaImg: string }> = {
  Guerrero:    { primary: '#e84040', glow: 'rgba(232,64,64,0.35)',   gradient: 'linear-gradient(180deg,rgba(80,10,10,0.7) 0%,rgba(30,5,5,0.4) 100%)',   arenaImg: `${STORAGE}/factions/bg_guerrero.jpg` },
  Mago:        { primary: '#7b4fd4', glow: 'rgba(123,79,212,0.35)',  gradient: 'linear-gradient(180deg,rgba(40,10,80,0.7) 0%,rgba(15,5,30,0.4) 100%)',  arenaImg: `${STORAGE}/factions/bg_mago.jpg` },
  'Pícaro':    { primary: '#3dc96b', glow: 'rgba(61,201,107,0.35)', gradient: 'linear-gradient(180deg,rgba(10,50,20,0.7) 0%,rgba(5,20,10,0.4) 100%)',  arenaImg: `${STORAGE}/factions/bg_picaro.jpg` },
  'Paladín':   { primary: '#e8b84b', glow: 'rgba(232,184,75,0.35)', gradient: 'linear-gradient(180deg,rgba(60,40,5,0.7) 0%,rgba(25,15,5,0.4) 100%)',   arenaImg: `${STORAGE}/factions/bg_paladin.jpg` },
  Explorador:  { primary: '#3dc96b', glow: 'rgba(61,201,107,0.35)', gradient: 'linear-gradient(180deg,rgba(10,50,20,0.7) 0%,rgba(5,20,10,0.4) 100%)',  arenaImg: `${STORAGE}/factions/bg_picaro.jpg` },
  Comerciante: { primary: '#e8b84b', glow: 'rgba(232,184,75,0.35)', gradient: 'linear-gradient(180deg,rgba(60,40,5,0.7) 0%,rgba(25,15,5,0.4) 100%)',   arenaImg: `${STORAGE}/factions/bg_paladin.jpg` },
  default:     { primary: '#4a9eff', glow: 'rgba(74,158,255,0.35)',  gradient: 'linear-gradient(180deg,rgba(5,20,50,0.7) 0%,rgba(5,10,25,0.4) 100%)',   arenaImg: `${STORAGE}/backgrounds/bg_missions.jpg` },
};

// ─── HP Bar épica ───────────────────────────────────────────────────────────────
function EpicHpBar({ hp, max, color }: { hp: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const col = HP_COLOR(pct);
  const critical = pct < 0.25;
  return (
    <div style={{ height: 10, background: 'rgba(0,0,0,0.7)', borderRadius: 5, overflow: 'hidden',
      border: `1px solid ${color}33`, position: 'relative' }}>
      <div style={{
        height: '100%', width: `${pct * 100}%`,
        background: critical
          ? `linear-gradient(90deg, ${col}, #ff6644)`
          : `linear-gradient(90deg, ${col}, ${col}bb)`,
        boxShadow: `0 0 8px ${col}99, inset 0 1px 0 rgba(255,255,255,0.2)`,
        transition: 'width 0.5s cubic-bezier(0.4,0,0.2,1)',
        borderRadius: 5,
      }} />
      {/* Damage flash ghost bar */}
      {critical && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 5,
          animation: 'hp-critical-pulse 0.8s ease-in-out infinite',
          background: 'rgba(255,50,50,0.08)',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ─── Fighter Card v2 — más grande y épica ──────────────────────────────────────
interface FighterCardProps {
  unit: BattleUnit;
  side: 'player' | 'opponent';
  isActive: boolean;
  isAnimating: boolean;
  isDropTarget: boolean;
  isDraggingFrom: boolean;
  isBeingHit: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerEnter?: () => void;
  dropRef?: React.RefObject<HTMLDivElement | null>;
}

// ─── Responsive card sizing ────────────────────────────────────────────────────
function useCardSize() {
  const [w, setW] = useState(() => typeof window !== 'undefined' ? window.innerWidth : 1024);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler, { passive: true });
    return () => window.removeEventListener('resize', handler);
  }, []);
  if (w <= 380) return { width: 118, minHeight: 162, imgH: 90,  iconFz: 34, bodyPad: '6px 7px 8px', nameFz: 9,  statFz: 10, hpFz: 8  };
  if (w <= 480) return { width: 138, minHeight: 188, imgH: 108, iconFz: 40, bodyPad: '7px 8px 9px', nameFz: 10, statFz: 11, hpFz: 9  };
  return         { width: 170, minHeight: 230, imgH: 145, iconFz: 52, bodyPad: '8px 10px 10px', nameFz: 11, statFz: 11, hpFz: 9 };
}

function FighterCard({
  unit, side, isActive, isAnimating, isDropTarget, isDraggingFrom, isBeingHit,
  onPointerDown, onPointerEnter, dropRef,
}: FighterCardProps) {
  const rarColor = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const rarGlow  = RARITY_GLOW[unit.rarity]  ?? 'rgba(139,139,158,0.3)';
  const zone     = FACTION_ZONE[unit.faction] ?? FACTION_ZONE['default'];
  const isPlayer = side === 'player';
  const hpPct    = unit.max_hp > 0 ? unit.hp / unit.max_hp : 1;
  const cs       = useCardSize();

  const cardStyle: CSSProperties = {
    position: 'relative',
    width: cs.width, minHeight: cs.minHeight,
    borderRadius: 12,
    border: `2px solid ${isDropTarget ? '#e8b84b' : isActive ? rarColor : rarColor + '55'}`,
    background: unit.image_url
      ? `linear-gradient(180deg, transparent 0%, rgba(5,5,14,0.85) 65%), url(${unit.image_url}) center/cover no-repeat`
      : `linear-gradient(160deg, ${rarColor}22 0%, rgba(5,5,14,0.97) 60%), ${zone.gradient}`,
    boxShadow: isDropTarget
      ? `0 0 30px rgba(232,184,75,0.8), 0 0 60px rgba(232,184,75,0.4), inset 0 0 20px rgba(232,184,75,0.1)`
      : isBeingHit
        ? `0 0 40px rgba(255,50,50,0.9), 0 0 80px rgba(255,50,50,0.5)`
        : isActive
          ? `0 0 24px ${rarGlow}, 0 0 48px ${rarColor}44, inset 0 0 12px ${rarColor}11`
          : `0 4px 20px rgba(0,0,0,0.7)`,
    cursor: isPlayer ? (isDraggingFrom ? 'grabbing' : 'grab') : 'default',
    userSelect: 'none',
    // animation-driven states; fallback transform for drag only
    transform: isDraggingFrom ? 'scale(1.08) translateY(-8px) rotate(-2deg)' : undefined,
    transition: isDraggingFrom ? 'none'
      : (!isBeingHit && !(isAnimating && isActive))
        ? 'box-shadow 0.25s ease, border-color 0.2s'
        : 'box-shadow 0.08s ease',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    touchAction: 'none',
    animation: isBeingHit
      ? 'card-hit-shake 0.35s ease forwards'
      : (isAnimating && isActive)
        ? (isPlayer ? 'unit-attack-lunge-up 0.42s cubic-bezier(0.22,1,0.36,1) forwards' : 'unit-attack-lunge-down 0.42s cubic-bezier(0.22,1,0.36,1) forwards')
        : undefined,
  };

  const rarityAuraClass =
    unit.rarity === 'Mythic'    ? 'card-mythic-aura' :
    unit.rarity === 'Legendary' ? 'card-legendary-aura' : undefined;

  return (
    <div
      ref={dropRef as React.RefObject<HTMLDivElement>}
      style={cardStyle}
      className={[
        isPlayer && isActive && !isDraggingFrom ? 'drag-ready' : undefined,
        rarityAuraClass,
      ].filter(Boolean).join(' ') || undefined}
      onPointerDown={isPlayer ? onPointerDown : undefined}
      onPointerEnter={onPointerEnter}
    >
      {/* Image zone — taller cuando hay imagen */}
      <div style={{ height: unit.image_url ? cs.imgH : Math.round(cs.imgH * 0.69), position: 'relative', overflow: 'hidden',
        background: !unit.image_url ? `radial-gradient(ellipse at center, ${rarColor}20, transparent 70%)` : undefined }}>
        {!unit.image_url && (
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: cs.iconFz,
            filter: `drop-shadow(0 0 16px ${rarColor}aa)`,
            animation: 'card-icon-breathe 3s ease-in-out infinite',
          }}>
            {FACTION_ICON[unit.faction] ?? '⚔️'}
          </div>
        )}
        {/* Rarity shimmer overlay for Rare+ */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic' || unit.rarity === 'Founder') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg, transparent 25%, ${rarColor}44 45%, rgba(255,255,255,0.15) 50%, ${rarColor}22 55%, transparent 75%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 2.2s ease-in-out infinite',
          }} />
        )}
        {/* Epic rarity corner badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: 8, fontWeight: 800,
          color: rarColor, background: `rgba(0,0,0,0.85)`,
          border: `1px solid ${rarColor}66`, borderRadius: 4,
          padding: '2px 5px', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.1em',
          backdropFilter: 'blur(4px)',
          boxShadow: `0 0 6px ${rarColor}55`,
        }}>
          {unit.rarity.toUpperCase()}
        </div>
        {/* Faction badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6, fontSize: 14,
          filter: `drop-shadow(0 0 6px ${zone.primary}aa)`,
        }}>
          {FACTION_ICON[unit.faction] ?? '⚔️'}
        </div>
      </div>

      {/* Card body */}
      <div style={{
        padding: cs.bodyPad, flex: 1,
        display: 'flex', flexDirection: 'column', gap: 4,
        background: 'linear-gradient(0deg, rgba(3,3,12,0.97) 0%, rgba(8,8,22,0.88) 100%)',
        borderTop: `1px solid ${rarColor}33`,
      }}>
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: cs.nameFz, fontWeight: 700,
          color: '#eee', letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${rarColor}55`,
        }}>
          {unit.name}
        </div>
        {/* Stats row */}
        <div style={{ display: 'flex', gap: 6, fontSize: cs.statFz, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800 }}>
          <span title="ATK" style={{ color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 2 }}>⚔ {unit.atk}</span>
          <span title="DEF" style={{ color: '#4a9eff', display: 'flex', alignItems: 'center', gap: 2 }}>🛡 {unit.def}</span>
          <span title="SPD" style={{ color: '#e8b84b', display: 'flex', alignItems: 'center', gap: 2 }}>⚡ {unit.spd}</span>
        </div>
        {/* HP bar */}
        <EpicHpBar hp={unit.hp} max={unit.max_hp} color={rarColor} />
        <div style={{
          fontSize: 9, color: HP_COLOR(hpPct), fontFamily: '"IBM Plex Mono",monospace',
          letterSpacing: '0.05em', textAlign: 'center',
          textShadow: `0 0 6px ${HP_COLOR(hpPct)}66`,
        }}>
          {unit.hp} / {unit.max_hp} HP
        </div>
        {/* Keywords */}
        {unit.keywords && unit.keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginTop: 2 }}>
            {unit.keywords.slice(0, 3).map(k => <KeywordChip key={k} keyword={k} />)}
          </div>
        )}
      </div>

      {/* Drop target overlay */}
      {isDropTarget && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: 'rgba(232,184,75,0.1)',
          border: '2px dashed rgba(232,184,75,0.8)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, pointerEvents: 'none',
          animation: 'target-pulse 0.6s ease-in-out infinite',
        }}>
          🎯
        </div>
      )}
    </div>
  );
}

// ─── Turn Log Entry ─────────────────────────────────────────────────────────────
function TurnLogEntry({ snap, isLatest }: { snap: TurnSnapshot; isLatest: boolean }) {
  const t = snap.data;
  const col = t.atk_side === 'a' ? '#4a9eff' : '#e74c3c';
  return (
    <div style={{
      padding: '5px 10px', borderRadius: 6,
      background: isLatest ? 'rgba(255,255,255,0.04)' : 'transparent',
      border: `1px solid ${isLatest ? col + '33' : 'transparent'}`,
      fontSize: 11, fontFamily: '"Rajdhani",sans-serif',
      animation: isLatest ? 'log-slide-in 0.3s ease' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: '#4a4a6a', minWidth: 28, fontFamily: '"IBM Plex Mono",monospace', fontSize: 9 }}>T{t.turn}</span>
        <span style={{ color: col, fontWeight: 700 }}>{t.attacker?.name ?? '?'}</span>
        <span style={{ color: '#3a3a5a' }}>→</span>
        <span style={{ color: '#8891a0' }}>{t.defender?.name ?? '?'}</span>
        <span style={{ color: t.is_crit ? '#e8b84b' : '#e74c3c', fontWeight: t.is_crit ? 800 : 400 }}>
          {t.is_crit ? '💥' : '⚔️'} {t.damage}
          {t.is_crit && <span style={{ fontSize: 9, color: '#e8b84b', marginLeft: 3 }}>CRIT!</span>}
        </span>
        {t.is_kill && <span style={{ fontSize: 9, color: '#ff4444', background: 'rgba(255,68,68,0.12)', borderRadius: 3, padding: '1px 4px' }}>☠ BAJA</span>}
        {t.lifesteal_heal > 0 && <span style={{ fontSize: 9, color: '#a855f7' }}>+{t.lifesteal_heal}♻</span>}
      </div>
    </div>
  );
}

// ─── Phase-based Attack Button ──────────────────────────────────────────────────
function AttackButton({ phase, onAdvance, onAutoPlay, onStop, isAutoOn, totalTurns, turnIdx, faction }: {
  phase: TurnPhase; onAdvance: () => void; onAutoPlay: () => void; onStop: () => void;
  isAutoOn: boolean; totalTurns: number; turnIdx: number; faction: string;
}) {
  if (phase === 'COMPLETE') return null;
  const remaining = totalTurns - turnIdx;
  const zone = FACTION_ZONE[faction] ?? FACTION_ZONE['default'];
  const isReady = phase === 'IDLE' && !isAutoOn;

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <button
        onClick={() => { AudioEngine.sfxCardSelect?.(); onAdvance(); }}
        disabled={!isReady}
        style={{
          padding: '11px 26px', borderRadius: 10,
          background: isReady
            ? `linear-gradient(135deg, ${zone.primary}, ${zone.primary}88)`
            : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isReady ? zone.primary + '88' : 'rgba(255,255,255,0.08)'}`,
          color: isReady ? '#fff' : '#4a4a6a',
          fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 13,
          cursor: isReady ? 'pointer' : 'not-allowed',
          letterSpacing: '0.06em',
          boxShadow: isReady ? `0 4px 20px ${zone.glow}, 0 0 0 1px ${zone.primary}33` : 'none',
          transition: 'all 0.2s ease',
          animation: isReady ? 'attack-btn-pulse 2s ease-in-out infinite' : 'none',
          minWidth: 'min(120px, 45vw)',
        }}
      >
        {phase === 'ANIMATING' ? '⚔ Resolviendo…' : `⚔ ATACAR (${remaining})`}
      </button>
      {isAutoOn ? (
        <button onClick={onStop} style={{
          padding: '9px 14px', borderRadius: 8,
          background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.4)',
          color: '#e8b84b', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
          cursor: 'pointer',
        }}>⏸ Pausar</button>
      ) : (
        <button onClick={() => { AudioEngine.sfxCardSelect?.(); onAutoPlay(); }}
          disabled={phase === 'ANIMATING'}
          style={{
            padding: '9px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
            cursor: phase === 'ANIMATING' ? 'not-allowed' : 'pointer',
          }}>▶ Auto</button>
      )}
    </div>
  );
}

// ─── Result Banner épico ────────────────────────────────────────────────────────
function ResultBanner({ won, eloChange, onDismiss }: {
  won: boolean; eloChange: number; onDismiss: () => void;
}) {
  const [showElo, setShowElo] = useState(false);
  const [eloVal, setEloVal] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setShowElo(true), 400);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    if (!showElo || eloChange === 0) { setEloVal(eloChange); return; }
    const start = performance.now();
    const animate = (now: number) => {
      const p = Math.min((now - start) / 700, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setEloVal(Math.round(eloChange * e));
      if (p < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [showElo, eloChange]);

  const col = won ? '#e8b84b' : '#e74c3c';
  const glow = won ? 'rgba(232,184,75,0.7)' : 'rgba(231,76,60,0.5)';

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: won
        ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,184,75,0.2) 0%, rgba(4,4,12,0.96) 65%)'
        : 'radial-gradient(ellipse 80% 60% at 50% 100%, rgba(192,57,43,0.25) 0%, rgba(4,4,12,0.96) 65%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 14, zIndex: 50,
      borderRadius: 12,
      animation: 'result-fade-in 0.5s cubic-bezier(0.22,1,0.36,1)',
      backdropFilter: 'blur(8px)',
    }}>
      <div style={{
        fontSize: 72, lineHeight: 1,
        filter: `drop-shadow(0 0 40px ${glow}) drop-shadow(0 0 80px ${glow})`,
        animation: 'result-icon-bounce 0.6s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {won ? '🏆' : '💀'}
      </div>
      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 'clamp(32px,6vw,48px)', fontWeight: 900,
        color: col,
        textShadow: `0 0 40px ${glow}, 0 0 80px ${glow}`,
        letterSpacing: '0.2em', animation: 'result-label-slide 0.5s 0.1s ease both',
      }}>
        {won ? 'VICTORIA' : 'DERROTA'}
      </div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, width: 220,
        margin: '0 0 4px',
      }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${col}55)` }} />
        <span style={{ color: col, opacity: 0.5, fontSize: 10 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${col}55, transparent)` }} />
      </div>
      {showElo && eloChange !== 0 && (
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: 22, fontWeight: 900,
          color: eloChange > 0 ? '#3ddc84' : '#e74c3c',
          textShadow: eloChange > 0 ? '0 0 20px rgba(61,220,132,0.7)' : '0 0 20px rgba(231,76,60,0.7)',
          animation: 'result-elo-pop 0.4s ease',
        }}>
          {eloChange > 0 ? '+' : ''}{eloVal} MMR
        </div>
      )}
      <button onClick={onDismiss} style={{
        marginTop: 8, padding: '13px 36px', borderRadius: 12,
        background: won
          ? 'linear-gradient(135deg,#e8b84b,#c9901f)'
          : 'linear-gradient(135deg,#c0392b,#8e1a0e)',
        border: 'none',
        color: won ? '#0a0a12' : '#fff',
        fontFamily: '"Cinzel",serif', fontWeight: 800, fontSize: 14,
        cursor: 'pointer', letterSpacing: '0.1em',
        boxShadow: `0 6px 24px ${glow}, 0 2px 8px rgba(0,0,0,0.6)`,
        transition: 'all 0.2s ease',
        animation: 'result-btn-appear 0.4s 0.4s ease both',
        opacity: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.03)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}>
        {won ? '⚔ Continuar' : '↩ Reintentar'}
      </button>
    </div>
  );
}

// ─── Partículas atmosféricas de la arena ────────────────────────────────────────
function ArenaParticles({ faction }: { faction: string }) {
  const zone = FACTION_ZONE[faction] ?? FACTION_ZONE['default'];
  const runes = ['✦', '◈', '⬡', '✧', '◆', '⊕'];
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {runes.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${(i * 17 + 7) % 90 + 5}%`,
          bottom: `${(i * 11 + 5) % 40 + 10}%`,
          color: zone.primary,
          fontSize: `${(i % 3) * 4 + 8}px`,
          opacity: 0.08 + (i % 3) * 0.06,
          animation: `arena-rune-float-${i % 3} ${(i % 3) * 1.5 + 4}s ease-in-out infinite`,
          animationDelay: `${i * 0.6}s`,
          filter: `drop-shadow(0 0 4px ${zone.primary}55)`,
        }}>{r}</div>
      ))}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────────────────────────────
export interface InteractiveBattleBoardProps {
  result: RealBattleResult;
  playerName?: string;
  opponentName?: string;
  onDismiss: () => void;
}

export function InteractiveBattleBoard({
  result, playerName = 'Tú', opponentName = 'Rival', onDismiss,
}: InteractiveBattleBoardProps) {
  const [state, actions] = useBattleStateMachine(result);
  const [beamVisible, setBeamVisible] = useState(false);
  const [hitSide, setHitSide] = useState<'player' | 'opponent' | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const dragRef     = useRef({ active: false, startX: 0, startY: 0 });
  
  // FASE 2: Card Attack Cinematic state
  const [attackingUnit, setAttackingUnit] = useState<BattleUnit | null>(null);
  const [cinematicVisible, setCinematicVisible] = useState(false);

  const finalUnits = result.final_units ?? [];
  const playerUnit   = finalUnits.find(u => u.side === 'a' && u.alive) ?? finalUnits.find(u => u.side === 'a');
  const opponentUnit = finalUnits.find(u => u.side === 'b' && u.alive) ?? finalUnits.find(u => u.side === 'b');
  const playerFaction = playerUnit?.faction ?? 'default';
  const oppFaction    = opponentUnit?.faction ?? 'default';
  const playerZone    = FACTION_ZONE[playerFaction] ?? FACTION_ZONE['default'];
  const oppZone       = FACTION_ZONE[oppFaction] ?? FACTION_ZONE['default'];

  // Beam + flash + hit effects when animating + FASE 2: cinematic trigger
  useEffect(() => {
    if (state.phase === 'ANIMATING' && state.currentTurn) {
      const isPlayerAtk = state.currentTurn.atk_side === 'a';
      
      // FASE 2: Trigger cinematic for Rare+ attacker
      const attackerUnit = isPlayerAtk ? playerUnit : opponentUnit;
      // FASE 2 v4: Cinematic para TODAS las rarezas — Common/Uncommon = flash rápido
      if (attackerUnit) {
        setAttackingUnit(attackerUnit);
        setCinematicVisible(true);
      }
      
      setBeamVisible(true);
      const t1 = setTimeout(() => {
        setBeamVisible(false);
        setScreenFlash(true);
        setHitSide(isPlayerAtk ? 'opponent' : 'player');
        setTimeout(() => { setScreenFlash(false); setHitSide(null); }, 280);
      }, 260);
      return () => clearTimeout(t1);
    }
    return undefined;
  }, [state.phase, state.currentTurn, playerUnit, opponentUnit]);

  const isPlayerAttacking = state.currentTurn?.atk_side === 'a';

  // Drag-to-attack handlers
  const onPointerDown = useCallback((e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startY: e.clientY };
    actions.startDrag();
    AudioEngine.sfxCardHover?.();
  }, [actions]);

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overDrop = dropZoneRef.current?.contains(el as Node) ?? false;
    if (overDrop) {
      AudioEngine.sfxCardSelect?.();
      actions.endDrag(true);
    } else {
      actions.endDrag(false);
    }
  }, [actions]);

  // Cancel drag if pointer leaves the window (prevents "sticky" card bug)
  const onPointerCancel = useCallback(() => {
    if (!dragRef.current.active) return;
    dragRef.current.active = false;
    actions.endDrag(false);
  }, [actions]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'radial-gradient(ellipse at 50% 0%, #0f0820 0%, #060610 55%, #030308 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Rajdhani",sans-serif',
      overflow: 'hidden',
    }} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel} onPointerLeave={onPointerCancel}>

      {/* Faction arena background image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: `url(${playerZone.arenaImg})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: 0.18,
        filter: 'saturate(1.4) brightness(0.7)',
      }} />
      {/* Dark overlay on top of arena image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 130% 130% at 50% 50%, rgba(5,5,18,0.55) 0%, rgba(3,3,10,0.92) 100%)',
      }} />
      {/* Atmospheric scan lines — cinematic feel */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.012) 0px, rgba(255,255,255,0.012) 1px, transparent 1px, transparent 3px)',
        backgroundSize: '100% 3px',
      }} />
      {/* Corner vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 55%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* FASE 2: Card Attack Cinematic Overlay */}
      <CardAttackCinematic 
        unit={attackingUnit} 
        visible={cinematicVisible} 
        onDone={() => setCinematicVisible(false)} 
      />

      {/* Keyframes */}
      <style>{`
        @keyframes card-shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes card-icon-breathe {
          0%,100% { transform: scale(1) rotate(-2deg); filter: drop-shadow(0 0 12px currentColor); }
          50%      { transform: scale(1.1) rotate(2deg); filter: drop-shadow(0 0 24px currentColor); }
        }
        @keyframes hp-critical-pulse {
          0%,100% { opacity: 0; }
          50%      { opacity: 1; }
        }
        @keyframes card-hit-shake {
          0%,100% { transform: translateX(0); }
          20%     { transform: translateX(-10px) rotate(-1.5deg); }
          40%     { transform: translateX(10px) rotate(1.5deg); }
          60%     { transform: translateX(-6px); }
          80%     { transform: translateX(6px); }
        }
        @keyframes target-pulse {
          0%,100% { border-color: rgba(232,184,75,0.8); box-shadow: 0 0 20px rgba(232,184,75,0.5); }
          50%      { border-color: rgba(232,184,75,0.4); box-shadow: 0 0 40px rgba(232,184,75,0.8); }
        }
        @keyframes attack-beam-shoot {
          0%   { opacity: 0; transform: scaleX(0) translateX(-50%); }
          30%  { opacity: 1; transform: scaleX(0.7) translateX(-50%); }
          70%  { opacity: 1; transform: scaleX(1) translateX(-50%); }
          100% { opacity: 0; transform: scaleX(1.05) translateX(-50%); }
        }
        @keyframes screen-flash {
          0%   { opacity: 0; }
          15%  { opacity: 0.3; }
          100% { opacity: 0; }
        }
        @keyframes attack-btn-pulse {
          0%,100% { box-shadow: 0 4px 20px var(--btn-glow, rgba(232,184,75,0.4)); }
          50%      { box-shadow: 0 4px 30px var(--btn-glow, rgba(232,184,75,0.7)), 0 0 60px var(--btn-glow, rgba(232,184,75,0.2)); }
        }
        @keyframes center-beam-pulse {
          0%,100% { opacity: 0.35; }
          50%      { opacity: 0.65; }
        }
        @keyframes log-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes arena-rune-float-0 {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.08; }
          50%      { transform: translateY(-24px) rotate(15deg); opacity: 0.2; }
        }
        @keyframes arena-rune-float-1 {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.06; }
          50%      { transform: translateY(-18px) rotate(-10deg); opacity: 0.14; }
        }
        @keyframes arena-rune-float-2 {
          0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.1; }
          50%      { transform: translateY(-30px) rotate(20deg); opacity: 0.22; }
        }
        @keyframes result-fade-in {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to   { opacity: 1; backdrop-filter: blur(8px); }
        }
        @keyframes result-icon-bounce {
          0%   { transform: scale(0.2) translateY(-20px); opacity: 0; }
          60%  { transform: scale(1.18); opacity: 1; }
          80%  { transform: scale(0.96); }
          100% { transform: scale(1); }
        }
        @keyframes result-label-slide {
          from { opacity: 0; transform: scaleX(1.4) translateY(-6px); }
          to   { opacity: 1; transform: scaleX(1) translateY(0); }
        }
        @keyframes result-elo-pop {
          from { opacity: 0; transform: scale(0.5) translateY(10px); }
          60%  { transform: scale(1.1); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes result-btn-appear {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes turn-counter-flash {
          0%,100% { color: #e8b84b66; }
          50%      { color: #e8b84bcc; text-shadow: 0 0 16px rgba(232,184,75,0.6); }
        }
        @keyframes vs-energy-pulse {
          0%,100% { box-shadow: 0 0 8px #e8b84b44, 0 0 24px #e8b84b22; opacity: 0.5; }
          50%      { box-shadow: 0 0 16px #e8b84b88, 0 0 48px #e8b84b33; opacity: 0.9; }
        }
      `}</style>

      {/* Screen flash on hit — enhanced */}
      {screenFlash && (
        <>
          {/* Full-screen color wash */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 200, pointerEvents: 'none',
            background: hitSide === 'opponent'
              ? `radial-gradient(ellipse 80% 60% at 50% 25%, rgba(255,80,30,0.45) 0%, rgba(255,80,30,0.15) 50%, transparent 100%)`
              : `radial-gradient(ellipse 80% 60% at 50% 75%, rgba(80,120,255,0.4) 0%, rgba(80,120,255,0.12) 50%, transparent 100%)`,
            animation: 'screen-flash 0.35s ease forwards',
          }} />
          {/* White edge burst */}
          <div style={{
            position: 'absolute', inset: 0, zIndex: 201, pointerEvents: 'none',
            boxShadow: hitSide === 'opponent'
              ? 'inset 0 0 60px rgba(255,140,50,0.6)'
              : 'inset 0 0 60px rgba(100,140,255,0.5)',
            borderRadius: 0,
            animation: 'screen-flash 0.3s ease forwards',
          }} />
        </>
      )}

      {/* ─── Header: HP bars + names ─────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px 6px',
        background: 'linear-gradient(180deg, rgba(5,5,18,0.99) 0%, rgba(5,5,18,0.95) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        flexShrink: 0, zIndex: 10,
        boxShadow: '0 2px 20px rgba(0,0,0,0.8)',
        gap: 16,
      }}>
        {/* Player HP */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Cinzel",serif', fontSize: 11, color: playerZone.primary,
            letterSpacing: '0.08em', marginBottom: 4,
            textShadow: `0 0 8px ${playerZone.primary}55`,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{playerName}</div>
          <EpicHpBar hp={state.playerHp} max={state.playerMaxHp} color={playerZone.primary} />
          <div style={{ fontSize: 9, color: playerZone.primary + 'aa', marginTop: 3,
            fontFamily: '"IBM Plex Mono",monospace' }}>
            {state.playerHp} / {state.playerMaxHp} HP
          </div>
        </div>

        {/* Turn counter */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontFamily: '"IBM Plex Mono",monospace', fontSize: 10,
            animation: 'turn-counter-flash 2s ease-in-out infinite',
            letterSpacing: '0.08em',
          }}>
            T {state.revealedTurns.length} / {state.totalTurns}
          </div>
          <div style={{
            fontSize: 8, color: state.phase === 'ANIMATING' ? '#e8b84b' : state.phase === 'COMPLETE' ? '#3ddc84' : '#5a5a7a',
            fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.12em',
            textTransform: 'uppercase', transition: 'color 0.3s',
            marginTop: 2,
          }}>
            {state.phase === 'IDLE'      && '▶ LISTO'}
            {state.phase === 'SELECTING' && '🎯 APUNTAR'}
            {state.phase === 'ANIMATING' && '⚔️ RESOLVIENDO'}
            {state.phase === 'COMPLETE'  && '✓ FIN'}
          </div>
        </div>

        {/* Opponent HP */}
        <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
          <div style={{
            fontFamily: '"Cinzel",serif', fontSize: 11, color: oppZone.primary,
            letterSpacing: '0.08em', marginBottom: 4,
            textShadow: `0 0 8px ${oppZone.primary}55`,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{opponentName}</div>
          <EpicHpBar hp={state.opponentHp} max={state.opponentMaxHp} color={oppZone.primary} />
          <div style={{ fontSize: 9, color: oppZone.primary + 'aa', marginTop: 3,
            fontFamily: '"IBM Plex Mono",monospace', textAlign: 'right' }}>
            {state.opponentHp} / {state.opponentMaxHp} HP
          </div>
        </div>
      </div>

      {/* ─── Battle Field ──────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '16px 20px', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Hex grid background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='48'%3E%3Cpolygon points='14,2 26,9 26,23 14,30 2,23 2,9' fill='none' stroke='rgba(255,255,255,0.035)' stroke-width='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: '28px 48px',
          opacity: 0.7,
        }} />
        {/* Center dividing line — lane separator */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%',
          height: 1, zIndex: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent 0%, rgba(232,184,75,0.15) 20%, rgba(232,184,75,0.3) 50%, rgba(232,184,75,0.15) 80%, transparent 100%)',
          transform: 'translateY(-50%)',
        }} />

        {/* Opponent zone glow */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: '50%',
          background: oppZone.gradient, zIndex: 0, pointerEvents: 'none',
          opacity: 0.8,
        }} />
        {/* Player zone glow */}
        <div style={{
          position: 'absolute', top: '50%', left: 0, right: 0, bottom: 0,
          background: playerZone.gradient, zIndex: 0, pointerEvents: 'none',
          opacity: 0.8,
        }} />
        {/* Ambient radial for each side */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: [
            `radial-gradient(ellipse 70% 30% at 50% 15%, ${oppZone.glow} 0%, transparent 100%)`,
            `radial-gradient(ellipse 70% 30% at 50% 85%, ${playerZone.glow} 0%, transparent 100%)`,
          ].join(','),
        }} />
        {/* Atmospheric particles */}
        <ArenaParticles faction={playerFaction} />

        {/* Attack flash overlay on the whole arena */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: state.phase === 'ANIMATING'
            ? `radial-gradient(ellipse at center, rgba(232,184,75,0.08) 0%, transparent 70%)`
            : 'transparent',
          transition: 'background 0.3s',
        }} />

        {/* Opponent zone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <div style={{
            fontSize: 9, color: oppZone.primary + 'cc', letterSpacing: '0.2em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
            background: `rgba(0,0,0,0.5)`, border: `1px solid ${oppZone.primary}33`,
            borderRadius: 20, padding: '3px 14px',
            boxShadow: `0 0 8px ${oppZone.primary}22`,
            backdropFilter: 'blur(4px)',
          }}>
            ⚔ {opponentName} · {oppFaction}
          </div>
          {opponentUnit ? (
            <FighterCard
              unit={opponentUnit}
              side="opponent"
              isActive={!isPlayerAttacking && state.phase === 'ANIMATING'}
              isAnimating={state.phase === 'ANIMATING'}
              isDropTarget={state.isDragging}
              isDraggingFrom={false}
              isBeingHit={hitSide === 'opponent'}
              dropRef={dropZoneRef}
            />
          ) : (
            <div ref={dropZoneRef as React.RefObject<HTMLDivElement>}
              style={{ width: 170, height: 188, border: `2px dashed ${oppZone.primary}30`, borderRadius: 12,
              background: `${oppZone.primary}05`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `${oppZone.primary}30`, fontSize: 36 }}>
              💀
            </div>
          )}
        </div>

        {/* VS + Energy Beam center divider */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 20, width: '100%', maxWidth: 600, zIndex: 1 }}>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${oppZone.primary}66)` }} />
          {/* Center VS orb */}
          <div style={{
            position: 'relative',
            fontFamily: '"Cinzel Decorative",serif', fontSize: 22, fontWeight: 900,
            background: 'linear-gradient(135deg, #e74c3c, #e8b84b, #4a9eff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.15em',
            filter: state.phase === 'ANIMATING' ? 'drop-shadow(0 0 12px rgba(232,184,75,0.9))' : 'drop-shadow(0 0 4px rgba(232,184,75,0.4))',
            transition: 'filter 0.3s',
          }}>VS</div>
          <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${playerZone.primary}66, transparent)` }} />

          {/* Attack beam — visible during ANIMATING */}
          {beamVisible && (
            <>
              {/* Main attack beam — thick + glowing */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: '75%', height: 5,
                transform: 'translateX(-50%) translateY(-50%)',
                background: isPlayerAttacking
                  ? `linear-gradient(90deg, transparent, ${playerZone.primary}, #fff 50%, ${oppZone.primary}bb, transparent)`
                  : `linear-gradient(90deg, transparent, ${oppZone.primary}, #fff 50%, ${playerZone.primary}bb, transparent)`,
                borderRadius: 3,
                boxShadow: isPlayerAttacking
                  ? `0 0 20px ${playerZone.primary}, 0 0 50px ${playerZone.primary}88, 0 0 80px ${playerZone.primary}44`
                  : `0 0 20px ${oppZone.primary}, 0 0 50px ${oppZone.primary}88, 0 0 80px ${oppZone.primary}44`,
                animation: 'attack-beam-shoot 0.28s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 10,
              }} />
              {/* Soft glow halo behind beam */}
              <div style={{
                position: 'absolute', left: '50%', top: '50%',
                width: '65%', height: 18,
                transform: 'translateX(-50%) translateY(-50%)',
                background: isPlayerAttacking
                  ? `radial-gradient(ellipse at center, ${playerZone.primary}44 0%, transparent 70%)`
                  : `radial-gradient(ellipse at center, ${oppZone.primary}44 0%, transparent 70%)`,
                animation: 'attack-beam-shoot 0.28s ease-out forwards',
                pointerEvents: 'none',
                zIndex: 9,
              }} />
            </>
          )}
        </div>

        {/* Player zone */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
          {playerUnit ? (
            <FighterCard
              unit={playerUnit}
              side="player"
              isActive={isPlayerAttacking && state.phase === 'ANIMATING'}
              isAnimating={state.phase === 'ANIMATING'}
              isDropTarget={false}
              isDraggingFrom={state.isDragging}
              isBeingHit={hitSide === 'player'}
              onPointerDown={onPointerDown}
              onPointerEnter={() => { if (!state.isDragging) AudioEngine.sfxCardHover?.(); }}
            />
          ) : (
            <div style={{ width: 170, height: 188, border: `2px dashed ${playerZone.primary}30`, borderRadius: 12,
              background: `${playerZone.primary}05`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `${playerZone.primary}30`, fontSize: 36 }}>⚔️</div>
          )}
          <div style={{
            fontSize: 9, color: playerZone.primary + 'cc', letterSpacing: '0.2em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.5)', border: `1px solid ${playerZone.primary}33`,
            borderRadius: 20, padding: '3px 14px',
            boxShadow: `0 0 8px ${playerZone.primary}22`,
            backdropFilter: 'blur(4px)',
          }}>
            🛡 {playerName} · {playerFaction}
          </div>
        </div>

        {/* Drag hint */}
        {state.phase === 'IDLE' && !state.isAutoPlaying && (
          <div style={{
            position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
            fontSize: 9, color: '#4a4a6a',
            fontFamily: '"Rajdhani",sans-serif',
            letterSpacing: '0.12em', whiteSpace: 'nowrap',
            animation: 'turn-counter-flash 2.5s ease-in-out infinite',
          }}>
            Arrastra tu carta hacia el rival o presiona ATACAR
          </div>
        )}

        {/* Result overlay */}
        {state.won !== null && (
          <ResultBanner
            won={state.won}
            eloChange={state.eloChange}
            onDismiss={onDismiss}
          />
        )}
      </div>

      {/* ─── Controls ────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(4,4,12,0.99)',
        borderTop: '1px solid #141428',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, gap: 8, flexWrap: 'wrap',
      }}>
        <AttackButton
          phase={state.phase}
          onAdvance={actions.advance}
          onAutoPlay={() => actions.autoPlay(850)}
          onStop={actions.stopAutoPlay}
          isAutoOn={state.isAutoPlaying}
          totalTurns={state.totalTurns}
          turnIdx={state.turnIdx}
          faction={playerFaction}
        />
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, color: '#6a6a8a', fontSize: 10,
          padding: '6px 12px', cursor: 'pointer',
          fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.06em',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#a0a0c0'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#6a6a8a'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
        >✕ Salir</button>
      </div>

      {/* ─── Turn Log ────────────────────────────────────────────────────── */}
      <div style={{
        maxHeight: 140, overflowY: 'auto',
        background: 'rgba(3,3,10,0.99)',
        borderTop: '1px solid rgba(232,184,75,0.12)',
        padding: '5px 8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 8, color: '#e8b84b88', letterSpacing: '0.18em',
          fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
          padding: '2px 4px', marginBottom: 1 }}>
          ▶ LOG DE BATALLA
        </div>
        {state.revealedTurns.length === 0 ? (
          <div style={{ fontSize: 10, color: '#4a4a6a', padding: '3px 6px',
            fontFamily: '"Rajdhani",sans-serif' }}>
            La batalla aún no ha comenzado. ¡Ataca!
          </div>
        ) : (
          [...state.revealedTurns].reverse().slice(0, 8).map((snap, i) => (
            <TurnLogEntry key={snap.idx} snap={snap} isLatest={i === 0} />
          ))
        )}
      </div>
    </div>
  );
}
