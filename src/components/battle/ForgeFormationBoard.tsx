// ForgeFormationBoard.tsx — FFE (Forge Formation Engine) v2.0
// Tablero de batalla visual con 3 posiciones: Vanguardia · Campeón · Centinela
// Si el Campeón cae → derrota instantánea con cinemática épica (4.0s).
// Champion Rage: +5% ATK por cada muerte de carta aliada (máx 5 stacks).
// Forge Ascension: al 3er kill del Campeón → visual dorado + buff.

import { useState, useEffect, useCallback, useRef } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import {
  type FormationState, type FormationSlot,
  isChampionProtected, SLOT_META,
  simulateFormationBattle, hasFormationPureBonus,
} from '../../lib/forgeFormation';
import type { AIDifficulty } from '../../lib/aiBattleEngine';
import { AudioEngine } from '../../lib/audioEngine';

// ─── Palette ───────────────────────────────────────────────────────────────────
const SLOT_COLORS: Record<FormationSlot, { primary: string; glow: string }> = {
  vanguard:  { primary: '#e84040', glow: 'rgba(232,64,64,0.6)' },
  champion:  { primary: '#e8b84b', glow: 'rgba(232,184,75,0.7)' },
  sentinel:  { primary: '#4a9eff', glow: 'rgba(74,158,255,0.6)' },
};

const FACTION_COLORS: Record<string, { primary: string; glow: string; particle: string }> = {
  Guerrero: { primary: '#e85d04', glow: 'rgba(232,93,4,0.8)',  particle: '🔥' },
  Mago:     { primary: '#4a9eff', glow: 'rgba(74,158,255,0.8)',particle: '✨' },
  Paladín:  { primary: '#e8b84b', glow: 'rgba(232,184,75,0.8)',particle: '⚡' },
  Pícaro:   { primary: '#a855f7', glow: 'rgba(168,85,247,0.8)',particle: '💜' },
};

const getFactionStyle = (faction: string) =>
  FACTION_COLORS[faction] ?? { primary: '#e8b84b', glow: 'rgba(232,184,75,0.8)', particle: '⚔️' };

