// WinStreakDisplay.tsx — GL.0 Win Streak Tracker
// Racha de victorias consecutivas. Persiste en localStorage.
// Muestra contador animado + efectos fuego en rachas altas.

import { useState, useEffect, useCallback } from 'react';
import { AudioEngine } from '../../lib/audioEngine';

const STREAK_KEY = 'vxf_win_streak_v1';
const STREAK_BEST_KEY = 'vxf_win_streak_best_v1';

export function useWinStreak() {
  const [streak, setStreak] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(STREAK_KEY) ?? '0', 10) || 0; } catch { return 0; }
  });
  const [best, setBest] = useState<number>(() => {
    try { return parseInt(localStorage.getItem(STREAK_BEST_KEY) ?? '0', 10) || 0; } catch { return 0; }
  });
  const [justBroke, setJustBroke] = useState(false);

  const onWin = useCallback(() => {
    setStreak(prev => {
      const next = prev + 1;
      try { localStorage.setItem(STREAK_KEY, String(next)); } catch {}
      setBest(b => {
        if (next > b) {
          try { localStorage.setItem(STREAK_BEST_KEY, String(next)); } catch {}
          setJustBroke(true);
          setTimeout(() => setJustBroke(false), 3000);
          return next;
        }
        return b;
      });
      // Play streak SFX
      try { (AudioEngine as any).sfxStreakFire?.(next); } catch {}
      return next;
    });
  }, []);

  const onLoss = useCallback(() => {
    setStreak(0);
    try { localStorage.setItem(STREAK_KEY, '0'); } catch {}
  }, []);

  return { streak, best, justBroke, onWin, onLoss };
}

export function WinStreakBadge({ streak, justBroke }: { streak: number; justBroke: boolean }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (streak > 0) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(t);
    }
  }, [streak]);

  if (streak < 2) return null;

  const tier = streak >= 10 ? 'inferno' : streak >= 5 ? 'blaze' : 'spark';
  const colors: Record<string, { bg: string; border: string; glow: string; label: string }> = {
    spark:   { bg: '#e8b84b22', border: '#e8b84b55', glow: '#e8b84b',    label: '🔥' },
    blaze:   { bg: '#ff6b3522', border: '#ff6b3566', glow: '#ff6b35',    label: '🔥🔥' },
    inferno: { bg: '#ff003322', border: '#ff004466', glow: '#ff0044',    label: '🔥🔥🔥' },
  };
  const c = colors[tier];

  return (
    <>
      <style>{`
        @keyframes streak-pop {
          0%   { transform: scale(1); }
          30%  { transform: scale(1.3); }
          60%  { transform: scale(0.95); }
          100% { transform: scale(1); }
        }
        @keyframes streak-record-flash {
          0%,100% { opacity:1; }
          50% { opacity:0.5; filter:brightness(1.5); }
        }
        @keyframes streak-fire-flicker {
          0%,100% { transform:scaleY(1) scaleX(1); }
          25% { transform:scaleY(1.08) scaleX(0.97); }
          75% { transform:scaleY(0.95) scaleX(1.03); }
        }
      `}</style>
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: c.bg, border: `1px solid ${c.border}`,
        borderRadius: 20, padding: '6px 14px',
        boxShadow: `0 0 16px ${c.glow}44`,
        animation: animate ? 'streak-pop 0.5s cubic-bezier(0.22,1,0.36,1)' : 'none',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Fire flicker icon */}
        <span style={{
          fontSize: 18,
          animation: 'streak-fire-flicker 0.4s ease-in-out infinite',
          filter: `drop-shadow(0 0 8px ${c.glow})`,
        }}>{c.label}</span>
        <div>
          <div style={{
            fontFamily: '"Cinzel",serif', fontWeight: 900,
            fontSize: 16, color: c.glow,
            textShadow: `0 0 16px ${c.glow}`,
            lineHeight: 1,
          }}>{streak}× RACHA</div>
          {justBroke && (
            <div style={{
              fontSize: 8, color: '#ffd700', fontFamily: '"Rajdhani",sans-serif',
              letterSpacing: '0.12em', fontWeight: 800,
              animation: 'streak-record-flash 0.4s ease-in-out 4',
            }}>⭐ NUEVO RÉCORD</div>
          )}
        </div>
      </div>
    </>
  );
}

// Panel de racha en el lobby PvP
export function StreakPanel({ streak, best }: { streak: number; best: number }) {
  if (streak === 0 && best === 0) return null;
  return (
    <div style={{
      background: 'linear-gradient(135deg,rgba(232,184,75,0.06),rgba(255,107,53,0.04))',
      border: '1px solid rgba(232,184,75,0.2)',
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', gap: 24, alignItems: 'center',
      flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ fontSize: 9, color: '#7a7a9a', letterSpacing: '0.12em',
          fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase', marginBottom: 4 }}>
          Racha Actual
        </div>
        <div style={{ fontFamily: '"Cinzel",serif', fontWeight: 900, fontSize: 22,
          color: streak >= 5 ? '#ff6b35' : '#e8b84b',
          textShadow: streak >= 5 ? '0 0 16px rgba(255,107,53,0.6)' : 'none',
        }}>
          {streak >= 2 ? `🔥 ${streak}×` : streak === 1 ? '⚔ 1×' : '—'}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 9, color: '#7a7a9a', letterSpacing: '0.12em',
          fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase', marginBottom: 4 }}>
          Mejor Racha
        </div>
        <div style={{ fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 18,
          color: '#a855f7',
        }}>
          {best > 0 ? `⭐ ${best}×` : '—'}
        </div>
      </div>
    </div>
  );
}
