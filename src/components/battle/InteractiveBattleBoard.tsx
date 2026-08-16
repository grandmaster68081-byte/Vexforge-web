// VexForge InteractiveBattleBoard v2.0 — DOMINION ARENA EDITION
// Épica visual overhaul: arena cinematica, cartas grandes, haz de ataque,
// zonas de facción, partículas atmosféricas. Inspirado en Yu-Gi-Oh Master Duel.

import { useRef, useCallback, useState, useEffect, type CSSProperties } from 'react';
import type { RealBattleResult, BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { CardAttackCinematic } from './CardAttackCinematic';
import { DamageFloatLayer, useDamageFloats } from './BattleEffects';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';

// Faction-to-icon map — KEYWORD_ICON maps mechanics (Guard, Surge…), not factions
const FACTION_ICON: Record<string, ForgeIconName> = {
  Guerrero:    'attack',
  Mago:        'spark',
  'Paladín':   'shield',
  'Pícaro':    'target',
  Explorador:  'target',
  Comerciante: 'coin',
};
import { useBattleStateMachine, type TurnPhase, type TurnSnapshot } from '../../lib/battleStateMachine';
import { KeywordChip } from './KeywordTooltip';
import { AudioEngine } from '../../lib/audioEngine';
import { KeywordActivationFX, useKeywordFX } from './KeywordActivationFX';

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
// ─── VX.3: Segmented HP Bar ────────────────────────────────────────────────────
function EpicHpBar({ hp, max, color }: { hp: number; max: number; color: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const col = HP_COLOR(pct);
  const critical = pct < 0.25;
  const segments = 10;
  const filled = Math.round(pct * segments);
  return (
    <div style={{ position: 'relative' }}>
      {/* VX.3: Segmented bar */}
      <div style={{ display: 'flex', gap: 2, width: '100%' }}>
        {Array.from({ length: segments }).map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 7, borderRadius: 2,
            background: i < filled
              ? `linear-gradient(90deg,${col},${col}bb)`
              : 'rgba(255,255,255,0.06)',
            boxShadow: i < filled && i === filled - 1 ? `0 0 6px ${col}99` : 'none',
            border: `1px solid ${i < filled ? color + '44' : 'rgba(255,255,255,0.04)'}`,
            transition: 'background 0.4s ease, box-shadow 0.4s ease',
            animation: critical && i < filled ? 'hp-critical-pulse 0.8s ease-in-out infinite' : 'none',
          }} />
        ))}
      </div>
    </div>
  );
}

