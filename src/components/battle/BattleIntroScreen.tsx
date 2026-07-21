// VexForge BattleIntroScreen v1.0 — Epic I: VEXFORGE DOMINION
// Cinematic battle intro: faction banners, animated face-off, VS graphic, countdown.
// Procedural CSS animations only — zero external assets.

import { useState, useEffect, useRef } from 'react';
import { AudioEngine } from '../../lib/audioEngine';
import { particleEngine } from '../../lib/particleEngine';

interface BattleIntroScreenProps {
  playerName: string;
  playerFaction: string;
  opponentName: string;
  opponentFaction: string;
  onComplete: () => void;
  canvasRef?: React.RefObject<HTMLCanvasElement>;
}

const FACTION_THEME: Record<string, { primary: string; secondary: string; glow: string; icon: string }> = {
  Guerrero:    { primary: '#c0392b', secondary: '#922b21', glow: 'rgba(192,57,43,0.6)',  icon: '⚔️' },
  Mago:        { primary: '#8e44ad', secondary: '#6c3483', glow: 'rgba(142,68,173,0.6)', icon: '🔮' },
  Explorador:  { primary: '#27ae60', secondary: '#1e8449', glow: 'rgba(39,174,96,0.6)',  icon: '🏹' },
  Comerciante: { primary: '#f39c12', secondary: '#d68910', glow: 'rgba(243,156,18,0.6)', icon: '💰' },
  default:     { primary: '#4a9eff', secondary: '#2471a3', glow: 'rgba(74,158,255,0.6)', icon: '🃏' },
};

