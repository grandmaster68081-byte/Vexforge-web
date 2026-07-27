// VEXFORGE — Card Attack Cinematic v4.0 — TIER-1 DCCG EDITION
// Per-card full-screen cinematic when a card attacks in battle.
// Cada carta tiene su propia cinemática. Ninguna rareza es 0ms.
// Common/Uncommon: flash rápido 350ms. Rare→Mythic: espectaculares.
// Inspirado en Yu-Gi-Oh Master Duel + Hearthstone Battlegrounds.

import { useEffect, useRef, useState, useCallback } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW, KEYWORD_ICON } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';

interface CardAttackCinematicProps {
  unit: BattleUnit | null;
  visible: boolean;
  onDone: () => void;
}

// Duration per rarity — todos tienen cinemática ahora
const RARITY_DURATION: Record<string, number> = {
  Common:    350,
  Uncommon:  450,
  Rare:      720,
  Epic:      920,
  Legendary: 1150,
  Mythic:    1400,
  Founder:   1250,
};

// Faction accent colors
const FACTION_COLOR: Record<string, string> = {
  Guerrero:    '#e84040',
  Mago:        '#7b4fd4',
  'Pícaro':    '#3dc96b',
  'Paladín':   '#e8b84b',
  Explorador:  '#3dc96b',
  Comerciante: '#e8b84b',
  default:     '#4a9eff',
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

// Per-rarity particle configs
interface Particle {
  id: number; x: number; y: number; size: number;
  dur: number; delay: number; anim: string;
  color: string; shape: 'circle' | 'diamond' | 'star' | 'spark';
  tx?: number; ty?: number;
}

let _pid = 0;
function makeParticles(rarity: string, rarColor: string, factionColor: string): Particle[] {
  const cfgMap: Record<string, { count: number; anims: string[]; colors: string[]; shapes: Particle['shape'][] }> = {
    Common:    { count: 6,  anims: ['cac-ptcl-rise'],    colors: ['#a0a0c0','#c0c0e0','#e0e0ff'],                              shapes: ['circle','spark'] },
    Uncommon:  { count: 8,  anims: ['cac-ptcl-rise'],    colors: [factionColor, `${factionColor}99`,'#d0d0f0'],                shapes: ['circle','diamond'] },
    Rare:      { count: 12, anims: ['cac-ptcl-rise'],    colors: ['#4a9eff','#7abcff','#c0e0ff','#ffffff'],                    shapes: ['circle','diamond','star'] },
    Epic:      { count: 16, anims: ['cac-ptcl-swirl'],   colors: ['#a855f7','#c084fc','#e9d5ff','#7c3aed','#ffffff'],          shapes: ['diamond','star','circle'] },
    Legendary: { count: 22, anims: ['cac-ptcl-burst'],   colors: ['#f59e0b','#fde68a','#ffffff','#e8b84b','#fbbf24','#ffdd80'],shapes: ['star','diamond','circle','spark'] },
    Mythic:    { count: 28, anims: ['cac-ptcl-chaos'],   colors: ['#ff4444','#ff8888','#ffffff','#ffcc00','#ff6600','#ff2200'],shapes: ['star','circle','diamond','spark'] },
    Founder:   { count: 22, anims: ['cac-ptcl-ember'],   colors: ['#ff6b35','#ff9d6b','#ffffff','#ffd700','#ff4500','#ffaa44'],shapes: ['diamond','star','circle','spark'] },
  };
  const cfg = cfgMap[rarity] ?? cfgMap.Rare;
  return Array.from({ length: cfg.count }, (_, i) => ({
    id: ++_pid,
    x:     Math.random() * 88 + 6,
    y:     Math.random() * 88 + 6,
    size:  Math.random() * (rarity === 'Mythic' ? 14 : rarity === 'Legendary' ? 10 : 8) + 4,
    dur:   Math.random() * 0.7 + (rarity === 'Mythic' ? 1.0 : rarity === 'Legendary' ? 0.8 : 0.65),
    delay: Math.random() * 0.4,
    anim:  cfg.anims[i % cfg.anims.length],
    color: cfg.colors[i % cfg.colors.length] ?? rarColor,
    shape: cfg.shapes[i % cfg.shapes.length],
    tx: (Math.random() - 0.5) * 120,
    ty: (Math.random() - 0.5) * 120,
  }));
}

function ParticleEl({ p }: { p: Particle }) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left:  `${p.x}%`,
    top:   `${p.y}%`,
    width:  p.size,
    height: p.size,
    animationName: p.anim,
    animationDuration: `${p.dur}s`,
    animationDelay: `${p.delay}s`,
    animationFillMode: 'both',
    animationTimingFunction: 'ease-out',
    pointerEvents: 'none',
    '--tx': `${p.tx ?? 0}px`,
    '--ty': `${p.ty ?? 0}px`,
  } as React.CSSProperties & { '--tx': string; '--ty': string };

  if (p.shape === 'circle')
    return <div style={{ ...baseStyle, borderRadius: '50%', background: p.color, boxShadow: `0 0 ${p.size}px ${p.color}` }} />;
  if (p.shape === 'diamond')
    return <div style={{ ...baseStyle, background: p.color, transform: 'rotate(45deg)', boxShadow: `0 0 ${p.size * 0.8}px ${p.color}` }} />;
  if (p.shape === 'spark')
    return <div style={{ ...baseStyle, width: p.size * 0.35, height: p.size * 2.2, borderRadius: 2, background: `linear-gradient(180deg, ${p.color}, transparent)`, boxShadow: `0 0 6px ${p.color}` }} />;
  // star
  return (
    <div style={{ ...baseStyle, background: 'transparent', fontSize: p.size + 4, lineHeight: 1,
      color: p.color, textShadow: `0 0 ${p.size}px ${p.color}`,
      animationName: p.anim, animationDuration: `${p.dur}s`,
      animationDelay: `${p.delay}s`, animationFillMode: 'both' }}>
      ✦
    </div>
  );
}