// ─── VX.3: Turn Indicator Segments ────────────────────────────────────────────
function TurnIndicatorSegments({ current, total }: { current: number; total: number }) {
  const segs = Math.min(total, 18);
  const done = Math.min(current, segs);
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' }}>
      {Array.from({ length: segs }).map((_, i) => (
        <div key={i} style={{
          width: 14, height: 4, borderRadius: 2,
          background: i < done
            ? (i < segs * 0.4 ? '#3ddc84' : i < segs * 0.7 ? '#e8b84b' : '#e84040')
            : 'rgba(255,255,255,0.06)',
          boxShadow: i === done - 1 ? '0 0 8px rgba(232,184,75,0.9)' : 'none',
          transition: 'all 0.3s ease',
        }} />
      ))}
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
        : (!isAnimating ? 'card-float-idle 4s ease-in-out infinite' : undefined),
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
        !unit.alive ? 'card-dissolve' : undefined,
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
            <ForgeIcon name={FACTION_ICON[unit.faction] ?? 'attack'} size={cs.iconFz} strokeWidth={1.6} />
          </div>
        )}
        {/* Rarity shimmer overlay — Legendary/Mythic/Founder: full shimmer; Epic/Rare: subtle; others: none */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic' || unit.rarity === 'Founder') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg, transparent 25%, ${rarColor}44 45%, rgba(255,255,255,0.18) 50%, ${rarColor}22 55%, transparent 75%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 2.0s ease-in-out infinite',
          }} />
        )}
        {(unit.rarity === 'Epic') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg, transparent 30%, ${rarColor}28 48%, rgba(255,255,255,0.09) 50%, transparent 70%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 3.2s ease-in-out infinite',
          }} />
        )}
        {(unit.rarity === 'Rare') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg, transparent 35%, ${rarColor}18 48%, rgba(255,255,255,0.06) 50%, transparent 65%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 4.5s ease-in-out infinite',
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
          <ForgeIcon name={FACTION_ICON[unit.faction] ?? 'attack'} size={14} strokeWidth={1.6} />
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
          <span title="ATK" style={{ color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="attack" size={10} strokeWidth={1.7} /> {unit.atk}</span>
          <span title="DEF" style={{ color: '#4a9eff', display: 'flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="shield" size={10} strokeWidth={1.7} /> {unit.def}</span>
          <span title="SPD" style={{ color: '#e8b84b', display: 'flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="energy" size={10} strokeWidth={1.7} /> {unit.spd}</span>
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
          <ForgeIcon name="target" size={30} strokeWidth={1.6} />
        </div>
      )}
    </div>
  );
}

// Keyword colour map for turn log event badges
const KW_LOG_COLOR: Record<string, string> = {
  Guard: '#4a9eff', Drain: '#3ddc84', Lifesteal: '#3ddc84',
  Surge: '#e8b84b', Veil: '#a855f7', Forge: '#ff6b35',
  Consecrate: '#ffd700', Flux: '#a855f7', Resonance: '#b08af8',
  Poison: '#a855f7', DoubleStrike: '#ff6b35', Rush: '#e8b84b',
};

// ─── Turn Log Entry ─────────────────────────────────────────────────────────────
function TurnLogEntry({ snap, isLatest }: { snap: TurnSnapshot; isLatest: boolean }) {
  const t = snap.data;
  const isPlayer = t.atk_side === 'a';
  const col = isPlayer ? '#4a9eff' : '#e84040';
  const dmgCol = t.is_crit ? '#e8b84b' : '#ff6b35';

  // Derive active keyword events from this turn's data
  const activeKws: string[] = [];
  if (t.attacker?.keywords) {
    for (const kw of t.attacker.keywords) {
      if (kw === 'Drain' || kw === 'Lifesteal') { if (t.lifesteal_heal > 0) activeKws.push(kw); }
      else if (kw === 'Guard') { /* guard shown on defender logic */ }
      else if (kw === 'Surge' || kw === 'Rush') activeKws.push(kw);
      else if (kw === 'DoubleStrike') activeKws.push(kw);
      else if (kw === 'Forge') activeKws.push(kw);
      else if (kw === 'Consecrate') activeKws.push(kw);
    }
  }
  // Events from the snap (guard block, poison, etc.)
  const events = (t as any).events as Array<{ type: string; dmg?: number; heal?: number }> ?? [];

  return (
    <div
      className={isLatest ? 'tl-entry-new' : undefined}
      style={{
        padding: '6px 10px', borderRadius: 8,
        background: isLatest
          ? `linear-gradient(90deg, ${col}0d, rgba(255,255,255,0.03))`
          : 'transparent',
        border: `1px solid ${isLatest ? col + '30' : 'transparent'}`,
        transition: 'background 0.3s',
      }}>
      {/* Main row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap', fontSize: 10, fontFamily: '"Rajdhani",sans-serif' }}>
        {/* Turn badge */}
        <span style={{ color: '#4a4a6a', minWidth: 22, fontFamily: '"IBM Plex Mono",monospace', fontSize: 8 }}>T{t.turn}</span>
        <ForgeIcon name={isPlayer ? "shield" : "skull"} size={10} strokeWidth={1.6} />
        {/* Attacker — faction icon + name */}
        <span style={{ color: col, fontWeight: 700, letterSpacing: '0.04em', maxWidth: 68, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.attacker?.name}>
          <ForgeIcon name={FACTION_ICON[t.attacker?.faction ?? ''] ?? 'attack'} size={11} strokeWidth={1.6} /> {t.attacker?.name ?? '?'}
        </span>
        <span style={{ color: '#3a3a5a', fontSize: 9 }}>vs</span>
        {/* Defender */}
        <span style={{ color: '#7a7a9a', fontWeight: 600, maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.defender?.name}>
          {t.defender?.name ?? '?'}
        </span>
        {/* Damage */}
        <span style={{ color: dmgCol, fontWeight: t.is_crit ? 900 : 600, fontSize: 11, textShadow: t.is_crit ? `0 0 8px ${dmgCol}` : 'none' }}>
          <ForgeIcon name={t.is_crit ? "attack" : "target"} size={10} strokeWidth={1.8} /> {t.damage}
        </span>
        {/* Badge row */}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          {t.is_crit && (
            <span style={{ fontSize: 7, color: '#e8b84b', background: 'rgba(232,184,75,0.18)', borderRadius: 4, padding: '1px 5px', fontWeight: 800, letterSpacing: '0.08em', border: '1px solid rgba(232,184,75,0.35)' }}>
              CRIT
            </span>
          )}
          {t.is_kill && (
            <span style={{ fontSize: 7, color: '#ff4444', background: 'rgba(255,68,68,0.18)', borderRadius: 4, padding: '1px 5px', fontWeight: 800, border: '1px solid rgba(255,68,68,0.35)' }}>
              <ForgeIcon name="skull" size={10} strokeWidth={1.7} /> KO
            </span>
          )}
          {t.lifesteal_heal > 0 && (
            <span style={{ fontSize: 7, color: '#3ddc84', background: 'rgba(61,220,132,0.15)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: '1px solid rgba(61,220,132,0.35)' }}>
              <ForgeIcon name="heart" size={10} strokeWidth={1.7} /> +{t.lifesteal_heal} Drain
            </span>
          )}
          {/* Keyword event badges */}
          {activeKws.filter(kw => kw !== 'Drain' && kw !== 'Lifesteal').map(kw => {
            const c = KW_LOG_COLOR[kw] ?? '#8888aa';
            return (
              <span key={kw} style={{ fontSize: 7, color: c, background: `${c}18`, borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: `1px solid ${c}35` }}>
                <ForgeIcon name={(KEYWORD_ICON[kw] as ForgeIconName) ?? 'spark'} size={10} strokeWidth={1.7} /> {kw}
              </span>
            );
          })}
          {/* Damage-over-time events (poison, etc.) */}
          {events.filter(e => e.type === 'poison_tick').map((e, i) => (
            <span key={i} style={{ fontSize: 7, color: '#a855f7', background: 'rgba(168,85,247,0.15)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: '1px solid rgba(168,85,247,0.35)' }}>
              <ForgeIcon name="skull" size={10} strokeWidth={1.7} /> -{e.dmg} Poison
            </span>
          ))}
          {events.filter(e => e.type === 'shield_block').map((_e, i) => (
            <span key={i} style={{ fontSize: 7, color: '#4a9eff', background: 'rgba(74,158,255,0.15)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: '1px solid rgba(74,158,255,0.35)' }}>
              <ForgeIcon name="shield" size={10} strokeWidth={1.7} /> Guard
            </span>
          ))}
          {events.filter(e => e.type === 'lifesteal').map((e, i) => (
            <span key={i} style={{ fontSize: 7, color: '#3ddc84', background: 'rgba(61,220,132,0.15)', borderRadius: 4, padding: '1px 5px', fontWeight: 700, border: '1px solid rgba(61,220,132,0.35)' }}>
              <ForgeIcon name="heart" size={10} strokeWidth={1.7} /> +{e.heal}
            </span>
          ))}
        </div>
      </div>
      {/* Defender remaining HP bar — only on latest */}
      {isLatest && t.defender && (t.defender as any).hp != null && (t.defender as any).max_hp != null && (
        <div style={{ marginTop: 3, height: 2, borderRadius: 1, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 1,
            width: `${Math.max(0, ((t.defender as any).hp / (t.defender as any).max_hp) * 100)}%`,
            background: (() => {
              const pct = (t.defender as any).hp / (t.defender as any).max_hp;
              return pct > 0.6 ? '#3ddc84' : pct > 0.3 ? '#e8b84b' : '#e84040';
            })(),
            transition: 'width 0.4s ease',
          }} />
        </div>
      )}
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
        onClick={() => { AudioEngine.sfxCardSelect?.(); try { (AudioEngine as any).sfxTurnStart?.(); } catch{} onAdvance(); }}
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
        {phase === 'ANIMATING' ? 'Resolviendo…' : `ATACAR (${remaining})`}
      </button>
      {isAutoOn ? (
        <button onClick={onStop} style={{
          padding: '9px 14px', borderRadius: 8,
          background: 'rgba(232,184,75,0.12)', border: '1px solid rgba(232,184,75,0.4)',
          color: '#e8b84b', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
          cursor: 'pointer',
        }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ForgeIcon name="pause" size={12} strokeWidth={1.8} /> Pausar</span></button>
      ) : (
        <button onClick={() => { AudioEngine.sfxCardSelect?.(); onAutoPlay(); }}
          disabled={phase === 'ANIMATING'}
          style={{
            padding: '9px 14px', borderRadius: 8,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
            color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11,
            cursor: phase === 'ANIMATING' ? 'not-allowed' : 'pointer',
          }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ForgeIcon name="play" size={12} strokeWidth={1.8} /> Auto</span></button>
      )}
    </div>
  );
}

// ─── Result Banner épico — GL.1: Revenge/Rematch button ─────────────────────────
function ResultBanner({ won, eloChange, onDismiss, onPlayAgain }: {
  won: boolean; eloChange: number; onDismiss: () => void; onPlayAgain?: () => void;
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
        <ForgeIcon name={won ? "trophy" : "skull"} size={72} strokeWidth={1.4} />
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
        <ForgeIcon name="spark" size={12} strokeWidth={1.4} style={{ color: col, opacity: 0.5 }} />
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
      {/* GL.1 — Revenge / Rematch button */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
        {onPlayAgain && (
          <button onClick={onPlayAgain} style={{
            padding: '13px 28px', borderRadius: 12,
            background: won
              ? 'linear-gradient(135deg,#2a7a4a,#1a5a32)'
              : 'linear-gradient(135deg,#8b1a8b,#5a0e5a)',
            border: `1px solid ${won ? 'rgba(61,220,132,0.4)' : 'rgba(168,85,247,0.4)'}`,
            color: '#fff',
            fontFamily: '"Cinzel",serif', fontWeight: 800, fontSize: 13,
            cursor: 'pointer', letterSpacing: '0.08em',
            boxShadow: won
              ? '0 4px 18px rgba(61,220,132,0.3)'
              : '0 4px 18px rgba(168,85,247,0.3)',
            transition: 'all 0.2s ease',
            animation: 'result-btn-appear 0.4s 0.35s ease both',
            opacity: 0,
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.03)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}>
            {won ? <><ForgeIcon name="refresh" size={15} strokeWidth={1.7} /> Revancha</> : <><ForgeIcon name="attack" size={15} strokeWidth={1.7} /> Revancha</>}
          </button>
        )}
        <button onClick={onDismiss} style={{
          padding: '13px 36px', borderRadius: 12,
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
          {won ? <><ForgeIcon name="attack" size={15} strokeWidth={1.7} /> Continuar</> : 'Salir'}
        </button>
      </div>
    </div>
  );
}

// ─── Partículas atmosféricas de la arena ────────────────────────────────────────
function ArenaParticles({ faction }: { faction: string }) {
  const zone = FACTION_ZONE[faction] ?? FACTION_ZONE['default'];
  const runes: ForgeIconName[] = ['spark', 'fusion', 'shield', 'spark', 'crown', 'target'];
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
        }}><ForgeIcon name={r} size={(i % 3) * 4 + 8} strokeWidth={1.1} /></div>
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
  onPlayAgain?: () => void;   // GL.1 — Revenge/Rematch callback
}

export function InteractiveBattleBoard({
  result, playerName = 'Tú', opponentName = 'Rival', onDismiss, onPlayAgain,
}: InteractiveBattleBoardProps) {
  const [state, actions] = useBattleStateMachine(result);
  const [beamVisible, setBeamVisible] = useState(false);
  const [hitSide, setHitSide] = useState<'player' | 'opponent' | null>(null);
  const [screenFlash, setScreenFlash] = useState(false);
  const dropZoneRef   = useRef<HTMLDivElement | null>(null);
  const dragRef       = useRef({ active: false, startX: 0, startY: 0 });
  const musicPhaseRef = useRef<'none' | 'intro' | 'mid' | 'last_stand'>('none');
  
  // FASE 2: Card Attack Cinematic state
  const [attackingUnit, setAttackingUnit] = useState<BattleUnit | null>(null);
  const [defenderUnit, setDefenderUnit] = useState<BattleUnit | null>(null);
  const [cinematicDamage, setCinematicDamage] = useState<number | undefined>(undefined);
  const [cinematicIsCrit, setCinematicIsCrit] = useState(false);
  const [cinematicIsKill, setCinematicIsKill] = useState(false);
  const [cinematicVisible, setCinematicVisible] = useState(false);
  const { floats } = useDamageFloats(state.currentTurn ?? null);
  // BA.1 / VX.1: Keyword activation FX
  const { effects: kwEffects, triggerKeywordFX } = useKeywordFX();

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
      
      // FASE 2 v5: Cinematic para TODAS las rarezas con attacker + defender
      const attackerUnit  = isPlayerAtk ? playerUnit : opponentUnit;
      const defUnit       = isPlayerAtk ? opponentUnit : playerUnit;
      if (attackerUnit) {
        setAttackingUnit(attackerUnit);
        setDefenderUnit(defUnit ?? null);
        setCinematicDamage(state.currentTurn.damage);
        setCinematicIsCrit(state.currentTurn.is_crit);
        setCinematicIsKill(state.currentTurn.is_kill);
        setCinematicVisible(true);
      }
      
      // SFX por tipo de evento — kill, crit, poison, shield break
      try {
        const events = state.currentTurn.events ?? [];
        const hasPoisonTick  = events.some(e => e.type === 'poison_tick');
        const hasShieldBlock = events.some(e => e.type === 'shield_block');
        const hasPoisoned    = events.some(e => e.type === 'poisoned');

        // AU.0 sfxDrawCard — fires at start of player's attacking turn
        if (isPlayerAtk) { try { (AudioEngine as any).sfxDrawCard?.(); } catch { /* silent */ } }

        if (state.currentTurn.is_kill) {
          (AudioEngine as any).sfxKillV2?.();
        } else if (hasPoisonTick) {
          (AudioEngine as any).sfxPoisonTick?.();
        } else if (hasShieldBlock) {
          (AudioEngine as any).sfxShieldBreak?.();
        } else if (hasPoisoned) {
          (AudioEngine as any).sfxPoisonApply?.();
        } else if (state.currentTurn.is_crit) {
          (AudioEngine as any).sfxCritV2?.();
        }

        // BA.1 / VX.1: Trigger keyword activation FX for this turn
        const attackerKws = (isPlayerAtk ? playerUnit : opponentUnit)?.keywords ?? [];
        triggerKeywordFX(events, state.currentTurn.atk_side, attackerKws);
      } catch { /* silent */ }

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

  // Document-level fallback: catches pointerup when pointer escapes the window
  // (mobile browser chrome, multi-touch, swipe-to-dismiss gesture, etc.)
  useEffect(() => {
    const globalCancel = () => {
      if (dragRef.current.active) {
        dragRef.current.active = false;
        actions.endDrag(false);
      }
    };
    document.addEventListener('pointerup',     globalCancel, { passive: true });
    document.addEventListener('pointercancel', globalCancel, { passive: true });
    return () => {
      document.removeEventListener('pointerup',     globalCancel);
      document.removeEventListener('pointercancel', globalCancel);
    };
  }, [actions]);

  // ─── Combat phase music ───────────────────────────────────────────────────────
  useEffect(() => {
    musicPhaseRef.current = 'intro';
    try { (AudioEngine as any).startCombatMusic?.('intro'); } catch { /* silent */ }
    return () => {
      musicPhaseRef.current = 'none';
      try { (AudioEngine as any).stopCombatMusic?.(); } catch { /* silent */ }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state.phase === 'COMPLETE' && musicPhaseRef.current !== 'none') {
      musicPhaseRef.current = 'none';
      try { (AudioEngine as any).stopCombatMusic?.(); } catch { /* silent */ }
    }
  }, [state.phase]);

  useEffect(() => {
    if (musicPhaseRef.current === 'none') return;
    const playerPct   = state.playerMaxHp  > 0 ? state.playerHp  / state.playerMaxHp  : 1;
    const opponentPct = state.opponentMaxHp > 0 ? state.opponentHp / state.opponentMaxHp : 1;
    const avgPct = (playerPct + opponentPct) / 2;
    if ((playerPct < 0.30 || opponentPct < 0.30) && musicPhaseRef.current !== 'last_stand') {
      musicPhaseRef.current = 'last_stand';
      try { (AudioEngine as any).startCombatMusic?.('last_stand'); } catch { /* silent */ }
    } else if (avgPct < 0.60 && musicPhaseRef.current === 'intro') {
      musicPhaseRef.current = 'mid';
      try { (AudioEngine as any).startCombatMusic?.('mid'); } catch { /* silent */ }
    }
  }, [state.playerHp, state.opponentHp, state.playerMaxHp, state.opponentMaxHp]);

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
        opacity: 0.22,
        filter: 'saturate(1.6) brightness(0.65)',
        transition: 'opacity 1s ease',
      }} />
      {/* Faction color aura — radial glow from center */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, ${playerZone.primary}0a 0%, transparent 70%)`,
        animation: 'faction-aura-breathe 4s ease-in-out infinite',
      }} />
      {/* Dark overlay on top of arena image */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 130% 130% at 50% 50%, rgba(5,5,18,0.5) 0%, rgba(3,3,10,0.9) 100%)',
      }} />
      {/* Atmospheric scan lines — cinematic feel */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.014) 0px, rgba(255,255,255,0.014) 1px, transparent 1px, transparent 3px)',
        backgroundSize: '100% 3px',
      }} />
      {/* Corner vignette */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 110% 110% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)',
      }} />
      {/* Faction ambient particles — 6 floating rune orbs */}
      {[0,1,2,3,4,5].map(i => (
        <div key={`fap-${i}`} style={{
          position: 'absolute', zIndex: 1, pointerEvents: 'none',
          width: 4 + (i % 3), height: 4 + (i % 3),
          borderRadius: '50%',
          background: playerZone.primary,
          opacity: 0,
          left: `${10 + i * 15}%`,
          bottom: `${15 + (i % 3) * 12}%`,
          boxShadow: `0 0 8px ${playerZone.primary}, 0 0 16px ${playerZone.primary}55`,
          animation: `hero-particle-rise ${3 + i * 0.7}s ease-out ${i * 0.9}s infinite`,
        }} />
      ))}

      {/* BA.1 / VX.1: Keyword Activation FX Overlay — shown over player card */}
      {kwEffects.length > 0 && (
        <div style={{
          position: 'absolute', bottom: '28%', left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 25, pointerEvents: 'none',
        }}>
          <KeywordActivationFX effects={kwEffects} />
        </div>
      )}

      {/* FASE 2: Card Attack Cinematic Overlay */}
      <CardAttackCinematic
        unit={attackingUnit}
        defender={defenderUnit}
        visible={cinematicVisible}
        onDone={() => setCinematicVisible(false)}
        damage={cinematicDamage}
        isCrit={cinematicIsCrit}
        isKill={cinematicIsKill}
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

        {/* VX.3 — Turn counter + segment indicator */}
        <div style={{ textAlign: 'center', flexShrink: 0 }}>
          <div style={{
            fontFamily: '"IBM Plex Mono",monospace', fontSize: 10,
            animation: 'turn-counter-flash 2s ease-in-out infinite',
            letterSpacing: '0.08em', marginBottom: 4,
          }}>
            T {state.revealedTurns.length} / {state.totalTurns}
          </div>
          {/* VX.3: Turn progress segments */}
          <TurnIndicatorSegments current={state.revealedTurns.length} total={state.totalTurns} />
          <div style={{
            fontSize: 8, color: state.phase === 'ANIMATING' ? '#e8b84b' : state.phase === 'COMPLETE' ? '#3ddc84' : '#5a5a7a',
            fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.12em',
            textTransform: 'uppercase', transition: 'color 0.3s',
            marginTop: 2,
          }}>
            {state.phase === 'IDLE'      && 'LISTO'}
            {state.phase === 'SELECTING' && 'APUNTAR'}
            {state.phase === 'ANIMATING' && 'RESOLVIENDO'}
            {state.phase === 'COMPLETE'  && 'FIN'}
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

        {/* FASE 2: Floating damage numbers — rendered over the whole arena */}
        <DamageFloatLayer floats={floats} playerSide="right" />

        {/* FASE 2: Impact ring — flashes at hit zone */}
        {hitSide && (
          <div style={{
            position: 'absolute',
            top: hitSide === 'opponent' ? '18%' : '72%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 100, height: 100,
            borderRadius: '50%',
            border: `3px solid ${hitSide === 'opponent' ? oppZone.primary : playerZone.primary}cc`,
            boxShadow: `0 0 20px ${hitSide === 'opponent' ? oppZone.primary : playerZone.primary}88`,
            pointerEvents: 'none',
            zIndex: 20,
          }} className="impact-ring" />
        )}

        {/* FASE 2: Arena atmospheric elements — smoke + lightning */}
        <div className="arena-smoke" style={{
          position: 'absolute', bottom: 0, left: '10%', width: 80, height: 60,
          borderRadius: '50%', background: `radial-gradient(ellipse, ${playerZone.primary}18 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div className="arena-smoke" style={{
          position: 'absolute', bottom: 0, right: '12%', width: 100, height: 70,
          borderRadius: '50%', background: `radial-gradient(ellipse, ${playerZone.primary}12 0%, transparent 70%)`,
          pointerEvents: 'none', zIndex: 0, animationDelay: '-1.5s',
        }} />
        <div className="arena-lightning" style={{
          position: 'absolute', top: '8%', left: '5%', width: 2, height: 40,
          background: `linear-gradient(180deg, transparent, ${oppZone.primary}cc, transparent)`,
          pointerEvents: 'none', zIndex: 0,
        }} />
        <div className="arena-lightning" style={{
          position: 'absolute', top: '12%', right: '7%', width: 2, height: 28,
          background: `linear-gradient(180deg, transparent, ${oppZone.primary}aa, transparent)`,
          pointerEvents: 'none', zIndex: 0, animationDelay: '-2s',
        }} />

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
            <ForgeIcon name="attack" size={12} strokeWidth={1.7} /> {opponentName} · {oppFaction}
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
              <ForgeIcon name="skull" size={36} strokeWidth={1.4} />
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
            <div style={{ position: 'relative' }} className="avatar-ring-v2">
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
            </div>
          ) : (
            <div style={{ width: 170, height: 188, border: `2px dashed ${playerZone.primary}30`, borderRadius: 12,
              background: `${playerZone.primary}05`, display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: `${playerZone.primary}30`, fontSize: 36 }}><ForgeIcon name="attack" size={36} strokeWidth={1.4} /></div>
          )}
          <div style={{
            fontSize: 9, color: playerZone.primary + 'cc', letterSpacing: '0.2em',
            fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
            background: 'rgba(0,0,0,0.5)', border: `1px solid ${playerZone.primary}33`,
            borderRadius: 20, padding: '3px 14px',
            boxShadow: `0 0 8px ${playerZone.primary}22`,
            backdropFilter: 'blur(4px)',
          }}>
            <ForgeIcon name="shield" size={12} strokeWidth={1.7} /> {playerName} · {playerFaction}
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
            onPlayAgain={onPlayAgain}
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
        ><ForgeIcon name="close" size={14} /> Salir</button>
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <ForgeIcon name="chevron-right" size={9} strokeWidth={2} /> LOG DE BATALLA
          </span>
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
