// VexForge BattleResultScreen v1.0 — Epic I: VEXFORGE DOMINION
// Enhanced result: battle stats, ELO reveal animation, victory/defeat cinematics.
// Extracted and upgraded from BattleCinematicScreen v2.0.

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { RealBattleResult } from '../../lib/battleTypes';
import { particleEngine } from '../../lib/particleEngine';

interface BattleResultScreenProps {
  result: RealBattleResult;
  playerName: string;
  opponentName: string;
  onDismiss: () => void;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

// Compute stats from turns
function computeStats(result: RealBattleResult) {
  const turns = result.turns ?? [];
  let totalDamage = 0;
  let crits = 0;
  let heals = 0;
  let keywordsTriggered = 0;
  let maxDamage = 0;

  for (const t of turns) {
    if (t.damage > 0) {
      totalDamage += t.damage;
      if (t.damage > maxDamage) maxDamage = t.damage;
    }
    if (t.is_crit) crits++;
    if (t.lifesteal_heal > 0) heals += t.lifesteal_heal;
    keywordsTriggered += (t.events?.length ?? 0);
  }

  return {
    totalDamage: Math.round(totalDamage),
    crits,
    heals: Math.round(heals),
    keywordsTriggered,
    maxDamage: Math.round(maxDamage),
    totalTurns: result.total_turns ?? turns.length,
  };
}

function StatRow({ label, value, highlight = false }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
    }}>
      <span style={{ color: '#888', fontSize: 11, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.08em' }}>
        {label}
      </span>
      <span style={{
        color: highlight ? '#e8b84b' : '#c0c0e0', fontSize: 13,
        fontFamily: 'Cinzel, serif', fontWeight: highlight ? 700 : 400,
      }}>
        {value}
      </span>
    </div>
  );
}

