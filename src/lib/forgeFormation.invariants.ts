import type { BattleUnit } from './battleTypes';
import {
  buildFormation,
  computeChampionBonus,
  getNextReserveUnit,
  isChampionProtected,
  type FormationSelection,
} from './forgeFormation';
import { createBattleUnitFromCanonicalCard } from './aiBattleEngine';

function unit(id: string, overrides: Partial<BattleUnit> = {}): BattleUnit {
  return {
    idx: 0,
    side: 'a',
    id,
    name: id,
    faction: 'Guerrero',
    rarity: 'Common',
    image_url: '',
    keywords: [],
    hp: 100,
    max_hp: 100,
    atk: 20,
    def: 10,
    spd: 5,
    power: 40,
    alive: true,
    poisoned: false,
    shielded: false,
    guard: false,
    lifesteal: false,
    poison_atk: false,
    rush: false,
    double_strike: false,
    ...overrides,
  };
}

/**
 * Pure T2 invariants used by local verification and future test runners.
 * This intentionally has no network, timers, randomness, or production writes.
 */
export function runForgeFormationInvariantChecks(): { passed: number; failures: string[] } {
  const failures: string[] = [];
  const assert = (condition: boolean, message: string) => {
    if (!condition) failures.push(message);
  };

  const deck = [
    unit('champion', { faction: 'Mago' }),
    unit('vanguard', { def: 30 }),
    unit('sentinel', { atk: 35, faction: 'Mago' }),
    unit('reserve-tank', { def: 40 }),
    unit('reserve-striker', { atk: 50 }),
  ];
  const selection: FormationSelection = {
    championIdx: 0,
    vanguardIdx: 1,
    sentinelIdx: 2,
  };
  const formation = buildFormation(deck, selection);

  assert(!!formation, 'a valid champion selection builds a formation');
  if (formation) {
    assert(formation.reserve.length === 2, 'only unassigned cards enter reserve');
    assert(isChampionProtected(formation), 'a live support protects the champion');
    assert(!isChampionProtected({
      ...formation,
      vanguard: formation.vanguard ? { ...formation.vanguard, alive: false } : null,
      sentinel: formation.sentinel ? { ...formation.sentinel, alive: false } : null,
    }), 'a champion is exposed when both supports are dead');
  }

  const bonus = computeChampionBonus(deck.slice(3));
  assert(bonus.atk === 2 && bonus.def === 1 && bonus.hp === 10, 'reserve bonus follows the canonical formula');

  const nextVanguard = getNextReserveUnit([unit('weak', { def: 5 }), unit('tank', { def: 40 })], 'vanguard');
  assert(nextVanguard?.unit.id === 'tank', 'vanguard replacement prioritizes defense');
  const nextSentinel = getNextReserveUnit([unit('weak', { atk: 5 }), unit('striker', { atk: 40 })], 'sentinel');
  assert(nextSentinel?.unit.id === 'striker', 'sentinel replacement prioritizes attack');
  assert(nextSentinel?.remaining.length === 1, 'replacement removes exactly one reserve card');

  const canonicalUnit = createBattleUnitFromCanonicalCard({
    id: 'canonical',
    name: 'Carta Canónica',
    faction: 'Guerrero',
    rarity: 'Rare',
    image_url: null,
    power: 40,
    affinity: 8,
    prestige: 3,
    charge: 2,
    specialization: 'Tank',
    synergy_json: { keywords: ['Guard', 'Surge'], faction_bonus: { Guerrero: 0.12 } },
  }, 0);
  assert(
    canonicalUnit.hp === 168 && canonicalUnit.atk === 42 && canonicalUnit.def === 12 && canonicalUnit.spd === 28,
    'canonical card attributes derive the same combat stats as the authoritative PvP resolver',
  );
  assert(
    canonicalUnit.specialization === 'Tank' && canonicalUnit.faction_bonus === 0.12,
    'canonical card strategic metadata survives into the battle unit',
  );

  return { passed: 10 - failures.length, failures };
}