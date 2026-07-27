// VexForge BattleIntroScreen v2.0 — CINEMATIC EDITION
// Inspirado en Yu-Gi-Oh Master Duel: paneles de facción, VS épico,
// cuenta regresiva dramática, flash de entrada al tablero.

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

const FACTION_THEME: Record<string, {
  primary: string; secondary: string; glow: string; icon: string;
  gradient: string; accent: string; runes: string[];
}> = {
  Guerrero: {
    primary: '#e84040', secondary: '#7a1010', glow: 'rgba(232,64,64,0.8)',
    icon: '⚔️', accent: '#ff6060',
    gradient: 'linear-gradient(160deg, #1a0000 0%, #3d0a0a 40%, #1a0505 100%)',
    runes: ['⚔','✦','⬡','✧','◆'],
  },
  Mago: {
    primary: '#7b4fd4', secondary: '#3a1a7a', glow: 'rgba(123,79,212,0.8)',
    icon: '🔮', accent: '#a855f7',
    gradient: 'linear-gradient(160deg, #050018 0%, #180a3d 40%, #0a0522 100%)',
    runes: ['✦','⊕','◈','⟐','★'],
  },
  'Pícaro': {
    primary: '#3dc96b', secondary: '#0e5c2a', glow: 'rgba(61,201,107,0.8)',
    icon: '🗡️', accent: '#5de88a',
    gradient: 'linear-gradient(160deg, #001a0a 0%, #0a3d1a 40%, #001505 100%)',
    runes: ['◆','✧','⬡','✦','⊕'],
  },
  'Paladín': {
    primary: '#e8b84b', secondary: '#7a5210', glow: 'rgba(232,184,75,0.8)',
    icon: '🛡️', accent: '#f5d585',
    gradient: 'linear-gradient(160deg, #1a1000 0%, #3d2a00 40%, #1a1200 100%)',
    runes: ['★','✦','◈','⬡','✧'],
  },
  Explorador: {
    primary: '#3dc96b', secondary: '#0e5c2a', glow: 'rgba(61,201,107,0.8)',
    icon: '🏹', accent: '#5de88a',
    gradient: 'linear-gradient(160deg, #001a0a 0%, #0a3d1a 40%, #001505 100%)',
    runes: ['◆','✧','⬡','✦','⊕'],
  },
  Comerciante: {
    primary: '#e8b84b', secondary: '#7a5210', glow: 'rgba(232,184,75,0.8)',
    icon: '💰', accent: '#f5d585',
    gradient: 'linear-gradient(160deg, #1a1000 0%, #3d2a00 40%, #1a1200 100%)',
    runes: ['★','✦','◈','⬡','✧'],
  },
  default: {
    primary: '#4a9eff', secondary: '#1a4a8a', glow: 'rgba(74,158,255,0.8)',
    icon: '🃏', accent: '#7abcff',
    gradient: 'linear-gradient(160deg, #000a1a 0%, #0a1e3d 40%, #000a1a 100%)',
    runes: ['◆','✦','⬡','◈','★'],
  },
};

// Floating rune particle animation
function RuneParticles({ theme, side }: { theme: typeof FACTION_THEME['default']; side: 'left' | 'right' }) {
  const runes = theme.runes;
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {runes.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          [side === 'left' ? 'left' : 'right']: `${10 + (i * 18) % 70}%`,
          bottom: `${(i * 23 + 10) % 60}%`,
          color: theme.primary,
          fontSize: `${12 + (i % 3) * 6}px`,
          opacity: 0.2 + (i % 3) * 0.15,
          animation: `rune-float-${i % 3} ${3 + i * 0.5}s ease-in-out infinite`,
          animationDelay: `${i * 0.4}s`,
          filter: `drop-shadow(0 0 4px ${theme.glow})`,
          fontFamily: 'serif',
        }}>
          {r}
        </div>
      ))}
    </div>
  );
}

