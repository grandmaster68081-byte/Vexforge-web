// ForgeFormationBoard.tsx — FFE (Forge Formation Engine)
// Tablero de batalla visual con 3 posiciones: Vanguardia · Campeón · Centinela
// Si el Campeón cae → derrota instantánea con cinemática épica.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import {
  type FormationState, type FormationSlot,
  isChampionProtected, getNextReserveUnit, SLOT_META,
  simulateFormationBattle,
} from '../../lib/forgeFormation';
import type { AIDifficulty } from '../../lib/aiBattleEngine';
import { AudioEngine } from '../../lib/audioEngine';

// ─── Palette ───────────────────────────────────────────────────────────────────
const SLOT_COLORS: Record<FormationSlot, { primary: string; glow: string }> = {
  vanguard:  { primary: '#e84040', glow: 'rgba(232,64,64,0.6)' },
  champion:  { primary: '#e8b84b', glow: 'rgba(232,184,75,0.7)' },
  sentinel:  { primary: '#4a9eff', glow: 'rgba(74,158,255,0.6)' },
};

// ─── HP colour helper ──────────────────────────────────────────────────────────
const hpCol = (pct: number) =>
  pct > 0.6 ? '#3ddc84' : pct > 0.3 ? '#e8b84b' : '#e84040';

// ─── Segmented HP bar (VX.3) ──────────────────────────────────────────────────
function SegmentedHpBar({
  hp, max, slot,
}: { hp: number; max: number; slot: FormationSlot }) {
  const pct = max > 0 ? Math.max(0, Math.min(1, hp / max)) : 0;
  const col  = hpCol(pct);
  const { primary } = SLOT_COLORS[slot];
  const segments = 10;
  const filled   = Math.round(pct * segments);
  return (
    <div style={{ display: 'flex', gap: 2, width: '100%' }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1, height: 6, borderRadius: 2,
            background: i < filled
              ? `linear-gradient(90deg,${col},${col}bb)`
              : 'rgba(255,255,255,0.06)',
            boxShadow: i < filled && i === filled - 1
              ? `0 0 6px ${col}99`
              : 'none',
            transition: 'background 0.4s, box-shadow 0.4s',
            border: `1px solid ${i < filled ? primary + '44' : 'rgba(255,255,255,0.04)'}`,
          }}
        />
      ))}
    </div>
  );
}

