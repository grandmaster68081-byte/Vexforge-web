// FormationSelector.tsx — Forge Formation Engine (pre-battle UI)
// Permite al jugador seleccionar su Campeón + 2 cartas de apoyo antes de la batalla.
// El mazo restante forma la Reserva y amplifica el poder del Campeón.

import { useState, useCallback, useMemo } from 'react';
import type { BattleUnit } from '../../lib/battleTypes';
import { RARITY_COLOR, RARITY_GLOW } from '../../lib/battleTypes';
import { SLOT_META, buildFormation, computeChampionBonus, hasFormationPureBonus, type FormationSlot, type FormationSelection, type FormationState } from '../../lib/forgeFormation';
import { AudioEngine } from '../../lib/audioEngine';
import { ForgeIcon, type ForgeIconName } from '../../shared/components/ForgeIcon';

interface FormationSelectorProps {
  playerUnits: BattleUnit[];
  onConfirm: (formation: FormationState) => void;
  onCancel: () => void;
  difficulty?: string;
}

const FACTION_ICON: Record<string, string> = {
  Guerrero: 'arena', Mago: 'fusion', 'Paladín': 'clans', 'Pícaro': 'deck',
  Explorador: 'lore', Comerciante: 'economy',
};

const SLOT_ICON: Record<FormationSlot, ForgeIconName> = {
  vanguard: 'arena',
  champion: 'season',
  sentinel: 'clans',
};

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Aprendiz',
  normal: 'Forjador',
  expert: 'Maestro',
  legend: 'Leyenda',
  tutorial: 'Tutorial',
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
        }}>
          <ForgeIcon name={SLOT_ICON[slot as FormationSlot]} size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {slotMeta.label}
        </div>
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
            <ForgeIcon name={(FACTION_ICON[unit.faction] ?? 'arena') as ForgeIconName} size={34} />
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
          <span style={{ color: '#ff6b6b' }}>ATK {unit.atk}</span>
          <span style={{ color: '#4a9eff' }}>DEF {unit.def}</span>
          <span style={{ color: '#e8b84b' }}>SPD {unit.spd}</span>
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
            <ForgeIcon name={(FACTION_ICON[unit.faction] ?? 'arena') as ForgeIconName} size={22} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: '"Cinzel",serif', fontSize: 10, color: rar, fontWeight: 700,
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{unit.name}</div>
              <div style={{ fontSize: 9, color: '#7a7a9a', fontFamily: '"Rajdhani",sans-serif' }}>
                ATK {unit.atk} · DEF {unit.def} · SPD {unit.spd}
              </div>
            </div>
            <button onClick={() => { AudioEngine.sfxCardHover?.(); onClear(); }} style={{
              background: 'rgba(255,68,68,0.12)', border: '1px solid rgba(255,68,68,0.3)',
              borderRadius: 6, color: '#ff6b6b', fontSize: 10, padding: '3px 7px',
              cursor: 'pointer', fontWeight: 700, flexShrink: 0,
            }}><ForgeIcon name="close" size={12} /></button>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: 14, gap: 4, minHeight: 60,
        }}>
           <ForgeIcon name={SLOT_ICON[slot]} size={18} style={{ opacity: 0.5 }} />
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