function KeywordRow({ keywords }: { keywords?: string[] }) {
  if (!keywords?.length) return null;
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginTop: 10 }}>
      {keywords.slice(0, 5).map(kw => (
        <span key={kw} style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 20,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)',
          color: '#c0c8e8', fontFamily: 'Rajdhani, sans-serif',
          fontWeight: 600, letterSpacing: '0.06em',
          backdropFilter: 'blur(4px)',
        }}>
          {KEYWORD_ICON[kw] ?? '•'} {kw}
        </span>
      ))}
    </div>
  );
}

// ─── Rarity-specific background config ──────────────────────────────────────
const RARITY_BG_CONFIG: Record<string, { bg: string; overlay: string; lightning: boolean; vortex: boolean; coronas: number }> = {
  Common:    { bg: 'radial-gradient(ellipse 100% 90% at 50% 60%, rgba(40,40,70,0.85) 0%, rgba(5,5,14,0.97) 65%)',    overlay: 'rgba(160,160,200,0.06)', lightning: false, vortex: false, coronas: 0 },
  Uncommon:  { bg: 'radial-gradient(ellipse 110% 95% at 50% 60%, rgba(20,60,40,0.88) 0%, rgba(5,5,14,0.97) 65%)',    overlay: 'rgba(61,220,132,0.06)',  lightning: false, vortex: false, coronas: 0 },
  Rare:      { bg: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(10,40,100,0.9) 0%, rgba(5,5,14,0.97) 65%)',   overlay: 'rgba(74,158,255,0.08)',  lightning: false, vortex: false, coronas: 1 },
  Epic:      { bg: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(60,15,110,0.92) 0%, rgba(5,5,14,0.98) 65%)',  overlay: 'rgba(168,85,247,0.10)',  lightning: false, vortex: true,  coronas: 2 },
  Legendary: { bg: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(90,55,0,0.92) 0%, rgba(5,5,14,0.98) 65%)',   overlay: 'rgba(232,184,75,0.12)',  lightning: true,  vortex: false, coronas: 3 },
  Mythic:    { bg: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(90,5,5,0.94) 0%, rgba(5,5,14,0.99) 65%)',    overlay: 'rgba(255,68,68,0.14)',   lightning: true,  vortex: true,  coronas: 4 },
  Founder:   { bg: 'radial-gradient(ellipse 120% 100% at 50% 60%, rgba(90,35,5,0.92) 0%, rgba(5,5,14,0.98) 65%)',   overlay: 'rgba(255,107,53,0.12)',  lightning: true,  vortex: false, coronas: 3 },
};

