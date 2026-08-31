// VexForge BattleBoardEngine v1.0 — Epic I: VEXFORGE DOMINION
// Real 2D battle board: unit positions, animated HP bars, attack arc canvas, turn indicator.
// Replaces the flat card list with a proper game board layout.

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import type { BattleUnit, BattleTurnData, RealBattleResult } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';
import { particleEngine } from '../../lib/particleEngine';
import { CardAttackCinematic } from './CardAttackCinematic';
import { createBattlePresentationContract, getBattlePresentationCue, resolveBattlePresentationState } from '../../lib/battlePresentation';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';

const FACTION_FORGE_ICON: Record<string, ForgeIconName> = {
  Guerrero: 'attack',
  Mago: 'spark',
  'Paladín': 'shield',
  'Pícaro': 'target',
  Explorador: 'target',
  Comerciante: 'coin',
};

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
  floatDamageIsCrit: boolean;
  floatHeal: number | null;
  alive: boolean;
}

function buildUnitStates(units: BattleUnit[]): Record<number, UnitState> {
  const s: Record<number, UnitState> = {};
  units.forEach(u => {
    s[u.idx] = {
      unit: u, currentHp: u.hp,
      isAttacking: false, isTakingHit: false, isDying: false,
      isActive: false, floatDamage: null, floatDamageIsCrit: false,
      floatHeal: null, alive: u.alive,
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
function FloatText({
  text, color, isHeal, isCrit,
}: {
  text: string;
  color: string;
  isHeal?: boolean;
  isCrit?: boolean;
}) {
  return (
    <div style={{
      position: 'absolute', top: -22, left: '50%', transform: 'translateX(-50%)',
      fontFamily: 'Cinzel, serif', fontSize: 13, fontWeight: 700,
      color, zIndex: 20, pointerEvents: 'none', whiteSpace: 'nowrap',
      textShadow: `0 0 8px ${color}`,
      animation: 'floatUp 0.9s ease forwards',
    }}>
      {isCrit && <ForgeIcon name="energy" size={12} strokeWidth={2} />}
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
  const {
    unit, currentHp, isAttacking, isTakingHit, isDying, isActive,
    floatDamage, floatDamageIsCrit, floatHeal, alive,
  } = state;
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
        animation: isAttacking
          ? (side === 'a' ? 'unit-attack-lunge-right 0.42s cubic-bezier(0.22,1,0.36,1) forwards' : 'unit-attack-lunge-left 0.42s cubic-bezier(0.22,1,0.36,1) forwards')
          : isTakingHit
            ? 'card-hit-shake 0.35s ease forwards'
            : isDying
              ? 'unitDeath 0.72s ease forwards, deathGlow 0.72s ease forwards'
              : undefined,
        transform: (!isAttacking && !isTakingHit && !isDying) ? 'translateY(0) scale(1)' : undefined,
        transition: (!isAttacking && !isTakingHit && !isDying)
          ? 'transform 0.18s cubic-bezier(0.22,1,0.36,1), box-shadow 0.3s'
          : undefined,
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
            <ForgeIcon name={FACTION_FORGE_ICON[unit.faction] ?? 'target'} size={30} strokeWidth={1.6} />
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
            <ForgeIcon name="heart" size={10} strokeWidth={1.7} /> {currentHp}
          </span>
          <span style={{ fontSize: 8, color: '#e84040', fontFamily: 'Rajdhani, sans-serif', fontWeight: 700 }}>
            <ForgeIcon name="attack" size={10} strokeWidth={1.7} /> {unit.atk}
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
            }}><ForgeIcon name={(KEYWORD_ICON[kw] as ForgeIconName) ?? 'spark'} size={11} strokeWidth={1.6} /></span>
          ))}
        </div>
      )}

      {/* Floating damage */}
      {floatDamage && (
        <FloatText
          text={floatDamage}
          color={floatDamageIsCrit ? '#e8b84b' : '#ff6b35'}
          isCrit={floatDamageIsCrit}
        />
      )}
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
          {isCrit && <><ForgeIcon name="energy" size={13} strokeWidth={2} /> CRIT </>}{damage} DMG
        </span>
      )}
    </div>
  );
}