// ─── Formation Unit Card ───────────────────────────────────────────────────────
function FormationUnitCard({
  unit, slot, isChampion, isActive, isDead, isBeingHit,
  showDeathAnim,
}: {
  unit: BattleUnit | null;
  slot: FormationSlot;
  isChampion?: boolean;
  isActive?: boolean;
  isDead?: boolean;
  isBeingHit?: boolean;
  showDeathAnim?: boolean;
}) {
  const { primary, glow } = SLOT_COLORS[slot];
  const meta = SLOT_META[slot];

  if (!unit) {
    return (
      <div style={{
        width: 110, minHeight: 160, borderRadius: 12,
        border: `2px dashed ${primary}22`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column', gap: 6,
        color: `${primary}33`, fontSize: 11,
        fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.1em',
      }}>
        <span style={{ fontSize: 28, opacity: 0.3 }}>{meta.icon}</span>
        <span>VACÍO</span>
      </div>
    );
  }

  const rar  = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const rglow = RARITY_GLOW[unit.rarity] ?? 'rgba(139,139,158,0.3)';
  const pct  = unit.max_hp > 0 ? unit.hp / unit.max_hp : 0;

  return (
    <div
      className={[
        isDead || showDeathAnim ? 'card-dissolve' : '',
        isBeingHit ? 'impact-shake' : '',
        isChampion && !isDead ? 'champion-crown-pulse' : '',
        isActive && !isDead ? 'vanguard-guard-pulse' : '',
      ].filter(Boolean).join(' ')}
      style={{
        width: 110, minHeight: 160, borderRadius: 12,
        border: `2px solid ${isDead ? '#333' : isChampion ? rar : primary}`,
        background: unit.image_url
          ? `linear-gradient(180deg,transparent 0%,rgba(5,5,14,0.92) 55%),url(${unit.image_url}) center/cover no-repeat`
          : `linear-gradient(160deg,${primary}18,#0a0a14)`,
        boxShadow: isDead
          ? 'none'
          : isChampion
            ? `0 0 24px ${rglow}, 0 0 48px ${rar}44, 0 0 0 2px ${rar}33`
            : `0 0 14px ${glow}55, inset 0 0 8px ${primary}11`,
        opacity: isDead ? 0.35 : 1,
        transition: 'all 0.35s ease',
        position: 'relative', display: 'flex', flexDirection: 'column',
        overflow: 'hidden', userSelect: 'none',
      }}
    >
      {/* Slot badge */}
      <div style={{
        position: 'absolute', top: 5, left: 5, zIndex: 2,
        background: (isDead ? '#333' : primary) + 'dd',
        borderRadius: 20, padding: '1px 7px',
        fontSize: 8, fontWeight: 800, color: '#fff',
        fontFamily: '"Cinzel",serif', letterSpacing: '0.08em',
        backdropFilter: 'blur(4px)',
      }}>{meta.icon} {meta.label}</div>

      {/* Champion crown */}
      {isChampion && !isDead && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          fontSize: 20, zIndex: 3, filter: `drop-shadow(0 0 8px ${rar}aa)`,
          animation: 'champion-crown-pulse 2s ease-in-out infinite',
        }}>👑</div>
      )}

      {/* Rarity badge */}
      <div style={{
        position: 'absolute', top: 5, right: 5, zIndex: 2,
        background: 'rgba(0,0,0,0.8)', border: `1px solid ${rar}55`,
        borderRadius: 4, padding: '1px 5px',
        fontSize: 6, fontWeight: 800, color: rar,
        fontFamily: '"Rajdhani",sans-serif',
      }}>{unit.rarity.toUpperCase()}</div>

      {/* Image area */}
      <div style={{
        flex: 1, minHeight: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {!unit.image_url && (
          <div style={{ fontSize: 32, filter: `drop-shadow(0 0 8px ${primary}99)` }}>
            {meta.icon}
          </div>
        )}
        {/* Legendary/Mythic shimmer */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic') && !isDead && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg,transparent 25%,${rar}44 45%,rgba(255,255,255,0.18) 50%,${rar}22 55%,transparent 75%)`,
            backgroundSize: '250% 250%', animation: 'card-shimmer 2s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Body */}
      <div style={{
        padding: '6px 8px 8px',
        background: 'linear-gradient(0deg,rgba(3,3,12,0.97),rgba(8,8,22,0.88))',
        borderTop: `1px solid ${primary}33`,
      }}>
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: 9, fontWeight: 700,
          color: '#eee', letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 4,
        }}>{unit.name}</div>
        <div style={{
          display: 'flex', gap: 4, fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
          fontWeight: 800, marginBottom: 4,
        }}>
          <span style={{ color: '#ff6b6b' }}>⚔{unit.atk}</span>
          <span style={{ color: '#4a9eff' }}>🛡{unit.def}</span>
          <span style={{ color: '#e8b84b' }}>⚡{unit.spd}</span>
        </div>
        <SegmentedHpBar hp={unit.hp} max={unit.max_hp} slot={slot} />
        <div style={{
          fontSize: 8, color: hpCol(pct), marginTop: 3,
          fontFamily: '"IBM Plex Mono",monospace',
          textAlign: 'right',
        }}>{unit.hp}/{unit.max_hp} HP</div>
      </div>

      {/* Dead overlay */}
      {isDead && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(3,3,10,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28, zIndex: 5, borderRadius: 12,
        }}>💀</div>
      )}
    </div>
  );
}

