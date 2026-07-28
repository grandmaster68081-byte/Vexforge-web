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

  return { vanguard, champion: boostedChampion, sentinel, reserve };
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
  tutorial: { championIdx: 0, vanguardIdx: 1, sentinelIdx: null },
};
