// VexForge InteractiveBattleBoard v1.0 — EPICA Q.4 (chat76)
// Interactive turn-by-turn battle board with drag-to-attack, keyword tooltips,
// and a player-controlled state machine. Replaces the cinematic auto-player
// as the default battle experience.
//
// Architecture:
//   useBattleStateMachine → manages turn order + phase transitions
//   KeywordChip / KeywordTooltip → hover tooltips for every keyword
//   Drag-to-attack: pointer events on player card → drop zone on opponent side
//   AudioEngine: sfxCardHover, sfxCardSelect, sfxBattleHit per action (T.2)

import { useRef, useCallback, type CSSProperties } from 'react';
import type { RealBattleResult, BattleTurnData, BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { useBattleStateMachine, type TurnPhase, type TurnSnapshot } from '../../lib/battleStateMachine';
import { KeywordChip } from './KeywordTooltip';
import { AudioEngine } from '../../lib/audioEngine';

// ─── Constants ────────────────────────────────────────────────────────────────
const HP_COLOR = (pct: number) =>
  pct > 0.55 ? '#3ddc84' : pct > 0.25 ? '#f39c12' : '#e74c3c';

const FACTION_BORDER: Record<string, string> = {
  Guerrero:    '#c0392b',
  Mago:        '#8e44ad',
  'Pícaro':    '#27ae60',
  'Paladín':   '#f39c12',
  // Legacy aliases
  Explorador:  '#27ae60',
  Comerciante: '#f39c12',
};

// ─── HP Bar ───────────────────────────────────────────────────────────────────
function HpBar({ hp, max, compact }: { hp: number; max: number; compact?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const col  = HP_COLOR(pct);
  return (
    <div style={{ height: compact ? 4 : 6, background: '#0a0a1a', borderRadius: 3, overflow: 'hidden' }}>
      <div style={{
        height: '100%', width: `${pct * 100}%`,
        background: col, boxShadow: `0 0 6px ${col}88`,
        transition: 'width 0.4s ease, background 0.4s',
      }} />
    </div>
  );
}

// ─── Fighter Card (draggable for player, static for opponent) ─────────────────
interface FighterCardProps {
  unit: BattleUnit;
  side: 'player' | 'opponent';
  isActive: boolean;
  isAnimating: boolean;
  isDropTarget: boolean;
  isDraggingFrom: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerEnter?: () => void;
  dropRef?: React.RefObject<HTMLDivElement | null>;
}

function FighterCard({
  unit, side, isActive, isAnimating, isDropTarget, isDraggingFrom,
  onPointerDown, onPointerEnter, dropRef,
}: FighterCardProps) {
  const rarColor = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const rarGlow  = RARITY_GLOW[unit.rarity]  ?? 'rgba(139,139,158,0.3)';
  const fBorder  = FACTION_BORDER[unit.faction] ?? '#2a2a4a';

  const isPlayer = side === 'player';
  const hpPct    = unit.max_hp > 0 ? unit.hp / unit.max_hp : 1;

  const cardStyle: CSSProperties = {
    position: 'relative',
    width: 128, minHeight: 165,
    borderRadius: 10,
    border: `1.5px solid ${isDropTarget ? '#e8b84b' : isActive ? rarColor : rarColor + '44'}`,
    background: `linear-gradient(160deg, ${rarColor}18 0%, rgba(5,5,14,0.97) 100%)`,
    boxShadow: isDropTarget
      ? `0 0 20px rgba(232,184,75,0.6), 0 0 8px rgba(232,184,75,0.4)`
      : isActive
        ? `0 0 18px ${rarGlow}, 0 0 6px ${rarColor}88`
        : 'none',
    cursor: isPlayer ? (isDraggingFrom ? 'grabbing' : 'grab') : 'default',
    userSelect: 'none',
    transform: isDraggingFrom
      ? 'scale(1.06) translateY(-4px)'
      : isAnimating && isActive
        ? `translateY(${isPlayer ? -8 : 8}px) scale(1.04)`
        : 'scale(1)',
    transition: isDraggingFrom ? 'none' : 'transform 0.2s ease, box-shadow 0.2s, border-color 0.2s',
    display: 'flex', flexDirection: 'column', overflow: 'hidden',
    touchAction: 'none',
  };

  return (
    <div
      ref={dropRef as React.RefObject<HTMLDivElement>}
      style={cardStyle}
      onPointerDown={isPlayer ? onPointerDown : undefined}
      onPointerEnter={onPointerEnter}
    >
      {/* Image zone */}
      <div style={{
        height: 90, background: unit.image_url
          ? `url(${unit.image_url}) center/cover no-repeat`
          : `linear-gradient(155deg, ${rarColor}30, ${fBorder}20, rgba(5,5,14,0.9) 100%)`,
        borderBottom: `1px solid ${rarColor}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 28, position: 'relative', overflow: 'hidden',
      }}>
        {!unit.image_url && (
          <span style={{ filter: `drop-shadow(0 0 8px ${rarColor}88)` }}>
            {KEYWORD_ICON[unit.faction] ?? '⚔️'}
          </span>
        )}
        {/* Rarity shimmer overlay for Rare+ */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic' || unit.rarity === 'Founder') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(135deg, transparent 30%, ${rarColor}22 50%, transparent 70%)`,
            backgroundSize: '200% 200%',
            animation: 'shimmer 2.5s ease infinite',
          }} />
        )}
      </div>

      {/* Body */}
      <div style={{ padding: '5px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: 10, fontWeight: 700,
          color: rarColor, letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {unit.name}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 5, fontSize: 10, fontFamily: '"Rajdhani",sans-serif', fontWeight: 700 }}>
          <span title="ATK" style={{ color: '#ff6b6b' }}>⚔{unit.atk}</span>
          <span title="DEF" style={{ color: '#4a9eff' }}>🛡{unit.def}</span>
          <span title="SPD" style={{ color: '#e8b84b' }}>⚡{unit.spd}</span>
        </div>

        {/* HP bar */}
        <HpBar hp={unit.hp} max={unit.max_hp} compact />
        <div style={{ fontSize: 8, color: HP_COLOR(hpPct), fontFamily: '"IBM Plex Mono",monospace' }}>
          {unit.hp}/{unit.max_hp} HP
        </div>

        {/* Keywords */}
        {unit.keywords && unit.keywords.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 2, marginTop: 2 }}>
            {unit.keywords.slice(0, 3).map(k => <KeywordChip key={k} keyword={k} />)}
          </div>
        )}
      </div>

      {/* Rarity badge */}
      <div style={{
        position: 'absolute', top: 4, right: 4,
        fontSize: 7, fontWeight: 800,
        color: rarColor, background: `${rarColor}22`,
        border: `1px solid ${rarColor}44`, borderRadius: 3,
        padding: '1px 4px', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.08em',
      }}>
        {unit.rarity.slice(0, 3).toUpperCase()}
      </div>

      {/* Drop target overlay */}
      {isDropTarget && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 10,
          background: 'rgba(232,184,75,0.12)',
          border: '2px dashed rgba(232,184,75,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22, pointerEvents: 'none',
        }}>
          🎯
        </div>
      )}
    </div>
  );
}

