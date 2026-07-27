// VexForge BattleBoardEngine v1.0 — Epic I: VEXFORGE DOMINION
// Real 2D battle board: unit positions, animated HP bars, attack arc canvas, turn indicator.
// Replaces the flat card list with a proper game board layout.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BattleUnit, BattleTurnData, RealBattleResult } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';
import { particleEngine } from '../../lib/particleEngine';
import { CardAttackCinematic } from './CardAttackCinematic';

interface BattleBoardEngineProps {
  result: RealBattleResult;
  playerName: string;
  opponentName: string;
  onComplete: () => void;
  speed?: 1 | 2 | 3;
}

interface UnitState {
  unit: BattleUnit;
  currentHp: number;
  isAttacking: boolean;
  isTakingHit: boolean;
  isDying: boolean;
  isActive: boolean;
  floatDamage: string | null;
  floatHeal: number | null;
  alive: boolean;
}

function buildUnitStates(units: BattleUnit[]): Record<number, UnitState> {
  const s: Record<number, UnitState> = {};
  units.forEach(u => {
    s[u.idx] = {
      unit: u, currentHp: u.hp,
      isAttacking: false, isTakingHit: false, isDying: false,
      isActive: false, floatDamage: null, floatHeal: null, alive: u.alive,
    };
  });
  return s;
}

