// VEXFORGE — Card Attack Cinematic v3.0 — Tier-1 DCCG Quality
// Per-card full-screen cinematic when a card attacks in battle.
// Inspired by Hearthstone / YuGiOh Master Duel epic reveals.
// Common/Uncommon: silent pass-through. Rare→Mythic: escalating epicness.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';

interface CardAttackCinematicProps {
  unit: BattleUnit | null;
  visible: boolean;
  onDone: () => void;
}

// Duration per rarity — calibrated for cinematic feel without interrupting flow
const RARITY_DURATION: Record<string, number> = {
  Common:    0,
  Uncommon:  0,
  Rare:      600,
  Epic:      750,
  Legendary: 950,
  Mythic:    1150,
  Founder:   1050,
};

// Faction → thematic background color accent
const FACTION_COLOR: Record<string, string> = {
  Guerrero:    '#c0392b',
  Mago:        '#6c3483',
  'Pícaro':    '#1a5e20',
  'Paladín':   '#7d6608',
  Explorador:  '#1a5e20',
  Comerciante: '#7d6608',
  default:     '#1a237e',
};

const FACTION_ICON: Record<string, string> = {
  Guerrero:    '⚔️',
  Mago:        '🔮',
  'Pícaro':    '🗡️',
  'Paladín':   '🛡️',
  Explorador:  '🏹',
  Comerciante: '💰',
  default:     '⚡',
};

// Per-rarity background compositions
const RARITY_BG: Record<string, string> = {
  Rare:      'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(19,65,140,0.9) 0%, rgba(5,5,14,0.97) 65%)',
  Epic:      'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(70,20,120,0.92) 0%, rgba(5,5,14,0.98) 65%)',
  Legendary: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(110,75,0,0.92) 0%, rgba(5,5,14,0.98) 65%)',
  Mythic:    'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(100,8,8,0.94) 0%, rgba(5,5,14,0.99) 65%)',
  Founder:   'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(110,45,0,0.92) 0%, rgba(5,5,14,0.98) 65%)',
};

// Per-rarity particle sets
interface Particle { id: number; x: number; y: number; size: number; dur: number; delay: number; anim: string; color: string; shape: 'circle' | 'diamond' | 'star'; }

let _pid = 0;
function makeParticles(rarity: string, rarColor: string): Particle[] {
  const cfgMap: Record<string, { count: number; anims: string[]; colors: string[]; shapes: Particle['shape'][] }> = {
    Rare:      { count: 8,  anims: ['cac-ptcl-rise'],    colors: ['#4a9eff','#7abcff','#c0e0ff'],                           shapes: ['circle','diamond'] },
    Epic:      { count: 12, anims: ['cac-ptcl-swirl'],   colors: ['#a855f7','#c084fc','#e9d5ff','#7c3aed'],                shapes: ['diamond','star','circle'] },
    Legendary: { count: 16, anims: ['cac-ptcl-burst'],   colors: ['#f59e0b','#fde68a','#ffffff','#e8b84b','#fbbf24'],      shapes: ['star','diamond','circle'] },
    Mythic:    { count: 20, anims: ['cac-ptcl-chaos'],   colors: ['#ff4444','#ff8888','#ffffff','#ffcc00','#ff6600'],       shapes: ['star','circle','diamond'] },
    Founder:   { count: 16, anims: ['cac-ptcl-ember'],   colors: ['#ff6b35','#ff9d6b','#ffffff','#ffd700','#ff4500'],      shapes: ['diamond','star','circle'] },
  };
  const cfg = cfgMap[rarity] ?? cfgMap.Rare;
  return Array.from({ length: cfg.count }, (_, i) => ({
    id: ++_pid,
    x:     Math.random() * 80 + 10,
    y:     Math.random() * 80 + 10,
    size:  Math.random() * (rarity === 'Mythic' ? 12 : 8) + 4,
    dur:   Math.random() * 0.6 + (rarity === 'Mythic' ? 0.9 : 0.65),
    delay: Math.random() * 0.35,
    anim:  cfg.anims[i % cfg.anims.length],
    color: cfg.colors[i % cfg.colors.length] ?? rarColor,
    shape: cfg.shapes[i % cfg.shapes.length],
  }));
}