// ─── Corona rings (Legendary+) ───────────────────────────────────────────────
function CoronaRings({ count, color }: { count: number; color: string }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          inset: `${-20 - i * 30}px`,
          borderRadius: '50%',
          border: `${2 - i * 0.3}px solid ${color}${Math.round((0.5 - i * 0.12) * 255).toString(16).padStart(2,'0')}`,
          animation: `cac-corona-spin ${1.8 + i * 0.6}s linear infinite ${i % 2 === 0 ? '' : 'reverse'}`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export function CardAttackCinematic({ unit, visible, onDone }: CardAttackCinematicProps) {
  const [entered, setEntered] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enterRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [imgError, setImgError] = useState(false);

  const triggerAudio = useCallback((rarity: string, faction: string) => {
    try {
      AudioEngine.setFaction?.(faction);
      if (typeof AudioEngine.rarityAttack === 'function') AudioEngine.rarityAttack(rarity);
      else AudioEngine.attack?.();
    } catch { /* silent */ }
  }, []);

  // Reset image error on new unit
  useEffect(() => { setImgError(false); }, [unit?.id]);

  useEffect(() => {
    if (!visible || !unit) {
      setEntered(false);
      setParticles([]);
      return;
    }

    const rarity = unit.rarity;
    const rarColor = RARITY_COLOR[rarity] ?? '#8b8b9e';
    const faction = unit.faction ?? 'default';
    const factionColor = FACTION_COLOR[faction] ?? '#4a9eff';
    const duration = RARITY_DURATION[rarity] ?? 400;

    triggerAudio(rarity, faction);

    // Entered state drives card-slam animation
    enterRef.current = setTimeout(() => setEntered(true), 40);

    // Spawn particles after brief delay
    setTimeout(() => setParticles(makeParticles(rarity, rarColor, factionColor)), 80);

    // Auto-close
    timeoutRef.current = setTimeout(() => {
      setEntered(false);
      setParticles([]);
      onDone();
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (enterRef.current)   clearTimeout(enterRef.current);
    };
  }, [visible, unit, onDone, triggerAudio]);

  if (!visible || !unit) return null;

  const rarity     = unit.rarity;
  const rarColor   = RARITY_COLOR[rarity] ?? '#8b8b9e';
  const rarGlow    = RARITY_GLOW[rarity]  ?? 'rgba(139,139,158,0.35)';
  const faction    = unit.faction ?? 'default';
  const factionColor = FACTION_COLOR[faction] ?? '#4a9eff';
  const fIcon      = FACTION_ICON[faction] ?? '⚡';
  const dur        = RARITY_DURATION[rarity];
  const bgCfg      = RARITY_BG_CONFIG[rarity] ?? RARITY_BG_CONFIG.Rare;
  const isQuick    = rarity === 'Common' || rarity === 'Uncommon';

  // Card size scales with rarity
  const cardW = isQuick ? 120 : rarity === 'Rare' ? 150 : rarity === 'Epic' ? 170 : 190;
  const cardH = Math.round(cardW * 1.42);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9000,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        background: bgCfg.bg,
        backdropFilter: isQuick ? 'none' : 'blur(2px)',
        animation: `cac-overlay-in ${Math.min(dur * 0.12, 100)}ms ease forwards`,
        overflow: 'hidden',
      }}
    >
      {/* Particle layer */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
        {particles.map(p => <ParticleEl key={p.id} p={p} />)}
      </div>

      {/* Background overlay tint */}
      <div style={{
        position: 'absolute', inset: 0,
        background: bgCfg.overlay,
        pointerEvents: 'none',
      }} />

      {/* Ray burst — Legendary+ */}
      {bgCfg.coronas >= 2 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 700, height: 700,
          transform: 'translate(-50%,-50%)',
          background: `conic-gradient(from 0deg, transparent 0deg, ${rarColor}18 10deg, transparent 20deg, transparent 30deg, ${rarColor}12 40deg, transparent 50deg)`,
          animation: 'cac-rays-spin 3s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Vortex ring — Epic/Mythic */}
      {bgCfg.vortex && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          width: 340, height: 340,
          transform: 'translate(-50%,-50%)',
          borderRadius: '50%',
          border: `3px solid ${rarColor}55`,
          boxShadow: `0 0 40px ${rarColor}44, inset 0 0 60px ${rarColor}22`,
          animation: 'cac-vortex-spin 1.2s linear infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Lightning flash — Legendary+ */}
      {bgCfg.lightning && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse 70% 70% at 50% 40%, ${rarColor}22 0%, transparent 70%)`,
          animation: 'cac-lightning-flash 0.5s ease-in-out',
          pointerEvents: 'none',
        }} />
      )}

      {/* Scanline effect */}
      <div style={{
        position: 'absolute', left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${rarColor}88, transparent)`,
        animation: 'cac-scanline 0.5s ease-in-out both',
        pointerEvents: 'none',
      }} />

      {/* ─── CARD SHOWCASE ─────────────────────────────────────────── */}
      <div style={{
        position: 'relative', zIndex: 10,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
        animation: entered ? `cac-card-slam ${Math.min(dur * 0.22, 200)}ms cubic-bezier(0.22,1,0.36,1) both` : 'none',
      }}>
        {/* Faction label above card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          animation: 'cac-name-reveal 0.25s ease-out 0.08s both',
        }}>
          <span style={{
            fontFamily: 'Cinzel, serif', fontSize: 11, fontWeight: 700,
            color: factionColor, letterSpacing: '0.25em', textTransform: 'uppercase',
            textShadow: `0 0 12px ${factionColor}`,
          }}>
            {fIcon} {faction !== 'default' ? faction : 'FORGE'}
          </span>
        </div>

        {/* ─── CARTA CENTRAL ─────────────────────────────────────── */}
        <div style={{
          position: 'relative',
          width: cardW, height: cardH,
          borderRadius: 12,
          border: `3px solid ${rarColor}`,
          boxShadow: [
            `0 0 30px ${rarGlow}`,
            `0 0 60px ${rarGlow}`,
            `0 0 10px ${rarColor}88`,
            `inset 0 0 20px rgba(0,0,0,0.5)`,
          ].join(', '),
          background: `linear-gradient(160deg, ${rarColor}25 0%, rgba(6,6,16,0.99) 100%)`,
          overflow: 'visible',
        }}>
          {/* Corona rings */}
          {bgCfg.coronas > 0 && (
            <CoronaRings count={bgCfg.coronas} color={rarColor} />
          )}

          {/* Card image */}
          <div style={{
            position: 'absolute', inset: 0,
            borderRadius: 10,
            overflow: 'hidden',
            background: `linear-gradient(160deg, ${FACTION_COLOR[faction] ?? '#1a1a2e'}44 0%, rgba(6,6,16,0.95) 100%)`,
          }}>
            {unit.image_url && !imgError ? (
              <>
                <img
                  src={unit.image_url}
                  alt={unit.name}
                  onError={() => setImgError(true)}
                  style={{
                    width: '100%', height: '78%',
                    objectFit: 'cover', objectPosition: 'top center',
                    display: 'block',
                    filter: `saturate(1.3) contrast(1.1) drop-shadow(0 0 8px ${rarColor}44)`,
                  }}
                />
                {/* Bottom gradient overlay on image */}
                <div style={{
                  position: 'absolute', bottom: '22%', left: 0, right: 0, height: '15%',
                  background: 'linear-gradient(transparent, rgba(6,6,16,0.99))',
                }} />
              </>
            ) : (
              <div style={{
                width: '100%', height: '78%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 52,
              }}>
                {fIcon}
              </div>
            )}

            {/* Card footer: name + stats */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              padding: '6px 8px 8px',
              background: 'linear-gradient(transparent, rgba(4,4,14,0.98) 30%)',
            }}>
              {/* Rarity badge */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 3,
              }}>
                <span style={{
                  fontSize: 8, fontFamily: 'IBM Plex Mono, monospace',
                  color: rarColor, letterSpacing: '0.18em', textTransform: 'uppercase',
                  textShadow: `0 0 6px ${rarColor}`,
                }}>
                  {rarity}
                </span>
                <div style={{ display: 'flex', gap: 5, fontSize: 9, fontFamily: 'IBM Plex Mono, monospace' }}>
                  <span style={{ color: '#e84040' }}>⚔{unit.atk}</span>
                  <span style={{ color: '#4a9eff' }}>🛡{unit.def}</span>
                  <span style={{ color: '#3dc96b' }}>♥{unit.hp}</span>
                </div>
              </div>

              {/* Card name */}
              <div style={{
                fontFamily: 'Cinzel, serif', fontWeight: 700,
                fontSize: isQuick ? 9 : 11,
                color: '#f0f0ff',
                textShadow: `0 0 8px ${rarColor}88`,
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {unit.name}
              </div>
            </div>

            {/* Shimmer sweep */}
            {!isQuick && (
              <div style={{
                position: 'absolute', inset: 0,
                background: `linear-gradient(105deg, transparent 30%, ${rarColor}18 50%, transparent 70%)`,
                backgroundSize: '300% 100%',
                animation: 'cac-shimmer-sweep 1s ease-in-out',
                pointerEvents: 'none', borderRadius: 10,
              }} />
            )}

            {/* Mythic/Legendary pulse overlay */}
            {(rarity === 'Mythic' || rarity === 'Legendary' || rarity === 'Founder') && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: 10,
                background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${rarColor}12 0%, transparent 65%)`,
                animation: 'cac-mythic-pulse 0.45s ease-in-out infinite alternate',
                pointerEvents: 'none',
              }} />
            )}
          </div>

          {/* Glowing border ring */}
          <div style={{
            position: 'absolute', inset: -3,
            borderRadius: 14,
            boxShadow: `0 0 20px ${rarColor}66, 0 0 40px ${rarColor}33`,
            pointerEvents: 'none',
          }} />
        </div>

        {/* ─── ATK label — dramatic ───────────────────────── */}
        {!isQuick && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            animation: 'cac-name-reveal 0.25s ease-out 0.15s both',
          }}>
            <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, transparent, ${rarColor}88)` }} />
            <span style={{
              fontFamily: 'Cinzel, serif', fontSize: rarity === 'Mythic' ? 28 : 22,
              fontWeight: 900, color: rarColor,
              textShadow: `0 0 20px ${rarGlow}, 0 0 40px ${rarGlow}`,
              letterSpacing: '0.15em',
            }}>
              ⚔ {unit.atk}
            </span>
            <div style={{ height: 1, width: 40, background: `linear-gradient(90deg, ${rarColor}88, transparent)` }} />
          </div>
        )}

        {/* Keywords */}
        {!isQuick && <KeywordRow keywords={unit.keywords} />}
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${rarColor}, transparent)`,
        animation: 'cac-bottom-bar 0.4s ease-out both',
        transformOrigin: 'center',
      }} />

      {/* Inline keyframes */}
      <style>{`
        @keyframes cac-overlay-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes cac-card-slam {
          0%   { transform: scale(2.2) translateY(-30px); opacity: 0; filter: brightness(3); }
          60%  { transform: scale(0.93) translateY(4px); opacity: 1; filter: brightness(1.4); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: brightness(1); }
        }
        @keyframes cac-name-reveal {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes cac-rays-spin {
          to { transform: translate(-50%,-50%) rotate(360deg); }
        }
        @keyframes cac-vortex-spin {
          to { transform: translate(-50%,-50%) rotate(360deg) scale(1.1); }
        }
        @keyframes cac-lightning-flash {
          0%,100% { opacity: 0; }
          25%,75% { opacity: 0.6; }
          50%     { opacity: 1; }
        }
        @keyframes cac-scanline {
          0%   { top: -4px; opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 0.7; }
          100% { top: 105%; opacity: 0; }
        }
        @keyframes cac-shimmer-sweep {
          from { background-position: 200% 50%; }
          to   { background-position: -200% 50%; }
        }
        @keyframes cac-mythic-pulse {
          from { opacity: 0.4; }
          to   { opacity: 1; }
        }
        @keyframes cac-bottom-bar {
          from { transform: scaleX(0); }
          to   { transform: scaleX(1); }
        }
        @keyframes cac-corona-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes cac-ptcl-rise {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-100px) scale(0); opacity: 0; }
        }
        @keyframes cac-ptcl-swirl {
          0%   { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translate(var(--tx,40px), var(--ty,-60px)) rotate(220deg) scale(0); opacity: 0; }
        }
        @keyframes cac-ptcl-burst {
          0%   { transform: scale(0); opacity: 0; }
          25%  { transform: scale(1.6); opacity: 1; }
          100% { transform: translate(var(--tx,0px), var(--ty,-60px)) scale(0.1); opacity: 0; }
        }
        @keyframes cac-ptcl-chaos {
          0%   { transform: scale(0) rotate(0deg); opacity: 0; }
          20%  { transform: scale(1.8) rotate(90deg); opacity: 1; }
          100% { transform: translate(var(--tx,40px), var(--ty,-60px)) scale(0) rotate(380deg); opacity: 0; }
        }
        @keyframes cac-ptcl-ember {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          50%  { transform: translate(var(--tx,15px), -35px) scale(0.8); opacity: 0.9; }
          100% { transform: translate(var(--tx,0px), -80px) scale(0.15); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