// ─── Turn indicator segments (VX.3) ───────────────────────────────────────────
function TurnIndicator({
  current, total,
}: { current: number; total: number }) {
  const segments = Math.min(total, 20);
  const done     = Math.min(current, segments);
  return (
    <div style={{
      display: 'flex', gap: 3, alignItems: 'center',
      flexWrap: 'wrap', justifyContent: 'center',
    }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div key={i} style={{
          width: 18, height: 5, borderRadius: 2,
          background: i < done
            ? (i < segments * 0.33 ? '#3ddc84' : i < segments * 0.66 ? '#e8b84b' : '#e84040')
            : 'rgba(255,255,255,0.06)',
          boxShadow: i === done - 1 ? '0 0 8px rgba(232,184,75,0.9)' : 'none',
          transition: 'all 0.3s ease',
        }} />
      ))}
      <span style={{
        fontSize: 9, color: '#6a6a8a', fontFamily: '"IBM Plex Mono",monospace',
        marginLeft: 4,
      }}>T{current}/{total}</span>
    </div>
  );
}

// ─── Champion Death overlay ────────────────────────────────────────────────────
function ChampionDeathScreen({ champion }: { champion: BattleUnit }) {
  const rar = RARITY_COLOR[champion.rarity] ?? '#8b8b9e';
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(3,3,10,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
      animation: 'modal-overlay-in 0.5s ease-out both',
    }}>
      <style>{`
        @keyframes champ-death-shake {
          0%,100%{transform:translateX(0)}
          15%{transform:translateX(-8px)}
          30%{transform:translateX(8px)}
          45%{transform:translateX(-6px)}
          60%{transform:translateX(6px)}
          75%{transform:translateX(-4px)}
          90%{transform:translateX(4px)}
        }
        @keyframes champ-death-glow {
          0%{opacity:0;transform:scale(0.5)}
          50%{opacity:1;transform:scale(1.2)}
          100%{opacity:0;transform:scale(2)}
        }
      `}</style>

      {/* Shockwave ring */}
      <div style={{
        position: 'absolute',
        width: 200, height: 200,
        borderRadius: '50%',
        border: `3px solid ${rar}`,
        animation: 'champ-death-glow 1.2s ease-out forwards',
        pointerEvents: 'none',
      }} />

      <div style={{
        fontSize: 64,
        animation: 'champ-death-shake 0.6s ease-in-out both',
        filter: `drop-shadow(0 0 24px ${rar}aa)`,
        marginBottom: 20,
      }}>💀</div>

      <div style={{
        fontFamily: '"Cinzel Decorative",serif',
        fontSize: 'clamp(18px,4vw,28px)',
        fontWeight: 900,
        color: '#e84040',
        textShadow: '0 0 30px rgba(232,64,64,0.8)',
        marginBottom: 8,
        letterSpacing: '0.1em',
        textAlign: 'center',
      }}>CAMPEÓN CAÍDO</div>

      <div style={{
        fontFamily: '"Cinzel",serif',
        fontSize: 14, color: rar,
        textShadow: `0 0 16px ${rar}88`,
        marginBottom: 4, textAlign: 'center',
      }}>{champion.name} ha sido derrotado</div>

      <div style={{
        fontFamily: '"Rajdhani",sans-serif',
        fontSize: 12, color: '#6a6a8a',
        textAlign: 'center', marginTop: 4,
      }}>La partida termina cuando el Campeón cae</div>
    </div>
  );
}

