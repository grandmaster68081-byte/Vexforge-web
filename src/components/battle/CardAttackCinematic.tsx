// VEXFORGE — Card Attack Cinematic v5.0 — TIER-1 DCCG MASTER EDITION
// Split-panel cinematic: Attacker vs Defender, card art prominente, animaciones por facción.
// Cada carta tiene su propia cinemática única. Inspirado en Yu-Gi-Oh Master Duel + Hearthstone.
// Cada rareza y facción tiene efectos visuales únicos.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';
import { getBattleCardActorProfile } from '../../lib/battlePresentation';

interface CardAttackCinematicProps {
  unit: BattleUnit | null;
  defender?: BattleUnit | null;
  visible: boolean;
  onDone: () => void;
  damage?: number;
  isCrit?: boolean;
  isKill?: boolean;
}

// Duration por rareza — todos tienen cinemática propia
const RARITY_DURATION: Record<string, number> = {
  Common:    380,
  Uncommon:  500,
  Rare:      750,
  Epic:      950,
  Legendary: 1200,
  Mythic:    1500,
  Founder:   1300,
};

// Colores de facción
const FACTION_COLOR: Record<string, string> = {
  Guerrero:    '#e84040',
  Mago:        '#7b4fd4',
  'Pícaro':    '#3dc96b',
  'Paladín':   '#e8b84b',
  Explorador:  '#3dc96b',
  Comerciante: '#e8b84b',
  default:     '#4a9eff',
};

const FACTION_SECONDARY: Record<string, string> = {
  Guerrero:    '#ff6060',
  Mago:        '#b08af8',
  'Pícaro':    '#5de88a',
  'Paladín':   '#f5d585',
  Explorador:  '#5de88a',
  Comerciante: '#f5d585',
  default:     '#7abcff',
};

const FACTION_ICON: Record<string, ForgeIconName> = {
  Guerrero:    'attack',
  Mago:        'spark',
  'Pícaro':    'target',
  'Paladín':   'shield',
  Explorador:  'target',
  Comerciante: 'coin',
  default:     'energy',
};

// Attack label por facción
const FACTION_ATTACK_LABEL: Record<string, string> = {
  Guerrero:    'GOLPE BRUTAL',
  Mago:        'HECHIZO ARCANO',
  'Pícaro':    'ATAQUE FURTIVO',
  'Paladín':   'GOLPE SAGRADO',
  Explorador:  'DISPARO PRECISO',
  Comerciante: 'CONTRAATAQUE',
  default:     'ATAQUE',
};

// Gradient BG por facción
const FACTION_BG: Record<string, string> = {
  Guerrero:    'radial-gradient(ellipse at center, #3d0a0a 0%, #1a0000 40%, #050008 100%)',
  Mago:        'radial-gradient(ellipse at center, #180a3d 0%, #050018 40%, #050008 100%)',
  'Pícaro':    'radial-gradient(ellipse at center, #0a3d1a 0%, #001a0a 40%, #050008 100%)',
  'Paladín':   'radial-gradient(ellipse at center, #3d2a00 0%, #1a1000 40%, #050008 100%)',
  Explorador:  'radial-gradient(ellipse at center, #0a3d1a 0%, #001a0a 40%, #050008 100%)',
  Comerciante: 'radial-gradient(ellipse at center, #3d2a00 0%, #1a1000 40%, #050008 100%)',
  default:     'radial-gradient(ellipse at center, #0a1e3d 0%, #000a1a 40%, #050008 100%)',
};

// Rarity gradient overlay
const RARITY_BG_OVERLAY: Record<string, string> = {
  Common:    'rgba(139,139,158,0.08)',
  Uncommon:  'rgba(61,220,132,0.10)',
  Rare:      'rgba(74,158,255,0.14)',
  Epic:      'rgba(168,85,247,0.18)',
  Legendary: 'rgba(232,184,75,0.22)',
  Mythic:    'rgba(255,68,68,0.24)',
  Founder:   'rgba(255,107,53,0.22)',
};

// ─── Particle types ──────────────────────────────────────────────────────────
interface Particle {
  id: number; x: number; y: number; size: number;
  dur: number; delay: number; anim: string;
  color: string; shape: 'circle' | 'diamond' | 'star' | 'spark' | 'rune';
  tx?: number; ty?: number; rot?: number;
}

let _pid = 0;
function makeParticles(rarity: string, rarColor: string, factionColor: string): Particle[] {
  const cfgMap: Record<string, { count: number; anims: string[]; colors: string[]; shapes: Particle['shape'][] }> = {
    Common:    { count: 8,  anims: ['cac-ptcl-rise'],    colors: ['#a0a0c0','#c0c0e0','#e0e0ff'],                              shapes: ['circle','spark'] },
    Uncommon:  { count: 12, anims: ['cac-ptcl-rise'],    colors: [factionColor, `${factionColor}99`,'#d0d0f0'],                shapes: ['circle','diamond'] },
    Rare:      { count: 18, anims: ['cac-ptcl-rise'],    colors: ['#4a9eff','#7abcff','#c0e0ff','#ffffff'],                    shapes: ['circle','diamond','star'] },
    Epic:      { count: 22, anims: ['cac-ptcl-swirl'],   colors: ['#a855f7','#c084fc','#e9d5ff','#7c3aed','#ffffff'],          shapes: ['diamond','star','circle','rune'] },
    Legendary: { count: 30, anims: ['cac-ptcl-burst'],   colors: ['#f59e0b','#fde68a','#ffffff','#e8b84b','#fbbf24','#ffdd80'],shapes: ['star','diamond','circle','spark','rune'] },
    Mythic:    { count: 38, anims: ['cac-ptcl-chaos'],   colors: ['#ff4444','#ff8888','#ffffff','#ffcc00','#ff6600','#ff2200','#ff0088'],shapes: ['star','circle','diamond','spark','rune'] },
    Founder:   { count: 30, anims: ['cac-ptcl-ember'],   colors: ['#ff6b35','#ff9d6b','#ffffff','#ffd700','#ff4500','#ffaa44'],shapes: ['diamond','star','circle','spark'] },
  };
  const cfg = cfgMap[rarity] ?? cfgMap.Rare;
  return Array.from({ length: cfg.count }, (_, i) => ({
    id: ++_pid,
    x:     Math.random() * 88 + 6,
    y:     Math.random() * 88 + 6,
    size:  Math.random() * (rarity === 'Mythic' ? 16 : rarity === 'Legendary' ? 12 : 9) + 4,
    dur:   Math.random() * 0.8 + (rarity === 'Mythic' ? 1.1 : rarity === 'Legendary' ? 0.9 : 0.7),
    delay: Math.random() * 0.4,
    anim:  cfg.anims[i % cfg.anims.length],
    color: cfg.colors[i % cfg.colors.length] ?? rarColor,
    shape: cfg.shapes[i % cfg.shapes.length],
    tx: (Math.random() - 0.5) * 140,
    ty: (Math.random() - 0.5) * 140,
    rot: Math.random() * 720,
  }));
}