// ─── Turn Log Entry ────────────────────────────────────────────────────────────
function TurnLogEntry({ snap, isLatest }: { snap: TurnSnapshot; isLatest: boolean }) {
  const t = snap.data;
  const col = t.atk_side === 'a' ? '#4a9eff' : '#e74c3c';
  const atkName = t.attacker?.name ?? '?';
  const defName = t.defender?.name ?? '?';
  return (
    <div style={{
      padding: '6px 10px', borderRadius: 6,
      background: isLatest ? 'rgba(255,255,255,0.04)' : 'transparent',
      border: `1px solid ${isLatest ? col + '33' : 'transparent'}`,
      fontSize: 11, fontFamily: '"Rajdhani",sans-serif',
      transition: 'all 0.3s',
      animation: isLatest ? 'slideIn 0.3s ease' : 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        <span style={{ color: '#444', minWidth: 32, fontFamily: '"IBM Plex Mono",monospace', fontSize: 10 }}>
          T{t.turn}
        </span>
        <span style={{ color: col, fontWeight: 700 }}>{atkName}</span>
        <span style={{ color: '#555' }}>→</span>
        <span style={{ color: '#aaa' }}>{defName}</span>
        <span style={{ color: t.is_crit ? '#e8b84b' : '#e74c3c', fontWeight: t.is_crit ? 800 : 400 }}>
          {t.is_crit ? '💥' : '⚔️'} {t.damage}
          {t.is_crit && <span style={{ fontSize: 9, color: '#e8b84b', marginLeft: 3 }}>CRIT!</span>}
        </span>
        {t.is_kill && <span style={{ fontSize: 9, color: '#ff4444', background: 'rgba(255,68,68,0.12)', borderRadius: 3, padding: '1px 4px' }}>☠ BAJA</span>}
        {t.lifesteal_heal > 0 && <span style={{ fontSize: 9, color: '#a855f7' }}>+{t.lifesteal_heal}♻</span>}
      </div>
      {t.events && t.events.length > 0 && (
        <div style={{ marginTop: 3, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {t.events.map((ev, i) => (
            <span key={i} style={{ fontSize: 9, color: '#666', background: '#0e0e1a', borderRadius: 3, padding: '1px 5px' }}>
              {ev.type.replace(/_/g, ' ')}
              {ev.dmg ? ` (${ev.dmg})` : ''}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Phase-based Attack Button ─────────────────────────────────────────────────
function AttackButton({ phase, onAdvance, onAutoPlay, onStop, isAutoOn, totalTurns, turnIdx }: {
  phase: TurnPhase;
  onAdvance: () => void;
  onAutoPlay: () => void;
  onStop: () => void;
  isAutoOn: boolean;
  totalTurns: number;
  turnIdx: number;
}) {
  if (phase === 'COMPLETE') return null;
  const remaining = totalTurns - turnIdx;

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      {/* Main attack button */}
      <button
        onClick={() => { AudioEngine.sfxCardSelect?.(); onAdvance(); }}
        disabled={phase === 'ANIMATING' || isAutoOn}
        style={{
          padding: '10px 22px', borderRadius: 8,
          background: phase === 'ANIMATING' || isAutoOn
            ? 'rgba(255,255,255,0.04)'
            : 'linear-gradient(135deg, #c0392b, #8e1a0e)',
          border: `1px solid ${phase === 'ANIMATING' || isAutoOn ? '#1a1a2a' : '#c0392b88'}`,
          color: phase === 'ANIMATING' || isAutoOn ? '#333' : '#fff',
          fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 12,
          cursor: phase === 'ANIMATING' || isAutoOn ? 'not-allowed' : 'pointer',
          letterSpacing: '0.06em',
          boxShadow: phase !== 'ANIMATING' && !isAutoOn
            ? '0 4px 16px rgba(192,57,43,0.4)' : 'none',
          transition: 'all 0.2s',
          minWidth: 'min(110px, 45vw)',
        }}
      >
        {phase === 'ANIMATING' ? '⚔ Resolviendo…' : `⚔ Atacar (${remaining})`}
      </button>

      {/* Auto-play toggle */}
      {isAutoOn ? (
        <button onClick={onStop} style={{
          padding: '8px 14px', borderRadius: 8,
          background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.4)',
          color: '#e8b84b', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
          cursor: 'pointer',
        }}>⏸ Pausar</button>
      ) : (
        <button onClick={() => { AudioEngine.sfxCardSelect?.(); onAutoPlay(); }}
          disabled={phase === 'ANIMATING'}
          style={{
            padding: '8px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid #2a2a3a',
            color: '#666', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
            cursor: phase === 'ANIMATING' ? 'not-allowed' : 'pointer',
          }}>▶ Auto</button>
      )}
    </div>
  );
}

// ─── Result Banner ─────────────────────────────────────────────────────────────
function ResultBanner({ won, eloChange, onDismiss }: {
  won: boolean; eloChange: number; onDismiss: () => void;
}) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(4,4,12,0.92)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: 16, zIndex: 50,
      borderRadius: 12,
      animation: 'fadeIn 0.4s ease',
    }}>
      <div style={{ fontSize: 56, lineHeight: 1 }}>{won ? '🏆' : '💀'}</div>
      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 28, fontWeight: 900,
        color: won ? '#e8b84b' : '#e74c3c',
        textShadow: `0 0 20px ${won ? 'rgba(232,184,75,0.6)' : 'rgba(231,76,60,0.6)'}`,
        letterSpacing: '0.1em',
      }}>
        {won ? 'VICTORIA' : 'DERROTA'}
      </div>
      {eloChange !== 0 && (
        <div style={{
          fontFamily: '"IBM Plex Mono",monospace', fontSize: 14,
          color: eloChange > 0 ? '#3ddc84' : '#e74c3c',
        }}>
          {eloChange > 0 ? '+' : ''}{eloChange} MMR
        </div>
      )}
      <button onClick={onDismiss} style={{
        marginTop: 8, padding: '12px 32px', borderRadius: 10,
        background: won
          ? 'linear-gradient(135deg,#e8b84b,#c9901f)'
          : 'linear-gradient(135deg,#c0392b,#8e1a0e)',
        border: 'none', color: won ? '#0a0a12' : '#fff',
        fontFamily: '"Cinzel",serif', fontWeight: 800, fontSize: 14,
        cursor: 'pointer', letterSpacing: '0.08em',
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
      }}>
        {won ? 'Continuar →' : 'Reintentar →'}
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
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
  const dropZoneRef = useRef<HTMLDivElement | null>(null);
  const dragRef     = useRef({ active: false, startX: 0, startY: 0 });

  const finalUnits = result.final_units ?? [];
  const playerUnit   = finalUnits.find(u => u.side === 'a' && u.alive) ?? finalUnits.find(u => u.side === 'a');
  const opponentUnit = finalUnits.find(u => u.side === 'b' && u.alive) ?? finalUnits.find(u => u.side === 'b');

  // Current turn actor info
  const cur = state.currentTurn;
  const isPlayerAttacking = cur?.atk_side === 'a';

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
    // Check if pointer is over drop zone
    const el = document.elementFromPoint(e.clientX, e.clientY);
    const overDrop = dropZoneRef.current?.contains(el as Node) ?? false;
    if (overDrop) {
      AudioEngine.sfxCardSelect?.();
      actions.endDrag(true);
    } else {
      actions.endDrag(false);
    }
  }, [actions]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'radial-gradient(ellipse at 50% 0%, #0f0820 0%, #060610 55%, #030308 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Rajdhani",sans-serif',
    }} onPointerUp={onPointerUp}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'linear-gradient(180deg, rgba(5,5,18,0.99) 0%, rgba(5,5,18,0.92) 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0, zIndex: 10,
        boxShadow: '0 2px 20px rgba(0,0,0,0.6)',
      }}>
        {/* Player HP */}
        <div style={{ minWidth: 160 }}>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 12, color: '#4a9eff',
            letterSpacing: '0.06em', marginBottom: 4 }}>{playerName}</div>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, height: 8,
            width: 160, overflow: 'hidden', border: '1px solid rgba(74,158,255,0.2)' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${state.playerMaxHp > 0 ? (state.playerHp / state.playerMaxHp) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #2980b9, #4a9eff)',
              boxShadow: '0 0 8px rgba(74,158,255,0.6)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#4a9effaa', marginTop: 3,
            fontFamily: '"IBM Plex Mono",monospace' }}>
            {state.playerHp} / {state.playerMaxHp} HP
          </div>
        </div>

        {/* Turn indicator */}
        <div style={{ textAlign: 'center', flex: 1 }}>
          <div style={{
            fontFamily: '"IBM Plex Mono",monospace', fontSize: 11,
            color: '#e8b84b66', letterSpacing: '0.1em',
          }}>
            TURNO {state.revealedTurns.length} / {state.totalTurns}
          </div>
          <div style={{
            marginTop: 4, fontSize: 10,
            color: state.phase === 'ANIMATING' ? '#e8b84b' : state.phase === 'COMPLETE' ? '#3ddc84' : '#555',
            fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.12em', textTransform: 'uppercase',
            transition: 'color 0.3s',
          }}>
            {state.phase === 'IDLE'      && '▶ LISTO PARA ATACAR'}
            {state.phase === 'SELECTING' && '🎯 SELECCIONA OBJETIVO'}
            {state.phase === 'ANIMATING' && '⚔️ RESOLVIENDO…'}
            {state.phase === 'COMPLETE'  && '🏆 BATALLA TERMINADA'}
          </div>
        </div>

        {/* Opponent HP */}
        <div style={{ textAlign: 'right', minWidth: 160 }}>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 12, color: '#e74c3c',
            letterSpacing: '0.06em', marginBottom: 4 }}>{opponentName}</div>
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: 6, height: 8,
            width: 160, overflow: 'hidden', border: '1px solid rgba(231,76,60,0.2)',
            marginLeft: 'auto' }}>
            <div style={{
              height: '100%', borderRadius: 6,
              width: `${state.opponentMaxHp > 0 ? (state.opponentHp / state.opponentMaxHp) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #c0392b, #e74c3c)',
              boxShadow: '0 0 8px rgba(231,76,60,0.6)',
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ fontSize: 10, color: '#e74c3caa', marginTop: 3,
            fontFamily: '"IBM Plex Mono",monospace' }}>
            {state.opponentHp} / {state.opponentMaxHp} HP
          </div>
        </div>
      </div>

      {/* ─── Battle Field ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 24, padding: '24px 20px', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient arena background */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: [
            'radial-gradient(ellipse 60% 35% at 50% 15%, rgba(231,76,60,0.07) 0%, transparent 100%)',
            'radial-gradient(ellipse 60% 35% at 50% 85%, rgba(74,158,255,0.07) 0%, transparent 100%)',
            'linear-gradient(180deg, rgba(5,5,20,0) 0%, rgba(10,5,30,0.4) 50%, rgba(5,5,20,0) 100%)',
          ].join(','),
          transition: 'background 0.5s',
        }} />
        {/* Attack flash */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: state.phase === 'ANIMATING'
            ? 'radial-gradient(ellipse at center, rgba(232,184,75,0.06) 0%, transparent 70%)'
            : 'transparent',
          transition: 'background 0.35s',
        }} />
        {/* Center divider line */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: '50%', height: 1, zIndex: 0, pointerEvents: 'none',
          background: 'linear-gradient(90deg, transparent, rgba(232,184,75,0.15) 20%, rgba(232,184,75,0.35) 50%, rgba(232,184,75,0.15) 80%, transparent)',
          transform: 'translateY(-50%)',
        }} />

        {/* Opponent zone (drop target) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 1 }}>
          <div style={{
            fontSize: 10, color: '#e74c3ccc', letterSpacing: '0.18em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
            background: 'rgba(231,76,60,0.08)', border: '1px solid rgba(231,76,60,0.2)',
            borderRadius: 20, padding: '3px 12px',
          }}>
            ⚔ {opponentName}
          </div>
          {opponentUnit ? (
            <FighterCard
              unit={opponentUnit}
              side="opponent"
              isActive={!isPlayerAttacking && state.phase === 'ANIMATING'}
              isAnimating={state.phase === 'ANIMATING'}
              isDropTarget={state.isDragging}
              isDraggingFrom={false}
              dropRef={dropZoneRef}
            />
          ) : (
            <div ref={dropZoneRef as React.RefObject<HTMLDivElement>}
              style={{ width: 128, height: 165, border: '1px dashed rgba(231,76,60,0.2)', borderRadius: 10,
              background: 'rgba(231,76,60,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(231,76,60,0.2)', fontSize: 28 }}>
              💀
            </div>
          )}
        </div>

        {/* VS divider — epic center beam */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', maxWidth: 600, zIndex: 1 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, rgba(231,76,60,0.5))' }} />
          <div style={{
            fontFamily: '"Cinzel Decorative",serif', fontSize: 20, fontWeight: 900,
            background: 'linear-gradient(135deg, #e74c3c, #e8b84b, #4a9eff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.15em',
            filter: state.phase === 'ANIMATING' ? 'drop-shadow(0 0 8px rgba(232,184,75,0.8))' : 'none',
            transition: 'filter 0.3s',
          }}>VS</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, rgba(74,158,255,0.5), transparent)' }} />
        </div>

        {/* Player zone (draggable) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
          {playerUnit ? (
            <FighterCard
              unit={playerUnit}
              side="player"
              isActive={isPlayerAttacking && state.phase === 'ANIMATING'}
              isAnimating={state.phase === 'ANIMATING'}
              isDropTarget={false}
              isDraggingFrom={state.isDragging}
              onPointerDown={onPointerDown}
              onPointerEnter={() => { if (!state.isDragging) AudioEngine.sfxCardHover?.(); }}
            />
          ) : (
            <div style={{ width: 128, height: 165, border: '1px dashed rgba(74,158,255,0.2)', borderRadius: 10,
              background: 'rgba(74,158,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(74,158,255,0.2)', fontSize: 28 }}>⚔️</div>
          )}
          <div style={{
            fontSize: 10, color: '#4a9effcc', letterSpacing: '0.18em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
            background: 'rgba(74,158,255,0.08)', border: '1px solid rgba(74,158,255,0.2)',
            borderRadius: 20, padding: '3px 12px',
          }}>
            🛡 {playerName}
          </div>
        </div>

        {/* Drag hint */}
        {state.phase === 'IDLE' && !state.isAutoPlaying && (
          <div style={{
            fontSize: 10, color: '#2a2a4a',
            fontFamily: '"Rajdhani",sans-serif',
            letterSpacing: '0.12em', textAlign: 'center',
            animation: 'pulse 2s infinite',
          }}>
            Arrastra tu carta hacia el rival o usa el botón Atacar
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

      {/* ─── Controls ─────────────────────────────────────────────────────── */}
      <div className="battle-controls-row" style={{
        padding: '10px 14px',
        background: 'rgba(4,4,12,0.98)',
        borderTop: '1px solid #181828',
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
        />
        <button onClick={onDismiss} style={{
          background: 'transparent', border: '1px solid #1a1a2a',
          borderRadius: 6, color: '#444', fontSize: 11,
          padding: '6px 12px', cursor: 'pointer',
          fontFamily: '"Rajdhani",sans-serif',
        }}>✕ Salir</button>
      </div>

      {/* ─── Turn Log ─────────────────────────────────────────────────────── */}
      <div style={{
        maxHeight: 160, overflowY: 'auto',
        background: 'rgba(3,3,10,0.98)',
        borderTop: '1px solid #101018',
        padding: '6px 8px',
        display: 'flex', flexDirection: 'column', gap: 3,
        flexShrink: 0,
      }}>
        <div style={{ fontSize: 9, color: '#2a2a3a', letterSpacing: '0.15em',
          fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
          padding: '2px 4px', marginBottom: 2 }}>
          LOG DE BATALLA
        </div>
        {state.revealedTurns.length === 0 ? (
          <div style={{ fontSize: 10, color: '#222', padding: '4px 6px',
            fontFamily: '"Rajdhani",sans-serif' }}>
            La batalla aún no ha comenzado. ¡Ataca!
          </div>
        ) : (
          [...state.revealedTurns].reverse().slice(0, 8).map((snap, i) => (
            <TurnLogEntry key={snap.idx} snap={snap} isLatest={i === 0} />
          ))
        )}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse   { 0%,100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      `}</style>
    </div>
  );
}