export function BattleResultScreen({ result, playerName, opponentName, onDismiss, canvasRef }: BattleResultScreenProps) {
  const navigate = useNavigate();
  const won = result.you_won;
  const isDraw = !won && result.status === 'draw';
  const eloChange = result.elo_change ?? 0;
  const [showElo, setShowElo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [eloDisplayed, setEloDisplayed] = useState(0);

    // GL.0: Win Streak counter — scoped por playerName (match_id es único por batalla y no sirve como clave acumulativa)
    const streakKey = `vxf_win_streak_${playerName ?? 'guest'}`;
    const [winStreak, setWinStreak] = useState<number>(() => {
      try { return parseInt(localStorage.getItem(streakKey) ?? '0') || 0; } catch { return 0; }
    });

    // Update streak on new battle result (runs once on mount per result)
    useEffect(() => {
      if (won) {
        const next = winStreak + 1;
        setWinStreak(next);
        try { localStorage.setItem(streakKey, String(next)); } catch {}
      } else if (!isDraw) {
        setWinStreak(0);
        try { localStorage.setItem(streakKey, '0'); } catch {}
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = computeStats(result);

  // Color theme
  const theme = isDraw
    ? { primary: '#4a9eff', glow: 'rgba(74,158,255,0.6)', label: 'EMPATE', emoji: '⚖️' }
    : won
      ? { primary: '#e8b84b', glow: 'rgba(232,184,75,0.7)', label: 'VICTORIA', emoji: '🏆' }
      : { primary: '#c0392b', glow: 'rgba(192,57,43,0.5)', label: 'DERROTA', emoji: '💀' };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const W = canvas.width; const H = canvas.height;

    // Start particle effects
    let interval: ReturnType<typeof setInterval>;
    if (won) {
      interval = setInterval(() => particleEngine.victoryRain(W, H), 280);
    } else if (!isDraw) {
      interval = setInterval(() => particleEngine.defeatAsh(W, H), 400);
    }

    // Reveal ELO after short delay
    const t1 = setTimeout(() => setShowElo(true), 600);
    const t2 = setTimeout(() => setShowStats(true), 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [won, isDraw]);

  // Animate ELO counter
  useEffect(() => {
    if (!showElo || eloChange === 0) { setEloDisplayed(eloChange); return; }
    const target = eloChange;
    const duration = 800;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setEloDisplayed(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [showElo, eloChange]);

  return (
    <div ref={containerRef} style={{
      position: 'absolute', inset: 0, zIndex: 40,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: won
        ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,184,75,0.22) 0%, rgba(6,6,16,0.99) 65%), linear-gradient(180deg, #03030a 0%, #0a080f 100%)'
        : isDraw
          ? 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(74,158,255,0.18) 0%, rgba(6,6,16,0.99) 65%), linear-gradient(180deg, #03030a 0%, #03080f 100%)'
          : 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(192,57,43,0.22) 0%, rgba(6,6,16,0.99) 65%), linear-gradient(180deg, #03030a 0%, #0f0303 100%)',
      animation: 'fadeInResult 0.6s ease',
      overflow: 'hidden',
    }}>
      {/* Cinematic letterbox bars */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 48,
        background: 'rgba(0,0,0,0.7)',
        borderBottom: `1px solid ${theme.primary}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
          color: theme.primary, letterSpacing: '0.3em', opacity: 0.7,
          textTransform: 'uppercase',
        }}>
          VEXFORGE BATTLE ARENA — RESULTADO
        </span>
      </div>

      {/* Background ambient glow */}
      <div style={{
        position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
        width: 600, height: 400, borderRadius: '50%',
        background: `radial-gradient(circle, ${theme.primary}14 0%, transparent 70%)`,
        pointerEvents: 'none',
        animation: 'resultAmbient 3s ease-in-out infinite',
      }} />

      {/* Victory conic rays — slow rotating behind everything */}
      {won && <div className="victory-bg-rays" />}

      {/* Trophy / Icon */}
      <div style={{
        fontSize: 96, marginBottom: 6, lineHeight: 1,
        filter: `drop-shadow(0 0 32px ${theme.glow}) drop-shadow(0 0 64px ${theme.glow})`,
        animation: won ? 'trophyBounce 0.7s cubic-bezier(0.22,1,0.36,1)' : 'fadeInUp 0.5s ease',
        position: 'relative',
      }}>
        {theme.emoji}
        {/* Starburst behind trophy */}
        <div style={{
          position: 'absolute', inset: -20, zIndex: -1, borderRadius: '50%',
          background: `radial-gradient(circle, ${theme.primary}18 0%, transparent 70%)`,
          animation: 'resultAmbient 2s ease-in-out infinite',
        }} />
      </div>

      {/* Result label — huge cinematic text */}
      <div style={{
        fontFamily: 'Cinzel, serif',
        fontSize: 'clamp(44px,8vw,64px)',
        fontWeight: 900,
        color: theme.primary,
        letterSpacing: '0.22em',
        textShadow: `0 0 40px ${theme.glow}, 0 0 80px ${theme.glow}`,
        marginBottom: 6, lineHeight: 1,
        animation: 'slideInLabel 0.6s cubic-bezier(0.22,1,0.36,1)',
        textTransform: 'uppercase',
      }}
      className={won ? 'victory-text' : (!isDraw ? 'defeat-text' : undefined)}
      >
        {theme.label}
      </div>

      {/* Decorative divider */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, width: 280,
      }}>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, transparent, ${theme.primary}55)` }} />
        <span style={{ color: theme.primary, opacity: 0.6, fontSize: 12 }}>✦</span>
        <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${theme.primary}55, transparent)` }} />
      </div>

      {/* Match names */}
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 13, color: '#6868a0',
        letterSpacing: '0.1em', marginBottom: 16, textTransform: 'uppercase',
      }}>
        <span style={{ color: '#8888b0' }}>{playerName}</span>
        <span style={{ color: '#4a4a6a', margin: '0 10px' }}>⚔</span>
        <span style={{ color: '#8888b0' }}>{opponentName}</span>
      </div>

      {/* GL.0: Win Streak badge */}
      {winStreak >= 2 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'linear-gradient(135deg, rgba(232,184,75,0.18), rgba(255,100,30,0.10))',
          border: '1px solid rgba(232,184,75,0.45)',
          borderRadius: 999, padding: '5px 18px',
          marginBottom: 14,
          animation: 'streakPop 0.4s cubic-bezier(0.22,1,0.36,1)',
          backdropFilter: 'blur(8px)',
        }}>
          <span style={{ fontSize: 16 }}>🔥</span>
          <span style={{
            fontFamily: 'Cinzel, serif', fontSize: 14, fontWeight: 700,
            color: '#e8b84b', letterSpacing: '0.1em',
          }}>
            RACHA × {winStreak}
          </span>
          <span style={{ fontSize: 16 }}>🔥</span>
        </div>
      )}

      {/* Win streak additional fire effect for high streaks */}
      {winStreak >= 5 && (
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 11, letterSpacing: '0.2em',
          color: '#ff9500', textTransform: 'uppercase', marginBottom: 8,
          marginTop: -8,
        }}
        className="streak-fire-2"
        >
          ¡Invicto! Racha de {winStreak}
        </div>
      )}

      {/* ELO change — animated counter */}
      <div style={{
        opacity: showElo ? 1 : 0, transform: showElo ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        marginBottom: 18, textAlign: 'center',
        background: 'rgba(8,8,22,0.7)', borderRadius: 12,
        border: `1px solid ${eloDisplayed >= 0 ? 'rgba(61,220,132,0.25)' : 'rgba(231,76,60,0.25)'}`,
        padding: '10px 28px',
        backdropFilter: 'blur(8px)',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 28, fontWeight: 900,
          color: eloDisplayed >= 0 ? '#3ddc84' : '#e74c3c',
          textShadow: eloDisplayed >= 0 ? '0 0 20px rgba(61,220,132,0.6)' : '0 0 20px rgba(231,76,60,0.6)',
          lineHeight: 1,
        }}>
          {eloDisplayed >= 0 ? '+' : ''}{eloDisplayed} ELO
        </div>
        <div style={{
          color: '#5a5a7a', fontSize: 9, fontFamily: 'IBM Plex Mono, monospace',
          letterSpacing: '0.25em', marginTop: 4,
        }}>
          CAMBIO DE RANKING
        </div>
      </div>

      {/* Battle stats panel */}
      <div style={{
        width: 240, opacity: showStats ? 1 : 0,
        transform: showStats ? 'translateY(0)' : 'translateY(14px)',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        background: 'rgba(6,6,18,0.88)', borderRadius: 12,
        border: `1px solid ${theme.primary}28`,
        padding: '14px 18px', marginBottom: 22,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${theme.primary}18`,
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 9, color: theme.primary,
          letterSpacing: '0.25em', textTransform: 'uppercase',
          marginBottom: 12, textAlign: 'center', opacity: 0.8,
        }}>
          ⚔ Estadísticas de Batalla ⚔
        </div>
        <StatRow label="Turnos" value={stats.totalTurns} />
        <StatRow label="Daño Total" value={stats.totalDamage.toLocaleString()} highlight />
        <StatRow label="Golpe Máximo" value={stats.maxDamage.toLocaleString()} />
        <StatRow label="Golpes Críticos" value={stats.crits} highlight={stats.crits > 0} />
        {stats.heals > 0 && <StatRow label="Vida Drenada" value={stats.heals.toLocaleString()} />}
        {stats.keywordsTriggered > 0 && <StatRow label="Keywords Activadas" value={stats.keywordsTriggered} />}
      </div>

      {/* Action buttons */}
      <div className="battle-result-btns" style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        opacity: showStats ? 1 : 0, transition: 'opacity 0.5s 0.3s',
        padding: '0 8px',
      }}>
        <button onClick={() => { onDismiss(); navigate('/pvp'); }} style={{
          background: `linear-gradient(135deg, ${theme.primary}dd, ${theme.primary}88)`,
          border: `1px solid ${theme.primary}`, borderRadius: 10,
          color: won ? '#0a0a12' : theme.primary, fontFamily: 'Cinzel, serif', fontSize: 12,
          letterSpacing: '0.12em', padding: '12px 28px', cursor: 'pointer',
          textTransform: 'uppercase', fontWeight: 700,
          transition: 'all 0.2s',
          boxShadow: `0 0 24px ${theme.primary}40, 0 4px 12px rgba(0,0,0,0.5)`,
          minWidth: 140,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px) scale(1.02)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'none'; }}
        >
          ⚔ Jugar de Nuevo
        </button>
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
          color: '#888', fontFamily: 'Rajdhani, sans-serif', fontSize: 12,
          letterSpacing: '0.1em', padding: '12px 22px', cursor: 'pointer',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
          minWidth: 120,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#aaa'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = '#888'; }}
        >
          Volver a Arena
        </button>
      </div>

      {/* Bottom bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${theme.primary}, transparent)`,
        opacity: 0.5,
      }} />

      <style>{`
        @keyframes fadeInResult { from { opacity:0; } to { opacity:1; } }
        @keyframes streakPop { from { opacity:0; transform:scale(0.5) translateY(10px); } 80% { transform:scale(1.08); } to { opacity:1; transform:scale(1) translateY(0); } }
        @keyframes trophyBounce { 0% { transform:scale(0.2) translateY(-30px); } 60% { transform:scale(1.14); } 80% { transform:scale(0.97); } 100% { transform:scale(1); } }
        @keyframes slideInLabel { from { opacity:0; transform:scaleX(1.5) translateY(-8px); } to { opacity:1; transform:scaleX(1) translateY(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes resultAmbient { 0%,100% { opacity:0.6; transform:translateX(-50%) scale(1); } 50% { opacity:1; transform:translateX(-50%) scale(1.1); } }
      `}</style>
    </div>
  );
}