const RUNE_ICONS: ForgeIconName[] = [
  'flux', 'resonance', 'veil', 'spark', 'target',
  'energy', 'shield', 'attack', 'star', 'fusion',
];

function ParticleEl({ p }: { p: Particle }) {
  const isRune = p.shape === 'rune';
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: `${p.x}%`,
    top: `${p.y}%`,
    width: isRune ? 'auto' : p.size,
    height: isRune ? 'auto' : p.size,
    animationName: p.anim,
    animationDuration: `${p.dur}s`,
    animationDelay: `${p.delay}s`,
    animationFillMode: 'both',
    animationTimingFunction: 'ease-out',
    '--tx': `${p.tx ?? 0}px`,
    '--ty': `${p.ty ?? 0}px`,
    '--rot': `${p.rot ?? 0}deg`,
    color: p.color,
    filter: `drop-shadow(0 0 ${p.size * 0.8}px ${p.color}cc)`,
    pointerEvents: 'none',
    zIndex: 5,
  } as React.CSSProperties;

  if (isRune) {
    return (
      <div style={{ ...baseStyle, width: p.size * 1.4, height: p.size * 1.4, opacity: 0.8 }}>
        <ForgeIcon
          name={RUNE_ICONS[p.id % RUNE_ICONS.length]!}
          size={Math.max(10, p.size * 1.2)}
          strokeWidth={1.25}
          style={{ color: p.color }}
        />
      </div>
    );
  }

  const shapeStyles: Record<string, React.CSSProperties> = {
    circle:  { borderRadius: '50%', background: p.color },
    diamond: {
      background: p.color,
      transform: `rotate(45deg)`,
      borderRadius: '2px',
    },
    star: {
      background: 'transparent',
      color: p.color,
      fontSize: p.size * 1.5,
      lineHeight: 1,
      width: 'auto',
      height: 'auto',
    },
    spark: {
      width: 2,
      height: p.size * 2,
      borderRadius: 1,
      background: `linear-gradient(180deg, transparent, ${p.color})`,
    },
  };

  if (p.shape === 'star') {
    return (
      <div style={{ ...baseStyle, ...shapeStyles.star }}>
        <ForgeIcon name="spark" size={Math.max(10, p.size * 2)} style={{ color: p.color }} />
      </div>
    );
  }

  return <div style={{ ...baseStyle, ...(shapeStyles[p.shape] ?? shapeStyles.circle) }} />;
}