// Render a single particle shape
function ParticleEl({ p }: { p: Particle }) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left:  `${p.x}%`,
    top:   `${p.y}%`,
    width:  p.size,
    height: p.size,
    pointerEvents: 'none',
    zIndex: 5,
    animation: `${p.anim} ${p.dur}s ease-out ${p.delay}s both`,
    filter: `drop-shadow(0 0 ${p.size}px ${p.color})`,
  };
  if (p.shape === 'circle') {
    return <div style={{ ...baseStyle, borderRadius: '50%', background: p.color }} />;
  }
  if (p.shape === 'diamond') {
    return <div style={{ ...baseStyle, background: p.color, transform: 'rotate(45deg)' }} />;
  }
  // star
  return (
    <div style={{ ...baseStyle, background: 'transparent', fontSize: p.size + 2, lineHeight: 1,
      color: p.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: `${p.anim} ${p.dur}s ease-out ${p.delay}s both`,
    }}>★</div>
  );
}

// Rarity label badge
function RarityBadge({ rarity, color }: { rarity: string; color: string }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 12px',
      background: `${color}22`,
      border: `1px solid ${color}88`,
      borderRadius: 20,
      fontFamily: 'Cinzel, serif',
      fontSize: 11,
      fontWeight: 700,
      color,
      letterSpacing: '0.25em',
      textTransform: 'uppercase',
      textShadow: `0 0 10px ${color}`,
    }}>
      {rarity.toUpperCase()}
    </div>
  );
}

// Keyword pills
function KeywordPills({ keywords, rarColor }: { keywords: string[]; rarColor: string }) {
  if (!keywords?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
      {keywords.slice(0, 4).map(kw => (
        <span key={kw} style={{
          padding: '2px 9px',
          background: `rgba(0,0,0,0.6)`,
          border: `1px solid ${rarColor}66`,
          borderRadius: 12,
          fontSize: 11,
          color: rarColor,
          fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 700,
          letterSpacing: '0.06em',
        }}>
          {KEYWORD_ICON[kw] ?? '✦'} {kw}
        </span>
      ))}
    </div>
  );
}

