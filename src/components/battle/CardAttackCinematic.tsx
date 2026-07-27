// VEXFORGE FASE 2 — Card Attack Cinematic Overlay
// Rarity-specific dramatic reveals when cards attack in battle.
// Common/Uncommon: silent pass-through. Rare+: escalating visual epicness.

import { useEffect, useRef } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';

interface CardAttackCinematicProps {
  unit: BattleUnit | null;
  visible: boolean;
  onDone: () => void;
}

const RARITY_DURATION: Record<string, number> = {
  Common:    0,
  Uncommon:  0,
  Rare:      400,
  Epic:      500,
  Legendary: 700,
  Mythic:    900,
  Founder:   900,
};

const RARITY_BG: Record<string, string> = {
  Rare:      'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(74,158,255,0.25) 0%, rgba(5,5,14,0.95) 70%)',
  Epic:      'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(168,85,247,0.28) 0%, rgba(5,5,14,0.96) 70%)',
  Legendary: 'radial-gradient(ellipse 85% 75% at 50% 50%, rgba(232,184,75,0.35) 0%, rgba(5,5,14,0.97) 65%)',
  Mythic:    'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,68,68,0.4) 0%, rgba(5,5,14,0.98) 60%)',
  Founder:   'radial-gradient(ellipse 90% 80% at 50% 50%, rgba(255,107,53,0.38) 0%, rgba(5,5,14,0.98) 60%)',
};