// ─── Faction-specific attack slash effect ────────────────────────────────────
function AttackSlash({ faction, rarColor, rarity }: { faction: string; rarColor: string; rarity: string }) {
  const slashConfigs: Record<string, { lines: number; angle: number[]; color: string; width: number }> = {
    Guerrero:    { lines: 3, angle: [-35, -42, -28], color: '#e84040', width: 280 },
    Mago:        { lines: 5, angle: [-45, -45, -45, -45, -45], color: '#a855f7', width: 200 },
    'Pícaro':    { lines: 2, angle: [-25, -55], color: '#3dc96b', width: 240 },
    'Paladín':   { lines: 4, angle: [-45, -45, -45, -45], color: '#e8b84b', width: 180 },
    Explorador:  { lines: 1, angle: [-45], color: '#3dc96b', width: 320 },
    Comerciante: { lines: 3, angle: [-40, -50, -30], color: '#e8b84b', width: 200 },
    default:     { lines: 2, angle: [-45, -45], color: rarColor, width: 240 },
  };

  const cfg = slashConfigs[faction] ?? slashConfigs.default;
  const isMagic = faction === 'Mago';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 10 }}>
      {cfg.lines > 0 && Array.from({ length: cfg.lines }).map((_, i) => (
        isMagic ? (
          // Magic orb ring for Mago
          <div key={i} style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: 60 + i * 35,
            height: 60 + i * 35,
            marginTop: -(30 + i * 17),
            marginLeft: -(30 + i * 17),
            borderRadius: '50%',
            border: `2px solid ${cfg.color}`,
            boxShadow: `0 0 18px ${cfg.color}88, inset 0 0 18px ${cfg.color}22`,
            animation: `cac-magic-ring ${0.35 + i * 0.08}s ease-out ${i * 0.06}s both`,
            zIndex: 11,
          }} />
        ) : (
          // Slash line for melee
          <div key={i} style={{
            position: 'absolute',
            top: `${38 + i * 12}%`,
            left: '-10%',
            width: `${cfg.width}%`,
            height: rarity === 'Mythic' ? 4 : rarity === 'Legendary' ? 3 : 2,
            background: `linear-gradient(90deg, transparent, ${cfg.color}ee, ${cfg.color}, transparent)`,
            transform: `rotate(${cfg.angle[i]}deg)`,
            boxShadow: `0 0 12px ${cfg.color}aa, 0 0 24px ${cfg.color}44`,
            animation: `cac-slash ${0.25 + i * 0.04}s ease-out ${i * 0.05}s both`,
            borderRadius: 2,
            zIndex: 11,
          }} />
        )
      ))}
      {/* Holy light pillar for Paladín */}
      {faction === 'Paladín' && (
        <div style={{
          position: 'absolute',
          top: 0, left: '50%', marginLeft: -60,
          width: 120, height: '100%',
          background: 'linear-gradient(180deg, rgba(232,184,75,0.0) 0%, rgba(232,184,75,0.35) 40%, rgba(255,255,200,0.5) 50%, rgba(232,184,75,0.35) 60%, rgba(232,184,75,0.0) 100%)',
          animation: 'cac-holy-pillar 0.5s ease-in-out both',
          zIndex: 8,
        }} />
      )}
      {/* Electric discharge for Mago */}
      {faction === 'Mago' && rarity !== 'Common' && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${cfg.color}30 0%, transparent 70%)`,
          animation: 'cac-magic-burst 0.4s ease-out both',
          zIndex: 8,
        }} />
      )}
    </div>
  );
}

// ─── Card Art Display ─────────────────────────────────────────────────────────
function CardArtDisplay({ unit, rarColor, factionColor, isDefender }: {
  unit: BattleUnit; rarColor: string; factionColor: string; isDefender?: boolean;
}) {
  const faction = unit.faction;
  return (
    <div style={{
      position: 'relative',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 8,
    }}>
      {/* Card frame */}
      <div style={{
        position: 'relative',
        width: 'clamp(90px, 18vw, 140px)',
        borderRadius: 12,
        overflow: 'hidden',
        border: `2px solid ${rarColor}`,
        boxShadow: `0 0 30px ${rarColor}88, 0 0 60px ${rarColor}33, inset 0 0 20px ${rarColor}11`,
        animation: isDefender ? 'cac-defender-enter 0.3s ease-out both' : 'cac-attacker-enter 0.3s ease-out both',
        background: `linear-gradient(160deg, ${rarColor}22, rgba(6,6,16,0.95))`,
      }}>
        {/* Card image */}
        {unit.image_url ? (
          <img
            src={unit.image_url}
            alt={unit.name}
            style={{
              width: '100%',
              aspectRatio: '3/4',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: '100%',
            aspectRatio: '3/4',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(40px, 8vw, 64px)',
            background: `radial-gradient(ellipse at center, ${factionColor}30, rgba(6,6,16,0.9))`,
            filter: `drop-shadow(0 0 20px ${factionColor}aa)`,
          }}>
            <ForgeIcon name={FACTION_ICON[faction] ?? 'energy'} size={56} strokeWidth={1.4} />
          </div>
        )}
        {/* Rarity shimmer overlay */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic' || unit.rarity === 'Founder') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg, transparent 25%, ${rarColor}44 45%, rgba(255,255,255,0.2) 50%, ${rarColor}22 55%, transparent 75%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 1.8s ease-in-out infinite',
          }} />
        )}
        {/* Faction corner badge */}
        <div style={{
          position: 'absolute', top: 6, left: 6,
          fontSize: 'clamp(10px, 2vw, 14px)',
          filter: `drop-shadow(0 0 6px ${factionColor}aa)`,
        }}>
          <ForgeIcon name={FACTION_ICON[faction] ?? 'energy'} size={56} strokeWidth={1.4} />
        </div>
        {/* Rarity badge */}
        <div style={{
          position: 'absolute', top: 6, right: 6,
          background: `rgba(0,0,0,0.85)`,
          border: `1px solid ${rarColor}88`,
          borderRadius: 4,
          padding: '2px 5px',
          fontSize: 8,
          fontFamily: '"Rajdhani",sans-serif',
          fontWeight: 800,
          color: rarColor,
          letterSpacing: '0.08em',
        }}>
          {unit.rarity.toUpperCase()}
        </div>
        {/* Stats bar at bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          background: 'linear-gradient(0deg, rgba(0,0,0,0.92), rgba(0,0,0,0.5))',
          padding: '6px 8px 5px',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span style={{ fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11, color: '#e84040', display: 'inline-flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="attack" size={11} strokeWidth={1.8} />{unit.atk}</span>
          <span style={{ fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11, color: '#4a9eff', display: 'inline-flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="shield" size={11} strokeWidth={1.8} />{unit.def}</span>
          <span style={{ fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 11, color: '#e8b84b', display: 'inline-flex', alignItems: 'center', gap: 2 }}><ForgeIcon name="heart" size={11} strokeWidth={1.8} />{unit.hp}</span>
        </div>
      </div>
      {/* Card name */}
      <div style={{
        fontFamily: '"Cinzel",serif',
        fontSize: 'clamp(9px, 1.8vw, 13px)',
        fontWeight: 700,
        color: rarColor,
        textShadow: `0 0 12px ${rarColor}aa`,
        letterSpacing: '0.04em',
        textAlign: 'center',
        maxWidth: 'clamp(90px, 18vw, 140px)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
      }}>
        {unit.name}
      </div>
      {/* Keywords */}
      {unit.keywords.length > 0 && (
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 140 }}>
          {unit.keywords.slice(0, 3).map(kw => (
            <span key={kw} style={{
              fontSize: 10, background: `${rarColor}22`, border: `1px solid ${rarColor}44`,
              borderRadius: 4, padding: '1px 5px', fontFamily: '"Rajdhani",sans-serif',
              color: rarColor, letterSpacing: '0.06em',
            }}>
              {KEYWORD_ICON[kw] && <ForgeIcon name={KEYWORD_ICON[kw] as ForgeIconName} size={11} strokeWidth={1.8} />} {kw}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Keyword Effect Overlay — unique visual per keyword ──────────────────────
// Renders on 'impact' phase. Each keyword has a unique effect composited on top.
const KW_EFFECT_COLORS: Record<string, string> = {
  Guard: '#4a9eff', Drain: '#3ddc84', Lifesteal: '#3ddc84',
  Surge: '#e8b84b', Rush: '#e8b84b', Veil: '#a855f7', Shield: '#a855f7',
  Forge: '#ff6b35', Consecrate: '#ffd700', Flux: '#ff4444',
  Resonance: '#b08af8', Poison: '#a855f7', DoubleStrike: '#ff6b35',
};

function KeywordEffectOverlay({ keywords, phase }: { keywords: string[]; phase: 'enter' | 'impact' | 'exit' }) {
  if (!keywords || keywords.length === 0) return null;
  const active = phase === 'impact';

  return (
    <>
      {keywords.slice(0, 2).map((kw) => {
        const col = KW_EFFECT_COLORS[kw] ?? '#ffffff';
        if (kw === 'Guard') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 220, height: 220, borderRadius: '50%',
              border: `4px solid ${col}`, boxShadow: `0 0 50px ${col}cc, inset 0 0 40px ${col}22`,
              opacity: active ? 1 : 0,
              animation: active ? 'kw-guard-shield 0.55s cubic-bezier(0.22,1,0.36,1) both' : 'none' }} />
            <div style={{ position: 'absolute', width: 130, height: 130, borderRadius: '50%',
              background: `radial-gradient(circle, ${col}40 0%, transparent 70%)`,
              animation: active ? 'kw-guard-glow 0.55s ease-out both' : 'none' }} />
          </div>
        );
        if (kw === 'Drain' || kw === 'Lifesteal') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {Array.from({ length: 9 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${12 + (i * 10) % 72}%`, top: `${15 + (i * 17) % 65}%`,
                width: 3, height: `${28 + i * 7}px`, borderRadius: 2,
                background: `linear-gradient(180deg, transparent, ${col}, ${col}88)`,
                boxShadow: `0 0 7px ${col}cc`,
                animation: active ? `kw-drain-wisp 0.65s ease-in ${i * 0.045}s both` : 'none',
              }} />
            ))}
            <div style={{ position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${col}18 0%, transparent 65%)`,
              animation: active ? 'kw-drain-pulse 0.5s ease-out both' : 'none' }} />
          </div>
        );
        if (kw === 'Surge' || kw === 'Rush') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{
                position: 'absolute', top: `${15 + i * 22}%`, left: '-5%', width: '110%', height: 2,
                background: `linear-gradient(90deg, transparent, ${col}, #ffffff88, ${col}, transparent)`,
                boxShadow: `0 0 14px ${col}cc`,
                transform: `rotate(${-4 + i * 3}deg)`,
                animation: active ? `kw-surge-bolt 0.32s ease-out ${i * 0.04}s both` : 'none',
              }} />
            ))}
            <div style={{ position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${col}28 0%, transparent 72%)`,
              animation: active ? 'kw-surge-flash 0.22s ease-out both' : 'none' }} />
          </div>
        );
        if (kw === 'Veil' || kw === 'Shield') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26, overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0,
              background: `radial-gradient(ellipse at center, ${col}44 0%, ${col}18 45%, transparent 72%)`,
              animation: active ? 'kw-veil-mist 0.75s ease-out both' : 'none' }} />
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} style={{
                position: 'absolute', left: `${8 + i * 16}%`, top: 0, bottom: 0, width: `${7 + i * 2}px`,
                background: `linear-gradient(180deg, ${col}00 0%, ${col}${i < 3 ? '28' : '18'} 50%, ${col}00 100%)`,
                animation: active ? `kw-veil-strand 0.85s ease ${i * 0.06}s both` : 'none',
              }} />
            ))}
          </div>
        );
        if (kw === 'Forge') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${30 + (i % 5) * 9}%`, bottom: `${25 + (i % 4) * 12}%`,
                width: 3, height: `${5 + (i % 5) * 4}px`, borderRadius: 2,
                background: `linear-gradient(180deg, #ff8c42, ${col})`,
                boxShadow: `0 0 5px ${col}cc`,
                '--tx': `${(i % 3 - 1) * 14}px`,
                animation: active ? `kw-forge-spark 0.55s ease-out ${i * 0.028}s both` : 'none',
              } as React.CSSProperties} />
            ))}
            <div style={{ position: 'absolute', bottom: '18%', left: '50%', marginLeft: -28,
              fontSize: 52, lineHeight: 1,
              filter: `drop-shadow(0 0 24px ${col}cc)`,
              animation: active ? 'kw-forge-hammer 0.35s cubic-bezier(0.22,1,0.36,1) both' : 'none' }}>
              <ForgeIcon name="attack" size={52} strokeWidth={1.4} style={{ color: col }} />
            </div>
          </div>
        );
        if (kw === 'Consecrate') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', marginLeft: -90,
              width: 180, height: '100%',
              background: `linear-gradient(180deg, ${col}00 0%, ${col}55 40%, rgba(255,255,200,0.65) 50%, ${col}55 60%, ${col}00 100%)`,
              animation: active ? 'kw-consecrate-pillar 0.55s ease-out both' : 'none' }} />
            {[0, 90, 45, -45].map((angle, i) => (
              <div key={i} style={{ position: 'absolute', inset: 0,
                background: `linear-gradient(${angle}deg, transparent 47%, ${col}38 50%, transparent 53%)`,
                animation: active ? `kw-consecrate-ray 0.44s ease-out ${i * 0.04}s both` : 'none' }} />
            ))}
          </div>
        );
        if (kw === 'Flux') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {Array.from({ length: 11 }).map((_, i) => {
              const colors = ['#ff4444','#e8b84b','#4a9eff','#3dc96b','#a855f7'];
              const c = colors[i % 5];
              return (
                <div key={i} style={{
                  position: 'absolute', left: `${(i * 17 + 5) % 86}%`, top: `${(i * 23 + 8) % 78}%`,
                  width: `${6 + (i % 4) * 4}px`, height: `${6 + (i % 4) * 4}px`,
                  borderRadius: i % 2 === 0 ? '50%' : '3px',
                  background: c, boxShadow: `0 0 8px ${c}`,
                  '--tx': `${(i % 3 - 1) * 45}px`, '--ty': `${-(i % 4) * 25}px`,
                  '--rot': `${90 + i * 40}deg`,
                  animation: active ? `kw-flux-chaos 0.65s ease-out ${i * 0.04}s both` : 'none',
                } as React.CSSProperties} />
              );
            })}
          </div>
        );
        if (kw === 'Resonance') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26,
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {[80, 150, 230].map((sz, i) => (
              <div key={i} style={{
                position: 'absolute', width: sz, height: sz, borderRadius: '50%',
                border: `1px solid ${col}`,
                boxShadow: `0 0 ${i * 6 + 4}px ${col}66`,
                animation: active ? `kw-resonance-ring 0.85s ease-out ${i * 0.10}s both` : 'none',
              }} />
            ))}
          </div>
        );
        if (kw === 'Poison') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{
                position: 'absolute', left: `${20 + (i * 13) % 58}%`, top: `${30 + (i * 18) % 45}%`,
                width: 8, height: 8, borderRadius: '50%',
                background: col, boxShadow: `0 0 8px ${col}`,
                animation: active ? `kw-poison-drip 0.7s ease ${i * 0.06}s both` : 'none',
              }} />
            ))}
          </div>
        );
        if (kw === 'DoubleStrike') return (
          <div key={kw} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 26 }}>
            {[0, 1].map((hit) => (
              <div key={hit} style={{
                position: 'absolute', inset: 0,
                background: `radial-gradient(ellipse at center, ${col}30 0%, transparent 65%)`,
                animation: active ? `kw-dstrike-flash 0.5s ease ${hit * 0.14}s both` : 'none',
              }} />
            ))}
          </div>
        );
        return null;
      })}
    </>
  );
}