// ─── Terrain per facción (Plan §3 — Terrain Faction) ──────────────────────────
const TERRAIN_FACTION: Record<string, {
  gradient: string; ambientColor: string; particleEmoji: string[]; scanlineColor: string;
}> = {
  Guerrero: {
    gradient: 'radial-gradient(ellipse at 50% 100%, rgba(120,20,0,0.55) 0%, rgba(50,8,2,0.25) 55%, transparent 85%)',
    ambientColor: 'rgba(232,93,4,0.07)',
    particleEmoji: ['🔥','🌋','💥'],
    scanlineColor: 'rgba(232,64,64,0.03)',
  },
  Mago: {
    gradient: 'radial-gradient(ellipse at 50% 50%, rgba(30,10,80,0.55) 0%, rgba(10,5,40,0.25) 60%, transparent 90%)',
    ambientColor: 'rgba(74,158,255,0.06)',
    particleEmoji: ['✨','🔮','⭐'],
    scanlineColor: 'rgba(74,158,255,0.03)',
  },
  'Paladín': {
    gradient: 'radial-gradient(ellipse at 50% 0%, rgba(90,65,5,0.5) 0%, rgba(40,25,5,0.22) 55%, transparent 85%)',
    ambientColor: 'rgba(232,184,75,0.07)',
    particleEmoji: ['⚡','✝️','☀️'],
    scanlineColor: 'rgba(232,184,75,0.03)',
  },
  'Pícaro': {
    gradient: 'radial-gradient(ellipse at 30% 80%, rgba(70,5,90,0.5) 0%, rgba(25,2,40,0.25) 55%, transparent 85%)',
    ambientColor: 'rgba(168,85,247,0.07)',
    particleEmoji: ['💜','🗡️','🌑'],
    scanlineColor: 'rgba(168,85,247,0.03)',
  },
};
const getTerrain = (faction: string) =>
  TERRAIN_FACTION[faction] ?? {
    gradient: 'radial-gradient(ellipse at 50% 50%, rgba(10,10,40,0.4) 0%, transparent 80%)',
    ambientColor: 'rgba(74,158,255,0.04)',
    particleEmoji: ['⚔️'],
    scanlineColor: 'rgba(74,158,255,0.02)',
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
  showDeathAnim, ascensionActive,
}: {
  unit: BattleUnit | null;
  slot: FormationSlot;
  isChampion?: boolean;
  isActive?: boolean;
  isDead?: boolean;
  isBeingHit?: boolean;
  showDeathAnim?: boolean;
  ascensionActive?: boolean;
}) {
  const { primary, glow } = SLOT_COLORS[slot];
  const meta = SLOT_META[slot];

  if (!unit) {
    return (
      <div className="forge-formation-card" style={{
        minHeight: 160, borderRadius: 12,
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

  const rar   = ascensionActive && isChampion ? '#ffd700' : (RARITY_COLOR[unit.rarity] ?? '#8b8b9e');
  const rglow = ascensionActive && isChampion ? 'rgba(255,215,0,0.6)' : (RARITY_GLOW[unit.rarity] ?? 'rgba(139,139,158,0.3)');
  const _pct  = unit.max_hp > 0 ? unit.hp / unit.max_hp : 0; void _pct;

  return (
    <div
      className={[
        'forge-formation-card',
        isDead || showDeathAnim ? 'card-dissolve' : '',
        isBeingHit ? 'impact-shake' : '',
        isChampion && !isDead ? (ascensionActive ? 'forge-ascension-pulse' : 'champion-crown-pulse') : '',
        isActive && !isDead ? 'vanguard-guard-pulse' : '',
      ].filter(Boolean).join(' ')}
      style={{
        minHeight: 160, borderRadius: 12,
        border: `2px solid ${isDead ? '#333' : isChampion ? rar : primary}`,
        background: unit.image_url
          ? `linear-gradient(180deg,transparent 0%,rgba(5,5,14,0.92) 55%),url(${unit.image_url}) center/cover no-repeat`
          : `linear-gradient(160deg,${primary}18,#0a0a14)`,
        boxShadow: isDead
          ? 'none'
          : isChampion && ascensionActive
            ? `0 0 32px rgba(255,215,0,0.9), 0 0 64px rgba(255,215,0,0.4), 0 0 0 2px #ffd70055`
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

      {/* Champion crown / ascension crown */}
      {isChampion && !isDead && (
        <div style={{
          position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)',
          fontSize: 20, zIndex: 3,
          filter: ascensionActive
            ? 'drop-shadow(0 0 12px #ffd700) drop-shadow(0 0 20px #ffd700aa)'
            : `drop-shadow(0 0 8px ${rar}aa)`,
          animation: ascensionActive
            ? 'forge-ascension-crown 1.5s ease-in-out infinite'
            : 'champion-crown-pulse 2s ease-in-out infinite',
        }}>{ascensionActive ? '🌟' : '👑'}</div>
      )}

      {/* Rarity badge */}
      <div style={{
        position: 'absolute', top: 5, right: 5, zIndex: 2,
        background: 'rgba(0,0,0,0.8)', border: `1px solid ${rar}55`,
        borderRadius: 4, padding: '1px 5px',
        fontSize: 6, fontWeight: 800, color: rar,
        fontFamily: '"Rajdhani",sans-serif',
      }}>{unit.rarity.toUpperCase()}</div>

      {/* Ascension glow overlay */}
      {isChampion && ascensionActive && !isDead && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1, borderRadius: 10,
          background: 'linear-gradient(180deg, rgba(255,215,0,0.15) 0%, transparent 60%)',
          animation: 'ascension-shimmer 2s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}

      {/* Image area */}
      <div style={{
        flex: 1, minHeight: 80,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {!unit.image_url && (
          <span style={{ fontSize: 28, opacity: 0.5 }}>
            {meta.icon}
          </span>
        )}
      </div>

      {/* Stats footer */}
      <div style={{
        padding: '5px 7px',
        background: 'rgba(3,3,12,0.92)',
        borderTop: `1px solid ${primary}22`,
        zIndex: 2,
      }}>
        <div style={{
          fontSize: 9, color: '#eee', fontFamily: '"Cinzel",serif',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          marginBottom: 3,
        }}>{unit.name}</div>
        <div style={{ display: 'flex', gap: 4, fontSize: 9, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800, marginBottom: 3 }}>
          <span style={{ color: '#ff6b6b' }}>⚔{unit.atk}</span>
          <span style={{ color: '#4a9eff' }}>🛡{unit.def}</span>
          <span style={{ color: '#3ddc84' }}>❤{unit.hp}</span>
        </div>
        <SegmentedHpBar hp={unit.hp} max={unit.max_hp} slot={slot} />
        {/* Keywords strip */}
        {unit.keywords && unit.keywords.length > 0 && (
          <div style={{
            marginTop: 3, fontSize: 6, color: '#8888aa',
            fontFamily: '"Rajdhani",sans-serif',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {unit.keywords.slice(0, 2).join(' · ')}
          </div>
        )}
      </div>

      {/* Dead overlay */}
      {isDead && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5,
          background: 'rgba(0,0,0,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 28,
        }}>💀</div>
      )}
    </div>
  );
}

// ─── Turn indicator ────────────────────────────────────────────────────────────
function TurnIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontFamily: '"Rajdhani",sans-serif',
    }}>
      <span style={{ fontSize: 9, color: '#6a6a8a', letterSpacing: '0.1em' }}>TURNO</span>
      <span style={{ fontSize: 15, fontWeight: 800, color: '#e8e8f0' }}>{current}</span>
      <span style={{ fontSize: 9, color: '#4a4a6a' }}>/ {total}</span>
    </div>
  );
}

// ─── Rage Meter ────────────────────────────────────────────────────────────────
function RageMeter({ stacks, maxStacks = 5 }: { stacks: number; maxStacks?: number }) {
  if (stacks === 0) return null;
  const isFrenzy = stacks >= maxStacks;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      padding: '4px 10px', borderRadius: 20,
      background: isFrenzy
        ? 'rgba(232,64,64,0.25)'
        : 'rgba(232,184,75,0.12)',
      border: `1px solid ${isFrenzy ? '#e84040' : '#e8b84b'}44`,
      animation: isFrenzy ? 'rage-frenzy-pulse 0.8s ease-in-out infinite' : 'none',
    }}>
      <span style={{ fontSize: 10 }}>🔥</span>
      <div style={{ display: 'flex', gap: 2 }}>
        {Array.from({ length: maxStacks }).map((_, i) => (
          <div key={i} style={{
            width: 8, height: 8, borderRadius: '50%',
            background: i < stacks
              ? (isFrenzy ? '#e84040' : '#e8b84b')
              : 'rgba(255,255,255,0.08)',
            boxShadow: i < stacks ? `0 0 6px ${isFrenzy ? '#e84040' : '#e8b84b'}` : 'none',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
      <span style={{
        fontSize: 8, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800,
        color: isFrenzy ? '#e84040' : '#e8b84b',
        letterSpacing: '0.06em',
      }}>
        {isFrenzy ? 'FORGE FRENZY' : `+${stacks * 5}% ATK`}
      </span>
    </div>
  );
}

// ─── Charge Orbs (Kills counter) ───────────────────────────────────────────────
function ChargeOrbs({ kills, ascensionAt = 3 }: { kills: number; ascensionAt?: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: 8, color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.1em' }}>KILLS</span>
      {Array.from({ length: ascensionAt }).map((_, i) => (
        <div key={i} style={{
          width: 10, height: 10, borderRadius: '50%',
          background: i < kills
            ? 'radial-gradient(circle,#ffd700,#e8b84b)'
            : 'rgba(255,255,255,0.06)',
          border: `1px solid ${i < kills ? '#ffd70088' : 'rgba(255,255,255,0.1)'}`,
          boxShadow: i < kills ? '0 0 8px rgba(255,215,0,0.8)' : 'none',
          transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
          animation: i < kills ? 'charge-orb-glow 1.5s ease-in-out infinite' : 'none',
        }} />
      ))}
      {kills >= ascensionAt && (
        <span style={{
          fontSize: 8, fontFamily: '"Cinzel",serif', fontWeight: 800,
          color: '#ffd700', letterSpacing: '0.08em',
          textShadow: '0 0 10px rgba(255,215,0,0.8)',
        }}>ASCENDIDO</span>
      )}
    </div>
  );
}

// ─── Forge Gauge ───────────────────────────────────────────────────────────────
function ForgeGauge({ progress }: { progress: number }) {
  const phase = progress < 0.4 ? 'intro' : progress < 0.75 ? 'mid' : 'last_stand';
  const col = phase === 'intro' ? '#3ddc84' : phase === 'mid' ? '#e8b84b' : '#e84040';
  return (
    <div style={{ position: 'relative', height: 6, background: 'rgba(255,255,255,0.04)', overflow: 'visible' }}>
      {/* Base track */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(255,255,255,0.04)',
      }} />
      {/* Fill */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0,
        width: `${progress * 100}%`,
        background: `linear-gradient(90deg, #e84040, ${col})`,
        transition: 'width 0.4s ease',
        boxShadow: `0 0 10px ${col}88`,
      }} />
      {/* Phase markers */}
      {[0.4, 0.75].map((marker, i) => (
        <div key={i} style={{
          position: 'absolute', top: -2, bottom: -2,
          left: `${marker * 100}%`,
          width: 1,
          background: 'rgba(255,255,255,0.2)',
        }} />
      ))}
      {/* Pulse dot at front */}
      <div style={{
        position: 'absolute', top: '50%',
        left: `${progress * 100}%`,
        transform: 'translate(-50%, -50%)',
        width: 8, height: 8, borderRadius: '50%',
        background: col,
        boxShadow: `0 0 12px ${col}`,
        animation: 'forge-gauge-pulse 1s ease-in-out infinite',
      }} />
    </div>
  );
}

// ─── Rarity & Faction config for summon cinematic ─────────────────────────────
    const RARITY_SUMMON: Record<string, { duration: number; rings: number; ptcl: number; tag: string }> = {
    'Común':       { duration: 2200, rings: 2, ptcl: 3,  tag: '' },
    'Infrecuente': { duration: 2600, rings: 2, ptcl: 4,  tag: '' },
    'Rara':        { duration: 3000, rings: 3, ptcl: 5,  tag: '★ RARA' },
    'Épica':       { duration: 3500, rings: 3, ptcl: 6,  tag: '★★ ÉPICA' },
    'Legendaria':  { duration: 4000, rings: 4, ptcl: 8,  tag: '👑 LEGENDARIA' },
    'Mítica':      { duration: 4500, rings: 5, ptcl: 10, tag: '🔥 MÍTICA' },
    };
    const FACTION_CINEMATIC_BG: Record<string, string> = {
    'Guerrero': 'radial-gradient(ellipse at 50% 35%, #3a0a0a 0%, #0a0208 100%)',
    'Mago':     'radial-gradient(ellipse at 50% 35%, #0c0820 0%, #020206 100%)',
    'Paladín':  'radial-gradient(ellipse at 50% 20%, #1a1408 0%, #050400 100%)',
    'Pícaro':   'radial-gradient(ellipse at 50% 80%, #0d061a 0%, #010104 100%)',
    };

// ─── Per-card motto generator (G1) ───────────────────────────────────────────
const KEYWORD_SUMMON_FX: Record<string, { color: string; emoji: string[]; bgOverlay: string }> = {
  'Guard':        { color: '#4a9eff', emoji: ['🛡️','⚔️'], bgOverlay: 'rgba(74,158,255,0.12)' },
  'Drain':        { color: '#9b59b6', emoji: ['💜','🌑'], bgOverlay: 'rgba(155,89,182,0.12)' },
  'Lifesteal':    { color: '#c0392b', emoji: ['❤️','🩸'], bgOverlay: 'rgba(192,57,43,0.12)' },
  'Surge':        { color: '#f1c40f', emoji: ['⚡','💥'], bgOverlay: 'rgba(241,196,15,0.12)' },
  'Veil':         { color: '#7f8c8d', emoji: ['🌫️','👁️'], bgOverlay: 'rgba(127,140,141,0.18)' },
  'Forge':        { color: '#e74c3c', emoji: ['🔥','⚒️'], bgOverlay: 'rgba(231,76,60,0.12)' },
  'Poison':       { color: '#27ae60', emoji: ['☠️','💚'], bgOverlay: 'rgba(39,174,96,0.12)' },
  'DoubleStrike': { color: '#e84040', emoji: ['⚔️','⚔️'], bgOverlay: 'rgba(232,64,64,0.14)' },
  'Rush':         { color: '#e67e22', emoji: ['💨','⚡'], bgOverlay: 'rgba(230,126,34,0.12)' },
  'Consecrate':   { color: '#f39c12', emoji: ['✨','☀️'], bgOverlay: 'rgba(243,156,18,0.12)' },
  'Resonance':    { color: '#8e44ad', emoji: ['🔮','✨'], bgOverlay: 'rgba(142,68,173,0.12)' },
  'Flux':         { color: '#3498db', emoji: ['🌀','⚡'], bgOverlay: 'rgba(52,152,219,0.12)' },
  'Taunt':        { color: '#e84040', emoji: ['💢','🔴'], bgOverlay: 'rgba(232,64,64,0.14)' },
  'Stealth':      { color: '#6c5ce7', emoji: ['🌑','👁️'], bgOverlay: 'rgba(108,92,231,0.14)' },
  'Spellpower':   { color: '#00cec9', emoji: ['📿','✨'], bgOverlay: 'rgba(0,206,201,0.12)' },
};

const KW_MOTTO: Record<string, string> = {
  'Guard':        'ESCUDO DE LA FORJA',
  'Drain':        'DRENA LA ESENCIA',
  'Lifesteal':    'VIDA ROBADA, PODER GANADO',
  'Surge':        'VELOCIDAD IMPARABLE',
  'Veil':         'INVISIBLE AL DESTINO',
  'Forge':        'NACIDO DEL FUEGO ETERNO',
  'Poison':       'EL VENENO NUNCA MIENTE',
  'DoubleStrike': 'DOS GOLPES — UN FINAL',
  'Rush':         'SIN LÍMITE NI FRENO',
  'Consecrate':   'BENDITO POR LA LUZ',
  'Resonance':    'RESUENA EN EL VACÍO',
  'Flux':         'FLUJO DE ENERGÍA PURA',
  'Taunt':        'ATRÉVETE A ATACARME',
  'Stealth':      'LAS SOMBRAS ME PROTEGEN',
  'Spellpower':   'LA MAGIA ES MI ARMA',
};

const FACTION_MOTTO: Record<string, string> = {
  'Guerrero': 'EL ACERO NUNCA MIENTE',
  'Mago':     'EL CONOCIMIENTO ES PODER',
  'Paladín':  'LA LUZ PREVALECERÁ',
  'Pícaro':   'LAS SOMBRAS SON MI ARMADURA',
};

const RARITY_PREFIX: Record<string, string> = {
  'Common': '', 'Uncommon': '', 'Rare': '★ ',
  'Epic': '★★ ', 'Legendary': '👑 ', 'Mythic': '🔥 ', 'Founder': '⚜️ ',
};

function getCardMotto(unit: BattleUnit): string {
  const kws   = unit.keywords ?? [];
  const primary = kws.find(k => KW_MOTTO[k]);
  const prefix  = RARITY_PREFIX[unit.rarity] ?? '';
  if (primary) return prefix + KW_MOTTO[primary];
  return prefix + (FACTION_MOTTO[unit.faction ?? ''] ?? 'FORJADO PARA LUCHAR');
}

    // ─── Champion Summon Cinematic (per-faction · per-rarity) ──────────────────────
    function ChampionSummonCinematic({ champion, onDone }: { champion: BattleUnit; onDone: () => void }) {
    const rar  = RARITY_COLOR[champion.rarity] ?? '#e8b84b';
    const fac  = getFactionStyle(champion.faction ?? '');
    const ter  = getTerrain(champion.faction ?? '');
    const cfg  = RARITY_SUMMON[champion.rarity] ?? { duration: 3000, rings: 3, ptcl: 5, tag: '' };
    const bg   = FACTION_CINEMATIC_BG[champion.faction ?? ''] ?? 'radial-gradient(ellipse at 50% 50%, #0e0e22 0%, #020208 100%)';
    const motto   = getCardMotto(champion);
    const kwFxChamp = KEYWORD_SUMMON_FX[(champion.keywords ?? [])[0] ?? ''] ?? null;
    const [stage, setStage] = useState(0);

    useEffect(() => {
      const t1 = setTimeout(() => setStage(1), 500);
      const t2 = setTimeout(() => setStage(2), 1100);
      const t3 = setTimeout(() => setStage(3), 2000);
      const t4 = setTimeout(() => onDone(), cfg.duration);
      try { (AudioEngine as any).sfxDrawCard?.(); } catch { /* ok */ }
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <div style={{
        position: 'absolute', inset: 0, zIndex: 60,
        background: bg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
      }}>
        <style>{`
          @keyframes summon-flash {
            0%   { opacity: 0; }
            30%  { opacity: 1; }
            100% { opacity: 0; }
          }
          @keyframes summon-champion-in {
            0%   { transform: scale(0.3) translateY(60px); opacity: 0; filter: blur(20px) brightness(3); }
            60%  { transform: scale(1.08) translateY(-8px); opacity: 1; filter: blur(0) brightness(1.2); }
            100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0) brightness(1); }
          }
          @keyframes summon-ring-expand {
            0%   { transform: scale(0); opacity: 0.9; }
            100% { transform: scale(3.5); opacity: 0; }
          }
          @keyframes summon-particles-orbit {
            0%   { transform: rotate(0deg) translateX(90px) rotate(0deg); opacity: 1; }
            100% { transform: rotate(360deg) translateX(90px) rotate(-360deg); opacity: 0.4; }
          }
          @keyframes summon-title-in {
            0%   { transform: translateY(20px) scale(0.9); opacity: 0; letter-spacing: 0.3em; }
            100% { transform: translateY(0) scale(1); opacity: 1; letter-spacing: 0.12em; }
          }
          @keyframes summon-stats-in {
            0%   { transform: translateY(12px); opacity: 0; }
            100% { transform: translateY(0); opacity: 1; }
          }
          @keyframes summon-motto-in {
            0%   { opacity: 0; letter-spacing: 0.5em; }
            100% { opacity: 1; letter-spacing: 0.18em; }
          }
          @keyframes summon-rarity-tag {
            0%   { transform: scale(1.4); opacity: 0; }
            100% { transform: scale(1); opacity: 1; }
          }
          @keyframes summon-scanline {
            0%   { transform: translateY(-100%); opacity: 0; }
            20%  { opacity: 1; }
            100% { transform: translateY(500%); opacity: 0; }
          }
          @keyframes forge-ascension-crown {
            0%,100% { transform: translateX(-50%) scale(1) rotate(-5deg); }
            50%     { transform: translateX(-50%) scale(1.2) rotate(5deg); }
          }
        `}</style>

        {/* Faction terrain ambient layer */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: ter.gradient, opacity: 0.9,
          pointerEvents: 'none',
        }} />

        {/* Scanline sweep */}
        <div style={{
          position: 'absolute', left: 0, right: 0, height: '30%', zIndex: 1,
          background: `linear-gradient(180deg, transparent, ${fac.primary}22, transparent)`,
          animation: 'summon-scanline 1.6s ease-in-out both',
          pointerEvents: 'none',
        }} />

        {/* Faction flash */}
        {stage >= 0 && (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            background: `radial-gradient(ellipse at 50% 50%, ${fac.primary}44 0%, transparent 70%)`,
            animation: 'summon-flash 0.5s ease-out both',
            pointerEvents: 'none',
          }} />
        )}

        {/* Expanding rings (rarity-scaled count) */}
        {stage >= 1 && Array.from({ length: cfg.rings }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', zIndex: 1,
            width: 180, height: 180, borderRadius: '50%',
            border: `${i === 0 ? 2 : 1}px solid ${i % 2 === 0 ? fac.primary : rar}`,
            animation: `summon-ring-expand ${0.8 + i * 0.25}s cubic-bezier(0,0.5,0.5,1) ${i * 0.12}s both`,
            pointerEvents: 'none',
          }} />
        ))}

        {/* Orbiting faction particles (rarity-scaled count) */}
        {stage >= 1 && Array.from({ length: cfg.ptcl }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute', zIndex: 2, fontSize: i % 3 === 0 ? 18 : 12,
            animation: `summon-particles-orbit ${1.0 + i * 0.18}s linear infinite`,
            transform: `rotate(${i * (360 / cfg.ptcl)}deg) translateX(90px)`,
            pointerEvents: 'none',
          }}>{ter.particleEmoji[i % ter.particleEmoji.length]}</div>
        ))}

        {/* Champion card */}
        {stage >= 2 && (
          <div style={{
            zIndex: 3, textAlign: 'center',
            animation: 'summon-champion-in 0.9s cubic-bezier(0.22,1,0.36,1) both',
          }}>
            {cfg.tag && (
              <div style={{
                fontFamily: '"Rajdhani",sans-serif', fontWeight: 900, fontSize: 11,
                color: rar, letterSpacing: '0.15em', marginBottom: 8,
                animation: 'summon-rarity-tag 0.4s ease-out both',
                textShadow: `0 0 12px ${rar}`,
              }}>{cfg.tag}</div>
            )}
            {/* Champion card art — uses image_url when available */}
            <div style={{
              width: 110, height: 150, borderRadius: 12, margin: '0 auto',
              background: champion.image_url
                ? `linear-gradient(180deg,transparent 0%,rgba(0,0,0,0.75) 65%),url(${champion.image_url}) center/cover no-repeat`
                : `linear-gradient(160deg, ${fac.primary}22, rgba(0,0,0,0.6))`,
              border: `2px solid ${kwFxChamp ? kwFxChamp.color : rar}`,
              boxShadow: `0 0 30px ${kwFxChamp ? kwFxChamp.color : fac.primary}88, 0 0 60px ${rar}44, inset 0 0 20px ${fac.primary}11`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40, position: 'relative', overflow: 'hidden',
            }}>
              {!champion.image_url && ter.particleEmoji[0]}
              {/* Keyword color overlay */}
              {kwFxChamp && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: kwFxChamp.bgOverlay,
                  pointerEvents: 'none',
                }} />
              )}
            </div>
            <div style={{
              fontFamily: '"Cinzel",serif', fontWeight: 900,
              fontSize: 'clamp(18px,4vw,28px)', color: '#f0ead6',
              marginTop: 14,
              textShadow: `0 0 30px ${kwFxChamp ? kwFxChamp.color : fac.primary}cc, 0 2px 0 rgba(0,0,0,0.8)`,
              animation: 'summon-title-in 0.6s cubic-bezier(0.22,1,0.36,1) both',
              letterSpacing: '0.12em',
            }}>{champion.name}</div>
            <div style={{
              color: kwFxChamp ? kwFxChamp.color : fac.primary, fontSize: 10, marginTop: 4,
              fontFamily: '"Rajdhani",sans-serif', fontWeight: 700,
              letterSpacing: '0.18em',
              animation: 'summon-motto-in 0.8s ease-out 0.2s both',
              textShadow: `0 0 8px ${kwFxChamp ? kwFxChamp.color : fac.primary}`,
            }}>{motto}</div>
          </div>
        )}

        {/* Stats */}
        {stage >= 3 && (
          <>
          <div style={{
            zIndex: 3, display: 'flex', gap: 16, marginTop: 16,
            animation: 'summon-stats-in 0.5s ease-out both',
          }}>
            {[
              { label: '⚔ ATK', val: champion.atk,    col: '#ff6b6b' },
              { label: '🛡 DEF', val: champion.def,    col: '#4a9eff' },
              { label: '❤ HP',  val: champion.max_hp,  col: '#3ddc84' },
              { label: '⚡ POW', val: champion.power,  col: '#e8b84b' },
            ].map(s => (
              <div key={s.label} style={{
                textAlign: 'center',
                background: 'rgba(255,255,255,0.04)',
                border: `1px solid ${s.col}33`,
                borderRadius: 8, padding: '6px 12px',
              }}>
                <div style={{ fontSize: 16, fontWeight: 900, color: s.col, fontFamily: '"Rajdhani",sans-serif' }}>{s.val}</div>
                <div style={{ fontSize: 8, color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.08em' }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Champion keyword badges (G2) */}
          {(champion.keywords ?? []).length > 0 && (
            <div style={{
              zIndex: 3, display: 'flex', gap: 5, marginTop: 10, flexWrap: 'wrap', justifyContent: 'center',
              animation: 'summon-stats-in 0.4s ease-out 0.15s both',
            }}>
              {(champion.keywords ?? []).slice(0, 4).map(kw => {
                const fx = KEYWORD_SUMMON_FX[kw];
                if (!fx) return null;
                return (
                  <div key={kw} style={{
                    padding: '3px 9px', borderRadius: 20,
                    border: `1px solid ${fx.color}66`,
                    background: `${fx.color}22`,
                    fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
                    fontWeight: 800, color: fx.color, letterSpacing: '0.08em',
                    textShadow: `0 0 8px ${fx.color}88`,
                  }}>{fx.emoji[0]} {kw.toUpperCase()}</div>
                );
              })}
            </div>
          )}
          </>
        )}

        {/* INVOCANDO label */}
        <div style={{
          position: 'absolute', bottom: 24, left: 0, right: 0,
          textAlign: 'center', zIndex: 3,
          fontFamily: '"Rajdhani",sans-serif', fontSize: 11,
          color: '#4a4a6a', letterSpacing: '0.25em',
        }}>▶ INVOCANDO CAMPEÓN</div>
      </div>
    );
    }

// ─── Unit Summon Cinematic — B1: per-faction · per-rarity for reserve cards ────
const UNIT_SUMMON_DURATION: Record<string, number> = {
  Common: 1400, Uncommon: 1600, Rare: 1900, Epic: 2200, Legendary: 2600, Mythic: 3000,
};
const UNIT_RARITY_TAG: Record<string, string> = {
  Rare: '★', Epic: '★★', Legendary: '👑', Mythic: '🔥',
};
const SLOT_LABEL_MAP: Record<FormationSlot, string> = {
  vanguard: 'VANGUARDIA', champion: 'CAMPEÓN', sentinel: 'CENTINELA',
};

function UnitSummonCinematic({
  unit, slot, onDone,
}: { unit: BattleUnit; slot: FormationSlot; onDone: () => void }) {
  const fac    = getFactionStyle(unit.faction ?? '');
  const ter    = getTerrain(unit.faction ?? '');
  const rar    = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const dur    = UNIT_SUMMON_DURATION[unit.rarity] ?? 1800;
  const tag    = UNIT_RARITY_TAG[unit.rarity] ?? '';
  const slotLabel = SLOT_LABEL_MAP[slot] ?? slot.toUpperCase();
  const motto  = getCardMotto(unit);
  const kwFx   = KEYWORD_SUMMON_FX[(unit.keywords ?? [])[0] ?? ''] ?? null;
  const bg     = {
    Guerrero: 'radial-gradient(ellipse at 50% 60%, #2a0800 0%, #06020a 100%)',
    Mago:     'radial-gradient(ellipse at 50% 40%, #08051a 0%, #020208 100%)',
    'Paladín': 'radial-gradient(ellipse at 50% 30%, #130d00 0%, #040300 100%)',
    'Pícaro':  'radial-gradient(ellipse at 50% 80%, #0a0314 0%, #020106 100%)',
  }[unit.faction ?? ''] ?? 'radial-gradient(ellipse at 50% 50%, #0e0e22 0%, #020208 100%)';

  const [show, setShow] = useState(false);
  useEffect(() => {
    const t0 = setTimeout(() => setShow(true), 80);
    const t1 = setTimeout(() => onDone(), dur);
    try { (AudioEngine as any).sfxDrawCard?.(); } catch { /* ok */ }
    return () => { clearTimeout(t0); clearTimeout(t1); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 58,
      background: bg, overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <style>{`
        @keyframes unit-summon-rise {
          0%   { transform: translateY(30px) scale(0.75); opacity: 0; filter: blur(10px) brightness(2.5); }
          55%  { transform: translateY(-4px) scale(1.04); opacity: 1; filter: blur(0) brightness(1.15); }
          100% { transform: translateY(0) scale(1);       opacity: 1; filter: blur(0) brightness(1); }
        }
        @keyframes unit-summon-ring {
          0%   { transform: scale(0.1); opacity: 0.8; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes unit-summon-label {
          0%   { transform: translateY(8px); opacity: 0; letter-spacing: 0.4em; }
          100% { transform: translateY(0);   opacity: 1; letter-spacing: 0.18em; }
        }
        @keyframes unit-summon-slot {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Terrain particles */}
      {ter.particleEmoji.map((p, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: `${20 + i * 30}%`, bottom: '15%',
          fontSize: 18 + i * 4, opacity: 0,
          animation: show ? `terrain-particle-float ${1.2 + i * 0.3}s ease-out ${i * 0.2}s both` : 'none',
        }}>{p}</div>
      ))}

      {/* Energy rings — keyword-tinted (G1) */}
      {[0, 1].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 120, height: 120, borderRadius: '50%',
          border: `2px solid ${kwFx ? kwFx.color : fac.primary}`,
          opacity: 0,
          animation: show ? `unit-summon-ring 0.9s ease-out ${i * 0.18}s both` : 'none',
        }} />
      ))}

      {/* Card image + name */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        opacity: 0,
        animation: show ? 'unit-summon-rise 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both' : 'none',
        zIndex: 2,
      }}>
        {/* Card art */}
        <div style={{
          width: 90, height: 120, borderRadius: 10,
          border: `2px solid ${rar}bb`,
          boxShadow: `0 0 24px ${fac.glow}, 0 0 8px ${rar}55`,
          overflow: 'hidden',
          background: unit.image_url
            ? `url(${unit.image_url}) center/cover no-repeat`
            : `linear-gradient(160deg, ${rar}33, #0a0a14)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          position: 'relative',
        }}>
          {!unit.image_url && (
            <span style={{ fontSize: 32, opacity: 0.5 }}>{fac.particle}</span>
          )}
          {/* Rarity tag */}
          {tag && (
            <div style={{
              position: 'absolute', top: 4, right: 4,
              fontSize: 9, color: rar, fontWeight: 800,
              textShadow: `0 0 6px ${rar}`,
              fontFamily: '"Cinzel",serif',
            }}>{tag}</div>
          )}
          {/* Keyword color overlay on card */}
          {kwFx && (
            <div style={{
              position: 'absolute', inset: 0,
              background: kwFx.bgOverlay,
              pointerEvents: 'none',
            }} />
          )}
        </div>

        {/* Unit name */}
        <div style={{
          fontFamily: '"Cinzel",serif', fontWeight: 700,
          fontSize: 15, color: '#e8e8f0',
          textShadow: `0 0 16px ${kwFx ? kwFx.color : fac.glow}`,
          textAlign: 'center',
        }}>{unit.name}</div>

        {/* Faction + rarity */}
        <div style={{
          display: 'flex', gap: 8, alignItems: 'center',
          fontFamily: '"Rajdhani",sans-serif', fontSize: 10,
          opacity: 0,
          animation: show ? 'unit-summon-label 0.4s ease-out 0.4s both' : 'none',
        }}>
          <span style={{ color: fac.primary, letterSpacing: '0.12em', fontWeight: 700 }}>
            {unit.faction}
          </span>
          <span style={{ color: '#3a3a5a' }}>·</span>
          <span style={{ color: rar, letterSpacing: '0.06em' }}>{unit.rarity}</span>
        </div>

        {/* Per-card motto (G1) */}
        <div style={{
          fontFamily: '"Rajdhani",sans-serif', fontWeight: 700, fontSize: 9,
          color: kwFx?.color ?? fac.primary, letterSpacing: '0.22em',
          textShadow: `0 0 10px ${kwFx?.color ?? fac.primary}88`,
          opacity: 0,
          animation: show ? 'unit-summon-label 0.4s ease-out 0.52s both' : 'none',
          maxWidth: 200, textAlign: 'center',
        }}>{motto}</div>

        {/* Keyword badges (G2) */}
        {(unit.keywords ?? []).length > 0 && (
          <div style={{
            display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center',
            opacity: 0,
            animation: show ? 'unit-summon-label 0.3s ease-out 0.62s both' : 'none',
          }}>
            {(unit.keywords ?? []).slice(0, 3).map(kw => {
              const fx = KEYWORD_SUMMON_FX[kw];
              if (!fx) return null;
              return (
                <div key={kw} style={{
                  padding: '2px 7px', borderRadius: 20,
                  border: `1px solid ${fx.color}55`,
                  background: `${fx.color}18`,
                  fontSize: 8, fontFamily: '"Rajdhani",sans-serif',
                  fontWeight: 700, color: fx.color, letterSpacing: '0.06em',
                }}>{fx.emoji[0]} {kw.toUpperCase()}</div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slot label */}
      <div style={{
        position: 'absolute', bottom: 28, left: 0, right: 0, textAlign: 'center',
        fontFamily: '"Rajdhani",sans-serif', fontSize: 10,
        letterSpacing: '0.3em', color: '#3a3a5a',
        opacity: 0,
        animation: show ? 'unit-summon-slot 0.3s ease-out 0.6s both' : 'none',
      }}>
        ▶ INVOCANDO {slotLabel}
      </div>

      {/* Bottom glow bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, transparent, ${fac.primary}, transparent)`,
        opacity: 0.6,
      }} />
    </div>
  );
}

// ─── Forge Ascension Overlay (2s cinematic) ────────────────────────────────────
function ForgeAscensionOverlay({ champion, onDone }: { champion: BattleUnit; onDone: () => void }) {
  useEffect(() => {
    try { (AudioEngine as any).sfxLevelUp?.(); } catch { /* ok */ }
    const t = setTimeout(onDone, 2200);
    return () => clearTimeout(t);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 55,
      background: 'rgba(2,2,8,0.88)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      animation: 'modal-overlay-in 0.3s ease-out both',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes ascension-shimmer {
          0%,100% { opacity: 0.6; }
          50% { opacity: 1; }
        }
        @keyframes ascension-title {
          0%   { transform: scale(0.7); opacity: 0; letter-spacing: 0.4em; }
          60%  { transform: scale(1.05); opacity: 1; letter-spacing: 0.2em; }
          100% { transform: scale(1); opacity: 1; letter-spacing: 0.2em; }
        }
        @keyframes ascension-burst {
          0%   { transform: scale(0); opacity: 1; }
          100% { transform: scale(4); opacity: 0; }
        }
      `}</style>

      {/* Gold burst rings */}
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          width: 100, height: 100, borderRadius: '50%',
          border: '3px solid #ffd700',
          animation: `ascension-burst 1.2s ease-out ${i * 0.25}s both`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{ fontSize: 64, filter: 'drop-shadow(0 0 24px #ffd700)', marginBottom: 16 }}>🌟</div>

      <div style={{
        fontFamily: '"Cinzel Decorative",serif',
        fontSize: 'clamp(18px,4vw,30px)',
        fontWeight: 900, color: '#ffd700',
        textShadow: '0 0 40px #ffd700, 0 0 80px rgba(255,215,0,0.5)',
        animation: 'ascension-title 0.6s cubic-bezier(0.22,1,0.36,1) 0.2s both',
        textAlign: 'center', letterSpacing: '0.2em',
      }}>FORGE ASCENSION</div>

      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 13,
        color: '#e8b84b', marginTop: 8,
        textShadow: '0 0 16px #e8b84b88',
        textAlign: 'center',
      }}>{champion.name} ha trascendido</div>

      <div style={{
        fontFamily: '"Rajdhani",sans-serif', fontSize: 11,
        color: '#ffd70088', marginTop: 6,
        letterSpacing: '0.1em',
      }}>+20% ATK · Aura Dorada Activa</div>
    </div>
  );
}

// ─── Champion Death Screen (4.0s, multi-stage) ────────────────────────────────
function ChampionDeathScreen({ champion }: { champion: BattleUnit }) {
  const rar = RARITY_COLOR[champion.rarity] ?? '#8b8b9e';
  const [stage, setStage] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setStage(1), 400);
    const t2 = setTimeout(() => setStage(2), 1200);
    const t3 = setTimeout(() => setStage(3), 2400);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(3,3,10,0.97)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(8px)',
    }}>
      <style>{`
        @keyframes champ-death-shake {
          0%,100%{transform:translateX(0)}
          10%{transform:translateX(-12px) rotate(-2deg)}
          25%{transform:translateX(10px) rotate(1deg)}
          40%{transform:translateX(-8px) rotate(-1deg)}
          55%{transform:translateX(8px) rotate(2deg)}
          70%{transform:translateX(-5px)}
          85%{transform:translateX(5px)}
        }
        @keyframes champ-death-ring {
          0%   { transform:scale(0); opacity:1; border-width:4px; }
          50%  { opacity:0.6; }
          100% { transform:scale(4); opacity:0; border-width:1px; }
        }
        @keyframes champ-death-fall {
          0%   { transform:translateY(0) scale(1); opacity:1; filter:grayscale(0); }
          40%  { transform:translateY(-10px) scale(1.05); opacity:1; filter:grayscale(0.3); }
          100% { transform:translateY(20px) scale(0.9); opacity:0.2; filter:grayscale(1); }
        }
        @keyframes champ-death-text-in {
          0%   { transform:translateY(24px) scale(0.9); opacity:0; }
          100% { transform:translateY(0) scale(1); opacity:1; }
        }
        @keyframes champ-death-crack {
          0%   { clip-path:inset(0 100% 0 0); opacity:0; }
          100% { clip-path:inset(0 0% 0 0); opacity:1; }
        }
        @keyframes champ-death-screen-flash {
          0%   { opacity:0; }
          20%  { opacity:0.6; }
          100% { opacity:0; }
        }
      `}</style>

      {/* Screen flash on stage 1 */}
      {stage >= 1 && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `radial-gradient(ellipse at 50% 50%, ${rar}44, transparent 70%)`,
          animation: 'champ-death-screen-flash 0.8s ease-out both',
          pointerEvents: 'none', zIndex: 1,
        }} />
      )}

      {/* Expanding rings */}
      {stage >= 1 && [0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute', zIndex: 2,
          width: 120, height: 120, borderRadius: '50%',
          border: `3px solid ${rar}`,
          animation: `champ-death-ring 1.5s ease-out ${i * 0.2}s both`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Skull icon */}
      <div style={{
        fontSize: 72, zIndex: 3, position: 'relative',
        animation: stage >= 1 ? 'champ-death-fall 1.6s ease-in-out 0.4s both' : 'none',
        filter: `drop-shadow(0 0 30px ${rar}aa)`,
        marginBottom: 24,
      }}>💀</div>

      {/* CAMPEÓN CAÍDO title */}
      {stage >= 2 && (
        <div style={{
          textAlign: 'center', zIndex: 3,
          animation: 'champ-death-text-in 0.6s cubic-bezier(0.22,1,0.36,1) both',
        }}>
          <div style={{
            fontFamily: '"Cinzel Decorative",serif',
            fontSize: 'clamp(20px,5vw,32px)',
            fontWeight: 900, color: '#e84040',
            textShadow: '0 0 40px rgba(232,64,64,0.9), 0 0 80px rgba(232,64,64,0.4)',
            marginBottom: 8, letterSpacing: '0.1em',
            animation: 'champ-death-shake 0.8s ease-in-out 0.2s both',
          }}>CAMPEÓN CAÍDO</div>

          <div style={{
            fontFamily: '"Cinzel",serif',
            fontSize: 16, color: rar,
            textShadow: `0 0 20px ${rar}88`,
            marginBottom: 4,
          }}>{champion.name}</div>
        </div>
      )}

      {/* Final message */}
      {stage >= 3 && (
        <div style={{
          textAlign: 'center', zIndex: 3,
          animation: 'champ-death-text-in 0.5s ease-out both',
        }}>
          <div style={{
            fontFamily: '"Rajdhani",sans-serif',
            fontSize: 12, color: '#6a6a8a',
            textAlign: 'center', marginTop: 8, letterSpacing: '0.1em',
          }}>La Forja apaga su fuego cuando el Campeón cae.</div>

          {/* Faction orbs */}
          <div style={{
            display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20,
          }}>
            {[...Array(5)].map((_, i) => (
              <div key={i} style={{
                width: 6, height: 6, borderRadius: '50%',
                background: rar, opacity: 1 - i * 0.18,
                animation: `charge-orb-glow ${1.2 + i * 0.2}s ease-in-out infinite`,
                boxShadow: `0 0 8px ${rar}`,
              }} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Reserve panel (top 3 only) ────────────────────────────────────────────────
function ReservePanel({
  reserve, onSelectReserve, awaitingSlot,
}: {
  reserve: BattleUnit[];
  onSelectReserve: (unit: BattleUnit, slotIdx: number) => void;
  awaitingSlot: FormationSlot | null;
}) {
  if (!awaitingSlot || reserve.length === 0) return null;
  const { primary, glow } = SLOT_COLORS[awaitingSlot];
  // Show only top 3 as per plan spec
  const top3 = reserve.slice(0, 3);

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 40,
      background: 'rgba(3,3,10,0.95)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 16, padding: 20, backdropFilter: 'blur(6px)',
      animation: 'modal-overlay-in 0.3s ease-out both',
    }}>
      <style>{`
        @keyframes reserve-card-enter {
          0%   { transform: translateY(20px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 16, color: primary,
        textShadow: `0 0 20px ${glow}`, letterSpacing: '0.1em', textAlign: 'center',
      }}>
        {SLOT_META[awaitingSlot].icon} Selecciona reemplazo para {SLOT_META[awaitingSlot].label}
      </div>

      <div style={{
        fontSize: 10, color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif',
        letterSpacing: '0.1em', textAlign: 'center', marginTop: -8,
      }}>
        Top 3 de tu Reserva · {reserve.length} carta{reserve.length !== 1 ? 's' : ''} restante{reserve.length !== 1 ? 's' : ''}
      </div>

      <div style={{
        display: 'flex', gap: 16, justifyContent: 'center',
      }}>
        {top3.map((u, i) => {
          const rar = RARITY_COLOR[u.rarity] ?? '#8b8b9e';
          return (
            <div
              key={u.id}
              onClick={() => onSelectReserve(u, i)}
              style={{
                width: 110, borderRadius: 12,
                border: `2px solid ${rar}66`,
                background: `linear-gradient(160deg,${rar}18,#0a0a14)`,
                cursor: 'pointer', overflow: 'hidden',
                transition: 'all 0.18s ease',
                boxShadow: `0 4px 20px rgba(0,0,0,0.6), 0 0 0 0 ${rar}`,
                animation: `reserve-card-enter 0.4s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s both`,
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'translateY(-6px) scale(1.06)';
                el.style.boxShadow = `0 8px 30px rgba(0,0,0,0.7), 0 0 20px ${rar}66`;
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLDivElement;
                el.style.transform = 'none';
                el.style.boxShadow = '0 4px 20px rgba(0,0,0,0.6)';
              }}
            >
              {/* Image */}
              <div style={{
                height: 80,
                background: u.image_url
                  ? `url(${u.image_url}) center/cover no-repeat`
                  : `linear-gradient(160deg,${rar}22,#0a0a14)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, position: 'relative',
              }}>
                {!u.image_url && '⚔️'}
                {/* Rarity badge */}
                <div style={{
                  position: 'absolute', top: 4, right: 4,
                  background: 'rgba(0,0,0,0.85)', border: `1px solid ${rar}55`,
                  borderRadius: 4, padding: '1px 5px',
                  fontSize: 6, fontWeight: 800, color: rar,
                  fontFamily: '"Rajdhani",sans-serif',
                }}>{u.rarity.slice(0,3).toUpperCase()}</div>
              </div>

              {/* Info */}
              <div style={{ padding: '7px 9px', background: 'rgba(3,3,12,0.95)' }}>
                <div style={{
                  fontSize: 9, color: '#eee', fontFamily: '"Cinzel",serif',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4,
                }}>{u.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800, marginBottom: 4 }}>
                  <span style={{ color: '#ff6b6b' }}>⚔{u.atk}</span>
                  <span style={{ color: '#4a9eff' }}>🛡{u.def}</span>
                  <span style={{ color: '#3ddc84' }}>❤{u.hp}</span>
                </div>
                {/* Mini HP bar */}
                <div style={{ height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
                  <div style={{
                    height: '100%',
                    width: `${(u.hp / u.max_hp) * 100}%`,
                    background: `linear-gradient(90deg,#3ddc84,#3ddc84bb)`,
                    borderRadius: 2,
                  }} />
                </div>
                {/* Keywords */}
                {u.keywords && u.keywords.length > 0 && (
                  <div style={{ marginTop: 3, fontSize: 7, color: '#8888aa', fontFamily: '"Rajdhani",sans-serif' }}>
                    {u.keywords.slice(0, 2).join(' · ')}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{
        fontSize: 10, color: '#4a4a6a', fontFamily: '"Rajdhani",sans-serif',
        letterSpacing: '0.1em', textAlign: 'center', maxWidth: 340,
      }}>
        Elige sabiamente — las otras {reserve.length - Math.min(3, reserve.length)} cartas vuelven al fondo de la reserva
      </div>
    </div>
  );
}

// ─── Forge Barrier (Plan §3 — THE FORGE BARRIER) ─────────────────────────────
// Línea de energía dinámica que divide las formaciones. Cambia de color según
// quién va ganando y pulsa más rápido cuando el Campeón está en HP crítico.
function ForgeBarrier({
  playerWinning, criticalHp, faction,
}: { playerWinning: boolean; criticalHp: boolean; faction: string }) {
  const winCol  = playerWinning ? '#3ddc84' : '#e84040';
  const fStyle  = getFactionStyle(faction);
  const pulseDur = criticalHp ? '0.45s' : '1.4s';

  return (
    <div style={{
      position: 'relative', zIndex: 2,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '5px 12px',
    }}>
      {/* Left energy line */}
      <div style={{
        flex: 1, height: 2,
        background: `linear-gradient(90deg, transparent 0%, ${winCol}55 40%, ${winCol} 100%)`,
        boxShadow: `0 0 8px ${winCol}44`,
        animation: `forge-barrier-glow ${pulseDur} ease-in-out infinite`,
        borderRadius: 2,
      }} />

      {/* Central rune node */}
      <div style={{
        position: 'relative', width: 38, height: 38, borderRadius: '50%',
        border: `2px solid ${winCol}88`,
        background: `radial-gradient(circle, ${fStyle.glow.replace('0.8', '0.15')} 0%, rgba(4,4,12,0.95) 70%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 0 18px ${winCol}55, inset 0 0 10px ${fStyle.primary}22`,
        flexShrink: 0,
        animation: `forge-barrier-rune ${pulseDur} ease-in-out infinite`,
      }}>
        <span style={{ fontSize: 16, filter: `drop-shadow(0 0 5px ${winCol})` }}>⚔</span>
        {/* Orbiting ring */}
        <div style={{
          position: 'absolute', inset: -5,
          border: `1px solid ${winCol}33`,
          borderRadius: '50%',
          animation: 'forge-barrier-orbit 3.5s linear infinite',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Right energy line */}
      <div style={{
        flex: 1, height: 2,
        background: `linear-gradient(90deg, ${winCol} 0%, ${winCol}55 60%, transparent 100%)`,
        boxShadow: `0 0 8px ${winCol}44`,
        animation: `forge-barrier-glow ${pulseDur} ease-in-out infinite`,
        borderRadius: 2,
      }} />

      {/* Critical flash overlay */}
      {criticalHp && (
        <div style={{
          position: 'absolute', inset: 0,
          background: `linear-gradient(90deg, transparent 20%, ${winCol}11 50%, transparent 80%)`,
          animation: 'forge-barrier-critical 0.45s ease-in-out infinite',
          pointerEvents: 'none',
        }} />
      )}
    </div>
  );
}

// ─── Reserve Stack (Plan §3 — RESERVE STACK) ──────────────────────────────────
// Mazo face-down visible con contador. Cambia a rojo al quedar < 5 cartas.
function ReserveStack({ count }: { count: number }) {
  const critical = count < 5;
  const empty    = count === 0;
  const col      = empty ? '#4a4a6a' : critical ? '#e84040' : '#4a9eff';
  const layers   = empty ? 0 : Math.min(count, 4);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    }}>
      {/* Stacked cards face-down */}
      <div style={{ position: 'relative', width: 30, height: 42 }}>
        {layers === 0 ? (
          <div style={{
            width: 26, height: 36, borderRadius: 4,
            border: '1px dashed rgba(255,255,255,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'rgba(255,255,255,0.15)',
          }}>∅</div>
        ) : Array.from({ length: layers }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            width: 24, height: 34, borderRadius: 4,
            border: `1px solid ${col}44`,
            background: critical
              ? `linear-gradient(155deg, rgba(232,64,64,0.18), rgba(15,3,3,0.92))`
              : `linear-gradient(155deg, rgba(74,158,255,0.12), rgba(3,3,12,0.92))`,
            top: (layers - 1 - i) * 2,
            left: (layers - 1 - i) * 2,
            boxShadow: i === 0 ? '0 2px 8px rgba(0,0,0,0.7)' : 'none',
          }}>
            {/* Back pattern */}
            <div style={{
              position: 'absolute', inset: 2, borderRadius: 2,
              background: `repeating-linear-gradient(45deg, ${col}0a 0px, ${col}0a 2px, transparent 2px, transparent 6px)`,
            }} />
          </div>
        ))}
      </div>

      {/* Count badge */}
      <div style={{
        fontSize: 9, fontFamily: '"IBM Plex Mono",monospace',
        fontWeight: 700, color: col, letterSpacing: '0.04em',
        textShadow: critical && !empty ? `0 0 8px ${col}` : 'none',
        animation: critical && !empty ? 'forge-barrier-glow 0.8s ease-in-out infinite' : 'none',
      }}>
        {count}{critical && !empty ? '⚠' : '▼'}
      </div>

      <div style={{
        fontSize: 7, color: '#3a3a5a', fontFamily: '"Rajdhani",sans-serif',
        letterSpacing: '0.08em', textTransform: 'uppercase',
      }}>RESERVA</div>
    </div>
  );
}

// ─── Pure Formation Badge ──────────────────────────────────────────────────────
function PureFormationBadge({ faction }: { faction: string }) {
  const fStyle = getFactionStyle(faction);
  return (
    <div style={{
      fontSize: 8, fontFamily: '"Cinzel",serif',
      color: fStyle.primary, letterSpacing: '0.12em',
      padding: '2px 8px', borderRadius: 20,
      border: `1px solid ${fStyle.primary}55`,
      background: `${fStyle.glow.replace('0.8)', '0.08)')}`,
      boxShadow: `0 0 10px ${fStyle.primary}33`,
      animation: 'pure-bonus-pulse 2s ease-in-out infinite',
      whiteSpace: 'nowrap',
    }}>
      ✦ FORMACIÓN PURA +15%
    </div>
  );
}

// ─── H4: ForgeFormation Post-Battle Scoreboard ────────────────────────────────
function ForgeFormationScoreboard({
  result, formation, playerName, opponentName, onDismiss,
}: {
  result: ReturnType<typeof simulateFormationBattle>;
  formation: FormationState;
  playerName: string;
  opponentName: string;
  onDismiss: () => void;
}) {
  const won = result.you_won;
  const turns = result.turns ?? [];
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Stats
  let playerDmg = 0; let oppDmg = 0; let playerCrits = 0; let playerKills = 0;
  for (const t of turns) {
    if (t.atk_side === 'a') { playerDmg += t.damage; if (t.is_crit) playerCrits++; if (t.is_kill) playerKills++; }
    else { oppDmg += t.damage; }
  }
  const champHpPct  = formation.champion.max_hp > 0 ? formation.champion.hp / formation.champion.max_hp : 0;
  const aliveAllies = (['vanguard', 'sentinel'] as FormationSlot[]).filter(
    s => { const u = formation[s] as BattleUnit | null; return u && u.alive !== false && u.hp > 0; }
  ).length;
  const totalUnits = 3;
  const surviveCount = (formation.champion.hp > 0 ? 1 : 0) + aliveAllies;

  const theme = won
    ? { primary: '#e8b84b', glow: 'rgba(232,184,75,0.7)', label: '¡VICTORIA!', emoji: '🏆', bg: 'radial-gradient(ellipse at 50% 0%,rgba(232,184,75,0.22) 0%,rgba(3,3,10,0.98) 60%)' }
    : { primary: '#e84040', glow: 'rgba(232,64,64,0.6)', label: 'DERROTA',     emoji: '💀', bg: 'radial-gradient(ellipse at 50% 0%,rgba(232,64,64,0.18) 0%,rgba(3,3,10,0.98) 60%)' };

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 45,
      background: theme.bg,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '20px 16px',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.4s ease',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes score-row-in {
          0%   { transform: translateX(-16px); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        @keyframes score-hero-in {
          0%   { transform: scale(0.7) translateY(16px); opacity: 0; filter: blur(8px); }
          100% { transform: scale(1) translateY(0); opacity: 1; filter: blur(0); }
        }
        @keyframes score-bar-fill {
          0%   { width: 0%; }
          100% { width: var(--bar-w, 50%); }
        }
      `}</style>

      {/* Trophy/skull */}
      <div style={{
        fontSize: 56, lineHeight: 1, marginBottom: 8,
        filter: `drop-shadow(0 0 24px ${theme.glow})`,
        animation: 'score-hero-in 0.5s cubic-bezier(0.22,1,0.36,1) 0.1s both',
      }}>{theme.emoji}</div>

      {/* Result headline */}
      <div style={{
        fontFamily: '"Cinzel Decorative",serif', fontSize: 'clamp(20px,5vw,30px)',
        fontWeight: 900, color: theme.primary, letterSpacing: '0.14em',
        textShadow: `0 0 24px ${theme.glow}, 0 0 48px ${theme.glow}`,
        marginBottom: 4,
        animation: 'score-hero-in 0.5s cubic-bezier(0.22,1,0.36,1) 0.2s both',
      }}>{theme.label}</div>

      {/* Champion name */}
      <div style={{
        fontFamily: '"Cinzel",serif', fontSize: 11, color: '#8888aa',
        letterSpacing: '0.12em', marginBottom: 16,
        animation: 'score-hero-in 0.5s ease 0.3s both',
      }}>
        {formation.champion.name} · {won ? '¡CAMPEÓN INVICTO!' : 'El campeón ha caído'}
      </div>

      {/* Stats box */}
      <div style={{
        width: '100%', maxWidth: 320,
        background: 'rgba(5,5,16,0.8)',
        border: `1px solid ${theme.primary}22`,
        borderRadius: 12, overflow: 'hidden',
        backdropFilter: 'blur(8px)',
        marginBottom: 14,
      }}>
        {/* Stats header */}
        <div style={{
          padding: '6px 14px',
          background: `linear-gradient(90deg,${theme.primary}18,transparent)`,
          borderBottom: `1px solid ${theme.primary}22`,
          fontFamily: '"Cinzel",serif', fontSize: 8,
          color: theme.primary, letterSpacing: '0.2em',
        }}>📊 ESTADÍSTICAS DE BATALLA</div>

        {[
          { label: 'Turnos jugados',     val: turns.length, delay: 0.35 },
          { label: 'Daño infligido',     val: Math.round(playerDmg), delay: 0.42, hi: true },
          { label: 'Daño recibido',      val: Math.round(oppDmg), delay: 0.48 },
          { label: 'Golpes críticos',    val: playerCrits, delay: 0.54 },
          { label: 'Bajas enemigas',     val: playerKills, delay: 0.60 },
          { label: 'Unidades supervivientes', val: `${surviveCount} / ${totalUnits}`, delay: 0.66, hi: won },
        ].map((row, i) => (
          <div key={i} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '7px 14px',
            borderBottom: i < 5 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            animation: `score-row-in 0.35s ease-out ${row.delay}s both`,
          }}>
            <span style={{ fontSize: 10, color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.06em' }}>
              {row.label}
            </span>
            <span style={{
              fontSize: 12, fontFamily: '"IBM Plex Mono",monospace',
              fontWeight: 700,
              color: row.hi ? theme.primary : '#c0c0e0',
              textShadow: row.hi ? `0 0 10px ${theme.glow}` : 'none',
            }}>{row.val}</span>
          </div>
        ))}
      </div>

      {/* Champion HP bar */}
      <div style={{
        width: '100%', maxWidth: 320, marginBottom: 16,
        animation: 'score-row-in 0.35s ease-out 0.72s both',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 9, color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.08em' }}>
            HP FINAL — {formation.champion.name}
          </span>
          <span style={{ fontSize: 9, color: hpCol(champHpPct), fontFamily: '"IBM Plex Mono",monospace' }}>
            {formation.champion.hp} / {formation.champion.max_hp}
          </span>
        </div>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{
            height: '100%', borderRadius: 3,
            background: `linear-gradient(90deg,${hpCol(champHpPct)},${hpCol(champHpPct)}bb)`,
            width: `${champHpPct * 100}%`,
            boxShadow: `0 0 8px ${hpCol(champHpPct)}88`,
            transition: 'width 0.8s cubic-bezier(0.22,1,0.36,1)',
          }} />
        </div>
      </div>

      {/* VS row */}
      <div style={{
        display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16,
        animation: 'score-row-in 0.35s ease-out 0.78s both',
      }}>
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: 'rgba(74,158,255,0.1)', border: '1px solid rgba(74,158,255,0.2)',
          fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
          color: '#4a9eff', letterSpacing: '0.1em',
        }}>🛡 {playerName}</div>
        <span style={{ color: '#3a3a5a', fontSize: 10 }}>vs</span>
        <div style={{
          padding: '4px 12px', borderRadius: 20,
          background: 'rgba(232,64,64,0.1)', border: '1px solid rgba(232,64,64,0.2)',
          fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
          color: '#e84040', letterSpacing: '0.1em',
        }}>⚔ {opponentName}</div>
      </div>

      {/* Action button */}
      <button
        onClick={onDismiss}
        style={{
          padding: '12px 32px', borderRadius: 12,
          background: `linear-gradient(135deg,${theme.primary},${theme.primary}88)`,
          border: `1px solid ${theme.primary}66`,
          color: '#0a0a12', fontFamily: '"Cinzel",serif',
          fontWeight: 700, fontSize: 13, cursor: 'pointer',
          letterSpacing: '0.06em',
          boxShadow: `0 4px 20px ${theme.glow}`,
          animation: 'score-hero-in 0.4s ease-out 0.85s both',
        }}
      >
        {won ? '🏆 Continuar' : '↩ Volver al lobby'}
      </button>
    </div>
  );
}

// ─── H3: Rich Terrain Particles ───────────────────────────────────────────────
const RICH_PARTICLES: Record<string, {
  colors: string[]; sizes: number[]; speeds: number[]; shapes: ('orb'|'spark'|'wisp')[];
}> = {
  Guerrero: {
    colors: ['#ff6b2b','#e84040','#ff9a3c','#ffd700'],
    sizes:  [4,3,6,2,5,3,4,2,5],
    speeds: [1.8,2.4,1.5,3.0,2.0,2.6,1.9,3.2,2.2],
    shapes: ['spark','orb','spark','spark','orb','spark','spark','orb','spark'],
  },
  Mago: {
    colors: ['#4a9eff','#a855f7','#00cec9','#6c5ce7','#74b9ff'],
    sizes:  [5,3,4,6,2,4,3,5,4],
    speeds: [2.5,3.5,2.0,4.0,3.0,2.8,3.3,2.1,3.7],
    shapes: ['orb','orb','wisp','orb','orb','wisp','orb','orb','wisp'],
  },
  'Paladín': {
    colors: ['#ffd700','#fffbe6','#e8b84b','#fff5b4','#f8c52d'],
    sizes:  [3,5,2,4,3,6,2,4,3],
    speeds: [2.0,2.8,1.6,3.2,2.4,1.8,3.0,2.2,2.6],
    shapes: ['spark','orb','spark','spark','orb','spark','spark','spark','orb'],
  },
  'Pícaro': {
    colors: ['#a855f7','#6c5ce7','#2d3436','#9b59b6','#7f8c8d'],
    sizes:  [4,3,5,2,4,3,6,2,5],
    speeds: [3.5,4.5,3.0,5.0,3.8,4.2,2.8,5.5,4.0],
    shapes: ['wisp','wisp','orb','wisp','wisp','orb','wisp','wisp','orb'],
  },
};
const DEFAULT_RICH_PARTICLES = RICH_PARTICLES['Mago'];

const PARTICLE_POSITIONS = [
  { x: 8, y: 90 }, { x: 22, y: 85 }, { x: 38, y: 92 }, { x: 55, y: 88 },
  { x: 70, y: 93 }, { x: 82, y: 87 }, { x: 92, y: 91 }, { x: 15, y: 78 },
  { x: 48, y: 82 },
];

function RichTerrainParticles({ faction }: { faction: string }) {
  const cfg = RICH_PARTICLES[faction] ?? DEFAULT_RICH_PARTICLES;
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none', overflow: 'hidden' }}>
      {cfg.sizes.map((sz, i) => {
        const color  = cfg.colors[i % cfg.colors.length];
        const speed  = cfg.speeds[i] ?? 2.5;
        const shape  = cfg.shapes[i] ?? 'orb';
        const pos    = PARTICLE_POSITIONS[i] ?? { x: 50, y: 90 };
        const delay  = (i * 0.37) % 3.2;
        const isOrb  = shape === 'orb';
        const isWisp = shape === 'wisp';
        const br     = isOrb ? '50%' : isWisp ? '40% 60% 50% 40%' : '2px';
        const blur   = isOrb ? `blur(${sz * 0.8}px)` : isWisp ? 'blur(3px)' : 'blur(1px)';
        const driftX = isWisp ? `${(i % 3 - 1) * 18}px` : isOrb ? `${(i % 3 - 1) * 8}px` : '0px';
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${pos.x}%`,
            top: `${pos.y}%`,
            width: sz, height: sz,
            borderRadius: br,
            background: color,
            boxShadow: `0 0 ${sz * 2}px ${color}cc, 0 0 ${sz * 4}px ${color}55`,
            filter: blur,
            opacity: 0,
            animation: `rich-ptcl-${faction.replace(/[^a-z]/gi,'').toLowerCase()} ${speed}s ease-out ${delay}s infinite`,
            // Inline keyframe via style; use CSS var trick
            ['--dx' as string]: driftX,
          }} />
        );
      })}
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

type BoardPhase = 'champion_summon' | 'intro' | 'battle' | 'reserve' | 'ascension' | 'champion_dead' | 'done';

export function ForgeFormationBoard({
  initialFormation, playerName = 'Tú', opponentName = 'Rival',
  difficulty, onComplete, onDismiss,
}: ForgeFormationBoardProps) {
  const [formation, setFormation]     = useState<FormationState>(initialFormation);
  const [phase, setPhase]             = useState<BoardPhase>('champion_summon');
  const [awaitingSlot, setAwaitingSlot] = useState<FormationSlot | null>(null);
  const [turnIdx, setTurnIdx]         = useState(0);
  const [totalTurns]                  = useState(20);
  const [log, setLog]                 = useState<string[]>([]);
  const [isAutoPlay, setIsAutoPlay]   = useState(false);
  const [hitFlash, setHitFlash]       = useState<FormationSlot | null>(null);

  // ─── Rage / Ascension state ──────────────────────────────────────────────────
  const [rageStacks, setRageStacks]     = useState(0);       // +5% ATK each, max 5
  const [champKills, setChampKills]     = useState(0);       // kills by champion
  const [ascensionActive, setAscensionActive] = useState(false);
  const [showAscensionOverlay, setShowAscensionOverlay] = useState(false);

  // ─── B1: Unit summon cinematic for reserve replacements ──────────────────────
  const [summoningUnit, setSummoningUnit] = useState<BattleUnit | null>(null);
  const [summoningSlot, setSummoningSlot] = useState<FormationSlot | null>(null);
  const pendingReserveRef = useRef<{ unit: BattleUnit; slot: FormationSlot } | null>(null);

  const autoRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const musicPhaseRef = useRef<'none' | 'intro' | 'mid' | 'last_stand'>('none');
  const prevKillsRef  = useRef(0);
  const prevDeathsRef = useRef(0);

  // Pre-compute battle result once
  const battleResult = useRef(simulateFormationBattle(initialFormation, difficulty));
  const battleTurns  = battleResult.current.turns ?? [];

  // ─── Summon cinematic done → show intro ──────────────────────────────────────
  const handleSummonDone = useCallback(() => {
    setPhase('intro');
    const t = setTimeout(() => setPhase('battle'), 1200);
    return () => clearTimeout(t);
  }, []);

  // ─── Cleanup music on unmount ────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      try { (AudioEngine as any).stopCombatMusic?.(); } catch { /* silent */ }
    };
  }, []);

  // ─── Combat phase music ───────────────────────────────────────────────────────
  useEffect(() => {
    if (phase === 'battle' && musicPhaseRef.current === 'none') {
      musicPhaseRef.current = 'intro';
      try { (AudioEngine as any).startCombatMusic?.('intro'); } catch { /* silent */ }
    }
    if ((phase === 'done' || phase === 'champion_dead') && musicPhaseRef.current !== 'none') {
      musicPhaseRef.current = 'none';
      try { (AudioEngine as any).stopCombatMusic?.(); } catch { /* silent */ }
    }
  }, [phase]);

  const totalBattleTurns = battleResult.current.turns?.length ?? totalTurns;

  useEffect(() => {
    if (phase !== 'battle' || totalBattleTurns <= 0) return;
    const pct = turnIdx / totalBattleTurns;
    if (pct >= 0.75 && musicPhaseRef.current === 'mid') {
      musicPhaseRef.current = 'last_stand';
      try { (AudioEngine as any).startCombatMusic?.('last_stand'); } catch { /* silent */ }
    } else if (pct >= 0.40 && musicPhaseRef.current === 'intro') {
      musicPhaseRef.current = 'mid';
      try { (AudioEngine as any).startCombatMusic?.('mid'); } catch { /* silent */ }
    }
  }, [turnIdx, phase, totalBattleTurns]);

  // ─── Auto-play interval ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAutoPlay || phase !== 'battle') return;
    autoRef.current = setInterval(() => advanceTurn(), 900);
    return () => { if (autoRef.current) clearInterval(autoRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAutoPlay, phase, turnIdx]);

  const addLog = useCallback((msg: string) => {
    setLog(prev => [msg, ...prev].slice(0, 10));
  }, []);

  const advanceTurn = useCallback(() => {
    if (phase !== 'battle') return;

    const turnData = battleTurns[turnIdx] ?? null;

    if (!turnData) {
      // Battle over
      const won = battleResult.current.you_won ?? false;
      const championDied = battleResult.current.championDied;

      if (championDied) {
        setPhase('champion_dead');
        try { (AudioEngine as any).sfxKillV2?.(); } catch { /* ok */ }
        setTimeout(() => { setPhase('done'); onComplete(false, true); }, 4200);
      } else {
        setPhase('done');
        try {
          if (won) (AudioEngine as any).sfxLevelUp?.();
          else     (AudioEngine as any).sfxKillV2?.();
        } catch { /* ok */ }
        setTimeout(() => onComplete(won, false), 600);
      }
      return;
    }

    // Animate hit
    const atkSide: 'player' | 'opponent' = turnData.atk_side === 'a' ? 'player' : 'opponent';
    setHitFlash(atkSide === 'player' ? 'sentinel' : 'vanguard');
    setTimeout(() => setHitFlash(null), 280);

    const dmg    = turnData.damage ?? 0;
    const isCrit = turnData.is_crit;
    const isKill = turnData.is_kill;

    const atkName = atkSide === 'player'
      ? (formation.vanguard?.name ?? formation.champion.name)
      : 'Enemigo';
    const defSlot: FormationSlot = atkSide === 'player'
      ? 'sentinel'
      : (formation.vanguard?.alive ? 'vanguard' : 'champion');
    const defName = defSlot === 'champion'
      ? formation.champion.name
      : (formation[defSlot]?.name ?? formation.champion.name);

    addLog(`${isCrit ? '💥' : '⚔️'} ${atkName} → ${defName} [${dmg}${isCrit ? ' CRIT' : ''}${isKill ? ' 💀' : ''}]`);

    try {
      if (isKill)      (AudioEngine as any).sfxKillV2?.();
      else if (isCrit) (AudioEngine as any).sfxCritV2?.();
      else             AudioEngine.sfxCardSelect?.();
    } catch { /* ok */ }

    // ─── Champion Rage: +5% ATK per allied formation card death ─────────────────
    if (isKill && atkSide === 'opponent' && defSlot !== 'champion') {
      const newDeaths = prevDeathsRef.current + 1;
      prevDeathsRef.current = newDeaths;
      const newStacks = Math.min(newDeaths, 5);
      setRageStacks(newStacks);
      addLog(`🔥 RAGE +1 → Campeón gana +${newStacks * 5}% ATK`);
      try { (AudioEngine as any).sfxCritV2?.(); } catch { /* ok */ }
    }

    // ─── Champion kills → Forge Ascension at 3 kills ─────────────────────────────
    if (isKill && atkSide === 'player') {
      const newKills = prevKillsRef.current + 1;
      prevKillsRef.current = newKills;
      setChampKills(newKills);
      if (newKills >= 3 && !ascensionActive) {
        setAscensionActive(true);
        setShowAscensionOverlay(true);
        if (autoRef.current) { clearInterval(autoRef.current); setIsAutoPlay(false); }
        setPhase('ascension');
      }
    }

    setTurnIdx(prev => prev + 1);

    // ─── Reserve replacement check ───────────────────────────────────────────────
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, turnIdx, formation, addLog, onComplete, ascensionActive]);

  // B1: called after UnitSummonCinematic completes
  const handleUnitSummonDone = useCallback(() => {
    const pending = pendingReserveRef.current;
    if (!pending) return;
    pendingReserveRef.current = null;
    setSummoningUnit(null);
    setSummoningSlot(null);
    setFormation(prev => ({
      ...prev,
      [pending.slot]: pending.unit,
      reserve: prev.reserve.filter(u => u.id !== pending.unit.id),
    }));
    addLog(`🔄 ${SLOT_META[pending.slot].label} → ${pending.unit.name} entra al campo`);
    setAwaitingSlot(null);
    setPhase('battle');
  }, [addLog]);

  const handleSelectReserve = useCallback((unit: BattleUnit, _idx: number) => {
    if (!awaitingSlot) return;
    // B1: trigger unit summon cinematic before deploying
    pendingReserveRef.current = { unit, slot: awaitingSlot };
    setSummoningUnit(unit);
    setSummoningSlot(awaitingSlot);
  }, [awaitingSlot]);

  const handleAscensionDone = useCallback(() => {
    setShowAscensionOverlay(false);
    setPhase('battle');
    addLog(`🌟 FORGE ASCENSION — ${formation.champion.name} +20% ATK`);
  }, [addLog, formation.champion.name]);

  const toggleAutoPlay = useCallback(() => {
    if (isAutoPlay) {
      if (autoRef.current) clearInterval(autoRef.current);
      setIsAutoPlay(false);
    } else {
      setIsAutoPlay(true);
    }
  }, [isAutoPlay]);

  const champAlive      = formation.champion.hp > 0 && formation.champion.alive !== false;
  const champProtected  = isChampionProtected(formation);
  const finalFormation  = battleResult.current.finalFormation;
  const progressPct     = Math.min(turnIdx / Math.max(1, totalBattleTurns), 1);

  // ─── Derived for Forge Barrier & terrain ─────────────────────────────────────
  const champFaction    = formation.champion.faction ?? 'default';
  const terrain         = getTerrain(champFaction);

  // ─── H2: Target Lock — derive which opponent slot the player is targeting ────
  const currentTurn = battleTurns[turnIdx];
  const playerIsAttacking = phase === 'battle' && currentTurn?.atk_side === 'a';
  const defenderName = playerIsAttacking ? currentTurn?.defender?.name : null;
  const targetedOpponentSlot = defenderName
    ? (['vanguard', 'champion', 'sentinel'] as FormationSlot[]).find(
        s => (finalFormation[s] as BattleUnit | null)?.name === defenderName
      ) ?? null
    : null;
  // Player is "winning" if they won OR fewer rage stacks (lost fewer allies)
  const playerWinning   = battleResult.current.you_won || rageStacks < 3;
  const criticalHp      = progressPct > 0.75;
  const isPureFormation = hasFormationPureBonus(formation);

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
        @keyframes modal-overlay-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes attack-btn-pulse {
          0%,100% { box-shadow: 0 4px 20px rgba(232,184,75,0.4); }
          50%     { box-shadow: 0 4px 30px rgba(232,184,75,0.7); }
        }
        @keyframes forge-gauge-pulse {
          0%,100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
          50%     { opacity: 0.6; transform: translate(-50%,-50%) scale(1.4); }
        }
        @keyframes rage-frenzy-pulse {
          0%,100% { box-shadow: 0 0 10px rgba(232,64,64,0.4); }
          50%     { box-shadow: 0 0 20px rgba(232,64,64,0.8); }
        }
        @keyframes charge-orb-glow {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.5; }
        }
        @keyframes forge-ascension-pulse {
          0%,100% { box-shadow: 0 0 32px rgba(255,215,0,0.9), 0 0 64px rgba(255,215,0,0.4); }
          50%     { box-shadow: 0 0 48px rgba(255,215,0,1.0), 0 0 96px rgba(255,215,0,0.6); }
        }
        @keyframes forge-barrier-glow {
          0%,100% { opacity: 0.75; }
          50%     { opacity: 1; }
        }
        @keyframes forge-barrier-rune {
          0%,100% { transform: scale(1); }
          50%     { transform: scale(1.12); }
        }
        @keyframes forge-barrier-orbit {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes forge-barrier-critical {
          0%,100% { opacity: 0; }
          50%     { opacity: 1; }
        }
        @keyframes terrain-particle-float {
          0%   { transform: translateY(0px) scale(1); opacity: 0.55; }
          100% { transform: translateY(-55px) scale(0.3); opacity: 0; }
        }
        @keyframes rich-ptcl-guerrero {
          0%   { transform: translateY(0px) translateX(0px) scale(0.6) rotate(0deg); opacity: 0; }
          15%  { opacity: 0.9; }
          85%  { opacity: 0.6; }
          100% { transform: translateY(-90px) translateX(var(--dx,6px)) scale(0.15) rotate(180deg); opacity: 0; }
        }
        @keyframes rich-ptcl-mago {
          0%   { transform: translateY(0px) translateX(0px) scale(0.5); opacity: 0; }
          20%  { opacity: 0.85; }
          80%  { opacity: 0.5; }
          100% { transform: translateY(-70px) translateX(var(--dx,0px)) scale(0.8); opacity: 0; }
        }
        @keyframes rich-ptcl-paladin {
          0%   { transform: translateY(0px) scale(0.4) rotate(0deg); opacity: 0; }
          18%  { opacity: 1; }
          82%  { opacity: 0.7; }
          100% { transform: translateY(-85px) scale(0.1) rotate(90deg); opacity: 0; }
        }
        @keyframes rich-ptcl-picaro {
          0%   { transform: translateY(0px) translateX(0px) scale(1) skewX(0deg); opacity: 0; }
          15%  { opacity: 0.7; }
          85%  { opacity: 0.3; }
          100% { transform: translateY(-50px) translateX(var(--dx,12px)) scale(0.4) skewX(15deg); opacity: 0; }
        }
        @keyframes target-lock-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes target-lock-pulse {
          0%,100% { opacity: 0.8; box-shadow: 0 0 12px rgba(232,64,64,0.7); }
          50%     { opacity: 1;   box-shadow: 0 0 24px rgba(232,64,64,1.0), 0 0 40px rgba(232,64,64,0.4); }
        }
        @keyframes target-lock-scan {
          0%   { transform: translateY(-100%); opacity: 0; }
          20%  { opacity: 0.6; }
          80%  { opacity: 0.4; }
          100% { transform: translateY(100%); opacity: 0; }
        }
        @keyframes target-lock-corner {
          0%   { opacity: 0; transform: scale(0.6); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shield-arc-break {
          0%   { opacity: 0.7; filter: none; }
          25%  { opacity: 1;   filter: hue-rotate(80deg) brightness(3); box-shadow: 0 0 60px rgba(232,64,64,0.9); }
          60%  { opacity: 0.5; filter: hue-rotate(120deg) brightness(1.5); transform: translate(-50%,-50%) scaleX(1.15) scaleY(0.7); }
          100% { opacity: 0;   transform: translate(-50%,-50%) scaleX(1.4) scaleY(0.2); }
        }
        @keyframes shield-arc-pulse {
          0%,100% { box-shadow: 0 -4px 24px rgba(74,158,255,0.25), inset 0 0 20px rgba(74,158,255,0.07); opacity: 0.85; }
          50%     { box-shadow: 0 -8px 40px rgba(74,158,255,0.55), inset 0 0 32px rgba(74,158,255,0.18); opacity: 1; }
        }
        @keyframes shield-label-in {
          0%   { opacity: 0; transform: translate(-50%,-50%) scale(0.8); }
          100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
        }
        @keyframes pure-bonus-pulse {
          0%,100% { box-shadow: 0 0 6px rgba(255,215,0,0.3); }
          50%     { box-shadow: 0 0 14px rgba(255,215,0,0.7); }
        }
      `}</style>

      {/* ── Champion Summon Cinematic (3.5s) ────────────────────────────────── */}
      {phase === 'champion_summon' && (
        <ChampionSummonCinematic
          champion={initialFormation.champion}
          onDone={handleSummonDone}
        />
      )}

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
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TurnIndicator current={turnIdx} total={totalBattleTurns} />
          <ChargeOrbs kills={champKills} ascensionAt={3} />
        </div>
        <button onClick={onDismiss} style={{
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6, color: '#6a6a8a', fontSize: 10, padding: '5px 10px', cursor: 'pointer',
          fontFamily: '"Rajdhani",sans-serif',
        }}>✕ Salir</button>
      </div>

      {/* ── Forge Gauge (enhanced battle progress) ─────────────────────────── */}
      <ForgeGauge progress={progressPct} />

      {/* ── Rage meter row ───────────────────────────────────────────────────── */}
      {rageStacks > 0 && (
        <div style={{
          padding: '4px 16px',
          background: 'rgba(4,4,12,0.95)',
          borderBottom: '1px solid rgba(232,64,64,0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <RageMeter stacks={rageStacks} maxStacks={5} />
        </div>
      )}

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
        {/* ── TERRAIN FACTION background (Plan §3 — "Terrain Faction") ─────── */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: terrain.gradient,
          transition: 'background 1s ease',
        }} />
        {/* Terrain scanlines */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          backgroundImage: `repeating-linear-gradient(0deg, ${terrain.scanlineColor} 0px, ${terrain.scanlineColor} 1px, transparent 1px, transparent 4px)`,
        }} />
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
          background: `radial-gradient(ellipse at 50% 50%, ${terrain.ambientColor} 0%, transparent 70%)`,
        }} />

        {/* H3: Rich Terrain Particles */}
        <RichTerrainParticles faction={champFaction} />

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

        {/* ── Champion Shield Arc (H1: enhanced visual) ─────────────────── */}
        {champAlive && (phase === 'battle' || phase === 'reserve') && (
          <>
          {/* Arc semi-circle */}
          <div style={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 240, height: 120,
            border: champProtected
              ? '2px solid rgba(74,158,255,0.55)'
              : '2px solid rgba(232,64,64,0.3)',
            borderBottom: 'none',
            borderRadius: '120px 120px 0 0',
            pointerEvents: 'none', zIndex: 1,
            transition: 'border-color 0.6s ease',
            animation: champProtected
              ? 'shield-arc-pulse 2.8s ease-in-out infinite'
              : 'shield-arc-break 0.8s ease-out both',
          }} />
          {/* Inner arc glow line */}
          {champProtected && (
            <div style={{
              position: 'absolute', top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 224, height: 112,
              border: '1px solid rgba(74,158,255,0.25)',
              borderBottom: 'none',
              borderRadius: '112px 112px 0 0',
              pointerEvents: 'none', zIndex: 1,
              animation: 'shield-arc-pulse 2.8s ease-in-out 0.4s infinite',
            }} />
          )}
          {/* Guard Active badge — H1: explicit label */}
          {champProtected && (
            <div style={{
              position: 'absolute', top: 'calc(50% - 130px)', left: '50%',
              transform: 'translate(-50%, 0)',
              zIndex: 2, pointerEvents: 'none',
              animation: 'shield-label-in 0.4s ease-out both',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(74,158,255,0.12)',
              border: '1px solid rgba(74,158,255,0.35)',
              backdropFilter: 'blur(4px)',
            }}>
              <span style={{ fontSize: 9 }}>🛡</span>
              <span style={{
                fontSize: 8, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800,
                color: '#4a9eff', letterSpacing: '0.15em',
                textShadow: '0 0 8px rgba(74,158,255,0.7)',
              }}>GUARD ACTIVO</span>
            </div>
          )}
          {/* Champion exposed warning flash */}
          {!champProtected && (
            <div style={{
              position: 'absolute', top: 'calc(50% - 130px)', left: '50%',
              transform: 'translate(-50%, 0)',
              zIndex: 2, pointerEvents: 'none',
              animation: 'shield-label-in 0.3s ease-out both',
              display: 'flex', alignItems: 'center', gap: 4,
              padding: '3px 10px', borderRadius: 20,
              background: 'rgba(232,64,64,0.12)',
              border: '1px solid rgba(232,64,64,0.4)',
            }}>
              <span style={{ fontSize: 9 }}>⚠️</span>
              <span style={{
                fontSize: 8, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800,
                color: '#e84040', letterSpacing: '0.15em',
              }}>CAMPEÓN EXPUESTO</span>
            </div>
          )}
          </>
        )}

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
              {(['vanguard', 'champion', 'sentinel'] as FormationSlot[]).map(s => {
                const u = finalFormation[s] as BattleUnit | null;
                const isTarget = targetedOpponentSlot === s;
                const slotPrimary = SLOT_COLORS[s].primary;
                return (
                  <div key={s} style={{
                    width: 90, minHeight: 130, borderRadius: 10,
                    border: isTarget
                      ? '2px solid rgba(232,64,64,0.9)'
                      : `1px solid ${slotPrimary}33`,
                    background: isTarget
                      ? `linear-gradient(160deg,rgba(232,64,64,0.18),#0a0a14)`
                      : `linear-gradient(160deg,${slotPrimary}11,#0a0a14)`,
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', padding: 8, gap: 4,
                    opacity: isTarget ? 1 : 0.75,
                    transform: 'scaleY(-1)',
                    position: 'relative', overflow: 'hidden',
                    boxShadow: isTarget ? '0 0 20px rgba(232,64,64,0.5), 0 0 40px rgba(232,64,64,0.2)' : 'none',
                    animation: isTarget ? 'target-lock-pulse 0.9s ease-in-out infinite' : 'none',
                    transition: 'all 0.3s ease',
                  }}>
                    {/* H2: Target Lock scan-line effect */}
                    {isTarget && (
                      <>
                        {/* Scan line */}
                        <div style={{
                          position: 'absolute', left: 0, right: 0, height: 2,
                          background: 'linear-gradient(90deg,transparent,rgba(232,64,64,0.8),transparent)',
                          animation: 'target-lock-scan 1.4s linear infinite',
                          pointerEvents: 'none', zIndex: 5,
                        }} />
                        {/* Corner brackets TL */}
                        <div style={{
                          position: 'absolute', top: 4, left: 4, width: 14, height: 14,
                          borderTop: '2px solid #e84040', borderLeft: '2px solid #e84040',
                          borderRadius: '3px 0 0 0',
                          animation: 'target-lock-corner 0.3s ease-out both',
                          zIndex: 5, transform: 'scaleY(-1)',
                        }} />
                        {/* Corner brackets BR */}
                        <div style={{
                          position: 'absolute', bottom: 4, right: 4, width: 14, height: 14,
                          borderBottom: '2px solid #e84040', borderRight: '2px solid #e84040',
                          borderRadius: '0 0 3px 0',
                          animation: 'target-lock-corner 0.3s ease-out 0.1s both',
                          zIndex: 5, transform: 'scaleY(-1)',
                        }} />
                        {/* TARGET label */}
                        <div style={{
                          position: 'absolute', top: 4, left: '50%',
                          transform: 'translateX(-50%) scaleY(-1)',
                          fontSize: 7, fontFamily: '"Rajdhani",sans-serif',
                          fontWeight: 900, color: '#e84040',
                          letterSpacing: '0.18em',
                          textShadow: '0 0 8px rgba(232,64,64,0.9)',
                          animation: 'target-lock-corner 0.3s ease-out 0.15s both',
                          zIndex: 6, whiteSpace: 'nowrap',
                        }}>◉ OBJETIVO</div>
                      </>
                    )}
                    <div style={{ fontSize: 20 }}>{SLOT_META[s].icon}</div>
                    {u && <div style={{
                      fontSize: 7, color: isTarget ? '#ff9a9a' : '#aaa', fontFamily: '"Cinzel",serif',
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

        {/* ── THE FORGE BARRIER (Plan §3) — dinámica, cambia por ganador / HP crítico ── */}
        <ForgeBarrier
          playerWinning={playerWinning}
          criticalHp={criticalHp}
          faction={champFaction}
        />

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
                      ascensionActive={s === 'champion' && ascensionActive}
                    />
                  </div>
                );
              })}
            </div>

            {/* Player info row: badge + reserve stack */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 4,
            }}>
              <div style={{
                fontSize: 9, color: '#4a9effcc', letterSpacing: '0.15em',
                fontFamily: '"Rajdhani",sans-serif', textTransform: 'uppercase',
                padding: '2px 10px',
                background: 'rgba(0,0,0,0.5)', borderRadius: 20,
                border: '1px solid rgba(74,158,255,0.2)',
              }}>🛡 {playerName}</div>

              {/* ── RESERVE STACK visual (Plan §3) ── */}
              <ReserveStack count={formation.reserve.length} />
            </div>

            {/* Champion protection + rage status + Pure Bonus */}
            <div style={{
              marginTop: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: 8, flexWrap: 'wrap',
            }}>
              <div style={{
                fontSize: 9, fontFamily: '"Rajdhani",sans-serif',
                color: champProtected ? '#3ddc84' : '#e84040',
                letterSpacing: '0.1em',
                transition: 'color 0.3s',
              }}>
                {champProtected ? '🛡 Campeón protegido' : '⚠️ ¡Campeón expuesto!'}
              </div>
              {/* ── FORMATION PURE BONUS badge ── */}
              {isPureFormation && <PureFormationBadge faction={champFaction} />}
            </div>
          </div>
        </div>

        {/* Champion death overlay (4.0s) */}
        {phase === 'champion_dead' && (
          <ChampionDeathScreen champion={formation.champion} />
        )}

        {/* Reserve selection overlay (top 3) */}
        {phase === 'reserve' && !summoningUnit && (
          <ReservePanel
            reserve={formation.reserve}
            onSelectReserve={handleSelectReserve}
            awaitingSlot={awaitingSlot}
          />
        )}

        {/* B1: Unit Summon Cinematic for reserve replacements */}
        {summoningUnit && summoningSlot && (
          <UnitSummonCinematic
            unit={summoningUnit}
            slot={summoningSlot}
            onDone={handleUnitSummonDone}
          />
        )}

        {/* Forge Ascension overlay */}
        {showAscensionOverlay && phase === 'ascension' && (
          <ForgeAscensionOverlay
            champion={formation.champion}
            onDone={handleAscensionDone}
          />
        )}

        {/* H4: Post-battle scoreboard overlay */}
        {phase === 'done' && (
          <ForgeFormationScoreboard
            result={battleResult.current}
            formation={formation}
            playerName={playerName}
            opponentName={opponentName}
            onDismiss={onDismiss}
          />
        )}
      </div>

      {/* ── Log ────────────────────────────────────────────────────────────── */}
      <div style={{
        maxHeight: 90, overflowY: 'auto',
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
            >⚔ ATACAR ({totalBattleTurns - turnIdx})</button>

            <button onClick={toggleAutoPlay} style={{
              padding: '10px 18px', borderRadius: 10,
              background: isAutoPlay ? 'rgba(232,184,75,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${isAutoPlay ? '#e8b84b44' : 'rgba(255,255,255,0.1)'}`,
              color: isAutoPlay ? '#e8b84b' : '#6a6a8a', fontFamily: '"Cinzel",serif',
              fontSize: 12, cursor: 'pointer', letterSpacing: '0.06em',
            }}>{isAutoPlay ? '⏸ Pausar' : '▶ Auto'}</button>

            {/* Rage badge in controls */}
            {rageStacks > 0 && (
              <RageMeter stacks={rageStacks} maxStacks={5} />
            )}
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