export function FormationSelector({ playerUnits, onConfirm, onCancel, difficulty }: FormationSelectorProps) {
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

  // A full collection must explicitly fill all three tactical positions.
  // Smaller collections remain playable, but never expose a hidden fallback
  // formation: they require as many support cards as they actually have.
  const requiredSupports = Math.min(2, Math.max(0, playerUnits.length - 1));
  const selectedSupports = [selection.vanguard, selection.sentinel]
    .filter((idx): idx is number => idx != null).length;
  const canConfirm = selection.champion !== null && selectedSupports >= requiredSupports;

  const previewSelection: FormationSelection | null = selection.champion == null
    ? null
    : {
        championIdx: selection.champion,
        vanguardIdx: selection.vanguard,
        sentinelIdx: selection.sentinel,
      };

  const formationPreview = useMemo(
    () => previewSelection ? buildFormation(playerUnits, previewSelection) : null,
    [playerUnits, previewSelection?.championIdx, previewSelection?.vanguardIdx, previewSelection?.sentinelIdx],
  );

  const pureFormation = formationPreview ? hasFormationPureBonus(formationPreview) : false;
  const selectedCount = usedIdxs.size;
  const reserveCount = playerUnits.length - selectedCount;
  const activeUnits = formationPreview
    ? [formationPreview.champion, formationPreview.vanguard, formationPreview.sentinel].filter((unit): unit is BattleUnit => !!unit)
    : [];
  const activeKeywords = activeUnits
    .flatMap(unit => unit.keywords)
    .reduce<Record<string, number>>((counts, keyword) => {
      counts[keyword] = (counts[keyword] ?? 0) + 1;
      return counts;
    }, {});
  const sharedKeywords = Object.entries(activeKeywords)
    .filter(([, count]) => count >= 2)
    .map(([keyword, count]) => `${keyword} ×${count}`);
  const championFactionBonus = formationPreview?.champion.faction_bonus;

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
    <div className="forge-formation-selector" style={{
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
           <span style={{ display: 'inline-flex', verticalAlign: 'middle', marginRight: 6 }}>
             <ForgeIcon name="arena" size={12} />
           </span>
           FORGE FORMATION — SELECCIÓN DE FORMACIÓN
        </div>
        <h1 style={{
          fontFamily: '"Cinzel",serif', fontSize: 'clamp(18px,4vw,26px)',
          color: '#f5e8b0', margin: 0, fontWeight: 700,
          textShadow: '0 0 30px rgba(232,184,75,0.5)',
        }}>Construye tu Formación</h1>
        <p style={{ color: '#6a6a8a', fontSize: 12, margin: '8px 0 0' }}>
           Elige Campeón, Vanguardia y Centinela usando tus cartas oficiales
        </p>
        <div style={{
           display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 14,
           padding: '6px 11px', borderRadius: 999, color: '#9e9ebd',
           background: 'rgba(74,158,255,0.07)', border: '1px solid rgba(74,158,255,0.18)',
           fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase',
         }}>
           <ForgeIcon name="arena" size={12} />
           Encuentro: <strong style={{ color: '#72b6ff' }}>{DIFFICULTY_LABEL[difficulty ?? 'normal'] ?? difficulty ?? 'Forjador'}</strong>
         </div>
      </div>

        {/* Tactical formation preview */}
       <div className="formation-tactical-grid" style={{
         width: 'min(920px, calc(100% - 32px))',
         display: 'grid', gridTemplateColumns: '1fr minmax(180px, 1.35fr) 1fr',
         gap: 10, padding: '0 0 16px', alignItems: 'stretch',
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
                 aria-label={`Seleccionar ranura ${meta.label}`}
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
                 <ForgeIcon name={SLOT_ICON[slot]} size={12} style={{ verticalAlign: 'middle', marginRight: 5 }} />
                 {meta.label.toUpperCase()}
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

       {/* Formation readout */}
        <div className="formation-readout-grid" style={{
         width: 'min(920px, calc(100% - 32px))',
         display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(220px, .8fr)',
         gap: 12, marginBottom: 16,
         animation: 'formation-enter 0.4s 0.15s ease both',
       }}>
       <div className="formation-readout-panel" style={{
           border: `1px solid ${formationPreview ? '#e8b84b55' : 'rgba(255,255,255,0.08)'}`,
           background: formationPreview
             ? 'linear-gradient(135deg,rgba(232,184,75,0.1),rgba(74,158,255,0.04))'
             : 'rgba(255,255,255,0.025)',
           borderRadius: 12, padding: 14, minHeight: 124,
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
             <ForgeIcon name="season" size={14} style={{ color: '#e8b84b' }} />
             <span style={{ color: '#e8b84b', fontFamily: '"Cinzel",serif', fontSize: 10, letterSpacing: '0.12em' }}>
               NÚCLEO DEL CAMPEÓN
             </span>
             {formationPreview && (
               <span style={{ marginLeft: 'auto', color: '#3ddc84', fontSize: 9, letterSpacing: '0.08em' }}>
                 {formationPreview.champion.faction}
               </span>
             )}
           </div>
           {formationPreview ? (
             <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
               <div style={{
                 width: 68, height: 68, flexShrink: 0, borderRadius: 10,
                 border: `1px solid ${RARITY_COLOR[formationPreview.champion.rarity] ?? '#e8b84b'}88`,
                 background: formationPreview.champion.image_url
                   ? `linear-gradient(180deg,transparent,rgba(5,5,14,.8)),url(${formationPreview.champion.image_url}) center/cover`
                   : `linear-gradient(145deg,${RARITY_COLOR[formationPreview.champion.rarity] ?? '#e8b84b'}33,#0a0a14)`,
                 display: 'flex', alignItems: 'center', justifyContent: 'center',
                 color: RARITY_COLOR[formationPreview.champion.rarity] ?? '#e8b84b',
               }}>
                 {!formationPreview.champion.image_url && <ForgeIcon name={(FACTION_ICON[formationPreview.champion.faction] ?? 'arena') as ForgeIconName} size={28} />}
               </div>
               <div style={{ minWidth: 0 }}>
                 <div style={{ color: '#f5e8b0', fontFamily: '"Cinzel",serif', fontWeight: 700, fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                   {formationPreview.champion.name}
                 </div>
                 <div style={{ color: '#8e8eaa', fontSize: 10, marginTop: 3 }}>
                   {formationPreview.champion.rarity} · estadísticas finales
                 </div>
                 <div style={{ display: 'flex', gap: 10, marginTop: 8, fontFamily: '"IBM Plex Mono",monospace', fontSize: 10 }}>
                   <span style={{ color: '#ff7777' }}>ATK {formationPreview.champion.atk}</span>
                   <span style={{ color: '#72b6ff' }}>DEF {formationPreview.champion.def}</span>
                   <span style={{ color: '#63e69b' }}>HP {formationPreview.champion.hp}</span>
                 </div>
               </div>
             </div>
           ) : (
             <div style={{ color: '#5c5c78', fontSize: 12, padding: '14px 0 4px' }}>
               Elige una carta para revelar su impacto como Campeón.
             </div>
           )}
         </div>
         <div style={{
           border: `1px solid ${pureFormation ? '#3ddc8466' : 'rgba(255,255,255,0.08)'}`,
           background: pureFormation ? 'rgba(61,220,132,0.07)' : 'rgba(255,255,255,0.025)',
           borderRadius: 12, padding: 14,
         }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
             <ForgeIcon name="collection" size={14} style={{ color: '#72b6ff' }} />
             <span style={{ color: '#a9cfff', fontFamily: '"Cinzel",serif', fontSize: 10, letterSpacing: '0.1em' }}>LECTURA DE ESCUADRA</span>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8e8eaa', fontSize: 11, marginBottom: 7 }}>
             <span>Activas</span><strong style={{ color: '#f0f0fa' }}>{selectedCount}/3</strong>
           </div>
           <div style={{ display: 'flex', justifyContent: 'space-between', color: '#8e8eaa', fontSize: 11, marginBottom: 7 }}>
             <span>Reserva</span><strong style={{ color: '#f0c050' }}>{reserveCount} cartas</strong>
           </div>
           {pureFormation ? (
             <div style={{ color: '#63e69b', fontSize: 10, display: 'flex', gap: 5, alignItems: 'center' }}>
               <ForgeIcon name="fusion" size={12} /> FORMACIÓN PURA · +15%
             </div>
           ) : (
             <div style={{ color: '#666681', fontSize: 10 }}>Completa una facción para activar la pureza</div>
           )}
            {formationPreview && (
              <div style={{ marginTop: 9, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.07)', fontSize: 9, lineHeight: 1.45 }}>
                {championFactionBonus != null && (
                  <div style={{ color: '#a9cfff' }}>
                    Afinidad oficial de {formationPreview.champion.faction} · {Math.round(championFactionBonus * 100)}%
                  </div>
                )}
                {sharedKeywords.length > 0
                  ? <div style={{ color: '#c9a8ff', marginTop: 3 }}>Sinergia activa · {sharedKeywords.join(' · ')}</div>
                  : <div style={{ color: '#62627c', marginTop: 3 }}>Selecciona roles complementarios para revelar sinergias.</div>}
              </div>
            )}
         </div>
       </div>

       {!canConfirm && selection.champion !== null && (
         <div style={{
           width: 'min(920px, calc(100% - 32px))', marginBottom: 12,
           padding: '9px 12px', borderRadius: 8,
           color: '#e8b84b', background: 'rgba(232,184,75,0.08)',
           border: '1px solid rgba(232,184,75,0.2)', fontSize: 11,
           textAlign: 'center',
         }}>
           {requiredSupports === 2
             ? 'Asigna también Vanguardia y Centinela para iniciar.'
             : requiredSupports === 1
               ? 'Asigna una carta de apoyo para iniciar.'
               : 'Tu Campeón está listo para iniciar.'}
         </div>
       )}

       {/* Champion power bonus */}
       {bonus && (
        <div style={{
           width: 'min(920px, calc(100% - 32px))',
           margin: '0 16px 16px',
          background: 'rgba(232,184,75,0.06)', border: '1px solid rgba(232,184,75,0.2)',
          borderRadius: 10, padding: '10px 16px',
          display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap',
          animation: 'formation-enter 0.4s 0.15s ease both',
        }}>
          <span style={{ fontSize: 10, color: '#e8b84b88', fontFamily: '"Cinzel",serif', letterSpacing: '0.1em' }}>
            BONUS DEL MAZO AL CAMPEÓN:
          </span>
           <span style={{ color: '#ff6b6b', fontSize: 11, fontWeight: 700 }}>ATK +{bonus.atk}</span>
           <span style={{ color: '#4a9eff', fontSize: 11, fontWeight: 700 }}>DEF +{bonus.def}</span>
           <span style={{ color: '#3ddc84', fontSize: 11, fontWeight: 700 }}>HP +{bonus.hp}</span>
          <span style={{ color: '#7a7a9a', fontSize: 10 }}>
             ({reserveCount} cartas en reserva)
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
         <ForgeIcon name={SLOT_ICON[activeSlot]} size={13} style={{ verticalAlign: 'middle', marginRight: 5 }} />
         Seleccionando: <strong style={{ color: '#e8b84b' }}>{SLOT_META[activeSlot].label}</strong>
         {' · '}Toca una carta para asignarla a esta ranura
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
        }}><ForgeIcon name="chevron-left" size={13} style={{ verticalAlign: 'middle', marginRight: 6 }} />Cancelar</button>
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
           {canConfirm ? 'ENTRAR EN LA FORJA' : 'ELIGE TU CAMPEÓN'}
        </button>
      </div>
    </div>
  );
}
