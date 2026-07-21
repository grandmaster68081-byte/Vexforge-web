// VexForge BattleResultScreen v1.0 — Epic I: VEXFORGE DOMINION
// Enhanced result: battle stats, ELO reveal animation, victory/defeat cinematics.
// Extracted and upgraded from BattleCinematicScreen v2.0.

import { useState, useEffect, useRef } from 'react';
import type { RealBattleResult } from '../../lib/battleTypes';
import { particleEngine } from '../../lib/particleEngine';
import { AudioEngine } from '../../lib/audioEngine';

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
  const won = result.you_won;
  const isDraw = !won && result.status === 'draw';
  const eloChange = result.elo_change ?? 0;
  const [showElo, setShowElo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [eloDisplayed, setEloDisplayed] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const stats = computeStats(result);

  // Color theme
  const theme = isDraw
    ? { primary: '#4a9eff', glow: 'rgba(74,158,255,0.6)', label: 'DRAW', emoji: '⚖️' }
    : won
      ? { primary: '#e8b84b', glow: 'rgba(232,184,75,0.7)', label: 'VICTORY', emoji: '🏆' }
      : { primary: '#c0392b', glow: 'rgba(192,57,43,0.5)', label: 'DEFEAT', emoji: '💀' };

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
        ? 'linear-gradient(180deg, rgba(232,184,75,0.08) 0%, rgba(6,6,16,0.97) 40%)'
        : isDraw
          ? 'linear-gradient(180deg, rgba(74,158,255,0.08) 0%, rgba(6,6,16,0.97) 40%)'
          : 'linear-gradient(180deg, rgba(192,57,43,0.08) 0%, rgba(6,6,16,0.97) 40%)',
      animation: 'fadeInResult 0.5s ease',
    }}>
      {/* Trophy / Icon */}
      <div style={{
        fontSize: 64, marginBottom: 8,
        filter: `drop-shadow(0 0 24px ${theme.glow})`,
        animation: won ? 'trophyBounce 0.6s cubic-bezier(0.22,1,0.36,1)' : 'fadeInUp 0.5s ease',
      }}>
        {theme.emoji}
      </div>

      {/* Result label */}
      <div style={{
        fontFamily: 'Cinzel, serif', fontSize: 28, fontWeight: 900,
        color: theme.primary, letterSpacing: '0.2em',
        textShadow: `0 0 30px ${theme.glow}`,
        marginBottom: 4,
        animation: 'slideInLabel 0.5s cubic-bezier(0.22,1,0.36,1)',
      }}>
        {theme.label}
      </div>

      {/* Match names */}
      <div style={{
        fontFamily: 'Rajdhani, sans-serif', fontSize: 12, color: '#666',
        letterSpacing: '0.1em', marginBottom: 20,
      }}>
        {playerName} <span style={{ color: '#333', margin: '0 6px' }}>vs</span> {opponentName}
      </div>

      {/* ELO change */}
      <div style={{
        opacity: showElo ? 1 : 0, transform: showElo ? 'translateY(0)' : 'translateY(8px)',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 22, fontWeight: 700,
          color: eloDisplayed >= 0 ? '#3ddc84' : '#e74c3c',
        }}>
          {eloDisplayed >= 0 ? '+' : ''}{eloDisplayed} ELO
        </div>
        <div style={{ color: '#555', fontSize: 10, fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.1em', marginTop: 2 }}>
          RANKING CHANGE
        </div>
      </div>

      {/* Battle stats panel */}
      <div style={{
        width: 220, opacity: showStats ? 1 : 0,
        transform: showStats ? 'translateY(0)' : 'translateY(12px)',
        transition: 'all 0.5s cubic-bezier(0.22,1,0.36,1)',
        background: 'rgba(8,8,20,0.9)', borderRadius: 10,
        border: `1px solid ${theme.primary}33`,
        padding: '12px 16px', marginBottom: 20,
      }}>
        <div style={{
          fontFamily: 'Cinzel, serif', fontSize: 10, color: theme.primary,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          marginBottom: 10, textAlign: 'center',
        }}>
          Battle Statistics
        </div>
        <StatRow label="Turns" value={stats.totalTurns} />
        <StatRow label="Total Damage" value={stats.totalDamage.toLocaleString()} highlight />
        <StatRow label="Max Single Hit" value={stats.maxDamage.toLocaleString()} />
        <StatRow label="Critical Hits" value={stats.crits} highlight={stats.crits > 0} />
        {stats.heals > 0 && <StatRow label="Life Drained" value={stats.heals.toLocaleString()} />}
        {stats.keywordsTriggered > 0 && <StatRow label="Keywords Triggered" value={stats.keywordsTriggered} />}
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 10, opacity: showStats ? 1 : 0, transition: 'opacity 0.5s 0.3s' }}>
        <button onClick={onDismiss} style={{
          background: `linear-gradient(135deg, ${theme.primary}22, ${theme.primary}11)`,
          border: `1px solid ${theme.primary}66`, borderRadius: 8,
          color: theme.primary, fontFamily: 'Cinzel, serif', fontSize: 11,
          letterSpacing: '0.15em', padding: '10px 20px', cursor: 'pointer',
          textTransform: 'uppercase',
          transition: 'all 0.2s',
        }}
        onMouseEnter={e => { (e.target as HTMLButtonElement).style.background = `${theme.primary}33`; }}
        onMouseLeave={e => { (e.target as HTMLButtonElement).style.background = `linear-gradient(135deg, ${theme.primary}22, ${theme.primary}11)`; }}
        >
          ⚔️ Play Again
        </button>
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
          color: '#888', fontFamily: 'Rajdhani, sans-serif', fontSize: 11,
          letterSpacing: '0.1em', padding: '10px 16px', cursor: 'pointer',
          textTransform: 'uppercase',
        }}>
          Arena
        </button>
      </div>

      <style>{`
        @keyframes fadeInResult { from { opacity:0; } to { opacity:1; } }
        @keyframes trophyBounce { 0% { transform:scale(0.3) translateY(-20px); } 70% { transform:scale(1.12); } 100% { transform:scale(1); } }
        @keyframes slideInLabel { from { opacity:0; transform:translateY(-12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
      `}</style>
    </div>
  );
}