export function BattleIntroScreen({
  playerName, playerFaction, opponentName, opponentFaction, onComplete, canvasRef,
}: BattleIntroScreenProps) {
  const [phase, setPhase] = useState<'enter' | 'vs' | 'countdown' | 'flash' | 'done'>('enter');
  const [count, setCount] = useState(3);
  const [shake, setShake] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const pTheme = FACTION_THEME[playerFaction] ?? FACTION_THEME['default'];
  const oTheme = FACTION_THEME[opponentFaction] ?? FACTION_THEME['default'];

  useEffect(() => {
    AudioEngine.setFaction(playerFaction);
    AudioEngine.factionIntro(playerFaction);

    const t1 = setTimeout(() => setPhase('vs'), 900);
    // countInterval must only start AFTER the countdown phase begins (1700ms)
    // to avoid tick firing before the VS screen is even shown
    let countInterval: ReturnType<typeof setInterval>;

    const t2 = setTimeout(() => {
      setPhase('countdown');
      AudioEngine.factionIntro(opponentFaction);

      let remaining = 3;
      const tick = () => {
        remaining--;
        setShake(true);
        setTimeout(() => setShake(false), 180);

        if (remaining > 0) {
          setCount(remaining);
          AudioEngine.triggerKeyword('Surge');
        } else {
          clearInterval(countInterval);
          setPhase('flash');
          AudioEngine.battleIntro();
          if (canvasRef?.current) {
            const cv = canvasRef.current;
            const cx = cv.width / 2; const cy = cv.height / 2;
            particleEngine.cardEntry(cx, cy, playerFaction);
            setTimeout(() => particleEngine.cardEntry(cx, cy, opponentFaction), 120);
          }
          setTimeout(() => { setPhase('done'); setTimeout(onComplete, 300); }, 500);
        }
      };
      countInterval = setInterval(tick, 650);
    }, 1700);

    return () => {
      clearTimeout(t1); clearTimeout(t2);
      // countInterval may not be defined if component unmounts before t2 fires
      clearInterval(countInterval!);
    };
  }, []);

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0, zIndex: 50,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: '#03030a',
      overflow: 'hidden',
      animation: shake ? 'intro-shake 0.18s ease' : undefined,
    }}>
      <style>{`
        @keyframes intro-slide-left  { from { transform: translateX(-110%); } to { transform: translateX(0); } }
        @keyframes intro-slide-right { from { transform: translateX(110%); }  to { transform: translateX(0); } }
        @keyframes intro-vs-pop      { 0% { transform: scale(0) rotate(-15deg); opacity:0; }
                                       60% { transform: scale(1.18) rotate(3deg); }
                                       80% { transform: scale(0.96) rotate(-1deg); }
                                       100% { transform: scale(1) rotate(0deg); opacity:1; } }
        @keyframes intro-vs-glow     { 0%,100% { text-shadow: 0 0 30px rgba(232,184,75,0.9), 0 0 60px rgba(232,184,75,0.5); }
                                       50% { text-shadow: 0 0 50px rgba(232,184,75,1), 0 0 100px rgba(232,184,75,0.7), 0 0 150px rgba(232,184,75,0.4); } }
        @keyframes intro-count       { 0% { transform: scale(1.8); opacity:0; } 30% { opacity:1; } 100% { transform: scale(1); opacity:1; } }
        @keyframes intro-flash       { 0% { opacity:0; } 20% { opacity:1; } 100% { opacity:0; } }
        @keyframes intro-battle-text { 0% { transform: scaleX(3) scaleY(0.4); opacity:0; letter-spacing:1em; }
                                       40% { transform: scaleX(1.05) scaleY(1); opacity:1; letter-spacing:.18em; }
                                       100% { transform: scale(1); opacity:1; letter-spacing:.18em; } }
        @keyframes intro-shake       { 0%,100% { transform: translateX(0); }
                                       25% { transform: translateX(-6px) rotate(-0.5deg); }
                                       75% { transform: translateX(6px) rotate(0.5deg); } }
        @keyframes rune-float-0  { 0%,100% { transform: translateY(0) rotate(0deg);   opacity:.2; }
                                   50%      { transform: translateY(-24px) rotate(12deg); opacity:.5; } }
        @keyframes rune-float-1  { 0%,100% { transform: translateY(0) rotate(0deg);   opacity:.15; }
                                   50%      { transform: translateY(-18px) rotate(-8deg); opacity:.4; } }
        @keyframes rune-float-2  { 0%,100% { transform: translateY(0) rotate(0deg);   opacity:.25; }
                                   50%      { transform: translateY(-30px) rotate(20deg); opacity:.55; } }
        @keyframes intro-divider-grow { from { scaleX: 0; } to { scaleX: 1; } }
        @keyframes intro-name-reveal  { from { opacity:0; transform: translateX(-20px); }
                                        to   { opacity:1; transform: translateX(0); } }
        @keyframes intro-opp-reveal   { from { opacity:0; transform: translateX(20px); }
                                        to   { opacity:1; transform: translateX(0); } }
        @keyframes intro-icon-float  { 0%,100% { transform: scale(1) rotate(0deg);   filter: drop-shadow(0 0 12px currentColor); }
                                       50%      { transform: scale(1.08) rotate(-5deg); filter: drop-shadow(0 0 24px currentColor); } }
        @keyframes intro-ring-spin   { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes intro-count-ripple { 0% { transform: scale(0.5); opacity:0.8; } 100% { transform: scale(2.5); opacity:0; } }
      `}</style>

      {/* ── Full-screen flash overlay ── */}
      {phase === 'flash' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 100,
          background: 'white',
          animation: 'intro-flash 0.5s ease forwards',
        }} />
      )}

      {/* ── Two faction panels ── */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
        {/* Player panel — slides in from left */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: pTheme.gradient,
          borderRight: `1px solid ${pTheme.primary}44`,
          animation: 'intro-slide-left 0.75s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          {/* Large radial glow orb */}
          <div style={{
            position: 'absolute', top: '20%', left: '10%',
            width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, ${pTheme.primary}30 0%, transparent 70%)`,
            animation: 'rune-float-0 5s ease-in-out infinite',
          }} />
          {/* Second smaller orb */}
          <div style={{
            position: 'absolute', bottom: '15%', left: '30%',
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${pTheme.primary}18 0%, transparent 70%)`,
            animation: 'rune-float-2 7s ease-in-out infinite 1.2s',
          }} />
          {/* Diagonal accent lines */}
          <div style={{
            position: 'absolute', top: 0, right: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, transparent, ${pTheme.primary}aa, ${pTheme.primary}44, transparent)`,
          }} />
          {/* Top accent bar */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, ${pTheme.primary}88, transparent)`,
          }} />
          <RuneParticles theme={pTheme} side="left" />
          {/* Content */}
          <div className="battle-intro-panel-content" style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'flex-start', justifyContent: 'center',
            padding: '0 28px',
          }}>
            {/* Faction label chip */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: `${pTheme.primary}18`, border: `1px solid ${pTheme.primary}44`,
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: pTheme.primary, fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 800, marginBottom: 16, opacity: 0.95,
              animation: phase !== 'enter' ? 'intro-name-reveal 0.4s 0.4s ease both' : undefined,
              boxShadow: `0 0 12px ${pTheme.primary}22`,
            }}>
              <span style={{ fontSize: 14 }}>{pTheme.icon}</span>
              {playerFaction}
            </div>
            {/* Big icon with glow rings */}
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div className="battle-intro-icon" style={{
                fontSize: 'clamp(52px,11vw,86px)', lineHeight: 1,
                filter: `drop-shadow(0 0 24px ${pTheme.glow}) drop-shadow(0 0 48px ${pTheme.glow})`,
                animation: 'intro-icon-float 3s ease-in-out infinite',
                color: pTheme.primary,
                display: 'block',
              }}>
                {pTheme.icon}
              </div>
              {/* Rotating glow ring */}
              <div style={{
                position: 'absolute', inset: -12,
                borderRadius: '50%',
                border: `1px solid ${pTheme.primary}40`,
                animation: 'intro-ring-spin 4s linear infinite',
              }} />
            </div>
            {/* Player name */}
            <div className="battle-intro-name" style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(15px,3vw,24px)',
              fontWeight: 900, color: '#f0f0ff',
              textShadow: `0 0 24px ${pTheme.glow}, 0 0 48px ${pTheme.glow}`,
              letterSpacing: '0.06em', lineHeight: 1.2,
              maxWidth: '90%', wordBreak: 'break-word',
              animation: phase !== 'enter' ? 'intro-name-reveal 0.4s 0.5s ease both' : undefined,
              opacity: phase === 'enter' ? 0 : 1,
            }}>
              {playerName}
            </div>
            <div style={{
              marginTop: 8, fontSize: 10,
              color: pTheme.accent, fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.18em', fontWeight: 700,
              animation: phase !== 'enter' ? 'intro-name-reveal 0.4s 0.6s ease both' : undefined,
              opacity: phase === 'enter' ? 0 : 1,
              textTransform: 'uppercase',
            }}>
              ← TÚ
            </div>
          </div>
          {/* Bottom gradient fade */}
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(0deg, rgba(3,3,10,0.85), transparent)',
          }} />
        </div>

        {/* Opponent panel — slides in from right */}
        <div style={{
          flex: 1, position: 'relative', overflow: 'hidden',
          background: oTheme.gradient,
          borderLeft: `1px solid ${oTheme.primary}44`,
          animation: 'intro-slide-right 0.75s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{
            position: 'absolute', top: '20%', right: '10%',
            width: 280, height: 280, borderRadius: '50%',
            background: `radial-gradient(circle, ${oTheme.primary}30 0%, transparent 70%)`,
            animation: 'rune-float-1 5.5s ease-in-out infinite 1s',
          }} />
          <div style={{
            position: 'absolute', bottom: '15%', right: '30%',
            width: 160, height: 160, borderRadius: '50%',
            background: `radial-gradient(circle, ${oTheme.primary}18 0%, transparent 70%)`,
            animation: 'rune-float-0 6.5s ease-in-out infinite 0.5s',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
            background: `linear-gradient(180deg, transparent, ${oTheme.primary}aa, ${oTheme.primary}44, transparent)`,
          }} />
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
            background: `linear-gradient(90deg, transparent, ${oTheme.primary}88)`,
          }} />
          <RuneParticles theme={oTheme} side="right" />
          <div className="battle-intro-panel-content" style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column',
            alignItems: 'flex-end', justifyContent: 'center',
            padding: '0 28px',
          }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '4px 12px', borderRadius: 20,
              background: `${oTheme.primary}18`, border: `1px solid ${oTheme.primary}44`,
              fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase',
              color: oTheme.primary, fontFamily: 'Rajdhani, sans-serif',
              fontWeight: 800, marginBottom: 16, opacity: 0.95, textAlign: 'right',
              animation: phase !== 'enter' ? 'intro-opp-reveal 0.4s 0.4s ease both' : undefined,
              boxShadow: `0 0 12px ${oTheme.primary}22`,
            }}>
              {opponentFaction}
              <span style={{ fontSize: 14 }}>{oTheme.icon}</span>
            </div>
            <div style={{ position: 'relative', marginBottom: 20 }}>
              <div className="battle-intro-icon" style={{
                fontSize: 'clamp(52px,11vw,86px)', lineHeight: 1,
                filter: `drop-shadow(0 0 24px ${oTheme.glow}) drop-shadow(0 0 48px ${oTheme.glow})`,
                animation: 'intro-icon-float 3.2s ease-in-out infinite 0.8s',
                color: oTheme.primary,
                display: 'block',
              }}>
                {oTheme.icon}
              </div>
              <div style={{
                position: 'absolute', inset: -12,
                borderRadius: '50%',
                border: `1px solid ${oTheme.primary}40`,
                animation: 'intro-ring-spin 4s linear infinite reverse',
              }} />
            </div>
            <div className="battle-intro-name" style={{
              fontFamily: 'Cinzel, serif', fontSize: 'clamp(15px,3vw,24px)',
              fontWeight: 900, color: '#f0f0ff',
              textShadow: `0 0 24px ${oTheme.glow}, 0 0 48px ${oTheme.glow}`,
              letterSpacing: '0.06em', lineHeight: 1.2,
              maxWidth: '90%', wordBreak: 'break-word', textAlign: 'right',
              animation: phase !== 'enter' ? 'intro-opp-reveal 0.4s 0.5s ease both' : undefined,
              opacity: phase === 'enter' ? 0 : 1,
            }}>
              {opponentName}
            </div>
            <div style={{
              marginTop: 8, fontSize: 10,
              color: oTheme.accent, fontFamily: 'Rajdhani, sans-serif',
              letterSpacing: '0.18em', fontWeight: 700, textAlign: 'right',
              animation: phase !== 'enter' ? 'intro-opp-reveal 0.4s 0.6s ease both' : undefined,
              opacity: phase === 'enter' ? 0 : 1,
              textTransform: 'uppercase',
            }}>
              RIVAL →
            </div>
          </div>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
            background: 'linear-gradient(0deg, rgba(3,3,10,0.85), transparent)',
          }} />
        </div>
      </div>

      {/* ── Central divider with VS ── */}
      <div style={{
        position: 'relative', zIndex: 20,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        opacity: phase === 'enter' ? 0 : 1,
        transition: 'opacity 0.3s 0.5s',
      }}>
        {/* Vertical divider — energy beam */}
        <div style={{
          width: 2, height: 70,
          background: `linear-gradient(180deg, transparent, ${pTheme.primary}, #e8b84b, ${oTheme.primary}, transparent)`,
          marginBottom: 10,
          opacity: phase === 'vs' || phase === 'countdown' || phase === 'flash' ? 1 : 0,
          transition: 'opacity 0.4s',
          boxShadow: '0 0 10px rgba(232,184,75,0.5)',
        }} />

        {/* VS badge */}
        <div style={{ position: 'relative' }}>
          {/* Outer glow ring */}
          <div style={{
            position: 'absolute', inset: -8,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(232,184,75,0.2) 0%, transparent 70%)',
            animation: 'intro-vs-glow 2s ease-in-out infinite',
          }} />
          <div className="battle-intro-vs" style={{
            fontFamily: 'Cinzel, serif',
            fontSize: 'clamp(44px,7vw,72px)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            background: 'linear-gradient(180deg, #fff5c0 0%, #e8b84b 45%, #c9901f 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            animation: phase !== 'enter' ? 'intro-vs-pop 0.6s 0.7s cubic-bezier(0.22,1,0.36,1) both, intro-vs-glow 2s 1.3s ease-in-out infinite' : undefined,
            opacity: phase === 'enter' ? 0 : 1,
            filter: 'drop-shadow(0 0 12px rgba(232,184,75,0.7))',
            lineHeight: 1,
          }}>
            VS
          </div>
        </div>

        <div style={{
          width: 2, height: 70,
          background: `linear-gradient(180deg, transparent, ${oTheme.primary}, #e8b84b, ${pTheme.primary}, transparent)`,
          marginTop: 10,
          opacity: phase === 'vs' || phase === 'countdown' || phase === 'flash' ? 1 : 0,
          transition: 'opacity 0.4s',
          boxShadow: '0 0 10px rgba(232,184,75,0.5)',
        }} />
      </div>

      {/* ── Countdown / Battle text ── */}
      {(phase === 'countdown' || phase === 'flash' || phase === 'done') && (
        <div style={{
          position: 'absolute', bottom: '8%', left: 0, right: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', gap: 10, zIndex: 30,
        }}>
          {phase === 'flash' ? (
            /* ¡DUEL! text — Yu-Gi-Oh style */
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'Cinzel, serif',
                fontSize: 'clamp(36px,8vw,64px)',
                fontWeight: 900,
                color: '#e8b84b',
                letterSpacing: '0.22em',
                textShadow: '0 0 50px rgba(232,184,75,1), 0 0 100px rgba(232,184,75,0.7), 0 0 150px rgba(232,184,75,0.4)',
                animation: 'intro-battle-text 0.5s cubic-bezier(0.22,1,0.36,1)',
                textTransform: 'uppercase',
              }}>
                ¡QUE COMIENCE!
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 'clamp(11px,2.5vw,15px)', color: 'rgba(232,184,75,0.6)',
                letterSpacing: '0.4em', textTransform: 'uppercase', marginTop: 8,
                animation: 'intro-battle-text 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) both',
              }}>
                LA BATALLA COMIENZA
              </div>
            </div>
          ) : (
            /* Countdown number — dramatic */
            <>
              <div style={{ position: 'relative' }}>
                {/* Ripple behind number */}
                <div style={{
                  position: 'absolute', inset: -20,
                  borderRadius: '50%',
                  border: `2px solid rgba(232,184,75,${count === 1 ? '0.6' : '0.2'})`,
                  animation: 'intro-count-ripple 0.65s ease-out',
                  opacity: 0,
                }} />
                <div className="battle-intro-count" style={{
                  fontFamily: 'Cinzel, serif',
                  fontSize: 'clamp(72px,16vw,140px)',
                  fontWeight: 900,
                  color: count === 1 ? '#e8b84b' : count === 2 ? '#c0a0ff' : '#e0e0f8',
                  textShadow: count === 1
                    ? '0 0 60px rgba(232,184,75,1), 0 0 120px rgba(232,184,75,0.6), 0 0 200px rgba(232,184,75,0.3)'
                    : count === 2
                      ? '0 0 40px rgba(160,120,255,0.8), 0 0 80px rgba(160,120,255,0.4)'
                      : '0 0 30px rgba(200,200,255,0.6)',
                  animation: 'intro-count 0.35s cubic-bezier(0.22,1,0.36,1)',
                  lineHeight: 1,
                }}>
                  {count}
                </div>
              </div>
              <div style={{
                fontFamily: 'Rajdhani, sans-serif',
                fontSize: 'clamp(10px,2vw,13px)', color: '#555',
                letterSpacing: '0.32em', textTransform: 'uppercase',
              }}>
                ¡PREPÁRATE!
              </div>
            </>
          )}
        </div>
      )}

      {/* ── Bottom faction gradient bar — dual color ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 4,
        background: `linear-gradient(90deg, ${pTheme.primary} 0%, #e8b84b 50%, ${oTheme.primary} 100%)`,
        opacity: 0.9,
        zIndex: 40,
        boxShadow: `0 -2px 20px rgba(232,184,75,0.4)`,
      }} />

      {/* ── Top vignette ── */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 80,
        background: 'linear-gradient(180deg, rgba(3,3,10,0.8), transparent)',
        pointerEvents: 'none', zIndex: 5,
      }} />

      {/* ── Corner decoration — top-left ── */}
      <div style={{
        position: 'absolute', top: 16, left: 16, zIndex: 6,
        fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
        color: 'rgba(232,184,75,0.4)', letterSpacing: '0.15em',
        textTransform: 'uppercase',
      }}>
        VEXFORGE · ARENA
      </div>
    </div>
  );
}
