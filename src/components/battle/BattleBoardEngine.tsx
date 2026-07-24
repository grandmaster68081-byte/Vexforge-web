// VexForge BattleBoardEngine v1.0 — Epic I: VEXFORGE DOMINION
// Real 2D battle board: unit positions, animated HP bars, attack arc canvas, turn indicator.
// Replaces the flat card list with a proper game board layout.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BattleUnit, BattleTurnData, RealBattleResult } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';
import { particleEngine } from '../../lib/particleEngine';

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
function HpBar({ current, max, rarity }: { current: number; max: number; rarity: string }) {
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

  if (!alive && !isDying) return <div style={{ width: 68, height: 88, opacity: 0 }} />;

  return (
    <div
      ref={cardRef}
      style={{
        width: 68, height: 88, position: 'relative', borderRadius: 7,
        border: `1.5px solid ${isActive ? rarColor : isDying ? '#333' : rarColor + '55'}`,
        background: isDying
          ? 'rgba(0,0,0,0.1)'
          : `linear-gradient(160deg, ${rarColor}18 0%, rgba(6,6,16,0.97) 100%)`,
        boxShadow: isActive
          ? `0 0 16px ${rarGlow}, 0 0 4px ${rarColor}88`
          : isDying
            ? '0 0 22px 8px rgba(255,60,30,0.6)'
            : isCurrentTurn
              ? `0 0 8px ${rarColor}55`
              : 'none',
        animation: isDying ? 'unitDeath 0.72s ease forwards, deathGlow 0.72s ease forwards' : undefined,
        transform: isAttacking
          ? (side === 'a' ? 'translateY(-6px) scale(1.06)' : 'translateY(6px) scale(1.06)')
          : isTakingHit
            ? `translateX(${side === 'a' ? 4 : -4}px)`
            : isDying
              ? 'scale(0.7) opacity(0)'
              : 'translateY(0) scale(1)',
        transition: isDying
          ? 'transform 0.4s ease, opacity 0.4s ease'
          : 'transform 0.15s ease, box-shadow 0.3s',
        opacity: isDying ? 0 : 1,
        cursor: 'default',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {/* Rarity glow strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: rarColor, opacity: 0.7, borderRadius: '7px 7px 0 0',
      }} />

      {/* Card image */}
      {unit.image_url ? (
        <div style={{
          width: '100%', height: 44, overflow: 'hidden',
          background: '#08080f',
        }}>
          <img
            src={unit.image_url} alt={unit.name}
            style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: isDying ? 0.3 : 1, transition: 'opacity 0.4s' }}
          />
        </div>
      ) : (
        <div style={{
          width: '100%', height: 44, background: `${rarColor}22`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 22,
        }}>
          🃏
        </div>
      )}

      {/* Name */}
      <div style={{
        padding: '2px 4px', fontSize: 7.5, color: '#b0b0d0',
        fontFamily: 'Rajdhani, sans-serif', fontWeight: 600,
        letterSpacing: '0.04em', lineHeight: 1.2,
        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      }}>
        {unit.name}
      </div>

      {/* HP bar + HP text */}
      <div style={{ padding: '0 4px' }}>
        <HpBar current={currentHp} max={unit.max_hp} rarity={unit.rarity} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 1 }}>
          <span style={{ fontSize: 7, color: '#666', fontFamily: 'Rajdhani, sans-serif' }}>
            {currentHp}/{unit.max_hp}
          </span>
          <span style={{ fontSize: 7, color: '#c0392b', fontFamily: 'Rajdhani, sans-serif' }}>
            ⚔{unit.atk}
          </span>
        </div>
      </div>

      {/* Keywords */}
      {unit.keywords.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 3, left: 4,
          display: 'flex', gap: 2, flexWrap: 'wrap',
        }}>
          {unit.keywords.slice(0, 2).map(kw => (
            <span key={kw} title={kw} style={{ fontSize: 9 }}>{KEYWORD_ICON[kw] ?? '✦'}</span>
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
function TurnHeader({ turn, side, attackerName, damage, isCrit, playerName, opponentName }: {
  turn: number; side: 'a' | 'b'; attackerName: string; damage: number;
  isCrit: boolean; playerName: string; opponentName: string;
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
  const [turnIdx, setTurnIdx]     = useState(-1);
  const [log, setLog]             = useState<string[]>(['Battle begins...']);
  const [activeTurn, setActiveTurn] = useState<BattleTurnData | null>(null);
  const [isDone, setIsDone]       = useState(false);

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

    // 1. Highlight attacker
    setStates(prev => {
      const next = { ...prev };
      if (attackerIdx >= 0 && next[attackerIdx]) {
        next[attackerIdx] = { ...next[attackerIdx], isActive: true, isAttacking: false };
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
      const logLine = `Turn ${t.turn}: ${t.attacker.name} → ${t.defender.name} [${t.damage} dmg${t.is_crit ? ' CRIT' : ''}${t.is_kill ? ' KILL' : ''}]`;
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
    <div ref={boardRef} style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(180deg, #060614 0%, #08081e 100%)' }}>
      {/* Particle canvas overlay */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }} />

{/* BA.0: Board atmosphere layer — faction-specific ambient glow */}
        {(() => {
          const factionColors: Record<string, string> = {
            Guerrero: '#c0392b', Mago: '#4a9eff', Explorador: '#3ddc84', Comerciante: '#e8b84b', default: '#8b8b9e',
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
      <div style={{ padding: '10px 8px 6px', background: 'rgba(192,57,43,0.04)', borderBottom: '1px solid rgba(192,57,43,0.15)' }}>
        <div style={{ fontSize: 9, color: '#c0392b', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>
          ⚔ {opponentName}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
      {activeTurn && (
        <TurnHeader
          turn={activeTurn.turn}
          side={activeTurn.atk_side}
          attackerName={activeTurn.attacker.name}
          damage={activeTurn.damage}
          isCrit={activeTurn.is_crit}
          playerName={playerName}
          opponentName={opponentName}
        />
      )}

      {/* Player zone (side A — bottom) */}
      <div style={{ padding: '6px 8px 10px', background: 'rgba(74,158,255,0.04)', borderTop: '1px solid rgba(74,158,255,0.15)' }}>
        <div style={{ fontSize: 9, color: '#4a9eff', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6, opacity: 0.7 }}>
          🛡 {playerName} (You)
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {sideA.map(s => (
            <BoardUnit
              key={s.unit.idx} state={s} side="a"
              cardRef={el => { cardRefs.current[s.unit.idx] = el; }}
              isCurrentTurn={activeTurn?.atk_side === 'a' && activeTurn.attacker.name === s.unit.name}
            />
          ))}
        </div>
      </div>

      {/* Battle log */}
      <div style={{ padding: '4px 10px', background: 'rgba(4,4,12,0.95)', minHeight: 36, borderTop: '1px solid #18183a' }}>
        {log.slice(-2).map((line, i) => (
          <div key={i} style={{
            fontSize: 9, fontFamily: 'monospace',
            color: i === log.slice(-2).length - 1 ? '#b0b0d0' : '#444',
            marginBottom: 1, transition: 'color 0.3s',
          }}>{line}</div>
        ))}
      </div>

      <style>{`
        @keyframes floatUp { 0%{transform:translate(-50%,0);opacity:1;} 100%{transform:translate(-50%,-28px);opacity:0;} }
        @keyframes hitFlash { 0%,100%{opacity:0;} 50%{opacity:1;} }
        @keyframes unitDeath {
          0%   { transform:scale(1) rotate(0deg);   opacity:1;    filter:brightness(1.8) saturate(0); }
          20%  { transform:scale(0.92) rotate(-8deg); opacity:0.85; filter:brightness(2.5) saturate(0) blur(0px); }
          55%  { transform:scale(0.62) rotate(14deg); opacity:0.45; filter:brightness(0.5) saturate(0) blur(2px); }
          100% { transform:scale(0.2) rotate(28deg);  opacity:0;    filter:brightness(0) blur(5px); }
        }
        @keyframes deathGlow {
          0%   { box-shadow:0 0 0 0 rgba(255,60,30,0); }
          30%  { box-shadow:0 0 24px 10px rgba(255,60,30,0.65); }
          100% { box-shadow:0 0 0 0 rgba(255,60,30,0); }
        }
      `}</style>
    </div>
  );
}