// ─── Reserve panel ─────────────────────────────────────────────────────────────
function ReservePanel({
  reserve, onSelectReserve, awaitingSlot,
}: {
  reserve: BattleUnit[];
  onSelectReserve: (unit: BattleUnit, slotIdx: number) => void;
  awaitingSlot: FormationSlot | null;
}) {
  if (!awaitingSlot || reserve.length === 0) return null;
  const { primary, glow } = SLOT_COLORS[awaitingSlot];
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(3,3,10,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 20, backdropFilter: 'blur(6px)',
      animation: 'modal-overlay-in 0.3s ease-out both',
    }}>
      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 16, color: primary,
        textShadow: `0 0 20px ${glow}`, letterSpacing: '0.1em', textAlign: 'center',
      }}>
        {SLOT_META[awaitingSlot].icon} Selecciona reemplazo para {SLOT_META[awaitingSlot].label}
      </div>
      <div style={{
        display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center',
        maxWidth: 480,
      }}>
        {reserve.map((u, i) => {
          const rar = RARITY_COLOR[u.rarity] ?? '#8b8b9e';
          return (
            <div key={u.id} onClick={() => onSelectReserve(u, i)} style={{
              width: 90, borderRadius: 10,
              border: `2px solid ${rar}55`,
              background: `linear-gradient(160deg,${rar}18,#0a0a14)`,
              cursor: 'pointer', overflow: 'hidden',
              transition: 'all 0.18s ease',
              boxShadow: `0 4px 16px rgba(0,0,0,0.5)`,
            }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px) scale(1.05)';
                (e.currentTarget as HTMLDivElement).style.boxShadow = `0 0 20px ${rar}66`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.transform = 'none';
                (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.5)';
              }}
            >
              <div style={{
                height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 24, background: u.image_url
                  ? `url(${u.image_url}) center/cover no-repeat`
                  : `linear-gradient(160deg,${rar}22,#0a0a14)`,
              }}>
                {!u.image_url && SLOT_META.vanguard.icon}
              </div>
              <div style={{ padding: '5px 7px', background: 'rgba(3,3,12,0.95)' }}>
                <div style={{
                  fontSize: 8, color: '#eee', fontFamily: '"Cinzel",serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3,
                }}>{u.name}</div>
                <div style={{ display: 'flex', gap: 3, fontSize: 8, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800 }}>
                  <span style={{ color: '#ff6b6b' }}>⚔{u.atk}</span>
                  <span style={{ color: '#4a9eff' }}>🛡{u.def}</span>
                </div>
                <div style={{ marginTop: 3, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(u.hp / u.max_hp) * 100}%`,
                    background: `linear-gradient(90deg,#3ddc84,#3ddc84bb)`, borderRadius: 2,
                  }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{
        fontSize: 10, color: '#4a4a6a', fontFamily: '"Rajdhani",sans-serif',
        letterSpacing: '0.1em', textAlign: 'center',
      }}>Elige sabiamente — cada carta de la reserva aumentó el poder del Campeón</div>
    </div>
  );
}

// ─── Main ForgeFormationBoard component ───────────────────────────────────────
export interface ForgeFormationBoardProps {
  initialFormation: FormationState;
  playerName?: string;
  opponentName?: string;
  difficulty: AIDifficulty;
  onComplete: (won: boolean, championDied: boolean) => void;
  onDismiss: () => void;
}

type BoardPhase = 'intro' | 'battle' | 'reserve' | 'champion_dead' | 'done';