// ─── Main Board Engine ─────────────────────────────────────────────────────────
export function BattleBoardEngine({ result, playerName, opponentName, onComplete, speed = 1 }: BattleBoardEngineProps) {
  const finalUnits = result.final_units ?? [];
  const turns      = result.turns ?? [];
  const presentationContract = createBattlePresentationContract(result);
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
  const [reducedEffects, setReducedEffects] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );
  
  // FASE 2 v5: Card Attack Cinematic state — con defender + stats
  const [attackingUnit, setAttackingUnit]   = useState<BattleUnit | null>(null);
  const [defenderUnit,  setDefenderUnit]    = useState<BattleUnit | null>(null);
  const [cinematicDmg,  setCinematicDmg]    = useState<number | undefined>(undefined);
  const [cinematicCrit, setCinematicCrit]   = useState(false);
  const [cinematicKill, setCinematicKill]   = useState(false);
  const [cinematicVisible, setCinematicVisible] = useState(false);

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const boardRef   = useRef<HTMLDivElement>(null);
  const cardRefs   = useRef<Record<number, HTMLDivElement | null>>({});

  const TURN_DUR = Math.max(400, 1200 / speed);
  const HIT_DUR  = Math.max(150, 350 / speed);

  // Respect the operating system preference without changing authoritative timing.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReducedEffects(media.matches);
    media.addEventListener?.('change', update);
    return () => media.removeEventListener?.('change', update);
  }, []);

  useEffect(() => {
    particleEngine.setReducedEffects(reducedEffects);
    return () => particleEngine.setReducedEffects(false);
  }, [reducedEffects]);

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
        
        // FASE 2 v5: Cinematic con attacker + defender + damage stats
        const atkUnit = finalUnits.find(u => u.idx === attackerIdx);
        const defUnit = finalUnits.find(u => u.idx === defenderIdx);
        if (atkUnit) {
          setAttackingUnit(atkUnit);
          setDefenderUnit(defUnit ?? null);
          setCinematicDmg(t.damage);
          setCinematicCrit(t.is_crit);
          setCinematicKill(t.is_kill);
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
            floatDamage: t.damage > 0 ? String(t.damage) : null,
            floatDamageIsCrit: t.damage > 0 && t.is_crit,
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

      // P0.2: event-specific cue; existing event names remain authoritative.
      (t.events ?? []).forEach(ev => {
        const cue = getBattlePresentationCue(ev);
        const cueIdx = cue.target === 'attacker' ? attackerIdx : defenderIdx;
        const pos = cueIdx >= 0 ? getCardCenter(cueIdx) : null;
        if (cue.audioKeyword) AudioEngine.triggerKeyword(cue.audioKeyword);
        if (pos) particleEngine.triggerKeyword(cue.particleKeyword, pos.x, pos.y);
      });

      // Log line
      const logLine = `Turno ${t.turn}: ${t.attacker.name} vs ${t.defender.name} [${t.damage} dmg${t.is_crit ? ' CRIT' : ''}${t.is_kill ? ' KO' : ''}]`;
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
            isTakingHit: false, floatDamage: null, floatDamageIsCrit: false,
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
  const activePresentationState = resolveBattlePresentationState({
    phase: isDone ? 'done' : 'battle',
    hasImpact: Object.values(states).some(s => s.isTakingHit),
    hasCurrentTurn: Boolean(activeTurn),
    hasAttackCue: cinematicVisible,
    result: result.you_won === true ? 'victory' : result.you_won === false ? 'defeat' : 'unknown',
  });

  return (
    <div
      ref={boardRef}
      data-presentation-contract={presentationContract.version}
      data-presentation-state={activePresentationState}
      data-presentation-fallback={reducedEffects ? 'reduced' : presentationContract.fallback}
      data-presentation-state-count={presentationContract.timeline.length}
      style={{ position: 'relative', width: '100%', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'linear-gradient(180deg, #060614 0%, #090920 50%, #06060f 100%)' }}
    >
      {/* Hex grid tactical floor overlay */}
      <div aria-hidden style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='52'%3E%3Cpath d='M30 1 L59 16 L59 36 L30 51 L1 36 L1 16Z' fill='none' stroke='%234a9eff' stroke-width='0.4' stroke-opacity='0.06'/%3E%3C/svg%3E")`,
        backgroundSize: '60px 52px',
      }} />
      {/* Particle canvas overlay */}
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }} />

      {/* FASE 2 v5: Card Attack Cinematic — attacker + defender + damage */}
      <CardAttackCinematic
        unit={attackingUnit}
        defender={defenderUnit}
        visible={cinematicVisible}
        onDone={() => setCinematicVisible(false)}
        damage={cinematicDmg}
        isCrit={cinematicCrit}
        isKill={cinematicKill}
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
        {/* Zone fog layer */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
          background: 'linear-gradient(180deg, rgba(192,57,43,0.06) 0%, transparent 100%)',
        }}>
          <div style={{ position:'absolute', bottom:0, left:'-10%', width:'60%', height:32,
            background:'radial-gradient(ellipse at center, rgba(192,57,43,0.12), transparent 70%)',
            animation:'board-zone-fog 5s ease-in-out infinite', borderRadius:'50%' }} />
          <div style={{ position:'absolute', bottom:0, right:'-5%', width:'50%', height:28,
            background:'radial-gradient(ellipse at center, rgba(192,57,43,0.08), transparent 70%)',
            animation:'board-zone-fog 6.5s ease-in-out infinite 1.5s', borderRadius:'50%' }} />
        </div>
        {/* Zone label bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, position:'relative', zIndex:1,
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
            <ForgeIcon name="attack" size={12} strokeWidth={1.7} style={{ opacity: 0.7 }} />
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
          animation: 'center-divider-pulse 3s ease-in-out infinite',
        }} />
      )}

      {/* Player zone (side A — bottom) */}
      <div style={{
        padding: '8px 12px 12px',
        background: 'linear-gradient(0deg, rgba(74,158,255,0.10) 0%, rgba(74,158,255,0.04) 100%)',
        borderTop: '1px solid rgba(74,158,255,0.30)',
        position: 'relative',
      }}>
        {/* Zone fog layer */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden',
          background: 'linear-gradient(0deg, rgba(74,158,255,0.06) 0%, transparent 100%)',
        }}>
          <div style={{ position:'absolute', top:0, left:'-10%', width:'60%', height:28,
            background:'radial-gradient(ellipse at center, rgba(74,158,255,0.1), transparent 70%)',
            animation:'board-zone-fog 4.5s ease-in-out infinite 0.8s', borderRadius:'50%' }} />
          <div style={{ position:'absolute', top:0, right:'-5%', width:'50%', height:24,
            background:'radial-gradient(ellipse at center, rgba(74,158,255,0.07), transparent 70%)',
            animation:'board-zone-fog 7s ease-in-out infinite 2.2s', borderRadius:'50%' }} />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 8, position: 'relative', zIndex: 1 }}>
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
            <ForgeIcon name="shield" size={12} strokeWidth={1.7} style={{ opacity: 0.7 }} />
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
        @keyframes unit-attack-lunge-right {
          0%   { transform:translateX(0) scale(1); filter:brightness(1); }
          30%  { transform:translateX(30px) scale(1.1); filter:brightness(1.7) saturate(1.4); }
          60%  { transform:translateX(14px) scale(1.04); filter:brightness(1.2); }
          100% { transform:translateX(0) scale(1); filter:brightness(1); }
        }
        @keyframes unit-attack-lunge-left {
          0%   { transform:translateX(0) scale(1); filter:brightness(1); }
          30%  { transform:translateX(-30px) scale(1.1); filter:brightness(1.7) saturate(1.4); }
          60%  { transform:translateX(-14px) scale(1.04); filter:brightness(1.2); }
          100% { transform:translateX(0) scale(1); filter:brightness(1); }
        }
        @keyframes card-hit-shake {
          0%,100% { transform:translateX(0) rotate(0deg); filter:brightness(1); }
          10%     { transform:translateX(-9px) rotate(-2.5deg); filter:brightness(2.5) saturate(2); }
          25%     { transform:translateX(7px) rotate(1.8deg); filter:brightness(1.5); }
          42%     { transform:translateX(-5px) rotate(-1.2deg); }
          60%     { transform:translateX(3px) rotate(0.7deg); }
          78%     { transform:translateX(-2px) rotate(-0.3deg); }
        }
        @keyframes board-zone-fog {
          0%,100% { opacity:0.3; transform:translateX(-8px) scaleX(1); }
          50%     { opacity:0.55; transform:translateX(8px) scaleX(1.04); }
        }
        @keyframes center-divider-pulse {
          0%,100% { opacity:0.65; box-shadow:0 0 8px rgba(232,184,75,0.3); }
          50%     { opacity:1; box-shadow:0 0 20px rgba(232,184,75,0.7),0 0 40px rgba(232,184,75,0.2); }
        }
      `}</style>
    </div>
  );
}
