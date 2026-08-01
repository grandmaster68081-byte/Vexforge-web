// VexForge — Forge Formation Engine v1.0
// Sistema de combate con formaciones: Vanguardia, Campeón, Centinela + Reserva
// El Campeón es la pieza central. Si el Campeón muere → derrota inmediata.
// La reserva (mazo completo menos las 3 cartas de formación) alimenta el campo.

import type { BattleUnit, BattleSide } from './battleTypes';
import { simulateAIBattle, type AIDifficulty } from './aiBattleEngine';
import type { RealBattleResult } from './battleTypes';

// ─── Position types ────────────────────────────────────────────────────────────
export type FormationSlot = 'vanguard' | 'champion' | 'sentinel';

export interface FormationState {
  vanguard:  BattleUnit | null;
  champion:  BattleUnit;         // Nunca null — es la condición de victoria
  sentinel:  BattleUnit | null;
  reserve:   BattleUnit[];       // Cartas restantes del mazo
}

export interface FormationSelection {
  championIdx: number;           // índice en el mazo de la carta Campeón
  vanguardIdx: number | null;    // índice de soporte 1
  sentinelIdx: number | null;    // índice de soporte 2
}

// ─── Slot metadata para UI ────────────────────────────────────────────────────
export const SLOT_META: Record<FormationSlot, {
  label: string; icon: string; desc: string; color: string;
}> = {
  vanguard:  { label: 'Vanguardia', icon: '⚔️',  desc: 'Protege al Campeón y ataca primero', color: '#e84040' },
  champion:  { label: 'Campeón',    icon: '👑',  desc: 'Centro de la formación. Si cae, la partida termina', color: '#e8b84b' },
  sentinel:  { label: 'Centinela',  icon: '🛡️', desc: 'Defensa de flanco y soporte táctico', color: '#4a9eff' },
};

// ─── Formation power bonus ────────────────────────────────────────────────────
// El mazo completo amplifica el poder del Campeón (+1 ATK por cada carta en reserva)
export function computeChampionBonus(reserve: BattleUnit[]): { atk: number; def: number; hp: number } {
  const n = reserve.length;
  return {
    atk: Math.floor(n * 1.2),
    def: Math.floor(n * 0.8),
    hp:  n * 5,
  };
}

// ─── Formation builder ────────────────────────────────────────────────────────
export function buildFormation(
  allUnits: BattleUnit[],
  sel: FormationSelection,
): FormationState | null {
  if (!allUnits.length) return null;
  const champion = allUnits[sel.championIdx];
  if (!champion) return null;

  const usedIdxs = new Set([sel.championIdx]);
  let vanguard: BattleUnit | null = null;
  let sentinel: BattleUnit | null = null;

  if (sel.vanguardIdx != null && allUnits[sel.vanguardIdx]) {
    vanguard = { ...allUnits[sel.vanguardIdx], guard: true }; // Vanguardia siempre Guard
    usedIdxs.add(sel.vanguardIdx);
  }
  if (sel.sentinelIdx != null && allUnits[sel.sentinelIdx]) {
    sentinel = allUnits[sel.sentinelIdx];
    usedIdxs.add(sel.sentinelIdx);
  }

  const reserve = allUnits.filter((_, i) => !usedIdxs.has(i));

  // Aplicar bonus del mazo al Campeón
  const bonus = computeChampionBonus(reserve);
  const boostedChampion: BattleUnit = {
    ...champion,
    atk:    champion.atk + bonus.atk,
    def:    champion.def + bonus.def,
    hp:     champion.hp + bonus.hp,
    max_hp: champion.hp + bonus.hp,
  };

  // Apply Formation Pure Bonus (+15% if all 3 active cards share the same faction)
  return applyFormationPureBonus({ vanguard, champion: boostedChampion, sentinel, reserve });
}

