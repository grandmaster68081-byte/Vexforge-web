// FormationSelector.tsx — Forge Formation Engine (pre-battle UI)
// Permite al jugador seleccionar su Campeón + 2 cartas de apoyo antes de la batalla.
// El mazo restante forma la Reserva y amplifica el poder del Campeón.

import { useState, useCallback } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import { SLOT_META, buildFormation, computeChampionBonus, type FormationSlot, type FormationSelection, type FormationState } from '../../lib/forgeFormation';
import { AudioEngine } from '../../lib/audioEngine';

interface FormationSelectorProps {
  playerUnits: BattleUnit[];
  onConfirm: (formation: FormationState) => void;
  onCancel: () => void;
  difficulty?: string;
}

const FACTION_ICON: Record<string, string> = {
  Guerrero: '⚔️', Mago: '🔮', 'Paladín': '🛡️', 'Pícaro': '🗡️',
  Explorador: '🏹', Comerciante: '💰',
};

function UnitMiniCard({
  unit, slot, isSelected, isUsed, onClick,
}: {
  unit: BattleUnit; slot: FormationSlot | null; isSelected: boolean; isUsed: boolean; onClick: () => void;
}) {
  const rar = RARITY_COLOR[unit.rarity] ?? '#8b8b9e';
  const glow = RARITY_GLOW[unit.rarity] ?? 'rgba(139,139,158,0.3)';
  const slotMeta = slot ? SLOT_META[slot] : null;

  return (
    <div
      onClick={() => { if (!isUsed) { AudioEngine.sfxCardSelect?.(); onClick(); } }}
      style={{
        position: 'relative',
        width: 'min(140px, 38vw)', minHeight: 190,
        borderRadius: 12,
        border: `2px solid ${isSelected ? rar : isUsed ? '#1a1a2a' : rar + '44'}`,
        background: unit.image_url
          ? `linear-gradient(180deg,transparent 0%,rgba(5,5,14,0.9) 60%), url(${unit.image_url}) center/cover no-repeat`
          : `linear-gradient(160deg,${rar}18,#0a0a14)`,
        boxShadow: isSelected
          ? `0 0 24px ${glow}, 0 0 48px ${rar}44, inset 0 0 16px ${rar}11`
          : isUsed ? 'none' : `0 4px 16px rgba(0,0,0,0.5)`,
        cursor: isUsed ? 'not-allowed' : 'pointer',
        opacity: isUsed ? 0.38 : 1,
        transition: 'all 0.2s ease',
        transform: isSelected ? 'translateY(-4px) scale(1.03)' : 'none',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
        userSelect: 'none',
      }}
    >
      {/* Slot badge */}
      {slotMeta && (
        <div style={{
          position: 'absolute', top: 6, left: 6,
          background: slotMeta.color + 'dd',
          borderRadius: 20, padding: '2px 8px',
          fontSize: 9, fontWeight: 800, color: '#fff',
          fontFamily: '"Cinzel",serif', letterSpacing: '0.08em',
          backdropFilter: 'blur(4px)', zIndex: 2,
          boxShadow: `0 0 8px ${slotMeta.color}88`,
        }}>{slotMeta.icon} {slotMeta.label}</div>
      )}
      {/* Rarity badge */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        background: 'rgba(0,0,0,0.8)', border: `1px solid ${rar}55`,
        borderRadius: 4, padding: '2px 5px',
        fontSize: 7, fontWeight: 800, color: rar,
        fontFamily: '"Rajdhani",sans-serif', letterSpacing: '0.1em',
        backdropFilter: 'blur(4px)', zIndex: 2,
      }}>{unit.rarity.toUpperCase()}</div>

      {/* Image area */}
      <div style={{ flex: 1, minHeight: 90, display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden' }}>
        {!unit.image_url && (
          <div style={{ fontSize: 38, filter: `drop-shadow(0 0 12px ${rar}aa)` }}>
            {FACTION_ICON[unit.faction] ?? '⚔️'}
          </div>
        )}
        {/* Shimmer for Legendary/Mythic */}
        {(unit.rarity === 'Legendary' || unit.rarity === 'Mythic') && (
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: `linear-gradient(125deg,transparent 25%,${rar}44 45%,rgba(255,255,255,0.18) 50%,${rar}22 55%,transparent 75%)`,
            backgroundSize: '250% 250%',
            animation: 'card-shimmer 2s ease-in-out infinite',
          }} />
        )}
      </div>

      {/* Body */}
      <div style={{
        padding: '8px 10px 10px',
        background: 'linear-gradient(0deg,rgba(3,3,12,0.97),rgba(8,8,22,0.88))',
        borderTop: `1px solid ${rar}33`,
      }}>
        <div style={{
          fontFamily: '"Cinzel",serif', fontSize: 10, fontWeight: 700,
          color: '#eee', letterSpacing: '0.04em',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textShadow: `0 0 8px ${rar}55`, marginBottom: 5,
        }}>{unit.name}</div>
        <div style={{ display: 'flex', gap: 5, fontSize: 10, fontFamily: '"Rajdhani",sans-serif', fontWeight: 800 }}>
          <span style={{ color: '#ff6b6b' }}>⚔{unit.atk}</span>
          <span style={{ color: '#4a9eff' }}>🛡{unit.def}</span>
          <span style={{ color: '#e8b84b' }}>⚡{unit.spd}</span>
        </div>
        <div style={{ marginTop: 4, height: 4, background: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${(unit.hp / unit.max_hp) * 100}%`,
            background: `linear-gradient(90deg,#3ddc84,#3ddc84bb)`,
            borderRadius: 2,
          }} />
        </div>
        <div style={{ fontSize: 8, color: '#3ddc84', marginTop: 2, fontFamily: '"IBM Plex Mono",monospace' }}>
          {unit.hp} HP
        </div>
      </div>

      {/* Hover glow ring */}
      {isSelected && (
        <div style={{
          position: 'absolute', inset: -2, borderRadius: 13, pointerEvents: 'none',
          border: `2px solid ${rar}`,
          boxShadow: `0 0 20px ${rar}88, inset 0 0 8px ${rar}22`,
          animation: 'selection-ring-pulse 1.2s ease-in-out infinite',
        }} />
      )}
    </div>
  );
}

