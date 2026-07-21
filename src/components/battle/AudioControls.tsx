// VexForge AudioControls v2.0 — Epic I: VEXFORGE DOMINION
// Adds compact prop for inline header usage. Fixes setMusicVol/setSfxVol API.
// Backward-compatible with H.1.d callers.

import { useState, useCallback } from 'react';
import { AudioEngine } from '../../lib/audioEngine';

interface AudioControlsProps {
  iconSize?: number;
  showSliders?: boolean;
  className?: string;
  /** compact: mute button only, no expand toggle */
  compact?: boolean;
}

export function AudioControls({ iconSize = 14, showSliders = false, compact = false }: AudioControlsProps) {
  const [muted,    setMuted]    = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [musicVol, setMusicVol] = useState(32);
  const [sfxVol,   setSfxVol]   = useState(88);

  const toggleMute = useCallback(() => {
    const next = !muted; setMuted(next); AudioEngine.setMuted(next);
  }, [muted]);

  const onMusicVol = useCallback((v: number) => {
    setMusicVol(v); AudioEngine.setMusicVol(v / 100);
  }, []);

  const onSfxVol = useCallback((v: number) => {
    setSfxVol(v); AudioEngine.setSfxVol(v / 100);
  }, []);

  if (compact) {
    return (
      <button
        onClick={toggleMute}
        title={muted ? 'Activar audio' : 'Silenciar'}
        style={{
          background: 'transparent', border: '1px solid #2a2a4a',
          borderRadius: 5, color: muted ? '#3a3a5a' : '#e8b84b',
          fontSize: iconSize, cursor: 'pointer', padding: '3px 7px',
          lineHeight: 1, transition: 'color 0.2s',
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, position: 'relative' }}>
      <button
        onClick={toggleMute}
        title={muted ? 'Activar audio' : 'Silenciar'}
        style={{
          background: 'transparent', border: '1px solid #2a2a4a',
          borderRadius: 5, color: muted ? '#3a3a5a' : '#e8b84b',
          fontSize: iconSize, cursor: 'pointer', padding: '3px 7px',
          lineHeight: 1, transition: 'color 0.2s',
        }}
      >{muted ? '🔇' : '🔊'}</button>

      {showSliders && (
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ background: 'transparent', border: '1px solid #2a2a4a', borderRadius: 5, color: expanded ? '#e8b84b' : '#666', fontSize: 10, cursor: 'pointer', padding: '3px 6px', lineHeight: 1 }}
        >⚙</button>
      )}

      {showSliders && expanded && (
        <div style={{
          position: 'absolute', top: '100%', right: 0, marginTop: 6,
          background: 'rgba(10,10,22,0.97)', border: '1px solid #2a2a4a',
          borderRadius: 8, padding: '10px 14px', width: 168, zIndex: 100,
          boxShadow: '0 8px 24px rgba(0,0,0,0.65)',
        }}>
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#777', marginBottom: 4 }}>
              <span>🎵 Música</span><span style={{ color: '#e8b84b' }}>{musicVol}%</span>
            </div>
            <input type="range" min={0} max={100} value={musicVol} onChange={e => onMusicVol(Number(e.target.value))} disabled={muted} style={{ width: '100%', accentColor: '#e8b84b', opacity: muted ? 0.35 : 1 }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8.5, color: '#777', marginBottom: 4 }}>
              <span>⚔️ Efectos</span><span style={{ color: '#e8b84b' }}>{sfxVol}%</span>
            </div>
            <input type="range" min={0} max={100} value={sfxVol} onChange={e => onSfxVol(Number(e.target.value))} disabled={muted} style={{ width: '100%', accentColor: '#e8b84b', opacity: muted ? 0.35 : 1 }} />
          </div>
        </div>
      )}
    </div>
  );
}
