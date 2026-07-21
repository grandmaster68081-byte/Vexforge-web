// VexForge BattleCinematicScreen v3.0 — Epic I: VEXFORGE DOMINION
// Orchestrator: BattleIntroScreen → BattleBoardEngine → BattleResultScreen.
// Backward-compatible props with v2.0 callers.

import { useState, useRef, useEffect } from 'react';
import type { RealBattleResult, BattleUnit } from '../../lib/battleTypes';
import { AudioEngine } from '../../lib/audioEngine';
import { particleEngine } from '../../lib/particleEngine';
import { BattleIntroScreen } from './BattleIntroScreen';
import { BattleBoardEngine } from './BattleBoardEngine';
import { BattleResultScreen } from './BattleResultScreen';
import { AudioControls } from './AudioControls';

export interface BattleCinematicScreenProps {
  result: RealBattleResult;
  playerName?: string;
  opponentName?: string;
  onDismiss: () => void;
}

type Phase = 'intro' | 'board' | 'result';

// Derive faction from final units (side a = player)
function deriveFaction(units: BattleUnit[], side: 'a' | 'b'): string {
  const unit = units.find(u => u.side === side);
  return unit?.faction ?? 'default';
}

export function BattleCinematicScreen({
  result, playerName = 'You', opponentName = 'Opponent', onDismiss,
}: BattleCinematicScreenProps) {
  const finalUnits  = result.final_units ?? [];
  const playerFaction   = deriveFaction(finalUnits, 'a');
  const opponentFaction = deriveFaction(finalUnits, 'b');

  const [phase, setPhase] = useState<Phase>('intro');
  const [speed, setSpeed] = useState<1 | 2 | 3>(1);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const arenaRef  = useRef<HTMLDivElement>(null);

  // Mount canvas for intro/result particle effects
  useEffect(() => {
    const canvas = canvasRef.current;
    const arena  = arenaRef.current;
    if (!canvas || !arena) return;
    const resize = () => {
      canvas.width  = arena.clientWidth;
      canvas.height = arena.clientHeight;
    };
    resize();
    // Re-mount particle engine when in result phase (board has its own)
    if (phase === 'result') particleEngine.mount(canvas);
    return () => {
      if (phase === 'result') particleEngine.unmount();
    };
  }, [phase]);

  // Phase transitions
  const goToBoard = () => {
    setPhase('board');
    // Set audio intensity to calm (full HP at start)
    AudioEngine.setIntensity(1.0);
    AudioEngine.setFaction(playerFaction);
    AudioEngine.musicLoop();
  };

  const goToResult = () => {
    setPhase('result');
    AudioEngine.stopMusic();
    result.you_won ? AudioEngine.victory() : AudioEngine.defeat();
  };

  return (
    <div ref={arenaRef} style={{
      position: 'fixed', inset: 0, zIndex: 100,
      display: 'flex', flexDirection: 'column',
      background: '#060610',
      maxWidth: 480, margin: '0 auto',
    }}>
      {/* Shared canvas for intro/result particles */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', inset: 0,
          pointerEvents: 'none', zIndex: 5,
          display: phase === 'board' ? 'none' : 'block',
        }}
      />

      {/* ─── Header bar (visible during board phase) ─────────────── */}
      {phase === 'board' && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '6px 10px',
          background: 'rgba(4,4,12,0.97)',
          borderBottom: '1px solid #18183a',
          zIndex: 20, flexShrink: 0,
        }}>
          {/* Player info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#4a9eff', letterSpacing: '0.06em' }}>
              {playerName}
            </span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>
              {playerFaction}
            </span>
          </div>

          {/* Speed controls */}
          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            {([1, 2, 3] as const).map(s => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                style={{
                  background: speed === s ? '#e8b84b22' : 'transparent',
                  border: `1px solid ${speed === s ? '#e8b84b88' : '#2a2a4a'}`,
                  borderRadius: 4, color: speed === s ? '#e8b84b' : '#555',
                  fontSize: 9, padding: '2px 6px', cursor: 'pointer',
                  fontFamily: 'Rajdhani, sans-serif', letterSpacing: '0.05em',
                }}
              >
                {s}×
              </button>
            ))}
            <AudioControls compact />
          </div>

          {/* Opponent info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1, alignItems: 'flex-end' }}>
            <span style={{ fontFamily: 'Cinzel, serif', fontSize: 10, color: '#e74c3c', letterSpacing: '0.06em' }}>
              {opponentName}
            </span>
            <span style={{ fontFamily: 'Rajdhani, sans-serif', fontSize: 9, color: '#444', letterSpacing: '0.08em' }}>
              {opponentFaction}
            </span>
          </div>
        </div>
      )}

      {/* ─── Phase: INTRO ────────────────────────────────────────── */}
      {phase === 'intro' && (
        <BattleIntroScreen
          playerName={playerName}
          playerFaction={playerFaction}
          opponentName={opponentName}
          opponentFaction={opponentFaction}
          onComplete={goToBoard}
          canvasRef={canvasRef}
        />
      )}

      {/* ─── Phase: BOARD ────────────────────────────────────────── */}
      {phase === 'board' && (
        <BattleBoardEngine
          result={result}
          playerName={playerName}
          opponentName={opponentName}
          onComplete={goToResult}
          speed={speed}
        />
      )}

      {/* ─── Phase: RESULT ───────────────────────────────────────── */}
      {phase === 'result' && (
        <BattleResultScreen
          result={result}
          playerName={playerName}
          opponentName={opponentName}
          onDismiss={onDismiss}
          canvasRef={canvasRef}
        />
      )}

      {/* Dismiss button — always visible except during intro */}
      {phase !== 'intro' && (
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute', top: phase === 'board' ? 44 : 8, right: 8,
            background: 'rgba(8,8,20,0.9)', border: '1px solid #2a2a4a',
            borderRadius: 5, color: '#555', fontSize: 12,
            padding: '3px 8px', cursor: 'pointer', zIndex: 50,
            lineHeight: 1,
          }}
          title="Close"
        >
          ✕
        </button>
      )}
    </div>
  );
}