// ─── HP Bar ────────────────────────────────────────────────────────────────────
function HpBar({ current, max }: { current: number; max: number; rarity?: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const color = pct > 55 ? '#3ddc84' : pct > 25 ? '#f39c12' : '#e74c3c';
  return (
    <div style={{ height: 3, background: '#0a0a1a', borderRadius: 2, overflow: 'hidden', marginTop: 2 }}>
      <div style={{
        height: '100%', width: `${pct}%`,
        background: color,
        boxShadow: `0 0 4px ${color}88`,
        transition: 'width 0.35s ease, background 0.35s',
      }} />
    </div>
  );
}

// ─── Floating damage text ─────────────────────────────────────────────────────
function FloatText({ text, color, isHeal }: { text: string; color: string; isHeal?: boolean }) {
  return (
    <div style={{
      position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
      fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700,
      color, zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
      textShadow: `0 0 8px ${color}`,
      animation: 'floatUp 0.9s ease forwards',
    }}>
      {isHeal ? '+' : ''}{text}
    </div>
  );
}

// ─── Unit Card on Board ────────────────────────────────────────────────────────
function BoardUnit({
  state, side, cardRef, isCurrentTurn,
}: {
  state: UnitState;
  side: 'a' | 'b';
  cardRef: (el: HTMLDivElement | null) => void;
  isCurrentTurn: boolean;
}) {
  const { unit, currentHp, isAttacking, isTakingHit, isDying, isActive, floatDamage, floatHeal, alive } = state;
  const rarColor = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const rarGlow  = RARITY_GLOW[unit.rarity]  ?? 'rgba(139,139,158,0.3)';

  if (!alive && !isDying) return <div style={{ width: 108, height: 138, opacity: 0 }} />;

  return (
    <div
      ref={cardRef}
      style={{
        width: 108, height: 138, position: 'relative', borderRadius: 10,
        border: `2px solid ${isActive ? rarColor : isDying ? '#333' : rarColor + '66'}`,
        background: isDying
          ? 'rgba(0,0,0,0.1)'
          : `linear-gradient(160deg, ${rarColor}22 0%, rgba(6,6,16,0.98) 100%)`,
        boxShadow: isActive
          ? `0 0 22px ${rarGlow}, 0 0 8px ${rarColor}aa, inset 0 0 12px ${rarColor}11`
          : isDying
            ? '0 0 28px 10px rgba(255,60,30,0.65)'
            : isCurrentTurn
              ? `0 0 12px ${rarColor}66, 0 0 2px ${rarColor}44`
              : `0 2px 8px rgba(0,0,0,0.5)`,
        animation: isDying ? 'unitDeath 0.72s ease forwards, deathGlow 0.72s ease forwards' : undefined,
        transform: isAttacking
          ? (side === 'a' ? 'translateY(-10px) scale(1.08)' : 'translateY(10px) scale(1.08)')
          : isTakingHit
            ? `translateX(${side === 'a' ? 6 : -6}px) rotate(${side === 'a' ? 1 : -1}deg)`
            : isDying
              ? 'scale(0.7)'
              : 'translateY(0) scale(1)',
        transition: isDying
          ? 'transform 0.4s ease, opacity 0.4s ease'
          : 'transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s',
        opacity: isDying ? 0 : 1,
        cursor: 'default',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Rarity glow strip — top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${rarColor}, transparent)`,
        opacity: isActive ? 1 : 0.6,
        borderRadius: '8px 8px 0 0',
        transition: 'opacity 0.3s',
      }} />

      {/* Active indicator pulse ring */}
      {isActive && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 11,
          border: `2px solid ${rarColor}`,
          animation: 'unitActivePulse 0.6s ease-in-out infinite',
          pointerEvents: 'none', zIndex: 5,
        }} />
      )}

      {/* Card image */}
      {unit.image_url ? (
        <div style={{
          width: '100%', height: 72, overflow: 'hidden',
          background: '#08080f',
        }}>
          <img
            src={unit.image_url} alt={unit.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDying ? 0.3 : 1, transition: 'opacity 0.4s' }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%', height: 72,
          background: `linear-gradient(160deg, ${rarColor}30, rgba(6,6,16,0.92))`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 4, position: 'relative', overflow: 'hidden',
        }}>
          {/* Faction pattern */}
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `repeating-linear-gradient(45deg, ${rarColor}08 0, ${rarColor}08 1px, transparent 0, transparent 50%)`,
            backgroundSize: '10px 10px',
          }} />
          <div style={{ fontSize: 30, lineHeight: 1, filter: `drop-shadow(0 0 8px ${rarColor})`, position: 'relative' }}>
            {KEYWORD_ICON[unit.faction] ?? '🃏'}
          </div>
        </div>
      )}

      {/* Name */}
      <div style={{
        padding: '3px 5px', fontSize: 8.5, color: '#c0c0e0',
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 700,
        letterSpacing: '0.04em', lineHeight: 1.2,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        textShadow: `0 0 6px ${rarColor}44`,
      }}>
        {unit.name}
      </div>

      {/* HP bar + stats */}
      <div style={{ padding: '0 5px' }}>
        <HpBar current={currentHp} max={unit.max_hp} rarity={unit.rarity} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 2 }}>
          <span style={{ fontSize: 8, color: '#7a7a9a', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}>
            ❤ {currentHp}
          </span>
          <span style={{ fontSize: 8, color: '#e84040', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
            ⚔ {unit.atk}
          </span>
        </div>
      </div>

      {/* Keywords */}
      {unit.keywords.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 4, left: 4,
          display: 'flex', gap: 2, flexWrap: 'wrap',
        }}>
          {unit.keywords.slice(0, 2).map(kw => (
            <span key={kw} title={kw} style={{
              fontSize: 10, filter: `drop-shadow(0 0 3px ${rarColor})`,
            }}>{KEYWORD_ICON[kw] ?? '✦'}</span>
          ))}
        </div>
      )}

      {/* Floating damage */}
      {floatDamage && <FloatText text={floatDamage} color="#ff6b35" />}
      {floatHeal !== null && floatHeal > 0 && <FloatText text={String(floatHeal)} color="#3ddc84" isHeal />}

      {/* Hit flash overlay */}
      {isTakingHit && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 7,
          background: 'rgba(255,100,50,0.35)',
          animation: 'hitFlash 0.18s ease',
        }} />
      )}
    </div>
  );
}

// ─── Turn header ──────────────────────────────────────────────────────────────
function TurnHeader({ turn, side, attackerName, damage, isCrit }: {
  turn: number; side: 'a' | 'b'; attackerName: string; damage: number;
  isCrit: boolean; playerName?: string; opponentName?: string;
}) {
  return (
    <div style={{
      padding: '5px 12px',
      background: side === 'a' ? 'rgba(74,158,255,0.08)' : 'rgba(192,57,43,0.08)',
      borderTop: `1px solid ${side === 'a' ? '#4a9eff33' : '#c0392b33'}`,
      borderBottom: `1px solid ${side === 'a' ? '#4a9eff33' : '#c0392b33'}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      minHeight: 28,
    }}>
      <span style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 10,
        color: side === 'a' ? '#4a9eff' : '#e74c3c', letterSpacing: '0.06em',
      }}>
        Turn {turn} — {attackerName}
      </span>
      {damage > 0 && (
        <span style={{
          fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700,
          color: isCrit ? '#e8b84b' : '#e0e0f8',
          textShadow: isCrit ? '0 0 8px #e8b84b88' : 'none',
        }}>
          {isCrit ? '⚡ CRIT ' : ''}{damage} DMG
        </span>
      )}
    </div>
  );
}

