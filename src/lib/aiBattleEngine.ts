// VexForge AI Battle Engine — IA.0 (Chat 95)
// Client-side battle simulator. Produces RealBattleResult compatible with
// InteractiveBattleBoard / useBattleStateMachine without hitting the backend.
//
// Architecture:
//   simulateAIBattle(playerUnits, difficulty) → RealBattleResult
//   loadPlayerBattleUnits(supabase, playerId) → BattleUnit[]
//   getAIDeck(difficulty, side) → BattleUnit[]
//   AI_DIFFICULTY_LABEL, BATTLE_MODE_META — UI metadata

import type { BattleUnit, BattleTurnData, BattleEvent, RealBattleResult, BattleRarity, BattleSide } from './battleTypes';

// ─── Types ────────────────────────────────────────────────────────────────────
export type AIDifficulty = 'easy' | 'normal' | 'expert' | 'tutorial';
export type BattleMode   = 'pvp' | 'ai_easy' | 'ai_normal' | 'ai_expert' | 'practice' | 'tutorial';

export const AI_DIFFICULTY_LABEL: Record<AIDifficulty, string> = {
  easy:     'Aprendiz',
  normal:   'Forjador',
  expert:   'Maestro',
  tutorial: 'Tutorial',
};

export const BATTLE_MODE_META: Record<BattleMode, {
  label: string; desc: string; icon: string; color: string;
  reward: string; ai?: AIDifficulty;
}> = {
  pvp:        { label: 'Versus Jugador',    desc: 'Enfrenta a Forjadores reales. Afecta tu MMR y ELO.',          icon: '⚔️',  color: '#4a9eff', reward: '+ELO · +VEX' },
  ai_easy:    { label: 'vs IA — Aprendiz',  desc: 'IA sin keywords. Ideal para aprender el motor de combate.', icon: '🤖',  color: '#3dc96b', reward: '+VEX reducido',  ai: 'easy'   },
  ai_normal:  { label: 'vs IA — Forjador',  desc: 'IA con Guard y Lifesteal. Requiere estrategia real.',       icon: '🛡️', color: '#e8b84b', reward: '+VEX medio',     ai: 'normal' },
  ai_expert:  { label: 'vs IA — Maestro',   desc: 'IA con deck completo y toma de decisiones óptima.',         icon: '💀',  color: '#a855f7', reward: '+VEX completo',  ai: 'expert' },
  practice:   { label: 'Práctica',          desc: 'Sin recompensas ni registro. Experimenta libremente.',       icon: '🎯',  color: '#8b8b9e', reward: 'Sin recompensas' },
  tutorial:   { label: 'Tutorial',          desc: 'Batalla guiada paso a paso.',                               icon: '📖',  color: '#ff6b35', reward: 'Completar tutorial' },
};


// ─── IA.2: Daily AI Challenger ───────────────────────────────────────────────
// Deterministic by UTC date. No backend writes are performed from the client.
export interface DailyAIChallenge { dateKey: string; seed: number; title: string; subtitle: string; difficulty: AIDifficulty; rewardLabel: string; deck: BattleUnit[]; }