export function CardAttackCinematic({ unit, visible, onDone }: CardAttackCinematicProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasTriggeredAudioRef = useRef(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [entered, setEntered] = useState(false);

  const triggerAudio = useCallback((rarity: string, faction: string) => {
    try {
      const ae = AudioEngine as any;
      // Rarity-specific SFX
      if (rarity === 'Mythic' || rarity === 'Founder') {
        ae.sfxMythicReveal?.();
      } else if (rarity === 'Legendary') {
        ae.sfxLegendaryReveal?.();
      } else if (rarity === 'Epic') {
        ae.sfxRarityReveal?.('Epic');
      } else if (rarity === 'Rare') {
        ae.sfxRarityReveal?.('Rare');
      }
      // Faction-specific hit SFX after brief delay
      setTimeout(() => {
        try {
          if (faction === 'Guerrero') ae.sfxAttackHit?.('heavy');
          else if (faction === 'Mago') ae.sfxAttackHit?.('magic');
          else ae.sfxAttackHit?.('normal');
        } catch {}
      }, Math.min(RARITY_DURATION[rarity] ?? 400, 300));
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    if (!visible || !unit) {
      hasTriggeredAudioRef.current = false;
      setEntered(false);
      setParticles([]);
      if (timeoutRef.current) { clearTimeout(timeoutRef.current); timeoutRef.current = null; }
      return;
    }

    const rarity = unit.rarity;
    const duration = RARITY_DURATION[rarity] ?? 0;

    // Common/Uncommon: skip cinematic
    if (duration === 0) { onDone(); return; }

    // Trigger once
    if (!hasTriggeredAudioRef.current) {
      hasTriggeredAudioRef.current = true;
      triggerAudio(rarity, unit.faction);
      const rarColor = RARITY_COLOR[rarity] ?? '#8b8b9e';
      setParticles(makeParticles(rarity, rarColor));
      // Small delay before showing for dramatic effect
      requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    }

    timeoutRef.current = setTimeout(() => { onDone(); }, duration);
    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [visible, unit, onDone, triggerAudio]);

  // Don't render for non-cinematic rarities or when hidden
  if (!visible || !unit || (RARITY_DURATION[unit.rarity] ?? 0) === 0) return null;

  const rarity   = unit.rarity;
  const rarColor = RARITY_COLOR[rarity] ?? '#8b8b9e';
  const rarGlow  = RARITY_GLOW[rarity]  ?? 'rgba(139,139,158,0.3)';
  const bgGrad   = RARITY_BG[rarity]    ?? RARITY_BG.Rare;
  const factionBg = FACTION_COLOR[unit.faction] ?? FACTION_COLOR.default;
  const factionIcon = FACTION_ICON[unit.faction] ?? '⚡';
  const dur = RARITY_DURATION[rarity];

  const isLegendary = rarity === 'Legendary';
  const isMythic    = rarity === 'Mythic' || rarity === 'Founder';
  const isEpic      = rarity === 'Epic';

  return (
    <div
      style={{
        position: 'absolute', inset: 0, zIndex: 200,
        background: bgGrad,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
        overflow: 'hidden',
        animation: `cac-overlay-in ${Math.min(dur * 0.15, 120)}ms ease forwards`,
      }}
    >
      {/* ── Ambient particles ── */}
      {particles.map(p => <ParticleEl key={p.id} p={p} />)}

      {/* ── Legendary: rotating sun rays ── */}
      {isLegendary && (
        <div style={{
          position: 'absolute', inset: -20,
          background: `conic-gradient(from 0deg, transparent 0deg, ${rarColor}44 8deg, transparent 16deg, transparent 80deg, ${rarColor}33 88deg, transparent 96deg)`,
          animation: 'cac-rays-spin 2.5s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Mythic: vortex chaos overlay ── */}
      {isMythic && (
        <>
          <div style={{
            position: 'absolute', inset: -40,
            background: `conic-gradient(from 0deg at 50% 50%, ${rarColor}55 0deg, transparent 30deg, ${rarColor}33 60deg, transparent 90deg, ${rarColor}44 120deg, transparent 150deg)`,
            animation: 'cac-vortex-spin 1.1s linear infinite',
            mixBlendMode: 'screen',
            pointerEvents: 'none',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: `rgba(255,0,0,0)`,
            animation: 'cac-lightning-flash 0.6s ease-in-out',
            pointerEvents: 'none',
          }} />
        </>
      )}

      {/* ── Epic: rune ring ── */}
      {isEpic && (
        <div style={{
          position: 'absolute',
          width: 380, height: 380,
          borderRadius: '50%',
          border: `2px solid ${rarColor}44`,
          boxShadow: `0 0 40px ${rarColor}33, inset 0 0 40px ${rarColor}22`,
          animation: 'cac-ring-pulse 0.75s ease-out both',
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Horizontal energy scan line ── */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${rarColor}cc, rgba(255,255,255,0.9), ${rarColor}cc, transparent)`,
        boxShadow: `0 0 12px ${rarColor}, 0 0 24px ${rarColor}88`,
        animation: 'cac-scanline 0.55s ease-in-out both',
        pointerEvents: 'none',
        zIndex: 8,
      }} />

      {/* ── Card art frame ── */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          animation: entered ? `cac-card-slam ${Math.min(dur * 0.25, 200)}ms cubic-bezier(0.22,1,0.36,1) both` : 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
          filter: `drop-shadow(0 0 40px ${rarColor}) drop-shadow(0 0 80px ${rarGlow})`,
        }}
      >
        {/* Faction icon above card */}
        <div style={{
          fontSize: 28,
          filter: `drop-shadow(0 0 12px ${factionBg})`,
          animation: 'cac-icon-pulse 0.8s ease-in-out infinite alternate',
        }}>
          {factionIcon}
        </div>

        {/* Card frame */}
        <div style={{
          width: 200, height: 266,
          borderRadius: 14,
          border: `3px solid ${rarColor}`,
          boxShadow: `0 0 32px ${rarColor}cc, 0 0 64px ${rarGlow}, 0 0 120px ${rarGlow}, inset 0 0 20px ${rarColor}22`,
          overflow: 'hidden',
          position: 'relative',
          background: unit.image_url
            ? 'transparent'
            : `linear-gradient(160deg, ${rarColor}33 0%, rgba(5,5,14,0.99) 100%)`,
        }}>
          {unit.image_url ? (
            <img
              src={unit.image_url}
              alt={unit.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 64,
              filter: `drop-shadow(0 0 24px ${rarColor})`,
            }}>
              {factionIcon}
            </div>
          )}

          {/* Rarity shimmer overlay */}
          {(isLegendary || isMythic) && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `linear-gradient(125deg, transparent 30%, ${rarColor}55 47%, rgba(255,255,255,0.2) 50%, ${rarColor}33 53%, transparent 70%)`,
              backgroundSize: '300% 300%',
              animation: 'cac-shimmer-sweep 1.2s ease-in-out',
            }} />
          )}

          {/* Mythic: chaos lightning overlay */}
          {isMythic && (
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              background: `rgba(255,68,68,0.15)`,
              animation: 'cac-mythic-pulse 0.4s ease-in-out infinite alternate',
            }} />
          )}

          {/* Stats bar at bottom */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(0deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.5) 80%, transparent 100%)',
            padding: '18px 10px 8px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
          }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#ff6b6b', fontWeight: 700 }}>
              ⚔{unit.atk}
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#4a9eff', fontWeight: 700 }}>
              🛡{unit.def}
            </span>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 9, color: '#3ddc84', fontWeight: 700 }}>
              ❤{unit.hp}
            </span>
          </div>
        </div>

        {/* Card name */}
        <div style={{
          textAlign: 'center',
          animation: 'cac-name-reveal 0.3s ease-out 0.1s both',
        }}>
          <div style={{
            fontFamily: 'Cinzel Decorative, serif',
            fontSize: 17,
            fontWeight: 900,
            color: '#ffffff',
            letterSpacing: '0.06em',
            textShadow: `0 0 20px ${rarColor}, 0 0 40px ${rarColor}aa, 0 2px 4px rgba(0,0,0,0.8)`,
            lineHeight: 1.2,
            maxWidth: 260,
            textAlign: 'center',
          }}>
            {unit.name}
          </div>
          <div style={{ marginTop: 8 }}>
            <RarityBadge rarity={rarity} color={rarColor} />
          </div>
          <KeywordPills keywords={unit.keywords} rarColor={rarColor} />
        </div>

        {/* ATTACK label */}
        <div style={{
          fontFamily: 'Cinzel, serif',
          fontSize: 13,
          fontWeight: 900,
          color: rarColor,
          letterSpacing: '0.3em',
          textTransform: 'uppercase',
          textShadow: `0 0 16px ${rarColor}`,
          animation: 'cac-attack-label 0.4s ease-out 0.2s both',
        }}>
          ⚔ ATACANDO ⚔
        </div>
      </div>

      {/* ── Bottom energy bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${rarColor}, rgba(255,255,255,0.8), ${rarColor}, transparent)`,
        animation: 'cac-bottom-bar 0.4s ease-out 0.05s both',
        boxShadow: `0 0 12px ${rarColor}`,
        pointerEvents: 'none',
      }} />

      {/* ── CSS keyframes ── */}
      <style>{`
        @keyframes cac-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cac-card-slam {
          0%   { transform: scale(0.55) translateY(40px); opacity: 0; }
          60%  { transform: scale(1.08) translateY(-6px); opacity: 1; }
          80%  { transform: scale(0.97) translateY(2px); }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes cac-name-reveal {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cac-attack-label {
          from { opacity: 0; transform: scale(0.7) translateY(8px); letter-spacing: 0.6em; }
          to   { opacity: 1; transform: scale(1) translateY(0); letter-spacing: 0.3em; }
        }
        @keyframes cac-rays-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes cac-vortex-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg) scale(1.08); }
        }
        @keyframes cac-lightning-flash {
          0%  { background: rgba(255,0,0,0); }
          15% { background: rgba(255,60,60,0.18); }
          30% { background: rgba(255,0,0,0); }
          50% { background: rgba(255,80,80,0.12); }
          65% { background: rgba(255,0,0,0); }
          80% { background: rgba(255,50,50,0.08); }
          100%{ background: rgba(255,0,0,0); }
        }
        @keyframes cac-ring-pulse {
          0%   { transform: scale(0.5); opacity: 0.8; }
          60%  { transform: scale(1.15); opacity: 0.5; }
          100% { transform: scale(1); opacity: 0.3; }
        }
        @keyframes cac-scanline {
          0%   { top: -4px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes cac-icon-pulse {
          from { transform: scale(0.9) translateY(0px); opacity: 0.7; }
          to   { transform: scale(1.1) translateY(-4px); opacity: 1; }
        }
        @keyframes cac-shimmer-sweep {
          from { background-position: 200% 50%; }
          to   { background-position: -200% 50%; }
        }
        @keyframes cac-mythic-pulse {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cac-bottom-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes cac-ptcl-rise {
          0%   { transform: translateY(0) scale(1);    opacity: 1; }
          100% { transform: translateY(-80px) scale(0); opacity: 0; }
        }
        @keyframes cac-ptcl-swirl {
          0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-60px) translateX(30px) rotate(180deg) scale(0); opacity: 0; }
        }
        @keyframes cac-ptcl-burst {
          0%   { transform: scale(0); opacity: 0; }
          30%  { transform: scale(1.4); opacity: 1; }
          100% { transform: scale(0.2) translateY(-50px); opacity: 0; }
        }
        @keyframes cac-ptcl-chaos {
          0%   { transform: scale(0) rotate(0deg); opacity: 0; }
          20%  { transform: scale(1.6) rotate(90deg); opacity: 1; }
          100% { transform: scale(0) rotate(360deg) translateX(${Math.random() > 0.5 ? '' : '-'}40px); opacity: 0; }
        }
        @keyframes cac-ptcl-ember {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          50%  { transform: translateY(-30px) translateX(${Math.random() > 0.5 ? '15' : '-15'}px) scale(0.8); }
          100% { transform: translateY(-70px) scale(0.2); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
