import type { BattleActor, BattleResult, BattleTurn, DeckSlot } from './supabase';

type SimUnit = {
  side: 'a' | 'b';
  name: string;
  faction: string;
  rarity: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  alive: boolean;
};

const AI_FORJADOR_DECK: Array<Omit<SimUnit, 'side' | 'alive'>> = [
  { name: 'Arcanista Sombrío', faction: 'Mago', rarity: 'Uncommon', hp: 100, maxHp: 100, attack: 18, defense: 6, speed: 6 },
  { name: 'Guardián Arcano', faction: 'Mago', rarity: 'Uncommon', hp: 120, maxHp: 120, attack: 12, defense: 12, speed: 4 },
  { name: 'Cazadora de Sombras', faction: 'Pícaro', rarity: 'Rare', hp: 80, maxHp: 80, attack: 22, defense: 4, speed: 9 },
];

function playerUnit(slot: DeckSlot, index: number): SimUnit {
  const power = Math.max(10, slot.power);
  const hp = 72 + power * 3;
  return {
    side: 'a',
    name: slot.name,
    faction: slot.faction,
    rarity: slot.rarity,
    hp,
    maxHp: hp,
    attack: 10 + power,
    defense: 3 + Math.floor(power / 4),
    speed: 5 + Math.max(0, 2 - index),
    alive: true,
  };
}

function actor(unit: SimUnit): BattleActor {
  return {
    name: unit.name,
    faction: unit.faction,
    rarity: unit.rarity,
    hp: unit.hp,
    max_hp: unit.maxHp,
    atk: unit.attack,
    def: unit.defense,
    spd: unit.speed,
  };
}

function aliveUnits(units: SimUnit[], side: SimUnit['side']) {
  return units.filter((unit) => unit.side === side && unit.alive);
}

function targetFor(units: SimUnit[], side: SimUnit['side']) {
  return aliveUnits(units, side).sort((a, b) => a.hp - b.hp || a.defense - b.defense)[0];
}

/**
 * Mirrors the existing web quick-battle contract (client_ai_v1) for Android
 * training only. It never changes MMR, inventory, rewards, or server matches.
 */
export function simulateQuickAIBattle(slots: DeckSlot[]): BattleResult {
  const playerUnits = slots.slice(0, 3).map(playerUnit);
  const aiUnits = AI_FORJADOR_DECK.map((unit) => ({ ...unit, side: 'b' as const, alive: true }));
  const units = [...playerUnits, ...aiUnits];
  const turns: BattleTurn[] = [];

  for (let round = 0; round < 18; round += 1) {
    const order = units
      .filter((unit) => unit.alive)
      .sort((a, b) => b.speed - a.speed || (a.side === 'a' ? -1 : 1));

    for (const attacker of order) {
      if (!attacker.alive) continue;
      const defender = targetFor(units, attacker.side === 'a' ? 'b' : 'a');
      if (!defender) break;
      const damage = Math.max(1, attacker.attack - defender.defense);
      defender.hp = Math.max(0, defender.hp - damage);
      const isKill = defender.hp === 0;
      if (isKill) defender.alive = false;
      turns.push({
        turn: turns.length + 1,
        atk_side: attacker.side,
        attacker: actor(attacker),
        defender: actor(defender),
        damage,
        is_crit: false,
        is_kill: isKill,
        lifesteal_heal: 0,
        events: [],
        alive_a: aliveUnits(units, 'a').length,
        alive_b: aliveUnits(units, 'b').length,
      });
      if (aliveUnits(units, 'a').length === 0 || aliveUnits(units, 'b').length === 0) break;
    }
    if (aliveUnits(units, 'a').length === 0 || aliveUnits(units, 'b').length === 0) break;
  }

  const youWon = aliveUnits(units, 'a').length > 0;
  return {
    ok: true,
    you_won: youWon,
    total_turns: turns.length,
    turns,
    engine: 'client_ai_v1',
    player_name: 'Tú',
    opponent_name: 'IA Forjador',
    elo_change: 0,
  };
}