// IA.2: VEX rewards (must match RPC values in claim_daily_ai_challenge)
export const DAILY_CHALLENGE_VEX_REWARD: Record<AIDifficulty, number> = {
  easy: 50, normal: 100, expert: 200, tutorial: 0,
};
function dailyHash(value: string): number { let hash = 2166136261; for (let i = 0; i < value.length; i++) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); } return hash >>> 0; }
export function getDailyAIChallenge(date = new Date()): DailyAIChallenge {
  const dateKey = date.toISOString().slice(0, 10); const seed = dailyHash(dateKey);
  const cycle: AIDifficulty[] = ['normal', 'expert', 'normal', 'easy']; const difficulty = cycle[seed % cycle.length];
  const baseDeck = getAIDeck(difficulty, 'b'); const rotation = baseDeck.length ? seed % baseDeck.length : 0;
  const deck = baseDeck.map((_, index) => { const unit = baseDeck[(index + rotation) % baseDeck.length]; return { ...unit, idx: index, id: 'daily_' + dateKey + '_' + unit.id }; });
  const names = ['La Guardia del Eclipse', 'La Forja Errante', 'El Círculo de Ceniza', 'La Última Vanguardia'];
  return { dateKey, seed, title: names[seed % names.length], subtitle: 'Mazo rotativo del ' + dateKey + '. Un solo intento por día.', difficulty, rewardLabel: 'Badge único · +' + DAILY_CHALLENGE_VEX_REWARD[difficulty] + ' VEX', deck };
}
export function getDailyChallengeAttemptKey(playerId: string, dateKey: string): string { return 'vxf_daily_challenge_attempt_v1:' + playerId + ':' + dateKey; }
export function hasDailyChallengeAttempted(playerId: string, dateKey: string): boolean { try { return localStorage.getItem(getDailyChallengeAttemptKey(playerId, dateKey)) === '1'; } catch { return false; } }
export function markDailyChallengeAttempted(playerId: string, dateKey: string): void { try { localStorage.setItem(getDailyChallengeAttemptKey(playerId, dateKey), '1'); } catch {} }
export function getDailyChallengeBadgeKey(playerId: string, dateKey: string): string { return 'vxf_daily_challenge_badge_v1:' + playerId + ':' + dateKey; }
export function hasDailyChallengeBadge(playerId: string, dateKey: string): boolean { try { return localStorage.getItem(getDailyChallengeBadgeKey(playerId, dateKey)) === '1'; } catch { return false; } }
export function markDailyChallengeBadge(playerId: string, dateKey: string): void { try { localStorage.setItem(getDailyChallengeBadgeKey(playerId, dateKey), '1'); } catch {} }
// ─── Predefined AI Decks ──────────────────────────────────────────────────────
function mkUnit(overrides: Partial<BattleUnit> & Pick<BattleUnit, 'idx'|'id'|'name'|'faction'|'rarity'|'atk'|'def'|'hp'|'spd'|'power'>): BattleUnit {
  return {
    side: 'b',
    image_url: '',
    keywords: [],
    max_hp: overrides.hp,
    alive: true,
    poisoned: false,
    shielded: false,
    guard: false,
    lifesteal: false,
    poison_atk: false,
    rush: false,
    double_strike: false,
    def: 0,
    ...overrides,
  };
}

const DECKS: Record<AIDifficulty, Partial<BattleUnit>[]> = {
  easy: [
    { idx:0, id:'ai_e0', name:'Centinela Gris',   faction:'Guerrero',    rarity:'Common',   atk:12, def:4,  hp:85,  spd:4,  power:30  },
    { idx:1, id:'ai_e1', name:'Escudero Novato',  faction:'Guerrero',    rarity:'Common',   atk:10, def:8,  hp:95,  spd:3,  power:25  },
    { idx:2, id:'ai_e2', name:'Lancero Bisoño',   faction:'Explorador',  rarity:'Common',   atk:14, def:2,  hp:70,  spd:6,  power:28  },
  ],
  normal: [
    { idx:0, id:'ai_n0', name:'Arcanista Sombrío', faction:'Mago',       rarity:'Uncommon', atk:18, def:6,  hp:100, spd:6,  power:50, keywords:['Flux'] },
    { idx:1, id:'ai_n1', name:'Guardián Arcano',   faction:'Mago',       rarity:'Uncommon', atk:12, def:12, hp:120, spd:4,  power:45, keywords:['Guard'], guard:true },
    { idx:2, id:'ai_n2', name:'Cazadora de Sombras',faction:'Explorador',rarity:'Rare',     atk:22, def:4,  hp:80,  spd:9,  power:55, keywords:['Surge'], rush:true },
  ],
  expert: [
    { idx:0, id:'ai_x0', name:'Forjador Élite',   faction:'Guerrero',   rarity:'Epic',     atk:28, def:10, hp:130, spd:7,  power:90, keywords:['Drain'],         lifesteal:true },
    { idx:1, id:'ai_x1', name:'Señor de Velos',   faction:'Mago',       rarity:'Rare',     atk:20, def:15, hp:115, spd:5,  power:80, keywords:['Veil','Guard'],  shielded:true, guard:true },
    { idx:2, id:'ai_x2', name:'Tormenta Surgente', faction:'Explorador', rarity:'Epic',     atk:34, def:5,  hp:90,  spd:11, power:95, keywords:['Surge','Forge'], rush:true },
  ],
  tutorial: [
    { idx:0, id:'ai_t0', name:'Guardián Aprendiz', faction:'Guerrero',  rarity:'Common',   atk:8,  def:4,  hp:70,  spd:3,  power:20  },
    { idx:1, id:'ai_t1', name:'Mago Novicio',      faction:'Mago',      rarity:'Common',   atk:10, def:2,  hp:60,  spd:5,  power:18  },
  ],
};