function SlotDropzone({
  slot, unit, onClear,
}: {
  slot: FormationSlot; unit: BattleUnit | null; onClear: () => void;
}) {
  const meta = SLOT_META[slot];
  const rar = unit ? (RARITY_COLOR[unit.rarity] ?? '#8b8b9e') : meta.color;

  return (
    <div style={{
      width: 'min(148px, 40vw)', minHeight: 60,
      borderRadius: 12, overflow: 'hidden',
      border: `2px dashed ${unit ? rar + '88' : meta.color + '44'}`,
      background: unit ? `${rar}08` : `${meta.color}06`,
      transition: 'all 0.3s ease',
      position: 'relative',
    }}>
      {unit ? (
        <div>
          <div style={{
            padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8,
            background: `linear-gradient(135deg,${rar}14,transparent)`,
          }}>
            <div style={{ fontSize: 22 }}>{FACTION_ICON[unit.faction] ?? '⚔️'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: '"Cinzel",serif', fontSize: 10, color: rar, fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.name}</div>
              <div style={{ fontSize: 9, color: '#7a7a9a', fontFamily: '"Rajdhani",sans-serif' }}>
                ⚔{unit.atk} 🛡{unit.def} ⚡{unit.spd}
              </div>
            </div>
            <button onClick={() => { AudioEngine.sfxCardHover?.(); onClear(); }} style={{
              background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 6, color: '#ff6b6b', fontSize: 10, padding: '3px 7px',
              cursor: 'pointer', fontWeight: 700, flexShrink: 0,
            }}>✕</button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 14, gap: 4, minHeight: 60,
        }}>
          <div style={{ fontSize: 18, opacity: 0.5 }}>{meta.icon}</div>
          <div style={{ fontSize: 9, color: meta.color + '88', fontFamily: '"Cinzel",serif',
            letterSpacing: '0.08em', textAlign: 'center' }}>{meta.label}</div>
          <div style={{ fontSize: 8, color: '#4a4a6a', textAlign: 'center', fontFamily: '"Rajdhani",sans-serif' }}>
            {meta.desc}
          </div>
        </div>
      )}
    </div>
  );
}

