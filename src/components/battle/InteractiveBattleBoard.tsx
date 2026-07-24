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
    width: 90, minHeight: 110,
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
        height: 56, background: unit.image_url
          ? `url(${unit.image_url}) center/cover no-repeat`
          : `linear-gradient(135deg, ${rarColor}28, ${fBorder}18)`,
        borderBottom: `1px solid ${rarColor}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 22,
      }}>
        {!unit.image_url && <span>{KEYWORD_ICON[unit.faction] ?? '⚔️'}</span>}
      </div>

      {/* Body */}
      <div style={{ padding: '5px 6px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: 9, fontWeight: 700,
          color: rarColor, letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {unit.name}
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', gap: 4, fontSize: 9, fontFamily: '"Rajdhani",sans-serif' }}>
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
          {t.is_crit && <span style={{ fontSize: 9, color: '#e8b84b', marginLeft: 3 }}>CRIT</span>}
        </span>
        {t.is_kill && <span style={{ fontSize: 9, color: '#ff4444', background: 'rgba(255,68,68,0.12)', borderRadius: 3, padding: '1px 4px' }}>☠ KILL</span>}
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
      background: '#060610',
      display: 'flex', flexDirection: 'column',
      maxWidth: 520, margin: '0 auto',
      fontFamily: '"Rajdhani",sans-serif',
    }} onPointerUp={onPointerUp}>

      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 14px',
        background: 'rgba(4,4,12,0.98)',
        borderBottom: '1px solid #181828',
        flexShrink: 0, zIndex: 10,
      }}>
        <div>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 10, color: '#4a9eff' }}>{playerName}</div>
          <HpBar hp={state.playerHp} max={state.playerMaxHp} />
          <div style={{ fontSize: 9, color: '#4a9eff88', marginTop: 1 }}>
            {state.playerHp}/{state.playerMaxHp} HP
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: '"IBM Plex Mono",monospace', fontSize: 10, color: '#444' }}>
            Turno {state.revealedTurns.length} / {state.totalTurns}
          </div>
          <div style={{ fontSize: 9, color: state.phase === 'ANIMATING' ? '#e8b84b' : '#333',
            fontFamily: '"Rajdhani",sans-serif', marginTop: 2, letterSpacing: '0.08em' }}>
            {state.phase === 'IDLE'      ? 'TU TURNO'        : ''}
            {state.phase === 'SELECTING' ? 'ARRASTRA CARTA'  : ''}
            {state.phase === 'ANIMATING' ? 'RESOLVIENDO…'    : ''}
            {state.phase === 'COMPLETE'  ? 'FIN'             : ''}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: '"Cinzel",serif', fontSize: 10, color: '#e74c3c' }}>{opponentName}</div>
          <HpBar hp={state.opponentHp} max={state.opponentMaxHp} />
          <div style={{ fontSize: 9, color: '#e74c3c88', marginTop: 1 }}>
            {state.opponentHp}/{state.opponentMaxHp} HP
          </div>
        </div>
      </div>

      {/* ─── Battle Field ─────────────────────────────────────────────────── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: '20px 16px', position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: state.phase === 'ANIMATING'
            ? 'radial-gradient(ellipse at center, rgba(192,57,43,0.08) 0%, transparent 70%)'
            : 'none',
          transition: 'background 0.3s',
        }} />

        {/* Opponent zone (drop target) */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, zIndex: 1 }}>
          <div style={{ fontSize: 10, color: '#e74c3c88', letterSpacing: '0.15em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase' }}>
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
              style={{ width: 90, height: 110, border: '1px dashed #2a2a3a', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#333', fontSize: 11 }}>
              Sin unidad
            </div>
          )}
        </div>

        {/* VS divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', zIndex: 1 }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, #2a2a4a)' }} />
          <div style={{ fontSize: 18, color: '#2a2a4a', fontWeight: 900 }}>VS</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, #2a2a4a, transparent)' }} />
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
            <div style={{ width: 90, height: 110, border: '1px dashed #2a2a3a', borderRadius: 10 }} />
          )}
          <div style={{ fontSize: 10, color: '#4a9eff88', letterSpacing: '0.15em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase' }}>
            🛡 {playerName} (Tú)
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