export function getAIDeck(difficulty: AIDifficulty, side: BattleSide = 'b'): BattleUnit[] {
  return DECKS[difficulty].map(p => ({ ...mkUnit(p as any), side, max_hp: (p as any).hp }));
}

// ─── Player units loader ──────────────────────────────────────────────────────
export async function loadPlayerBattleUnits(
  supabase: any, playerId: string, count = 3
): Promise<BattleUnit[]> {
  try {
    const { data } = await supabase
      .from('player_cards')
      .select('cards!inner(id,name,faction,rarity,atk,def,spd,hp,power,synergy_json,image_url)')
      .eq('player_id', playerId)
      .eq('listed', false)
      .order('created_at', { ascending: false })
      .limit(40);

    if (!data || !data.length) return getAIDeck('easy', 'a');

    const units: BattleUnit[] = data
      .map((pc: any, i: number) => {
        const c = pc.cards;
        if (!c) return null;
        const kw: string[] = c.synergy_json?.keywords ?? [];
        return {
          idx: i,
          side: 'a' as BattleSide,
          id: c.id,
          name: c.name,
          faction: c.faction ?? 'Guerrero',
          rarity: (c.rarity ?? 'Common') as BattleRarity,
          image_url: c.image_url ?? '',
          keywords: kw,
          hp: c.hp ?? 80, max_hp: c.hp ?? 80,
          atk: c.atk ?? 10, def: c.def ?? 5, spd: c.spd ?? 5, power: c.power ?? 30,
          alive: true, poisoned: false, shielded: kw.includes('Veil'),
          guard: kw.includes('Guard'), lifesteal: kw.includes('Drain'),
          poison_atk: kw.includes('Poison'), rush: kw.includes('Surge'),
          double_strike: kw.includes('DoubleStrike'),
        } as BattleUnit;
      })
      .filter(Boolean)
      .sort((a: BattleUnit, b: BattleUnit) => b.power - a.power)
      .slice(0, count)
      .map((u: BattleUnit, i: number) => ({ ...u, idx: i }));

    return units.length ? units : getAIDeck('easy', 'a');
  } catch {
    return getAIDeck('easy', 'a');
  }
}

// ─── Battle Simulator ─────────────────────────────────────────────────────────
function cloneUnits(units: BattleUnit[]): BattleUnit[] {
  return units.map(u => ({ ...u }));
}

function toActor(u: BattleUnit) {
  return {
    name: u.name, faction: u.faction, rarity: u.rarity, image_url: u.image_url,
    atk: u.atk, def: u.def, hp: u.hp, max_hp: u.max_hp, spd: u.spd,
  };
}

function pickTarget(enemies: BattleUnit[], difficulty: AIDifficulty): BattleUnit {
  const guards = enemies.filter(e => e.guard);
  const pool   = guards.length ? guards : enemies;
  if (difficulty === 'easy') {
    return pool[Math.floor(Math.random() * pool.length)];
  }
  if (difficulty === 'normal' || difficulty === 'tutorial') {
    return pool.reduce((a, b) => a.hp < b.hp ? a : b);
  }
  // Expert: prioritize lowest HP/DEF ratio (best efficiency)
  return pool.reduce((a, b) => (a.hp - a.def) < (b.hp - b.def) ? a : b);
}