export function FormationSelector({ playerUnits, onConfirm, onCancel }: FormationSelectorProps) {
  const [selection, setSelection] = useState<{
    champion: number | null; vanguard: number | null; sentinel: number | null;
  }>({ champion: null, vanguard: null, sentinel: null });

  const [activeSlot, setActiveSlot] = useState<FormationSlot>('champion');

  const usedIdxs = new Set([selection.champion, selection.vanguard, selection.sentinel].filter(x => x != null));

  const handleUnitClick = useCallback((idx: number) => {
    setSelection(prev => {
      const next = { ...prev };
      // Si ya está asignado a ese slot, deseleccionar
      if (prev[activeSlot] === idx) {
        next[activeSlot] = null;
        return next;
      }
      // Si está en otro slot, removerlo de ahí primero
      if (prev.champion === idx) next.champion = null;
      if (prev.vanguard === idx) next.vanguard = null;
      if (prev.sentinel === idx) next.sentinel = null;
      next[activeSlot] = idx;
      // Auto-avanzar al siguiente slot vacío
      return next;
    });
    // Auto-advance slot
    setTimeout(() => {
      setActiveSlot(prev => {
        if (prev === 'champion') return 'vanguard';
        if (prev === 'vanguard') return 'sentinel';
        return 'champion';
      });
    }, 200);
  }, [activeSlot]);

  const canConfirm = selection.champion !== null;

  const handleConfirm = useCallback(() => {
    if (!canConfirm || selection.champion == null) return;
    const sel: FormationSelection = {
      championIdx: selection.champion,
      vanguardIdx: selection.vanguard,
      sentinelIdx: selection.sentinel,
    };
    const formation = buildFormation(playerUnits, sel);
    if (!formation) return;
    AudioEngine.sfxCardDrop?.();
    onConfirm(formation);
  }, [canConfirm, selection, playerUnits, onConfirm]);

  const bonus = selection.champion != null
    ? computeChampionBonus(
        playerUnits.filter((_, i) => !usedIdxs.has(i))
      )
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'radial-gradient(ellipse at 50% 0%,#110820 0%,#060612 55%,#030309 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      fontFamily: '"Rajdhani",sans-serif', overflowY: 'auto',
    }}>
      <style>{`
        @keyframes selection-ring-pulse {
          0%,100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
        @keyframes slot-tab-glow {
          0%,100% { box-shadow: 0 0 8px currentColor; }
          50% { box-shadow: 0 0 20px currentColor, 0 0 40px currentColor; }
        }
        @keyframes formation-enter {
          from { opacity:0; transform:translateY(24px); }
          to { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* Header */}
      <div style={{
        width: '100%', padding: '20px 24px 16px',
        background: 'linear-gradient(180deg,rgba(5,5,18,0.99),transparent)',
        textAlign: 'center', animation: 'formation-enter 0.4s ease both',
      }}>
        <div style={{ fontSize: 9, letterSpacing: '0.2em', color: '#e8b84b',
          fontFamily: '"Rajdhani",sans-serif', fontWeight: 800, marginBottom: 8 }}>
          ⚔️ FORGE FORMATION — SELECCIÓN DE FORMACIÓN
        </div>
        <h1 style={{
          fontFamily: '"Cinzel",serif', fontSize: 'clamp(18px,4vw,26px)',
          color: '#f5e8b0', margin: 0, fontWeight: 700,
          textShadow: '0 0 30px rgba(232,184,75,0.5)',
        }}>Construye tu Formación</h1>
        <p style={{ color: '#6a6a8a', fontSize: 12, margin: '8px 0 0' }}>
          Elige tu Campeón (obligatorio) y 2 cartas de apoyo
        </p>
      </div>

      {/* Formation slots display */}
      <div style={{
        display: 'flex', gap: 12, padding: '0 16px 16px',
        justifyContent: 'center', flexWrap: 'wrap',
        animation: 'formation-enter 0.4s 0.1s ease both',
      }}>
        {(['vanguard', 'champion', 'sentinel'] as FormationSlot[]).map(slot => {
          const slotIdx = selection[slot];
          const unit = slotIdx != null ? playerUnits[slotIdx] : null;
          const meta = SLOT_META[slot];
          const isActive = activeSlot === slot;
          return (
            <div key={slot} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
              {/* Slot tab */}
              <button
                onClick={() => { AudioEngine.sfxCardHover?.(); setActiveSlot(slot); }}
                style={{
                  padding: '5px 14px', borderRadius: 20,
                  border: `1px solid ${isActive ? meta.color : meta.color + '33'}`,
                  background: isActive ? `${meta.color}22` : 'transparent',
                  color: isActive ? meta.color : meta.color + '77',
                  fontSize: 10, fontWeight: 800, cursor: 'pointer',
                  fontFamily: '"Cinzel",serif', letterSpacing: '0.1em',
                  transition: 'all 0.2s',
                  animation: isActive ? 'slot-tab-glow 2s ease-in-out infinite' : 'none',
                }}
              >
                {meta.icon} {meta.label.toUpperCase()}
                {slot === 'champion' && ' *'}
              </button>
              <SlotDropzone
                slot={slot}
                unit={unit}
                onClear={() => setSelection(prev => ({ ...prev, [slot]: null }))}
              />
            </div>
          );
        })}
      </div>

      {/* Champion power bonus */}
      {bonus && (
        <div style={{
          margin: '0 16px 16px',
          background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          animation: 'formation-enter 0.4s 0.15s ease both',
        }}>
          <span style={{ fontSize: 10, color: '#e8b84b88', fontFamily: '"Cinzel",serif', letterSpacing: '0.1em' }}>
            BONUS DEL MAZO AL CAMPEÓN:
          </span>
          <span style={{ color: '#ff6b6b', fontSize: 11, fontWeight: 700 }}>⚔ +{bonus.atk} ATK</span>
          <span style={{ color: '#4a9eff', fontSize: 11, fontWeight: 700 }}>🛡 +{bonus.def} DEF</span>
          <span style={{ color: '#3ddc84', fontSize: 11, fontWeight: 700 }}>❤ +{bonus.hp} HP</span>
          <span style={{ color: '#7a7a9a', fontSize: 10 }}>
            ({playerUnits.length - (usedIdxs.size)} cartas en reserva)
          </span>
        </div>
      )}

      {/* Instruction */}
      <div style={{
        fontSize: 11, color: '#4a9eff', background: 'rgba(74,158,255,0.08)',
        border: '1px solid rgba(74,158,255,0.2)', borderRadius: 8, padding: '8px 16px',
        margin: '0 16px 16px', textAlign: 'center',
        animation: 'formation-enter 0.4s 0.2s ease both',
      }}>
        Seleccionando: <strong style={{ color: '#e8b84b' }}>{SLOT_META[activeSlot].label}</strong>
        {' · '}Toca una carta para asignarla a este slot
      </div>

      {/* Unit grid */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10,
        padding: '0 16px 24px', justifyContent: 'center',
        maxWidth: 760,
        animation: 'formation-enter 0.4s 0.25s ease both',
      }}>
        {playerUnits.map((unit, idx) => {
          const slot: FormationSlot | null =
            selection.champion === idx ? 'champion' :
            selection.vanguard  === idx ? 'vanguard' :
            selection.sentinel  === idx ? 'sentinel' : null;
          const _isUsed = usedIdxs.has(idx) && slot !== activeSlot && selection[activeSlot] !== idx; void _isUsed;

          return (
            <UnitMiniCard
              key={unit.id + idx}
              unit={unit}
              slot={slot}
              isSelected={selection[activeSlot] === idx || slot === activeSlot}
              isUsed={!!slot && slot !== activeSlot}
              onClick={() => handleUnitClick(idx)}
            />
          );
        })}
      </div>

      {/* Actions */}
      <div style={{
        position: 'sticky', bottom: 0,
        width: '100%', padding: '14px 24px',
        background: 'linear-gradient(0deg,rgba(4,4,12,0.99),transparent)',
        display: 'flex', gap: 12, justifyContent: 'center',
        animation: 'formation-enter 0.4s 0.3s ease both',
      }}>
        <button onClick={onCancel} style={{
          padding: '12px 28px', borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.1)', background: 'transparent',
          color: '#6a6a8a', fontFamily: '"Rajdhani",sans-serif', fontWeight: 700,
          fontSize: 13, cursor: 'pointer', letterSpacing: '0.04em',
        }}>← Cancelar</button>
        <button
          onClick={handleConfirm}
          disabled={!canConfirm}
          style={{
            padding: '12px 36px', borderRadius: 10, border: 'none',
            background: canConfirm
              ? 'linear-gradient(135deg,#e8b84b,#c9901f)'
              : 'rgba(255,255,255,0.06)',
            color: canConfirm ? '#0a0a12' : '#3a3a5a',
            fontFamily: '"Cinzel",serif', fontWeight: 800, fontSize: 14,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            letterSpacing: '0.06em',
            boxShadow: canConfirm ? '0 4px 24px rgba(232,184,75,0.4)' : 'none',
            transition: 'all 0.2s',
          }}
        >
          {canConfirm ? '⚔️ ¡A la Batalla!' : 'Elige tu Campeón primero'}
        </button>
      </div>
    </div>
  );
}