// ─── Formation Pure Bonus ─────────────────────────────────────────────────────
// +15% ATK/DEF/HP/SPD a las 3 cartas activas si todas son de la misma facción.
// Incentiva construcción mono-facción — ningún otro DCCG tiene esto.
export function hasFormationPureBonus(
  formation: Pick<FormationState, 'champion' | 'vanguard' | 'sentinel'>,
): boolean {
  const cards = [formation.champion, formation.vanguard, formation.sentinel]
    .filter((c): c is BattleUnit => !!c);
  if (cards.length < 2) return false;
  return cards.every(c => c.faction === formation.champion.faction);
}

function applyBuff15(u: BattleUnit): BattleUnit {
  return {
    ...u,
    atk:    Math.round(u.atk * 1.15),
    def:    Math.round(u.def * 1.15),
    hp:     Math.round(u.hp * 1.15),
    max_hp: Math.round(u.max_hp * 1.15),
    spd:    Math.round((u.spd ?? 10) * 1.15),
  };
}

function applyFormationPureBonus(formation: FormationState): FormationState {
  if (!hasFormationPureBonus(formation)) return formation;
  return {
    ...formation,
    champion: applyBuff15(formation.champion),
    vanguard: formation.vanguard ? applyBuff15(formation.vanguard) : null,
    sentinel: formation.sentinel ? applyBuff15(formation.sentinel) : null,
  };
}

// ─── Champion protection rule ─────────────────────────────────────────────────
// El Campeón no puede ser atacado mientras exista Vanguardia O Centinela vivos.
export function isChampionProtected(formation: FormationState): boolean {
  return !!(formation.vanguard?.alive || formation.sentinel?.alive);
}

// ─── Reserve activation ───────────────────────────────────────────────────────
// Cuando una carta de la formación muere, se ofrece un reemplazo de la reserva
export function getNextReserveUnit(
  reserve: BattleUnit[],
  slot: FormationSlot,
): { unit: BattleUnit; remaining: BattleUnit[] } | null {
  if (!reserve.length) return null;

  // Para Vanguardia → buscar la carta con mayor DEF + Guard preferida
  // Para Centinela → buscar la carta con mayor ATK
  let idx = 0;
  if (slot === 'vanguard') {
    idx = reserve.reduce((best, u, i) =>
      u.def > reserve[best].def ? i : best, 0);
  } else if (slot === 'sentinel') {
    idx = reserve.reduce((best, u, i) =>
      u.atk > reserve[best].atk ? i : best, 0);
  }

  const unit = { ...reserve[idx], guard: slot === 'vanguard' };
  const remaining = reserve.filter((_, i) => i !== idx);
  return { unit, remaining };
}

// ─── Formation battle result (wraps simulateAIBattle) ────────────────────────
// Expande las unidades de formación a un array para usar el motor existente
export function simulateFormationBattle(
  formation: FormationState,
  difficulty: AIDifficulty,
): RealBattleResult & { championDied: boolean; finalFormation: FormationState } {
  // Aplanar formación en array de unidades (con Champion marcado como especial)
  const playerUnits: BattleUnit[] = [
    ...(formation.vanguard ? [{ ...formation.vanguard, idx: 0 }] : []),
    { ...formation.champion, idx: 1 },
    ...(formation.sentinel  ? [{ ...formation.sentinel,  idx: 2 }] : []),
  ].map((u, i) => ({ ...u, side: 'a' as BattleSide, idx: i }));

  const result = simulateAIBattle(playerUnits, difficulty);

  // Detectar si el Campeón cayó (índice 1 o el de más alto poder)
  const finalChampion = result.final_units?.find(u => u.side === 'a' && u.id === formation.champion.id);
  // Explicit ternary to avoid the ?? short-circuit bug: !X ?? Y always returns !X (boolean).
  const championDied = finalChampion ? !finalChampion.alive : true;

  // Reconstruir estado final de formación
  const finalFormation: FormationState = {
    champion: finalChampion ?? { ...formation.champion, alive: false, hp: 0 },
    vanguard: formation.vanguard
      ? result.final_units?.find(u => u.side === 'a' && u.id === formation.vanguard!.id) ?? null
      : null,
    sentinel: formation.sentinel
      ? result.final_units?.find(u => u.side === 'a' && u.id === formation.sentinel!.id) ?? null
      : null,
    reserve: formation.reserve,
  };

  // Si el Campeón murió → forzar derrota (independientemente del resultado del motor)
  const effectiveWon = championDied ? false : (result.you_won ?? false);

  return {
    ...result,
    you_won: effectiveWon,
    championDied,
    finalFormation,
  };
}