export function BattleIntroScreen({
  playerName, playerFaction, opponentName, opponentFaction, onComplete, canvasRef,
}: BattleIntroScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'vs' | 'countdown' | 'done'>('enter');
  const [count, setCount] = useState(3);
  const containerRef = useRef<HTMLDivElement>(null);

  const pTheme = FACTION_THEME[playerFaction]   ?? FACTION_THEME['default'];
  const oTheme = FACTION_THEME[opponentFaction] ?? FACTION_THEME['default'];

  useEffect(() => {
    // Announce factions via audio
    AudioEngine.setFaction(playerFaction);
    AudioEngine.factionIntro(playerFaction);

    const t1 = setTimeout(() => setPhase('vs'), 900);
    const t2 = setTimeout(() => {
      setPhase('countdown');
      AudioEngine.factionIntro(opponentFaction);
    }, 1600);

    // Countdown 3→2→1→BATTLE
    let remaining = 3;
    const countInterval = setInterval(() => {
      remaining--;
      if (remaining > 0) {
        setCount(remaining);
        AudioEngine.triggerKeyword('Surge'); // tick sound
      } else {
        clearInterval(countInterval);
        setPhase('done');
        AudioEngine.battleIntro();
        // Particle burst if canvas available
        if (canvasRef?.current) {
          const cv = canvasRef.current;
          const cx = cv.width / 2; const cy = cv.height / 2;
          particleEngine.cardEntry(cx, cy, playerFaction);
          setTimeout(() => particleEngine.cardEntry(cx, cy, opponentFaction), 120);
        }
        setTimeout(onComplete, 400);
      }
    }, 600);

    return () => {
      clearTimeout(t1); clearTimeout(t2); clearInterval(countInterval);
    };
  }, []);

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(180deg, #060610 0%, #0a0a1f 100%)',
      overflow: 'hidden',
    }}>
      {/* Faction panels */}
      <div style={{ display: 'flex', width: '100%', height: '100%', position: 'absolute', inset: 0 }}>
        {/* Player side — slides in from left */}
        <div style={{
          flex: 1, background: `linear-gradient(135deg, ${pTheme.primary}22 0%, transparent 100%)`,
          borderRight: `1px solid ${pTheme.primary}44`,
          transform: phase === 'enter' ? 'translateX(-100%)' : 'translateX(0)',
          transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
          justifyContent: 'center', padding: '0 24px',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: `drop-shadow(0 0 12px ${pTheme.glow})` }}>
            {pTheme.icon}
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 11, color: pTheme.primary,
            letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4,
          }}>
            {playerFaction}
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 700,
            color: '#e0e0f8', letterSpacing: '0.05em',
            textShadow: `0 0 20px ${pTheme.glow}`,
            maxWidth: 140, wordBreak: 'break-word',
          }}>
            {playerName}
          </div>
          <div style={{
            marginTop: 8, fontSize: 10, color: pTheme.primary, opacity: 0.6,
            fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em',
          }}>
            YOU
          </div>
        </div>

        {/* Opponent side — slides in from right */}
        <div style={{
          flex: 1, background: `linear-gradient(225deg, ${oTheme.primary}22 0%, transparent 100%)`,
          borderLeft: `1px solid ${oTheme.primary}44`,
          transform: phase === 'enter' ? 'translateX(100%)' : 'translateX(0)',
          transition: 'transform 0.7s cubic-bezier(0.22,1,0.36,1)',
          display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
          justifyContent: 'center', padding: '0 24px',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8, filter: `drop-shadow(0 0 12px ${oTheme.glow})` }}>
            {oTheme.icon}
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 11, color: oTheme.primary,
            letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.8, marginBottom: 4, textAlign: 'right',
          }}>
            {opponentFaction}
          </div>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 18, fontWeight: 700,
            color: '#e0e0f8', letterSpacing: '0.05em',
            textShadow: `0 0 20px ${oTheme.glow}`,
            textAlign: 'right', maxWidth: 140, wordBreak: 'break-word',
          }}>
            {opponentName}
          </div>
          <div style={{
            marginTop: 8, fontSize: 10, color: oTheme.primary, opacity: 0.6,
            fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em',
          }}>
            RIVAL
          </div>
        </div>
      </div>

      {/* VS graphic — center */}
      <div style={{
        position: 'relative', zIndex: 10,
        opacity: phase === 'enter' ? 0 : 1,
        transform: phase === 'enter' ? 'scale(0.4)' : phase === 'vs' ? 'scale(1.1)' : 'scale(1)',
        transition: 'opacity 0.4s ease, transform 0.5s cubic-bezier(0.22,1,0.36,1)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* VS text */}
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 42, fontWeight: 900,
          color: '#e8b84b', letterSpacing: '0.1em',
          textShadow: '0 0 30px rgba(232,184,75,0.8), 0 0 60px rgba(232,184,75,0.4)',
          background: 'linear-gradient(180deg, #f5d585, #e8b84b, #b8860b)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>
          VS
        </div>
        {/* Dividing line */}
        <div style={{
          width: 2, height: 40, margin: '8px 0',
          background: 'linear-gradient(180deg, transparent, #e8b84b, transparent)',
          opacity: phase === 'vs' || phase === 'countdown' ? 1 : 0,
          transition: 'opacity 0.5s',
        }} />
      </div>

      {/* Countdown */}
      {(phase === 'countdown' || phase === 'done') && (
        <div style={{
          position: 'absolute', bottom: 60, left: 0, right: 0,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
          animation: 'fadeInUp 0.3s ease',
        }}>
          <div style={{
            fontFamily: 'Cinzel, serif', fontSize: 52, fontWeight: 900,
            color: count === 1 ? '#e8b84b' : '#e0e0f8',
            textShadow: `0 0 30px ${count === 1 ? 'rgba(232,184,75,0.9)' : 'rgba(200,200,255,0.5)'}`,
            transition: 'all 0.15s',
            animation: 'pulseBig 0.5s ease',
          }}>
            {phase === 'done' ? '⚔️' : count}
          </div>
          <div style={{
            fontFamily: 'Rajdhani, sans-serif', fontSize: 12,
            color: '#888', letterSpacing: '0.25em', textTransform: 'uppercase',
          }}>
            {phase === 'done' ? 'BATTLE!' : 'READY...'}
          </div>
        </div>
      )}

      {/* Bottom decorative line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, ${pTheme.primary}, #e8b84b, ${oTheme.primary})`,
        opacity: 0.6,
      }} />

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pulseBig { 0%,100% { transform:scale(1); } 50% { transform:scale(1.18); } }
      `}</style>
    </div>
  );
}