// ─── Card Name Profile — unique accent color & label per card name ────────────
// Uses a fast string hash to derive a deterministic hue offset and label
// so every card gets its own visual flavor without requiring a lookup table.
function cardNameHash(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return h;
}

// Name-keyword patterns for special visual profiles
const NAME_PROFILES: Array<{ pattern: RegExp; label: string; extraColor: string; icon: ForgeIconName }> = [
  { pattern: /dragón|dragon|wyrm/i,    label: 'ALIENTO DE DRAGÓN',  extraColor: '#ff6600', icon: 'boss' },
  { pattern: /fuego|fire|llama|flame/i,label: 'INFIERNO',           extraColor: '#ff4400', icon: 'energy' },
  { pattern: /sombra|shadow|oscur/i,   label: 'GOLPE OSCURO',       extraColor: '#6600aa', icon: 'more' },
  { pattern: /hielo|ice|frost|gélido/i,label: 'TORMENTA GLACIAL',   extraColor: '#44ccff', icon: 'energy' },
  { pattern: /trueno|thunder|rayo|bolt/i,label:'DESCARGA',          extraColor: '#ffe000', icon: 'energy' },
  { pattern: /arcano|arcane|místico/i, label: 'CANALIZACIÓN',       extraColor: '#aa44ff', icon: 'spark' },
  { pattern: /veneno|poison|serpiente/i,label:'TOXINA',             extraColor: '#88ff44', icon: 'skull' },
  { pattern: /sangre|blood|crimson/i,  label: 'HERIDA FATAL',       extraColor: '#cc0022', icon: 'heart' },
  { pattern: /sagrado|holy|light|luz/i,label: 'JUICIO DIVINO',      extraColor: '#ffee88', icon: 'crown' },
  { pattern: /forjador|forger|smith/i, label: 'GOLPE DE FRAGUA',    extraColor: '#ff8833', icon: 'attack' },
  { pattern: /espectro|specter|ghost/i,label: 'TOQUE ESPECTRAL',    extraColor: '#aaccff', icon: 'more' },
  { pattern: /titan|titán|coloso/i,    label: 'APLASTAMIENTO',      extraColor: '#bb8855', icon: 'boss' },
  { pattern: /viento|wind|aire|storm/i,label: 'RÁFAGA',             extraColor: '#99ddff', icon: 'spark' },
];