// ─── Preset formations para IA ────────────────────────────────────────────────
export const AI_FORMATIONS: Record<AIDifficulty, FormationSelection> = {
  easy:     { championIdx: 0, vanguardIdx: 1, sentinelIdx: 2 },
  normal:   { championIdx: 1, vanguardIdx: 0, sentinelIdx: 2 },
  expert:   { championIdx: 2, vanguardIdx: 0, sentinelIdx: 1 },
  legend:   { championIdx: 2, vanguardIdx: 1, sentinelIdx: 0 },
  tutorial: { championIdx: 0, vanguardIdx: 1, sentinelIdx: null },
};

// ─── P4: Relic effects ───────────────────────────────────────────────────────
export interface EquippedRelic {
  id: string;
  code: string;
  name: string;
  effect_type: string | null;
  effect_value: number | null;
  metadata: Record<string, unknown>;
}

function applyRelicToUnit(unit: BattleUnit, relics: EquippedRelic[]): BattleUnit {
  let u = { ...unit };
  for (const relic of relics) {
    const val = relic.effect_value ?? 0;
    switch (relic.effect_type) {
      case 'power_bonus_common':
        if (u.rarity === 'Common') {
          const m = 1 + val / 100;
          u = { ...u, atk: Math.round(u.atk * m), power: Math.round(u.power * m) };
        }
        break;
      case 'legendary_mythic_bonus':
        if (u.rarity === 'Legendary' || u.rarity === 'Mythic') {
          const m = 1 + val / 100;
          u = { ...u, atk: Math.round(u.atk * m), power: Math.round(u.power * m) };
        }
        break;
      case 'paladin_bonus':
        if (u.faction === 'Paladín') {
          const m = 1 + val / 100;
          u = { ...u, atk: Math.round(u.atk * m), power: Math.round(u.power * m) };
        }
        break;
      case 'first_attack_bonus':
        u = { ...u, atk: Math.round(u.atk * (1 + val / 100)) };
        break;
      case 'guard_start':
        u = { ...u, guard: true };
        break;
      case 'veil_permanent':
        u = { ...u, shielded: true };
        break;
      case 'keyword_grant': {
        const kw = (relic.metadata?.keyword as string | undefined) ?? 'Resonance';
        if (!u.keywords.includes(kw)) u = { ...u, keywords: [...u.keywords, kw] };
        break;
      }
      case 'drain_enhanced':
        if (u.lifesteal || u.keywords.includes('Drain')) {
          u = { ...u, atk: Math.round(u.atk * 1.12) };
        }
        break;
      case 'surge_amplify':
        if (u.rush || u.keywords.includes('Surge')) {
          u = { ...u, atk: Math.round(u.atk * 1.15) };
        }
        break;
      case 'all_keywords':
        u = { ...u, guard: true, shielded: true, lifesteal: true, rush: true, double_strike: true };
        break;
      case 'rage_bonus':
        // Pre-apply partial buff since runtime HP tracking isn't available here
        u = { ...u, atk: Math.round(u.atk * 1.06) };
        break;
    }
  }
  return u;
}

/**
 * Aplica efectos de reliquias equipadas a la formación antes del combate.
 * Llamar antes de pasar la formación a ForgeFormationBoard.
 */
export function applyRelicEffects(
  formation: FormationState,
  equippedRelics: EquippedRelic[],
): FormationState {
  if (!equippedRelics.length) return formation;
  return {
    ...formation,
    champion: applyRelicToUnit(formation.champion, equippedRelics),
    vanguard: formation.vanguard ? applyRelicToUnit(formation.vanguard, equippedRelics) : null,
    sentinel: formation.sentinel ? applyRelicToUnit(formation.sentinel, equippedRelics) : null,
    reserve:  formation.reserve.map(u => applyRelicToUnit(u, equippedRelics)),
  };
}