// ─── Main Board Engine ─────────────────────────────────────────────────────────
export function BattleBoardEngine({ result, playerName, opponentName, onComplete, speed = 1 }: BattleBoardEngineProps) {
  const finalUnits = result.final_units ?? [];
  const turns      = result.turns ?? [];
  const playerSide: 'a' | 'b' = 'a';

  // v1.1: Derive player faction for AudioEngine + faction ambient particles
  const playerFaction = useMemo(() => {
    const pu = finalUnits.find(u => u.side === 'a');
    return pu?.faction ?? 'default';
  }, [finalUnits]);

  const [states, setStates]       = useState<Record<number, UnitState>>(() => buildUnitStates(finalUnits));
  const [_turnIdx, _setTurnIdx]     = useState(-1);
  const [log, setLog]             = useState<string[]>(['La batalla comienza...']);
  const [activeTurn, setActiveTurn] = useState<BattleTurnData | null>(null);
  const [isDone, setIsDone]       = useState(false);
  
  // FASE 2: Card Attack Cinematic state
  const [attackingUnit, setAttackingUnit] = useState<BattleUnit | null>(null);
  const [cinematicVisible, setCinematicVisible] = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const boardRef   = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<Record<number, HTMLDivElement | null>>({});

  const TURN_DUR = Math.max(400, 1200 / speed);
  const HIT_DUR  = Math.max(150, 350 / speed);

  // Mount particle canvas + faction music + ambient particles (v1.1)
  useEffect(() => {
    const canvas = canvasRef.current;
    const board  = boardRef.current;
    if (!canvas || !board) return;
    canvas.width  = board.clientWidth;
    canvas.height = board.clientHeight;
    particleEngine.mount(canvas);

    // v1.1: Start faction music and ambient particles
    AudioEngine.setFaction(playerFaction);
    AudioEngine.musicLoop();
    const W = canvas.width; const H = canvas.height;
    particleEngine.factionAmbient(playerFaction, W, H);
    const ambientId = setInterval(() => {
      if (canvasRef.current) particleEngine.factionAmbient(playerFaction, W, H);
    }, 2800);

    return () => {
      particleEngine.unmount();
      clearInterval(ambientId);
      AudioEngine.stopMusic();
    };
  }, [playerFaction]);

  // v1.1: Wire audio intensity to player HP ratio in real-time
  useEffect(() => {
    const playerUnits = Object.values(states).filter(s => s.unit.side === 'a');
    if (playerUnits.length === 0) return;
    const totalHp = playerUnits.reduce((sum, s) => sum + Math.max(0, s.currentHp), 0);
    const maxHp   = playerUnits.reduce((sum, s) => sum + s.unit.max_hp, 0);
    const ratio   = maxHp > 0 ? totalHp / maxHp : 1;
    AudioEngine.setIntensity(ratio);
  }, [states]);

  // Helper: get card center in canvas coords
  const getCardCenter = useCallback((idx: number): { x: number; y: number } | null => {
    const el = cardRefs.current[idx];
    const canvas = canvasRef.current;
    if (!el || !canvas) return null;
    const er = el.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    return { x: er.left - cr.left + er.width / 2, y: er.top - cr.top + er.height / 2 };
  }, []);

  // Process one turn
  const processTurn = useCallback((t: BattleTurnData) => {
    setActiveTurn(t);
    const atkSide = t.atk_side;

    // Find attacker and defender unit indices
    const attackerIdx = finalUnits.find(u => u.side === atkSide && u.name === t.attacker.name)?.idx ?? -1;
    const defenderIdx = finalUnits.find(u => u.side !== atkSide && u.name === t.defender.name)?.idx ?? -1;

    // 1. Highlight attacker + trigger cinematic (FASE 2)
    setStates(prev => {
      const next = { ...prev };
      if (attackerIdx >= 0 && next[attackerIdx]) {
        next[attackerIdx] = { ...next[attackerIdx], isActive: true, isAttacking: false };
        
        // FASE 2: Show cinematic for Rare+ rarities
        const atkUnit = finalUnits.find(u => u.idx === attackerIdx);
        if (atkUnit && ['Rare', 'Epic', 'Legendary', 'Mythic', 'Founder'].includes(atkUnit.rarity)) {
          setAttackingUnit(atkUnit);
          setCinematicVisible(true);
        }
      }
      return next;
    });

    // 2. Attack animation + arc
    setTimeout(() => {
      setStates(prev => {
        const next = { ...prev };
        if (attackerIdx >= 0 && next[attackerIdx]) {
          next[attackerIdx] = { ...next[attackerIdx], isAttacking: true, isActive: true };
        }
        return next;
      });

      // Particle arc
      const from = getCardCenter(attackerIdx);
      const to   = getCardCenter(defenderIdx);
      if (from && to) {
        const arcColor = t.is_crit ? '#e8b84b' : (atkSide === playerSide ? '#4a9eff' : '#e74c3c');
        particleEngine.attackArc(from.x, from.y, to.x, to.y, arcColor, t.is_crit);
      }

      // Audio
      const atkUnit = finalUnits.find(u => u.idx === attackerIdx);
      if (t.is_crit) AudioEngine.critical();
      else if (atkUnit) AudioEngine.rarityAttack(atkUnit.rarity);
      else AudioEngine.attack();

    }, 80);

    // 3. Impact: defender takes hit
    setTimeout(() => {
      setStates(prev => {
        const next = { ...prev };
        // Reset attacker
        if (attackerIdx >= 0 && next[attackerIdx]) {
          next[attackerIdx] = { ...next[attackerIdx], isAttacking: false, isActive: false };
        }
        // Defender hit
        if (defenderIdx >= 0 && next[defenderIdx]) {
          const newHp = Math.max(0, t.defender.hp);
          next[defenderIdx] = {
            ...next[defenderIdx],
            currentHp: newHp,
            isTakingHit: true,
            floatDamage: t.damage > 0 ? (t.is_crit ? `⚡${t.damage}` : String(t.damage)) : null,
          };
        }
        // Lifesteal heal
        if (t.lifesteal_heal > 0 && attackerIdx >= 0 && next[attackerIdx]) {
          next[attackerIdx] = {
            ...next[attackerIdx],
            currentHp: Math.min(next[attackerIdx].unit.max_hp, next[attackerIdx].currentHp + t.lifesteal_heal),
            floatHeal: t.lifesteal_heal,
          };
          AudioEngine.heal();
          const pos = getCardCenter(attackerIdx);
          if (pos) particleEngine.heal(pos.x, pos.y);
        }
        return next;
      });

      // Keyword events
      (t.events ?? []).forEach(ev => {
        if (ev.type === 'shield_block' && defenderIdx >= 0) {
          AudioEngine.triggerKeyword('Guard');
          const pos = getCardCenter(defenderIdx);
          if (pos) particleEngine.triggerKeyword('Guard', pos.x, pos.y);
        }
        if (ev.type === 'poisoned') {
          AudioEngine.triggerKeyword('Poison');
          const pos = getCardCenter(defenderIdx);
          if (pos) particleEngine.triggerKeyword('Poison', pos.x, pos.y);
        }
        if (ev.type === 'lifesteal') {
          AudioEngine.triggerKeyword('Drain');
          const pos = getCardCenter(attackerIdx);
          if (pos) particleEngine.triggerKeyword('Drain', pos.x, pos.y);
        }
      });

      // Log line
      const logLine = `Turno ${t.turn}: ${t.attacker.name} → ${t.defender.name} [${t.damage} dmg${t.is_crit ? ' ¡CRIT!' : ''}${t.is_kill ? ' ☠' : ''}]`;
      setLog(prev => [...prev.slice(-8), logLine]);

    }, HIT_DUR);

    // 4. Clear hit state + handle death
    setTimeout(() => {
      setStates(prev => {
        const next = { ...prev };
        if (defenderIdx >= 0 && next[defenderIdx]) {
          const isDead = t.is_kill || next[defenderIdx].currentHp <= 0;
          next[defenderIdx] = {
            ...next[defenderIdx],
            isTakingHit: false, floatDamage: null,
            isDying: isDead, alive: !isDead,
          };
          if (isDead) {
            AudioEngine.death();
            const pos = getCardCenter(defenderIdx);
            if (pos) particleEngine.death(pos.x, pos.y);
          }
        }
        if (attackerIdx >= 0 && next[attackerIdx]) {
          next[attackerIdx] = { ...next[attackerIdx], floatHeal: null };
        }
        return next;
      });
    }, HIT_DUR + 200);

  }, [finalUnits, getCardCenter, HIT_DUR, playerSide]);

  // Auto-advance turns
  useEffect(() => {
    if (turns.length === 0) {
      const t = setTimeout(onComplete, 1200);
      return () => clearTimeout(t);
    }
    if (isDone) return;

    let idx = 0;
    const advance = () => {
      if (idx >= turns.length) {
        setIsDone(true);
        setTimeout(onComplete, 1200);
        return;
      }
      processTurn(turns[idx]);
      idx++;
    };

    advance(); // first turn immediately
    const interval = setInterval(advance, TURN_DUR);
    return () => clearInterval(interval);
  }, []);

  const sideA = Object.values(states).filter(s => s.unit.side === 'a');
  const sideB = Object.values(states).filter(s => s.unit.side === 'b');

  return (
    <div ref={boardRef} style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(180deg, #060614 0%, #090920 50%, #06060f 100%)' }}>
      {/* Particle canvas overlay */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }} />

      {/* FASE 2: Card Attack Cinematic Overlay */}
      <CardAttackCinematic 
        unit={attackingUnit} 
        visible={cinematicVisible} 
        onDone={() => setCinematicVisible(false)} 
      />

{/* BA.0: Board atmosphere layer — faction-specific ambient glow */}
        {(() => {
          const factionColors: Record<string, string> = {
            Guerrero: '#c0392b', Mago: '#8e44ad', 'Pícaro': '#3ddc84', 'Paladín': '#f39c12', Explorador: '#3ddc84', Comerciante: '#f39c12', default: '#8b8b9e',
          };
          const atmoColor = factionColors[playerFaction] ?? factionColors.default;
          return (
            <div aria-hidden style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
            }}>
              {/* Large ambient orb — top center */}
              <div style={{
                position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)',
                width: 260, height: 260, borderRadius: '50%',
                background: `radial-gradient(circle, ${atmoColor}20 0%, transparent 70%)`,
                animation: 'atmosphereOrb 7s ease-in-out infinite',
              }} />
              {/* Bottom glow — player side */}
              <div style={{
                position: 'absolute', bottom: -40, left: '50%', transform: 'translateX(-50%)',
                width: 200, height: 160, borderRadius: '50%',
                background: `radial-gradient(circle, rgba(74,158,255,0.12) 0%, transparent 70%)`,
                animation: 'atmospherePulse 4s ease-in-out infinite',
              }} />
              {/* Corner accents */}
              <div style={{
                position: 'absolute', top: 0, left: 0, width: 80, height: 80, borderRadius: '0 0 80px 0',
                background: `linear-gradient(135deg, ${atmoColor}10, transparent)`,
                animation: 'atmosphereDrift 6s ease-in-out infinite',
              }} />
              <div style={{
                position: 'absolute', top: 0, right: 0, width: 80, height: 80, borderRadius: '0 0 0 80px',
                background: `linear-gradient(225deg, ${atmoColor}10, transparent)`,
                animation: 'atmosphereDrift 6s ease-in-out infinite 1s',
              }} />
            </div>
          );
        })()}

        {/* Opponent zone (side B — top) */}
      <div style={{
        padding: '10px 12px 8px',
        background: 'linear-gradient(180deg, rgba(192,57,43,0.10) 0%, rgba(192,57,43,0.04) 100%)',
        borderBottom: '1px solid rgba(192,57,43,0.30)',
        position: 'relative',
      }}>
        {/* Zone label bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8,
        }}>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.5))',
          }} />
          <div style={{
            fontSize: 9, color: '#e74c3c', fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ opacity: 0.7 }}>⚔</span>
            <span>{opponentName}</span>
            <span style={{
              fontSize: 8, color: '#e74c3c', background: 'rgba(192,57,43,0.15)',
              border: '1px solid rgba(192,57,43,0.3)', borderRadius: 4,
              padding: '0 5px', fontFamily: 'IBM Plex Mono, monospace',
            }}>
              {sideB.filter(s => s.alive).length} vivos
            </span>
          </div>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, rgba(192,57,43,0.5), transparent)',
          }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
          {sideB.map(s => (
            <BoardUnit
              key={s.unit.idx} state={s} side="b"
              cardRef={el => { cardRefs.current[s.unit.idx] = el; }}
              isCurrentTurn={activeTurn?.atk_side === 'b' && activeTurn.attacker.name === s.unit.name}
            />
          ))}
        </div>
      </div>

      {/* Turn indicator center strip */}
      {activeTurn ? (
        <TurnHeader
          turn={activeTurn.turn}
          side={activeTurn.atk_side}
          attackerName={activeTurn.attacker.name}
          damage={activeTurn.damage}
          isCrit={activeTurn.is_crit}
          playerName={playerName}
          opponentName={opponentName}
        />
      ) : (
        <div style={{
          height: 6,
          background: 'linear-gradient(90deg, rgba(74,158,255,0.3), rgba(232,184,75,0.4), rgba(192,57,43,0.3))',
        }} />
      )}

      {/* Player zone (side A — bottom) */}
      <div style={{
        padding: '8px 12px 12px',
        background: 'linear-gradient(0deg, rgba(74,158,255,0.10) 0%, rgba(74,158,255,0.04) 100%)',
        borderTop: '1px solid rgba(74,158,255,0.30)',
      }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8 }}>
          {sideA.map(s => (
            <BoardUnit
              key={s.unit.idx} state={s} side="a"
              cardRef={el => { cardRefs.current[s.unit.idx] = el; }}
              isCurrentTurn={activeTurn?.atk_side === 'a' && activeTurn.attacker.name === s.unit.name}
            />
          ))}
        </div>
        {/* Zone label bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, transparent, rgba(74,158,255,0.5))',
          }} />
          <div style={{
            fontSize: 9, color: '#4a9eff', fontFamily: 'Rajdhani, sans-serif',
            letterSpacing: '0.2em', textTransform: 'uppercase', fontWeight: 800,
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <span style={{ opacity: 0.7 }}>🛡</span>
            <span>{playerName}</span>
            <span style={{
              fontSize: 8, color: '#4a9eff', background: 'rgba(74,158,255,0.15)',
              border: '1px solid rgba(74,158,255,0.3)', borderRadius: 4,
              padding: '0 5px', fontFamily: 'IBM Plex Mono, monospace',
            }}>
              {sideA.filter(s => s.alive).length} vivos
            </span>
          </div>
          <div style={{
            height: 1, flex: 1,
            background: 'linear-gradient(90deg, rgba(74,158,255,0.5), transparent)',
          }} />
        </div>
      </div>

      {/* Battle log — scrolling ticker */}
      <div style={{
        padding: '5px 12px', background: 'rgba(3,3,10,0.97)',
        minHeight: 40, borderTop: '1px solid #141428',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        {log.slice(-2).map((line, i) => (
          <div key={i} style={{
            fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
            color: i === log.slice(-2).length - 1 ? '#a0a0c8' : '#4a4a6a',
            marginBottom: 1, transition: 'color 0.3s',
          }}>{line}</div>
        ))}
      </div>

      <style>{`
        @keyframes atmosphereOrb { 0%,100%{transform:translateX(-50%) scale(1);opacity:0.7;} 50%{transform:translateX(-50%) scale(1.12);opacity:1;} }
        @keyframes atmospherePulse { 0%,100%{opacity:0.6;} 50%{opacity:1;} }
        @keyframes atmosphereDrift { 0%,100%{transform:scale(1);opacity:0.5;} 50%{transform:scale(1.08);opacity:0.8;} }
        @keyframes floatUp { 0%{transform:translate(-50%,0);opacity:1;} 100%{transform:translate(-50%,-32px);opacity:0;} }
        @keyframes hitFlash { 0%,100%{opacity:0;} 50%{opacity:1;} }
        @keyframes unitActivePulse { 0%,100%{opacity:0.4;transform:scale(1);} 50%{opacity:1;transform:scale(1.04);} }
        @keyframes unitDeath {
          0%   { transform:scale(1) rotate(0deg);   opacity:1;    filter:brightness(1.8) saturate(0); }
          20%  { transform:scale(0.92) rotate(-8deg); opacity:0.85; filter:brightness(2.5) saturate(0) blur(0px); }
          55%  { transform:scale(0.62) rotate(14deg); opacity:0.45; filter:brightness(0.5) saturate(0) blur(2px); }
          100% { transform:scale(0.2) rotate(28deg);  opacity:0;    filter:brightness(0) blur(5px); }
        }
        @keyframes deathGlow {
          0%   { box-shadow:0 0 0 0 rgba(255,60,30,0); }
          30%  { box-shadow:0 0 32px 12px rgba(255,60,30,0.7); }
          100% { box-shadow:0 0 0 0 rgba(255,60,30,0); }
        }
      `}</style>
    </div>
  );
}