export function simulateAIBattle(
  rawPlayerUnits: BattleUnit[],
  difficulty: AIDifficulty,
  opponentUnits?: BattleUnit[],
): RealBattleResult {
  const playerUnits = cloneUnits(rawPlayerUnits).map((u, i) => ({ ...u, side: 'a' as BattleSide, idx: i, alive: true }));
  const aiUnits     = cloneUnits(opponentUnits ?? getAIDeck(difficulty, 'b')).map((u, i) => ({ ...u, side: 'b' as BattleSide, idx: i, alive: true }));
  const all         = [...playerUnits, ...aiUnits];

  const turns: BattleTurnData[] = [];
  const MAX_ROUNDS = 30;

  for (let round = 0; round < MAX_ROUNDS; round++) {
    const aliveA = all.filter(u => u.side === 'a' && u.alive);
    const aliveB = all.filter(u => u.side === 'b' && u.alive);
    if (!aliveA.length || !aliveB.length) break;

    // Sort by SPD desc for attack order
    const order = [...aliveA, ...aliveB].sort((a, b) => b.spd - a.spd);

    for (const attacker of order) {
      if (!attacker.alive) continue;
      const enemies = all.filter(u => u.side !== attacker.side && u.alive);
      if (!enemies.length) break;

      const target = pickTarget(enemies, difficulty);
      const events: BattleEvent[] = [];

      // Shield block (Veil)
      if (target.shielded) {
        target.shielded = false;
        events.push({ type: 'shield_block', unit: target.name, side: target.side });
        turns.push({
          turn: turns.length + 1, atk_side: attacker.side,
          attacker: toActor(attacker), defender: toActor(target),
          damage: 0, is_crit: false, is_kill: false, lifesteal_heal: 0,
          events, alive_a: all.filter(u => u.side === 'a' && u.alive).length,
          alive_b: all.filter(u => u.side === 'b' && u.alive).length,
        });
        continue;
      }

      // Damage calculation
      let dmg   = Math.max(1, attacker.atk - target.def);
      const isCrit = Math.random() < (difficulty === 'easy' ? 0.10 : 0.18);
      if (isCrit) dmg = Math.floor(dmg * 1.5);

      // Apply damage
      target.hp = Math.max(0, target.hp - dmg);
      const isKill = target.hp === 0;
      if (isKill) target.alive = false;

      // Lifesteal / Drain
      let lifestealHeal = 0;
      if (attacker.lifesteal && dmg > 0) {
        lifestealHeal = Math.floor(dmg * 0.3);
        attacker.hp = Math.min(attacker.max_hp, attacker.hp + lifestealHeal);
        events.push({ type: 'lifesteal', heal: lifestealHeal, side: attacker.side });
      }

      turns.push({
        turn: turns.length + 1, atk_side: attacker.side,
        attacker: toActor(attacker), defender: toActor(target),
        damage: dmg, is_crit: isCrit, is_kill: isKill, lifesteal_heal: lifestealHeal,
        events,
        alive_a: all.filter(u => u.side === 'a' && u.alive).length,
        alive_b: all.filter(u => u.side === 'b' && u.alive).length,
      });

      // Double strike (second attack at 60% power)
      if (attacker.double_strike && target.alive) {
        const dmg2 = Math.max(1, Math.floor(attacker.atk * 0.6) - target.def);
        target.hp  = Math.max(0, target.hp - dmg2);
        if (target.hp === 0) target.alive = false;
        turns.push({
          turn: turns.length + 1, atk_side: attacker.side,
          attacker: toActor(attacker), defender: toActor(target),
          damage: dmg2, is_crit: false, is_kill: target.hp === 0, lifesteal_heal: 0,
          events: [{ type: 'double_strike', unit: attacker.name }],
          type: 'double_strike',
          alive_a: all.filter(u => u.side === 'a' && u.alive).length,
          alive_b: all.filter(u => u.side === 'b' && u.alive).length,
        });
      }

      if (!all.filter(u => u.side === 'a' && u.alive).length ||
          !all.filter(u => u.side === 'b' && u.alive).length) break;
    }
  }

  const aliveA   = all.filter(u => u.side === 'a' && u.alive);
  const you_won  = aliveA.length > 0;

  // Restore defender snapshots to final state
  return {
    ok:          true,
    you_won,
    total_turns: turns.length,
    elo_change:  0,
    turns,
    final_units: all,
    engine:      'client_ai_v1',
    match_id:    `ai_${Date.now()}`,
    player_name: 'Tú',
    opponent_name: AI_DIFFICULTY_LABEL[difficulty],
  };
}
    // ─── IA.2: Server-side claim (SECURITY DEFINER RPC) ──────────────────────────
    // Requires RPC claim_daily_ai_challenge to be deployed (supabase/migrations/0002_ia2_daily_claim_rpc.sql)
    export async function claimDailyAIChallenge(
    supabase: any,
    dateKey: string,
    difficulty: AIDifficulty,
    ): Promise<{ claimed: boolean; vex_awarded?: number; reason?: string }> {
    const { data, error } = await supabase.rpc('claim_daily_ai_challenge', {
      p_date_key: dateKey,
      p_difficulty: difficulty,
    });
    if (error) return { claimed: false, reason: error.message };
    return data as { claimed: boolean; vex_awarded?: number; reason?: string };
    }
    