function getNameProfile(cardName: string, fallbackLabel: string, _fallbackColor: string) {
  const match = NAME_PROFILES.find(p => p.pattern.test(cardName));
  if (match) return { label: match.label, accentColor: match.extraColor, nameIcon: match.icon };
  // Deterministic hue from name hash
  const h = cardNameHash(cardName);
  const hue = (h % 360);
  const sat = 70 + (h % 25);
  const accentColor = `hsl(${hue},${sat}%,62%)`;
  return { label: fallbackLabel, accentColor, nameIcon: null };
}

// ─── Name-specific background particle overlay ────────────────────────────────
function NameParticleOverlay({ cardName, rarColor, phase }: {
  cardName: string; rarColor: string; phase: 'enter' | 'impact' | 'exit';
}) {
  const h = cardNameHash(cardName);
  const hue = h % 360;
  const color = `hsl(${hue},75%,60%)`;
  const count = 6 + (h % 6);
  if (phase !== 'impact') return null;
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 22 }}>
      {Array.from({ length: count }).map((_, i) => {
        const x = 20 + ((h * (i + 1) * 37) % 60);
        const y = 10 + ((h * (i + 1) * 53) % 75);
        const sz = 6 + (i % 5) * 3;
        return (
          <div key={i} style={{
            position: 'absolute', left: `${x}%`, top: `${y}%`,
            width: sz, height: sz, borderRadius: i % 2 === 0 ? '50%' : '3px',
            background: i % 3 === 0 ? rarColor : color,
            boxShadow: `0 0 ${sz * 1.5}px ${color}`,
            '--tx': `${(i % 3 - 1) * 50}px`,
            '--ty': `${-(20 + i * 15)}px`,
            '--rot': `${90 + i * 55}deg`,
            animation: 'cac-ptcl-swirl 0.55s ease-out both',
            animationDelay: `${i * 0.03}s`,
          } as React.CSSProperties} />
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CardAttackCinematic({
  unit, defender, visible, onDone, damage, isCrit, isKill,
}: CardAttackCinematicProps) {
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [phase, setPhase] = useState<'enter' | 'impact' | 'exit'>('enter');
  const [particles, setParticles] = useState<Particle[]>([]);

  const rarity = unit?.rarity ?? 'Common';
  const faction = unit?.faction ?? 'default';
  const rarColor = RARITY_COLOR[rarity] ?? '#8b8b9e';
  const factionColor = FACTION_COLOR[faction] ?? FACTION_COLOR.default;
  const factionSecondary = FACTION_SECONDARY[faction] ?? FACTION_SECONDARY.default;
  const duration = RARITY_DURATION[rarity] ?? 500;
  const nameProfile = unit ? getNameProfile(unit.name, FACTION_ATTACK_LABEL[faction] ?? 'ATAQUE', factionColor) : null;

  const fire = useCallback(() => {
    if (!unit) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setPhase('enter');
    setParticles(makeParticles(rarity, rarColor, factionColor));

    // Fire rarity-gated attack audio + crit/kill SFX
    try {
      const ae = AudioEngine as any;
      if (typeof ae.sfxAttackByRarity === 'function') {
        ae.sfxAttackByRarity(rarity);
      } else if (typeof ae.sfxFactionAttack === 'function') {
        ae.sfxFactionAttack(faction, rarity);
      } else {
        ae.attack?.();
      }
    } catch { /* silent */ }

    // Phase transitions
    const impactAt = duration * 0.3;
    const exitAt   = duration * 0.7;

    setTimeout(() => {
      setPhase('impact');
      // Crit / kill SFX on impact
      try {
        const ae = AudioEngine as any;
        if (isCrit && typeof ae.sfxCritV2 === 'function') ae.sfxCritV2();
        else if (isKill && typeof ae.sfxKillV2 === 'function') ae.sfxKillV2();
        // Keyword SFX
        if (unit.keywords.length > 0 && typeof ae.triggerKeyword === 'function') {
          ae.triggerKeyword(unit.keywords[0]);
        }
      } catch { /* silent */ }
    }, impactAt);
    setTimeout(() => setPhase('exit'),   exitAt);

    timerRef.current = setTimeout(() => {
      setParticles([]);
      onDone();
    }, duration + 50);
  }, [unit, rarity, rarColor, factionColor, faction, duration, onDone]);

  useEffect(() => {
    if (visible && unit) {
      fire();
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setParticles([]);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [visible, unit, fire]);

  if (!visible || !unit) return null;

  const isShortRarity = rarity === 'Common' || rarity === 'Uncommon';
  const attackLabel = nameProfile?.label ?? FACTION_ATTACK_LABEL[faction] ?? 'ATAQUE';
  const nameAccent  = nameProfile?.accentColor ?? factionColor;
  const nameIcon    = nameProfile?.nameIcon ?? '';
  const bg = FACTION_BG[faction] ?? FACTION_BG.default;
  const actorProfile = unit ? getBattleCardActorProfile(unit) : null;
  const rarityOverlay = RARITY_BG_OVERLAY[rarity] ?? 'rgba(74,158,255,0.10)';

  // Damage color
  const dmgColor = isCrit ? '#e8b84b' : isKill ? '#ff4444' : '#ffffff';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={`${attackLabel}${damage !== undefined ? `. Daño ${damage}.` : ''}${isKill ? ' Eliminado.' : ''}`}
      data-card-faction={actorProfile?.faction ?? faction}
      data-card-rarity={actorProfile?.rarity ?? rarity}
      data-card-has-art={actorProfile?.hasArt ? 'true' : 'false'}
      data-card-keyword-count={actorProfile?.keywordCount ?? 0}
      style={{
      position: 'fixed', inset: 0, zIndex: 500,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: bg,
      animation: phase === 'exit'
        ? 'cac-bg-fadeout 0.3s ease-out both'
        : 'cac-bg-fadein 0.15s ease-out both',
      overflow: 'hidden',
    }}>

      {/* Rarity color overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(ellipse at center, ${rarityOverlay} 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: phase === 'impact' ? 'cac-impact-pulse 0.2s ease-out both' : undefined,
      }} />

      {/* Vignette edge */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.7) 100%)',
      }} />

      {/* Scanline for Mythic/Legendary */}
      {(rarity === 'Mythic' || rarity === 'Legendary') && (
        <div style={{
          position: 'absolute', left: 0, right: 0, height: 2,
          background: `linear-gradient(90deg, transparent, ${rarColor}dd, transparent)`,
          animation: 'cac-scanline 0.8s linear both',
          pointerEvents: 'none', zIndex: 20,
        }} />
      )}

      {/* Grid lines for Epic+ */}
      {(rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Founder') && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.08,
          backgroundImage: `linear-gradient(${rarColor}55 1px, transparent 1px), linear-gradient(90deg, ${rarColor}55 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
          zIndex: 2,
        }} />
      )}

      {/* ── SPLIT PANEL LAYOUT ── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 'clamp(16px, 4vw, 48px)',
        width: '100%',
        padding: '0 clamp(12px, 4vw, 32px)',
        flexWrap: 'wrap',
      }}>

        {/* ── LEFT: Attacker ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          animation: 'cac-attacker-enter 0.25s ease-out both',
        }}>
          <div style={{
            fontSize: 'clamp(8px, 1.5vw, 11px)',
            fontFamily: '"Rajdhani",sans-serif',
            fontWeight: 800,
            letterSpacing: '0.2em',
            color: factionColor,
            textTransform: 'uppercase',
            marginBottom: 4,
            textShadow: `0 0 12px ${factionColor}`,
          }}>
            ATACANTE
          </div>
          <CardArtDisplay unit={unit} rarColor={rarColor} factionColor={factionColor} />
        </div>

        {/* ── CENTER: Attack effect ── */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          minWidth: 'clamp(80px, 20vw, 160px)',
        }}>
          {/* Faction icon large */}
          <div style={{
            fontSize: 'clamp(32px, 8vw, 56px)',
            animation: phase === 'impact'
              ? 'cac-icon-impact 0.25s ease-out both'
              : 'cac-icon-float 0.6s ease-in-out infinite alternate',
            filter: `drop-shadow(0 0 20px ${factionColor}) drop-shadow(0 0 40px ${factionColor}88)`,
          }}>
            <ForgeIcon name={FACTION_ICON[faction] ?? 'energy'} size={56} strokeWidth={1.4} />
          </div>

          {/* Attack label — uses card-name-derived label and accent color */}
          <div style={{
            fontFamily: '"Cinzel Decorative",serif',
            fontSize: 'clamp(7px, 1.8vw, 11px)',
            fontWeight: 900,
            letterSpacing: '0.15em',
            color: nameAccent,
            textShadow: `0 0 16px ${nameAccent}, 0 0 32px ${nameAccent}88`,
            textAlign: 'center',
            textTransform: 'uppercase',
            animation: 'cac-label-reveal 0.3s ease-out 0.1s both',
            whiteSpace: 'nowrap',
          }}>
            {nameIcon && <ForgeIcon name={nameIcon} size={12} strokeWidth={1.8} style={{ marginRight: 4, verticalAlign: '-0.15em' }} />}
            {isShortRarity ? 'ATACA' : attackLabel}
          </div>

          {/* Damage number (if provided) */}
          {damage != null && damage > 0 && (
            <div style={{
              fontFamily: '"Cinzel",serif',
              fontSize: isCrit
                ? 'clamp(28px, 7vw, 48px)'
                : 'clamp(22px, 5vw, 36px)',
              fontWeight: 900,
              color: dmgColor,
              textShadow: `0 0 20px ${dmgColor}, 0 0 40px ${dmgColor}88`,
              animation: 'cac-damage-pop 0.3s ease-out 0.2s both',
              lineHeight: 1,
            }}>
              {isCrit && (
                <span style={{ fontSize: '0.55em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 2, letterSpacing: '0.15em' }}>
                  <ForgeIcon name="spark" size={11} strokeWidth={1.8} /> CRÍTICO <ForgeIcon name="spark" size={11} strokeWidth={1.8} />
                </span>
              )}
              -{damage}
              {isKill && (
                <span style={{ fontSize: '0.45em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginTop: 2, color: '#ff4444', letterSpacing: '0.12em' }}>
                  <ForgeIcon name="skull" size={12} strokeWidth={1.8} /> ELIMINADO
                </span>
              )}
            </div>
          )}

          {/* VS divider */}
          {!isShortRarity && (
            <div style={{
              fontFamily: '"Cinzel Decorative",serif',
              fontSize: 'clamp(14px, 3.5vw, 22px)',
              fontWeight: 900,
              color: '#ffffff44',
              letterSpacing: '0.1em',
              animation: 'cac-vs-reveal 0.2s ease-out 0.15s both',
            }}>VS</div>
          )}

          {/* Attack slash */}
          {!isShortRarity && (
            <div style={{ position: 'relative', width: 80, height: 40 }}>
              <AttackSlash faction={faction} rarColor={rarColor} rarity={rarity} />
            </div>
          )}
        </div>

        {/* ── RIGHT: Defender (if available) ── */}
        {!isShortRarity && defender && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            animation: 'cac-defender-enter 0.25s ease-out 0.05s both',
            opacity: phase === 'impact' ? 0.7 : 1,
            transition: 'opacity 0.2s',
          }}>
            <div style={{
              fontSize: 'clamp(8px, 1.5vw, 11px)',
              fontFamily: '"Rajdhani",sans-serif',
              fontWeight: 800,
              letterSpacing: '0.2em',
              color: '#6a6a9a',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}>
              DEFENSOR
            </div>
            <CardArtDisplay
              unit={defender}
              rarColor={RARITY_COLOR[defender.rarity] ?? '#8b8b9e'}
              factionColor={FACTION_COLOR[defender.faction] ?? FACTION_COLOR.default}
              isDefender
            />
          </div>
        )}
      </div>

      {/* ── Particles ── */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 15 }}>
        {particles.map(p => <ParticleEl key={p.id} p={p} />)}
      </div>

      {/* ── Card-name-specific particle overlay (unique per carta) ── */}
      {unit && (
        <NameParticleOverlay cardName={unit.name} rarColor={rarColor} phase={phase} />
      )}

      {/* ── Keyword Effects — unique per-keyword cinematic overlay ── */}
      {unit && unit.keywords.length > 0 && (
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 26 }}>
          <KeywordEffectOverlay keywords={unit.keywords} phase={phase} />
        </div>
      )}

      {/* ── Kill confirm flash ── */}
      {isKill && phase === 'impact' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 27,
          background: `radial-gradient(ellipse at center, rgba(255,40,40,0.35) 0%, rgba(255,40,40,0.12) 50%, transparent 80%)`,
          animation: 'cac-impact-flash 0.18s ease-out both',
          borderRadius: 'inherit',
        }} />
      )}

      {/* ── Crit edge flash ── */}
      {isCrit && phase === 'impact' && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 27,
          boxShadow: `inset 0 0 60px rgba(232,184,75,0.6), inset 0 0 120px rgba(232,184,75,0.2)`,
          animation: 'cac-impact-flash 0.22s ease-out both',
          borderRadius: 'inherit',
        }} />
      )}

      {/* ── Bottom faction bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${factionColor}, ${rarColor}, ${factionSecondary}, transparent)`,
        animation: 'cac-bottom-bar 0.3s ease-out both',
        zIndex: 20,
        boxShadow: `0 -2px 16px ${factionColor}66`,
      }} />

      {/* ── Top faction bar ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${rarColor}88, transparent)`,
        zIndex: 20,
      }} />

      {/* ── Corner accent: VEXFORGE ARENA ── */}
      <div style={{
        position: 'absolute', top: 12, left: 16, zIndex: 25,
        fontFamily: '"IBM Plex Mono",monospace', fontSize: 8,
        color: `${rarColor}66`, letterSpacing: '0.18em', textTransform: 'uppercase',
      }}>
        VEXFORGE · BATALLA
      </div>

      {/* ── Rarity corner accent (top right) ── */}
      <div style={{
        position: 'absolute', top: 12, right: 16, zIndex: 25,
        fontFamily: '"Rajdhani",sans-serif', fontSize: 9, fontWeight: 800,
        color: rarColor, letterSpacing: '0.15em', textTransform: 'uppercase',
        textShadow: `0 0 10px ${rarColor}`,
      }}>
        {rarity}
      </div>

      {/* ── CSS Animations ── */}
      <style>{`
        @keyframes cac-bg-fadein   { from { opacity:0; } to { opacity:1; } }
        @keyframes cac-bg-fadeout  { from { opacity:1; } to { opacity:0; } }
        @keyframes cac-attacker-enter {
          from { opacity:0; transform:translateX(-60px) scale(0.88); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        @keyframes cac-defender-enter {
          from { opacity:0; transform:translateX(60px) scale(0.88); }
          to   { opacity:1; transform:translateX(0) scale(1); }
        }
        @keyframes cac-icon-float  { from { transform:translateY(0) scale(1); } to { transform:translateY(-6px) scale(1.05); } }
        @keyframes cac-icon-impact { 0%{transform:scale(1.5) rotate(-10deg);} 60%{transform:scale(0.9) rotate(5deg);} 100%{transform:scale(1) rotate(0);} }
        @keyframes cac-label-reveal { from { opacity:0; transform:scaleX(1.4); } to { opacity:1; transform:scaleX(1); } }
        @keyframes cac-vs-reveal   { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
        @keyframes cac-damage-pop  { 0%{opacity:0;transform:scale(0.3) translateY(20px);}60%{transform:scale(1.15);}100%{opacity:1;transform:scale(1) translateY(0);} }
        @keyframes cac-impact-pulse { 0%{opacity:0;} 50%{opacity:1;} 100%{opacity:0;} }
        @keyframes cac-slash { from { transform:rotate(var(--angle,-35deg)) scaleX(0); transform-origin:left; } to { transform:rotate(var(--angle,-35deg)) scaleX(1); } }
        @keyframes cac-magic-ring { from{opacity:0;transform:scale(0.3);} 60%{opacity:1;} to{opacity:0;transform:scale(1.5);} }
        @keyframes cac-holy-pillar { from{opacity:0;} 30%{opacity:1;} to{opacity:0;} }
        @keyframes cac-magic-burst { from{opacity:0;transform:scale(0.5);} 50%{opacity:1;} to{opacity:0;transform:scale(1.5);} }
        @keyframes cac-scanline    { 0%{top:-4px;opacity:0;} 10%{opacity:1;} 90%{opacity:0.7;} 100%{top:105%;opacity:0;} }
        @keyframes cac-bottom-bar  { from{transform:scaleX(0);transform-origin:center;} to{transform:scaleX(1);} }
        @keyframes cac-corona-spin { to{transform:rotate(360deg);} }
        @keyframes cac-ptcl-rise   { 0%{transform:translateY(0) scale(1);opacity:1;} 100%{transform:translateY(-100px) scale(0);opacity:0;} }
        @keyframes cac-ptcl-swirl  { 0%{transform:translate(0,0) rotate(0deg) scale(1);opacity:1;} 100%{transform:translate(var(--tx,40px),var(--ty,-60px)) rotate(220deg) scale(0);opacity:0;} }
        @keyframes cac-ptcl-burst  { 0%{transform:scale(0);opacity:0;} 25%{transform:scale(1.6);opacity:1;} 100%{transform:translate(var(--tx,0px),var(--ty,-60px)) scale(0.1);opacity:0;} }
        @keyframes cac-ptcl-chaos  { 0%{transform:scale(0) rotate(0deg);opacity:0;} 20%{transform:scale(1.8) rotate(90deg);opacity:1;} 100%{transform:translate(var(--tx,40px),var(--ty,-60px)) rotate(var(--rot,380deg)) scale(0);opacity:0;} }
        @keyframes cac-ptcl-ember  { 0%{transform:translateY(0) scale(1);opacity:1;} 50%{transform:translate(var(--tx,15px),-35px) scale(0.8);opacity:0.9;} 100%{transform:translate(var(--tx,0px),-80px) scale(0.15);opacity:0;} }
        @keyframes cac-shimmer-sweep { from{background-position:200% 50%;} to{background-position:-200% 50%;} }
        @keyframes card-shimmer { 0%{background-position:-200% 50%;} 100%{background-position:200% 50%;} }
      `}</style>
    </div>
  );
}