export function ForgeFormationBoard({
  initialFormation, playerName = 'Tú', opponentName = 'Rival',
  difficulty, onComplete, onDismiss,
}: ForgeFormationBoardProps) {
  const [formation, setFormation] = useState<FormationState>(initialFormation);
  const [phase, setPhase]         = useState<BoardPhase>('intro');
  const [awaitingSlot, setAwaitingSlot] = useState<FormationSlot | null>(null);
  const [turnIdx, setTurnIdx]     = useState(0);
  const [totalTurns]              = useState(20);
  const [log, setLog]             = useState<string[]>([]);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [hitFlash, setHitFlash]   = useState<FormationSlot | null>(null);
  const autoRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Simulate formation battle result once
  const battleResult = useRef(simulateFormationBattle(initialFormation, difficulty));
  // Use turns array (RealBattleResult uses 'turns' not 'timeline')
  const battleTurns = battleResult.current.turns ?? [];

  // ─── Start ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setPhase('battle'), 1400);
    return () => clearTimeout(t);
  }, []);

  // ─── Auto-play interval ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlay || phase !== 'battle') return;
    autoRef.current = setInterval(() => advanceTurn(), 900);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
  }, [isAutoPlay, phase, turnIdx]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 10));
  }, []);

  const advanceTurn = useCallback(() => {
    if (phase !== 'battle') return;

    // Use the pre-computed battle turns
    const turnData = battleTurns[turnIdx] ?? null;

    if (!turnData) {
      // Battle over
      const won = battleResult.current.you_won ?? false;
      const championDied = battleResult.current.championDied;

      if (championDied) {
        setPhase('champion_dead');
        try { (AudioEngine as any).sfxKillV2?.(); } catch { /* ok */ }
        setTimeout(() => { setPhase('done'); onComplete(false, true); }, 2800);
      } else {
        setPhase('done');
        try {
          if (won) (AudioEngine as any).sfxLevelUp?.();
          else (AudioEngine as any).sfxKillV2?.();
        } catch { /* ok */ }
        setTimeout(() => onComplete(won, false), 600);
      }
      return;
    }

    // Animate turn
    const atkSide: 'player' | 'opponent' = turnData.atk_side === 'a' ? 'player' : 'opponent';

    setHitFlash(atkSide === 'player' ? 'sentinel' : 'vanguard');
    setTimeout(() => setHitFlash(null), 280);

    const dmg = turnData.damage ?? 0;
    const isCrit = turnData.is_crit;
    const isKill = turnData.is_kill;

    const atkName = atkSide === 'player'
      ? (formation.vanguard?.name ?? formation.champion.name)
      : 'Enemigo';
    const defName = defSlot === 'champion'
      ? formation.champion.name
      : (formation.sentinel?.name ?? formation.champion.name);

    addLog(`${isCrit ? '💥' : '⚔️'} ${atkName} → ${defName} [${dmg}${isCrit ? ' CRIT' : ''}${isKill ? ' 💀' : ''}]`);

    try {
      if (isKill)      (AudioEngine as any).sfxKillV2?.();
      else if (isCrit) (AudioEngine as any).sfxCritV2?.();
      else             AudioEngine.sfxCardSelect?.();
    } catch { /* ok */ }

    setTurnIdx(prev => prev + 1);

    // Check if reserve replacement needed (simplified)
    const finalFormation = battleResult.current.finalFormation;
    if (!finalFormation.vanguard?.alive && formation.vanguard?.alive && formation.reserve.length > 0) {
      if (autoRef.current) { clearInterval(autoRef.current); setIsAutoPlay(false); }
      setAwaitingSlot('vanguard');
      setPhase('reserve');
    } else if (!finalFormation.sentinel?.alive && formation.sentinel?.alive && formation.reserve.length > 0) {
      if (autoRef.current) { clearInterval(autoRef.current); setIsAutoPlay(false); }
      setAwaitingSlot('sentinel');
      setPhase('reserve');
    }
  }, [phase, turnIdx, formation, addLog, onComplete]);

  const handleSelectReserve = useCallback((unit: BattleUnit, _idx: number) => {
    if (!awaitingSlot) return;
    const result = getNextReserveUnit(formation.reserve, awaitingSlot);
    if (!result) return;

    setFormation(prev => ({
      ...prev,
      [awaitingSlot]: unit,
      reserve: prev.reserve.filter(u => u.id !== unit.id),
    }));

    try { (AudioEngine as any).sfxDrawCard?.(); } catch { /* ok */ }
    addLog(`🔄 ${SLOT_META[awaitingSlot].label} → ${unit.name} entra al campo`);
    setAwaitingSlot(null);
    setPhase('battle');
  }, [awaitingSlot, formation.reserve, addLog]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlay) {
      if (autoRef.current) clearInterval(autoRef.current);
      setIsAutoPlay(false);
    } else {
      setIsAutoPlay(true);
    }
  }, [isAutoPlay]);

  const champAlive = formation.champion.hp > 0 && formation.champion.alive !== false;
  const champProtected = isChampionProtected(formation);
  const finalFormation = battleResult.current.finalFormation;
  const progressPct = Math.min(turnIdx / Math.max(1, battleResult.current.timeline?.length ?? 20), 1);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'radial-gradient(ellipse at 50% 0%, #0f0820 0%, #060610 55%, #030308 100%)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Rajdhani",sans-serif', overflow: 'hidden',
    }}>
      <style>{`
        @keyframes intro-forge-in {
          0% { transform: scale(1.18) translateY(-20px); opacity: 0; filter: blur(12px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        @keyframes formation-slot-in {
          0% { transform: translateY(30px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes reserve-draw {
          0% { transform: translateX(-20px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(4,4,12,0.99)',
        borderBottom: '1px solid #141428',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexShrink: 0, gap: 8,
      }}>
        <div style={{ fontFamily: '"Cinzel",serif', fontSize: 13, color: '#e8b84b', letterSpacing: '0.08em' }}>
          ⚔ FORGE FORMATION · {opponentName}
        </div>
        <TurnIndicator current={turnIdx} total={battleResult.current.timeline?.length ?? totalTurns} />
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, color: '#6a6a8a', fontSize: 10, padding: '5px 10px', cursor: 'pointer',
          fontFamily: '"Rajdhani",sans-serif',
        }}>✕ Salir</button>
      </div>

      {/* ── Battle progress bar ─────────────────────────────────────────────── */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>
        <div style={{
          height: '100%', background: 'linear-gradient(90deg,#e84040,#e8b84b,#3ddc84)',
          width: `${progressPct * 100}%`, transition: 'width 0.4s ease',
          boxShadow: '0 0 8px rgba(232,184,75,0.6)',
        }} />
      </div>

      {/* ── Intro overlay ───────────────────────────────────────────────────── */}
      {phase === 'intro' && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 30,
          background: 'rgba(3,3,10,0.98)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          animation: 'modal-overlay-in 0.4s ease-out both',
        }}>
          <div style={{
            fontSize: 72, marginBottom: 20,
            animation: 'intro-forge-in 0.9s cubic-bezier(0.22,1,0.36,1) both',
            filter: 'drop-shadow(0 0 30px rgba(232,184,75,0.8))',
          }}>⚔️</div>
          <div style={{
            fontFamily: '"Cinzel Decorative",serif', fontSize: 'clamp(20px,5vw,32px)',
            fontWeight: 900, color: '#e8b84b',
            textShadow: '0 0 40px rgba(232,184,75,0.8)', letterSpacing: '0.12em',
            textAlign: 'center', marginBottom: 8,
            animation: 'intro-forge-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.15s both',
          }}>FORGE FORMATION</div>
          <div style={{
            fontFamily: '"Cinzel",serif', fontSize: 13, color: '#8888aa',
            letterSpacing: '0.2em', textAlign: 'center',
            animation: 'intro-forge-in 0.9s cubic-bezier(0.22,1,0.36,1) 0.3s both',
          }}>vs {opponentName.toUpperCase()}</div>
        </div>
      )}

      {/* ── Main arena ─────────────────────────────────────────────────────── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        {/* Atmospheric grid */}
        <div className="board-grid" style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `
            linear-gradient(rgba(74,158,255,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(74,158,255,0.02) 1px, transparent 1px)`,
          backgroundSize: '40px 40px',
        }} />

        {/* Fog layers */}
        <div className="arena-fog-layer" style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: 80,
          background: 'linear-gradient(transparent, rgba(5,5,14,0.6))',
          pointerEvents: 'none', zIndex: 0,
        }} />

        {/* === OPPONENT FORMATION (top) === */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '16px 8px 8px', position: 'relative', zIndex: 1,
        }}>
          <div style={{ textAlign: 'center', opacity: 0.7 }}>
            <div style={{
              fontSize: 9, color: '#e84040cc', letterSpacing: '0.15em',
              fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
              marginBottom: 6, padding: '2px 10px',
              background: 'rgba(0,0,0,0.5)', borderRadius: 20,
              border: '1px solid rgba(232,64,64,0.2)',
            }}>⚔ {opponentName}</div>
            <div style={{ display: 'flex', gap: 12 }}>
              {/* Opponent cards — simplified enemy display */}
              {(['vanguard', 'champion', 'sentinel'] as FormationSlot[]).map(s => {
                const u = finalFormation[s] as BattleUnit | null;
                return (
                  <div key={s} style={{
                    width: 90, minHeight: 130, borderRadius: 10,
                    border: `1px solid ${SLOT_COLORS[s].primary}33`,
                    background: `linear-gradient(160deg,${SLOT_COLORS[s].primary}11,#0a0a14)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: 8, gap: 4, opacity: 0.75,
                    transform: 'scaleY(-1)',
                  }}>
                    <div style={{ fontSize: 20 }}>{SLOT_META[s].icon}</div>
                    {u && <div style={{
                      fontSize: 7, color: '#aaa', fontFamily: '"Cinzel",serif',
                      textAlign: 'center', transform: 'scaleY(-1)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      maxWidth: 70,
                    }}>{u.name}</div>}
                    {s === 'champion' && (
                      <div style={{ fontSize: 12, transform: 'scaleY(-1)' }}>👑</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* VS divider */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 16, position: 'relative', zIndex: 1, padding: '4px 0',
        }}>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,transparent,rgba(232,64,64,0.4))' }} />
          <div style={{
            fontFamily: '"Cinzel Decorative",serif', fontSize: 18, fontWeight: 900,
            background: 'linear-gradient(135deg,#e74c3c,#e8b84b,#4a9eff)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            letterSpacing: '0.12em',
          }}>VS</div>
          <div style={{ flex: 1, height: 1, background: 'linear-gradient(90deg,rgba(74,158,255,0.4),transparent)' }} />
        </div>

        {/* === PLAYER FORMATION (bottom) === */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 16,
          padding: '8px 8px 16px', position: 'relative', zIndex: 1,
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 6 }}>
              {(['vanguard', 'champion', 'sentinel'] as FormationSlot[]).map((s, i) => {
                const u = formation[s] as BattleUnit | null;
                const finalU = finalFormation[s] as BattleUnit | null;
                const isDead = u ? (finalU ? !finalU.alive : false) : false;
                return (
                  <div key={s} style={{
                    animation: phase === 'battle' || phase === 'reserve'
                      ? `formation-slot-in 0.5s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both`
                      : 'none',
                  }}>
                    <FormationUnitCard
                      unit={u}
                      slot={s}
                      isChampion={s === 'champion'}
                      isActive={s === 'vanguard' && phase === 'battle'}
                      isDead={isDead}
                      isBeingHit={hitFlash === s}
                    />
                  </div>
                );
              })}
            </div>
            <div style={{
              fontSize: 9, color: '#4a9effcc', letterSpacing: '0.15em',
              fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
              padding: '2px 10px',
              background: 'rgba(0,0,0,0.5)', borderRadius: 20,
              border: '1px solid rgba(74,158,255,0.2)',
              display: 'inline-block',
            }}>🛡 {playerName} · Reserva: {formation.reserve.length}</div>

            {/* Champion protection indicator */}
            <div style={{
              marginTop: 6, fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
              color: champProtected ? '#3ddc84' : '#e84040',
              letterSpacing: '0.1em',
              transition: 'color 0.3s',
            }}>
              {champProtected ? '🛡 Campeón protegido' : '⚠️ ¡Campeón expuesto!'}
            </div>
          </div>
        </div>

        {/* Champion death overlay */}
        {phase === 'champion_dead' && (
          <ChampionDeathScreen champion={formation.champion} />
        )}

        {/* Reserve selection overlay */}
        {phase === 'reserve' && (
          <ReservePanel
            reserve={formation.reserve}
            onSelectReserve={handleSelectReserve}
            awaitingSlot={awaitingSlot}
          />
        )}
      </div>

      {/* ── Log ────────────────────────────────────────────────────────────── */}
      <div style={{
        maxHeight: 100, overflowY: 'auto',
        background: 'rgba(3,3,10,0.99)',
        borderTop: '1px solid rgba(232,184,75,0.1)',
        padding: '4px 8px',
        flexShrink: 0,
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        <div style={{
          fontSize: 7, color: '#e8b84b66', letterSpacing: '0.18em',
          fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
          padding: '1px 4px',
        }}>▶ LOG DE FORMACIÓN</div>
        {log.length === 0 ? (
          <div style={{ fontSize: 10, color: '#4a4a6a', padding: '2px 6px', fontFamily: '"Rajdhani",sans-serif' }}>
            Preparando la Forge Formation…
          </div>
        ) : log.map((l, i) => (
          <div key={i} className="turn-log-entry" style={{
            fontSize: 10, color: i === 0 ? '#e8e8f0' : '#8888aa',
            fontFamily: '"IBM Plex Mono",monospace', padding: '1px 6px',
          }}>{l}</div>
        ))}
      </div>

      {/* ── Controls ───────────────────────────────────────────────────────── */}
      <div style={{
        padding: '10px 16px',
        background: 'rgba(4,4,12,0.99)',
        borderTop: '1px solid #141428',
        display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, flexWrap: 'wrap',
      }}>
        {phase === 'battle' && (
          <>
            <button
              onClick={advanceTurn}
              disabled={isAutoPlay}
              style={{
                padding: '10px 22px', borderRadius: 10,
                background: isAutoPlay
                  ? 'rgba(255,255,255,0.04)'
                  : 'linear-gradient(135deg,#e8b84b,#e8b84b88)',
                border: `1px solid ${isAutoPlay ? 'rgba(255,255,255,0.08)' : '#e8b84b88'}`,
                color: isAutoPlay ? '#4a4a6a' : '#0a0a12',
                fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 12,
                cursor: isAutoPlay ? 'not-allowed' : 'pointer',
                letterSpacing: '0.06em',
                boxShadow: isAutoPlay ? 'none' : '0 4px 20px rgba(232,184,75,0.4)',
                animation: isAutoPlay ? 'none' : 'attack-btn-pulse 2s ease-in-out infinite',
              }}
            >⚔ ATACAR ({(battleResult.current.timeline?.length ?? 0) - turnIdx})</button>

            <button onClick={toggleAutoPlay} style={{
              padding: '10px 18px', borderRadius: 10,
              background: isAutoPlay ? 'rgba(232,184,75,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isAutoPlay ? '#e8b84b44' : 'rgba(255,255,255,0.1)'}`,
              color: isAutoPlay ? '#e8b84b' : '#6a6a8a', fontFamily: '"Cinzel",serif',
              fontSize: 12, cursor: 'pointer', letterSpacing: '0.06em',
            }}>{isAutoPlay ? '⏸ Pausar' : '▶ Auto'}</button>
          </>
        )}
        {phase === 'done' && (
          <div style={{
            fontFamily: '"Cinzel",serif', fontSize: 13,
            color: battleResult.current.you_won ? '#3ddc84' : '#e84040',
            textShadow: battleResult.current.you_won
              ? '0 0 20px rgba(61,220,132,0.6)'
              : '0 0 20px rgba(232,64,64,0.6)',
          }}>
            {battleResult.current.you_won ? '🏆 ¡VICTORIA!' : '💀 DERROTA'}
          </div>
        )}
      </div>
    </div>
  );
}