export function CardAttackCinematic({ unit, visible, onDone }: CardAttackCinematicProps) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasTriggeredAudioRef = useRef(false);

  useEffect(() => {
    if (!visible || !unit) {
      hasTriggeredAudioRef.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      return;
    }

    const rarity = unit.rarity;
    const duration = RARITY_DURATION[rarity] ?? 0;

    // Common/Uncommon: skip cinematic entirely
    if (duration === 0) {
      onDone();
      return;
    }

    // Trigger audio once per cinematic
    if (!hasTriggeredAudioRef.current) {
      hasTriggeredAudioRef.current = true;
      if (rarity === 'Legendary') {
        try { (AudioEngine as any).sfxLegendaryReveal?.(); } catch {}
      } else if (rarity === 'Mythic' || rarity === 'Founder') {
        try { (AudioEngine as any).sfxMythicReveal?.(); } catch {}
      }
    }

    timeoutRef.current = setTimeout(() => {
      onDone();
    }, duration);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [visible, unit, onDone]);

  // Don't render anything for Common/Uncommon or when not visible
  if (!visible || !unit || (RARITY_DURATION[unit.rarity] ?? 0) === 0) {
    return null;
  }

  const rarity = unit.rarity;
  const rarColor = RARITY_COLOR[rarity] ?? '#8b8b9e';
  const rarGlow  = RARITY_GLOW[rarity]  ?? 'rgba(139,139,158,0.3)';
  const bgGrad   = RARITY_BG[rarity] ?? RARITY_BG.Rare;

  return (
    <div
      className="card-attack-overlay"
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 100,
        background: bgGrad,
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        animation: 'card-cinematic-appear 0.18s ease forwards',
      }}
    >
      {/* Mythic: screen shake applied via className */}
      {(rarity === 'Mythic' || rarity === 'Founder') && (
        <div
          className="card-cinematic-mythic"
          style={{ position: 'absolute', inset: 0 }}
        />
      )}

      {/* Card image frame */}
      <div
        className="card-cinematic-frame"
        style={{
          position: 'relative',
          width: 220,
          height: 290,
          borderRadius: 14,
          border: `3px solid ${rarColor}`,
          background: unit.image_url
            ? `linear-gradient(180deg, rgba(5,5,14,0.3) 0%, rgba(5,5,14,0.85) 100%), url(${unit.image_url}) center/cover no-repeat`
            : `linear-gradient(160deg, ${rarColor}30 0%, rgba(5,5,14,0.98) 60%)`,
          boxShadow: `0 0 40px ${rarGlow}, 0 0 80px ${rarColor}44, inset 0 0 30px ${rarColor}11`,
          overflow: 'hidden',
          animation: rarity === 'Mythic' || rarity === 'Founder'
            ? 'card-cinematic-appear 0.22s ease forwards'
            : 'card-cinematic-appear 0.18s ease forwards',
        }}
      >
        {/* Rarity-specific overlay effects */}
        {rarity === 'Rare' && (
          <div
            style={{
              position: 'absolute',
              inset: -2,
              border: `2px solid ${rarColor}`,
              borderRadius: 14,
              animation: 'cinematic-border-pulse 0.6s ease-in-out infinite',
              pointerEvents: 'none',
            }}
          />
        )}

        {rarity === 'Epic' && (
          <>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: `radial-gradient(circle at 50% 50%, ${rarColor}22 0%, transparent 60%)`,
                animation: 'epic-pulse-ring 1.2s ease-in-out infinite',
                pointerEvents: 'none',
              }}
            />
            {/* Chromatic aberration via text-shadow applied to name below */}
          </>
        )}

        {rarity === 'Legendary' && (
          <>
            {/* Rotating golden rays */}
            <div
              style={{
                position: 'absolute',
                inset: -50,
                background: `conic-gradient(from 0deg at 50% 50%, transparent 0deg, ${rarColor}33 45deg, transparent 90deg, ${rarColor}33 135deg, transparent 180deg, ${rarColor}33 225deg, transparent 270deg, ${rarColor}33 315deg, transparent 360deg)`,
                animation: 'legendary-rays 3s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* Scanline sweep */}
            <div
              style={{
                position: 'absolute',
                left: '-20%',
                right: '-20%',
                height: 3,
                background: `linear-gradient(90deg, transparent 0%, ${rarGlow} 40%, rgba(255,255,255,0.6) 50%, ${rarGlow} 60%, transparent 100%)`,
                animation: 'legendary-scanline 2s ease-in-out infinite',
                transform: 'skewX(-12deg)',
                pointerEvents: 'none',
              }}
            />
          </>
        )}

        {(rarity === 'Mythic' || rarity === 'Founder') && (
          <>
            {/* Red vortex spiral */}
            <div
              style={{
                position: 'absolute',
                inset: -60,
                background: `conic-gradient(from 0deg at 50% 50%, ${rarColor}44 0deg, transparent 60deg, ${rarColor}55 120deg, transparent 180deg, ${rarColor}44 240deg, transparent 300deg)`,
                animation: 'mythic-vortex 2.5s linear infinite',
                pointerEvents: 'none',
              }}
            />
            {/* Electric lightning bolts (simulated via radial flashes) */}
            {[0, 1, 2].map(i => (
              <div
                key={i}
                style={{
                  position: 'absolute',
                  top: `${20 + i * 25}%`,
                  left: `${10 + i * 30}%`,
                  width: 4,
                  height: 60,
                  background: `linear-gradient(180deg, ${rarColor}dd 0%, transparent 100%)`,
                  filter: `blur(2px) drop-shadow(0 0 8px ${rarColor})`,
                  transform: `rotate(${-15 + i * 25}deg)`,
                  animation: `mythic-lightning ${0.8 + i * 0.3}s ease-in-out infinite`,
                  animationDelay: `${i * 0.2}s`,
                  pointerEvents: 'none',
                }}
              />
            ))}
          </>
        )}

        {/* Card name label */}
        <div
          style={{
            position: 'absolute',
            bottom: 16,
            left: 12,
            right: 12,
            textAlign: 'center',
            fontFamily: rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Founder' ? '"Cinzel",serif' : '"Rajdhani",sans-serif',
            fontSize: rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Founder' ? 16 : 14,
            fontWeight: 900,
            color: '#fff',
            textShadow:
              rarity === 'Epic'
                ? `2px 0 0 #f0f, -2px 0 0 #0ff, 0 0 20px ${rarColor}` // chromatic aberration
                : rarity === 'Legendary'
                  ? `0 0 20px ${rarGlow}, 0 0 40px ${rarColor}, 0 2px 8px rgba(0,0,0,0.9)`
                  : (rarity === 'Mythic' || rarity === 'Founder')
                    ? `0 0 12px ${rarColor}, 0 0 24px #ff0000, 0 0 36px #ff8800, 0 2px 10px rgba(0,0,0,0.95)`
                    : `0 0 12px ${rarColor}, 0 2px 6px rgba(0,0,0,0.8)`,
            letterSpacing: rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Founder' ? '0.1em' : '0.05em',
            textTransform: 'uppercase',
            animation: (rarity === 'Legendary' || rarity === 'Mythic' || rarity === 'Founder') ? 'cinematic-name-glow 1.5s ease-in-out infinite' : 'none',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {unit.name}
        </div>

        {/* Rarity badge top-right */}
        <div
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            padding: '4px 10px',
            background: `rgba(0,0,0,0.85)`,
            border: `1px solid ${rarColor}`,
            borderRadius: 6,
            fontFamily: '"IBM Plex Mono",monospace',
            fontSize: 9,
            fontWeight: 800,
            color: rarColor,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            boxShadow: `0 0 12px ${rarGlow}`,
          }}
        >
          {rarity}
        </div>
      </div>

      {/* Global cinematic keyframes */}
      <style>{`
        @keyframes card-cinematic-appear {
          0%   { opacity: 0; transform: scale(0.3); filter: blur(12px); }
          60%  { opacity: 1; transform: scale(1.05); filter: blur(0px); }
          100% { opacity: 1; transform: scale(1); filter: blur(0px); }
        }
        @keyframes card-cinematic-exit {
          0%   { opacity: 1; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.2); }
        }
        @keyframes cinematic-border-pulse {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes epic-pulse-ring {
          0%   { transform: scale(0.8); opacity: 0.8; }
          50%  { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        @keyframes legendary-rays {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes legendary-scanline {
          0%   { top: -10%; opacity: 0; }
          10%  { opacity: 0.8; }
          90%  { opacity: 0.6; }
          100% { top: 110%; opacity: 0; }
        }
        @keyframes mythic-vortex {
          from { transform: rotate(0deg) scale(1); }
          to   { transform: rotate(-360deg) scale(1.1); }
        }
        @keyframes mythic-lightning {
          0%, 100% { opacity: 0; }
          10%      { opacity: 1; }
          15%      { opacity: 0; }
          25%      { opacity: 0.8; }
          30%      { opacity: 0; }
        }
        @keyframes mythic-attack-shake {
          0%, 100% { transform: translateX(0); }
          10%      { transform: translateX(-4px); }
          20%      { transform: translateX(4px); }
          30%      { transform: translateX(-3px); }
          40%      { transform: translateX(3px); }
          50%      { transform: translateX(-2px); }
          60%      { transform: translateX(2px); }
          70%      { transform: translateX(-1px); }
          80%      { transform: translateX(1px); }
        }
        @keyframes cinematic-name-glow {
          0%, 100% { filter: brightness(1); }
          50%      { filter: brightness(1.3); }
        }
        .card-cinematic-mythic {
          animation: mythic-attack-shake 0.5s ease infinite;
        }
      `}</style>
    </div>
  );
}
