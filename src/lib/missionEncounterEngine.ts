// VexForge — Mission Encounter Engine T4
// Diferencia enemigos por tipo de misión, región y fase.
// Sin cambios de esquema — todo client-side.

import type { BattleUnit, BattleSide, BattleRarity } from './battleTypes';
import type { FormationState } from './forgeFormation';
import type { AIDifficulty } from './aiBattleEngine';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RegionalModifier {
  regionId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  type: 'buff' | 'debuff' | 'neutral';
  // Flat bonus to player units
  playerBuff: { atk: number; def: number; hp: number; spd: number };
}

export interface MissionPhaseConfig {
  totalPhases: number;
  phaseLabel: (phase: number) => string;
  phase2Difficulty: AIDifficulty;
  phase2EnemyType: EnemyArchetype;
  phase2OpponentName: string;
  phase2Narrative: string;
  // Champion recovers % of missing HP between phases
  champHealPct: number;
}

export type EnemyArchetype =
  | 'pve_patrol'
  | 'pve_elite'
  | 'expedition_scout'
  | 'expedition_ranger'
  | 'expedition_commander'
  | 'event_champion'
  | 'event_elite'
  | 'clan_vanguard'
  | 'clan_warlord'
  | 'dungeon_guardian'
  | 'dungeon_boss'
  | 'tutorial_drone';

export interface MissionEncounterConfig {
  enemies: BattleUnit[];
  opponentName: string;
  enemyDescription: string;
  archetype: EnemyArchetype;
  difficulty: AIDifficulty;
  regionModifier: RegionalModifier;
  phaseConfig: MissionPhaseConfig;
  briefingNarrative: string;
  enemyKeywords: string[];
}

// ─── Regional Modifiers ───────────────────────────────────────────────────────
// Buffs/debuffs aplicados a la formación del jugador según región.

const NEUTRAL_BUFF = { atk: 0, def: 0, hp: 0, spd: 0 };

const REGIONAL_MODIFIERS: Record<string, RegionalModifier> = {
  'Torres Rúnicas': {
    regionId: 'Torres Rúnicas',
    name: 'Runas Antiguas',
    description: '+12 DEF para todas tus unidades',
    icon: '🔵',
    color: '#4a9eff',
    type: 'buff',
    playerBuff: { atk: 0, def: 12, hp: 0, spd: 0 },
  },
  'Catedral del Alba': {
    regionId: 'Catedral del Alba',
    name: 'Luz Sagrada',
    description: '+15 ATK y +20 HP al Campeón',
    icon: '☀️',
    color: '#E8B84B',
    type: 'buff',
    playerBuff: { atk: 15, def: 0, hp: 20, spd: 0 },
  },
  'Fortaleza Abisal': {
    regionId: 'Fortaleza Abisal',
    name: 'Oscuridad Profunda',
    description: '-5 SPD · Terreno hostil para el defensor',
    icon: '🌑',
    color: '#A855F7',
    type: 'debuff',
    playerBuff: { atk: 0, def: 0, hp: 0, spd: -5 },
  },
  'Sombras del Eclipse': {
    regionId: 'Sombras del Eclipse',
    name: 'Eclipse Táctico',
    description: '+8 ATK pero -8 DEF — ataca o muere',
    icon: '🌒',
    color: '#8B5CF6',
    type: 'debuff',
    playerBuff: { atk: 8, def: -8, hp: 0, spd: 0 },
  },
  'Reino del Acero': {
    regionId: 'Reino del Acero',
    name: 'Terreno Forjado',
    description: '+10 ATK y +8 DEF para todas tus unidades',
    icon: '⚙️',
    color: '#9CA3AF',
    type: 'buff',
    playerBuff: { atk: 10, def: 8, hp: 0, spd: 0 },
  },
  'Telegram': {
    regionId: 'Telegram',
    name: 'Campo Abierto',
    description: 'Sin ventajas ni penalizaciones regionales',
    icon: '🌿',
    color: '#3DC96B',
    type: 'neutral',
    playerBuff: NEUTRAL_BUFF,
  },
  _default: {
    regionId: '_default',
    name: 'Terreno Desconocido',
    description: 'Exploración sin modificadores',
    icon: '🗺️',
    color: '#6B7280',
    type: 'neutral',
    playerBuff: NEUTRAL_BUFF,
  },
};

export function getRegionalModifier(regionId: string | null): RegionalModifier {
  return REGIONAL_MODIFIERS[regionId ?? ''] ?? REGIONAL_MODIFIERS['_default'];
}

// ─── Apply regional modifier to player formation ──────────────────────────────

function buffUnit(unit: BattleUnit, buff: RegionalModifier['playerBuff']): BattleUnit {
  const newAtk = Math.max(1, unit.atk + buff.atk);
  const newDef = Math.max(0, unit.def + buff.def);
  const newHp  = Math.max(1, unit.hp  + buff.hp);
  const newSpd = Math.max(1, unit.spd + buff.spd);
  return {
    ...unit,
    atk: newAtk, def: newDef,
    hp: newHp, max_hp: Math.max(1, unit.max_hp + buff.hp),
    spd: newSpd,
  };
}

export function applyRegionalModifier(
  formation: FormationState,
  modifier: RegionalModifier,
): FormationState {
  if (modifier.type === 'neutral') return formation;
  const b = modifier.playerBuff;
  return {
    ...formation,
    champion: buffUnit(formation.champion, b),
    vanguard: formation.vanguard ? buffUnit(formation.vanguard, b) : null,
    sentinel: formation.sentinel ? buffUnit(formation.sentinel, b) : null,
  };
}

// ─── Enemy Unit Factory ───────────────────────────────────────────────────────

function mkEnemy(
  overrides: Partial<BattleUnit> & Pick<BattleUnit, 'idx' | 'id' | 'name' | 'faction' | 'rarity' | 'atk' | 'def' | 'hp' | 'spd' | 'power'>,
): BattleUnit {
  return {
    side: 'b' as BattleSide,
    image_url: '',
    keywords: overrides.keywords ?? [],
    max_hp: overrides.hp,
    alive: true,
    poisoned: false,
    shielded: overrides.shielded ?? false,
    guard: overrides.guard ?? false,
    lifesteal: overrides.lifesteal ?? false,
    poison_atk: overrides.poison_atk ?? false,
    rush: overrides.rush ?? false,
    double_strike: overrides.double_strike ?? false,
    ...overrides,
  };
}

// ─── Enemy Archetypes ─────────────────────────────────────────────────────────

const ENEMY_ARCHETYPES: Record<EnemyArchetype, {
  units: BattleUnit[];
  opponentName: string;
  description: string;
  keywords: string[];
}> = {
  // ── PvE ──────────────────────────────────────────────────────────────────
  pve_patrol: {
    opponentName: 'Patrulla de Campo',
    description: 'Escuadra básica de reconocimiento. Sin formación coordinada.',
    keywords: [],
    units: [
      mkEnemy({ idx:0, id:'pve_p0', name:'Centinela Gris',   faction:'Guerrero', rarity:'Common',   atk:12, def:4,  hp:85,  spd:4,  power:30 }),
      mkEnemy({ idx:1, id:'pve_p1', name:'Explorador Rápido',faction:'Pícaro',   rarity:'Common',   atk:14, def:2,  hp:70,  spd:7,  power:28, rush:true, keywords:['Surge'] }),
      mkEnemy({ idx:2, id:'pve_p2', name:'Escudero de Línea',faction:'Guerrero', rarity:'Common',   atk:10, def:8,  hp:95,  spd:3,  power:25, guard:true, keywords:['Guard'] }),
    ],
  },
  pve_elite: {
    opponentName: 'Unidad de Élite',
    description: 'Guerreros veteranos con formación disciplinada y keywords activos.',
    keywords: ['Guard', 'Drain'],
    units: [
      mkEnemy({ idx:0, id:'pve_e0', name:'Forjador Veterano', faction:'Guerrero', rarity:'Uncommon', atk:22, def:10, hp:120, spd:6,  power:65, lifesteal:true, keywords:['Drain'] }),
      mkEnemy({ idx:1, id:'pve_e1', name:'Escudo Arcano',     faction:'Mago',     rarity:'Rare',     atk:14, def:16, hp:130, spd:4,  power:70, guard:true, keywords:['Guard', 'Flux'] }),
      mkEnemy({ idx:2, id:'pve_e2', name:'Cazadora Élite',    faction:'Pícaro',   rarity:'Uncommon', atk:26, def:5,  hp:90,  spd:9,  power:72, rush:true, keywords:['Surge'] }),
    ],
  },
  // ── Expedition ────────────────────────────────────────────────────────────
  expedition_scout: {
    opponentName: 'Escuadra Exploradora',
    description: 'Exploradores ágiles adaptados al terreno. Prioridad en velocidad.',
    keywords: ['Surge'],
    units: [
      mkEnemy({ idx:0, id:'exp_s0', name:'Batidor del Norte',  faction:'Pícaro',   rarity:'Common',   atk:16, def:3,  hp:75,  spd:9,  power:35, rush:true, keywords:['Surge'] }),
      mkEnemy({ idx:1, id:'exp_s1', name:'Rastreadora Ágil',   faction:'Pícaro',   rarity:'Common',   atk:13, def:4,  hp:80,  spd:8,  power:32, keywords:[] }),
      mkEnemy({ idx:2, id:'exp_s2', name:'Vigía de Flanco',    faction:'Guerrero', rarity:'Common',   atk:11, def:6,  hp:90,  spd:5,  power:28, guard:true, keywords:['Guard'] }),
    ],
  },
  expedition_ranger: {
    opponentName: 'Comandante de Expedición',
    description: 'Unidad coordinada de exploración profunda. Veneno y velocidad.',
    keywords: ['Surge', 'Poison'],
    units: [
      mkEnemy({ idx:0, id:'exp_r0', name:'Cazador Sombrío',    faction:'Pícaro',   rarity:'Rare',     atk:20, def:6,  hp:95,  spd:10, power:60, rush:true, poison_atk:true, keywords:['Surge','Poison'] }),
      mkEnemy({ idx:1, id:'exp_r1', name:'Guardabosques',      faction:'Guerrero', rarity:'Uncommon', atk:16, def:10, hp:110, spd:6,  power:55, guard:true, keywords:['Guard'] }),
      mkEnemy({ idx:2, id:'exp_r2', name:'Maga Terrestre',     faction:'Mago',     rarity:'Uncommon', atk:22, def:7,  hp:85,  spd:7,  power:58, keywords:['Flux'] }),
    ],
  },
  expedition_commander: {
    opponentName: 'Señor de la Expedición',
    description: 'Comandante del territorio. Formación equilibrada con capacidades ofensivas y defensivas.',
    keywords: ['Guard', 'Drain', 'Veil'],
    units: [
      mkEnemy({ idx:0, id:'exp_c0', name:'Comandante del Filo',faction:'Guerrero', rarity:'Epic',     atk:32, def:14, hp:145, spd:8,  power:100, lifesteal:true, keywords:['Drain','Guard'] }),
      mkEnemy({ idx:1, id:'exp_c1', name:'Velo de Niebla',     faction:'Mago',     rarity:'Rare',     atk:24, def:16, hp:120, spd:6,  power:90,  shielded:true, keywords:['Veil'] }),
      mkEnemy({ idx:2, id:'exp_c2', name:'Asesina del Umbral', faction:'Pícaro',   rarity:'Epic',     atk:38, def:7,  hp:100, spd:12, power:105, rush:true, poison_atk:true, keywords:['Surge','Poison'] }),
    ],
  },
  // ── Event ─────────────────────────────────────────────────────────────────
  event_champion: {
    opponentName: 'Campeón del Evento',
    description: 'Luchador de torneo con técnicas únicas y habilidades especiales.',
    keywords: ['DoubleStrike', 'Guard'],
    units: [
      mkEnemy({ idx:0, id:'evt_c0', name:'Gladiador del Festival', faction:'Guerrero', rarity:'Rare',     atk:28, def:12, hp:130, spd:8, power:90, double_strike:true, keywords:['DoubleStrike'] }),
      mkEnemy({ idx:1, id:'evt_c1', name:'Hechicera del Cénit',   faction:'Mago',     rarity:'Rare',     atk:25, def:10, hp:110, spd:7, power:85, keywords:['Flux','Resonance'] }),
      mkEnemy({ idx:2, id:'evt_c2', name:'Evasora Oscura',        faction:'Pícaro',   rarity:'Uncommon', atk:20, def:6,  hp:90,  spd:10, power:75, rush:true, keywords:['Surge'] }),
    ],
  },
  event_elite: {
    opponentName: 'Élite del Festival — Guardia Final',
    description: 'La guardia definitiva del evento. Ningún keyword se descarta.',
    keywords: ['DoubleStrike', 'Veil', 'Drain', 'Guard'],
    units: [
      mkEnemy({ idx:0, id:'evt_e0', name:'Señor de la Forja',   faction:'Guerrero', rarity:'Mythic',    atk:44, def:20, hp:190, spd:9,  power:170, lifesteal:true, double_strike:true, keywords:['Drain','DoubleStrike'] }),
      mkEnemy({ idx:1, id:'evt_e1', name:'Arcanista Absoluta',   faction:'Mago',     rarity:'Legendary', atk:32, def:22, hp:155, spd:7,  power:155, shielded:true, guard:true, keywords:['Veil','Guard','Resonance'] }),
      mkEnemy({ idx:2, id:'evt_e2', name:'Sombra Sin Nombre',    faction:'Pícaro',   rarity:'Legendary', atk:50, def:8,  hp:120, spd:15, power:165, rush:true, poison_atk:true, keywords:['Surge','Poison'] }),
    ],
  },
  // ── Clan ──────────────────────────────────────────────────────────────────
  clan_vanguard: {
    opponentName: 'Vanguardia del Clan',
    description: 'Formación ofensiva de clan. Coordinación táctica y daño sostenido.',
    keywords: ['Guard', 'Flux'],
    units: [
      mkEnemy({ idx:0, id:'clan_v0', name:'Lancero del Clan',    faction:'Guerrero', rarity:'Uncommon', atk:20, def:8,  hp:115, spd:6, power:60, guard:true, keywords:['Guard'] }),
      mkEnemy({ idx:1, id:'clan_v1', name:'Arcanista del Gremio', faction:'Mago',    rarity:'Uncommon', atk:18, def:8,  hp:100, spd:7, power:58, keywords:['Flux'] }),
      mkEnemy({ idx:2, id:'clan_v2', name:'Infiltrador del Clan', faction:'Pícaro',  rarity:'Rare',     atk:24, def:5,  hp:85,  spd:9, power:65, rush:true, keywords:['Surge'] }),
    ],
  },
  clan_warlord: {
    opponentName: 'Señor de la Guerra del Clan',
    description: 'La cúspide de un clan consolidado. Formación de élite sin fisuras.',
    keywords: ['Drain', 'DoubleStrike', 'Veil', 'Guard'],
    units: [
      mkEnemy({ idx:0, id:'clan_w0', name:'Comandante Eterno',   faction:'Guerrero', rarity:'Legendary', atk:40, def:18, hp:185, spd:9,  power:165, lifesteal:true, double_strike:true, keywords:['Drain','DoubleStrike'] }),
      mkEnemy({ idx:1, id:'clan_w1', name:'Sabio del Cónclave',  faction:'Mago',     rarity:'Epic',      atk:28, def:20, hp:145, spd:7,  power:135, shielded:true, guard:true, keywords:['Veil','Guard'] }),
      mkEnemy({ idx:2, id:'clan_w2', name:'Asesina del Pacto',   faction:'Pícaro',   rarity:'Epic',      atk:44, def:7,  hp:110, spd:14, power:145, rush:true, poison_atk:true, keywords:['Surge','Poison'] }),
    ],
  },
  // ── Dungeon ───────────────────────────────────────────────────────────────
  dungeon_guardian: {
    opponentName: 'Guardián de la Mazmorra',
    description: 'Criatura ancestral que defiende las profundidades. Lenta pero devastadora.',
    keywords: ['Guard', 'Drain'],
    units: [
      mkEnemy({ idx:0, id:'dng_g0', name:'Golem de Piedra',     faction:'Guerrero', rarity:'Rare',     atk:18, def:20, hp:180, spd:3, power:80, guard:true, keywords:['Guard'] }),
      mkEnemy({ idx:1, id:'dng_g1', name:'Espectro Drenante',   faction:'Mago',     rarity:'Uncommon', atk:22, def:8,  hp:100, spd:5, power:70, lifesteal:true, keywords:['Drain'] }),
      mkEnemy({ idx:2, id:'dng_g2', name:'Araña Venenosa',      faction:'Pícaro',   rarity:'Uncommon', atk:16, def:5,  hp:90,  spd:8, power:65, poison_atk:true, keywords:['Poison'] }),
    ],
  },
  dungeon_boss: {
    opponentName: 'Señor de las Profundidades',
    description: 'El jefe final de la mazmorra. Una presencia antigua y corrupta.',
    keywords: ['Guard', 'Drain', 'Veil', 'DoubleStrike'],
    units: [
      mkEnemy({ idx:0, id:'dng_b0', name:'Liche Eterno',        faction:'Mago',     rarity:'Mythic',    atk:38, def:22, hp:200, spd:5, power:180, lifesteal:true, shielded:true, keywords:['Drain','Veil'] }),
      mkEnemy({ idx:1, id:'dng_b1', name:'Coloso Abismal',      faction:'Guerrero', rarity:'Legendary', atk:42, def:24, hp:210, spd:4, power:190, guard:true, double_strike:true, keywords:['Guard','DoubleStrike'] }),
      mkEnemy({ idx:2, id:'dng_b2', name:'Sombra Corrupta',     faction:'Pícaro',   rarity:'Epic',      atk:30, def:8,  hp:130, spd:10, power:150, poison_atk:true, keywords:['Poison','Surge'] }),
    ],
  },
  // ── Tutorial ──────────────────────────────────────────────────────────────
  tutorial_drone: {
    opponentName: 'Simulacro de Entrenamiento',
    description: 'Oponente de práctica. Sin amenaza real — aprende el sistema ForgeFormation.',
    keywords: [],
    units: [
      mkEnemy({ idx:0, id:'tut_0', name:'Guardián Aprendiz', faction:'Guerrero', rarity:'Common', atk:8,  def:4,  hp:70,  spd:3, power:20 }),
      mkEnemy({ idx:1, id:'tut_1', name:'Mago Novicio',      faction:'Mago',     rarity:'Common', atk:10, def:2,  hp:60,  spd:5, power:18 }),
      mkEnemy({ idx:2, id:'tut_2', name:'Pícaro en Prácticas',faction:'Pícaro', rarity:'Common', atk:7,  def:3,  hp:65,  spd:6, power:16 }),
    ],
  },
};

// ─── Phase Configuration ──────────────────────────────────────────────────────

function getPhaseConfig(missionType: string, difficulty: string): MissionPhaseConfig {
  const is2Phase =
    (missionType === 'Clan'       && (difficulty === 'epic' || difficulty === 'legendary')) ||
    (missionType === 'Event'      && (difficulty === 'epic' || difficulty === 'legendary')) ||
    (missionType === 'Expedition' &&  difficulty === 'legendary');

  if (!is2Phase) {
    return {
      totalPhases: 1,
      phaseLabel: () => 'Batalla',
      phase2Difficulty: 'expert',
      phase2EnemyType: 'pve_elite',
      phase2OpponentName: '',
      phase2Narrative: '',
      champHealPct: 0,
    };
  }

  // 2-phase configurations by type
  if (missionType === 'Clan') {
    const isLegend = difficulty === 'legendary';
    return {
      totalPhases: 2,
      phaseLabel: (p) => p === 1 ? 'Fase 1 — Vanguardia del Clan' : 'Fase 2 — Señor de la Guerra',
      phase2Difficulty: isLegend ? 'legend' : 'legend',
      phase2EnemyType: 'clan_warlord',
      phase2OpponentName: 'Señor de la Guerra del Clan',
      phase2Narrative: 'La vanguardia cayó. Ahora se presenta el verdadero líder del Clan. Cada Campeón que haya sobrevivido lo enfrentará en su estado actual.',
      champHealPct: 30,
    };
  }
  if (missionType === 'Event') {
    const isLegend = difficulty === 'legendary';
    return {
      totalPhases: 2,
      phaseLabel: (p) => p === 1 ? 'Fase 1 — Campeón del Evento' : 'Fase 2 — Élite del Festival',
      phase2Difficulty: isLegend ? 'legend' : 'legend',
      phase2EnemyType: 'event_elite',
      phase2OpponentName: 'Élite del Festival — Guardia Final',
      phase2Narrative: 'Has derrotado al Campeón del evento. Pero la Élite del Festival exige más. Tu formación entra a la segunda fase con las mismas unidades que sobrevivieron.',
      champHealPct: 25,
    };
  }
  // Expedition legendary
  return {
    totalPhases: 2,
    phaseLabel: (p) => p === 1 ? 'Fase 1 — Vanguardia Explorada' : 'Fase 2 — Comandante del Territorio',
    phase2Difficulty: 'legend',
    phase2EnemyType: 'expedition_commander',
    phase2OpponentName: 'Comandante del Territorio',
    phase2Narrative: 'La expedición alcanzó el punto de no retorno. El Comandante del territorio emerge para enfrentarte en combate final.',
    champHealPct: 20,
  };
}

// ─── Difficulty → Archetype mapping ──────────────────────────────────────────

type DifficultyTier = 'easy' | 'normal' | 'hard' | 'epic' | 'legendary' | 'fácil' | 'dificil' | 'épico' | 'legendario';

function selectArchetype(missionType: string, difficulty: string): { archetype: EnemyArchetype; aiDifficulty: AIDifficulty } {
  const d = difficulty.toLowerCase() as DifficultyTier;

  const isHard   = d === 'hard'      || d === 'dificil';
  const isEpic   = d === 'epic'      || d === 'épico';
  const isLegend = d === 'legendary' || d === 'legendario';
  const isEasy   = d === 'easy'      || d === 'fácil';

  const aiMap: Record<string, AIDifficulty> = {
    easy: 'easy', fácil: 'easy',
    normal: 'normal',
    hard: 'normal', dificil: 'normal',
    epic: 'expert', épico: 'expert',
    legendary: 'legend', legendario: 'legend',
  };
  const aiDifficulty: AIDifficulty = aiMap[d] ?? 'easy';

  switch (missionType) {
    case 'PvE':
      return { archetype: (isHard || isEpic || isLegend) ? 'pve_elite' : 'pve_patrol', aiDifficulty };
    case 'Expedition':
      if (isLegend) return { archetype: 'expedition_commander', aiDifficulty };
      if (isEpic || isHard) return { archetype: 'expedition_ranger', aiDifficulty };
      return { archetype: 'expedition_scout', aiDifficulty };
    case 'Event':
      return { archetype: (isEpic || isLegend) ? 'event_elite' : 'event_champion', aiDifficulty };
    case 'Clan':
      return { archetype: (isEpic || isLegend) ? 'clan_warlord' : 'clan_vanguard', aiDifficulty };
    case 'Dungeon':
      return { archetype: (isEpic || isLegend) ? 'dungeon_boss' : 'dungeon_guardian', aiDifficulty };
    case 'Tutorial':
      return { archetype: 'tutorial_drone', aiDifficulty: 'easy' };
    default:
      return { archetype: isEasy ? 'pve_patrol' : 'pve_elite', aiDifficulty };
  }
}

// ─── Narrative by type ────────────────────────────────────────────────────────

function buildNarrative(missionType: string, missionName: string, regionId: string | null, difficulty: string): string {
  const region = regionId ?? 'territorio desconocido';
  switch (missionType) {
    case 'PvE':
      return `Patrulla de combate en ${region}. Unidades enemigas detectadas en el perímetro. Tu Campeón lidera la incursión — mantén la Formación o todo colapsa.`;
    case 'Expedition':
      return `Expedición profunda a ${region}. El terreno modifica las capacidades de combate. Adapta tu Formación a las condiciones del entorno — la reserva marcará la diferencia.`;
    case 'Event':
      return `"${missionName}" — Combate de evento especial en ${region}. Las reglas cambian, los rivales son más impredecibles. Selecciona tu Formación con precisión.`;
    case 'Clan':
      return `Enfrentamiento de clanes en ${region}. La victoria refuerza tu posición táctica. El Clan enemigo envía su formación optimizada — espera coordinación real.`;
    case 'Dungeon':
      return `Las profundidades de la mazmorra en ${region} no han sido exploradas sin bajas. Criaturas antiguas guardan secretos de la Forja — tu Campeón debe resistir todo.`;
    case 'Tutorial':
      return `Prueba de entrenamiento controlada. Sin consecuencias reales — aprende el sistema ForgeFormation y entiende la función de Campeón, Vanguardia y Centinela.`;
    default:
      return `Misión de combate en ${region}. Selecciona tu Formación con cuidado. El Campeón no puede caer.`;
  }
}

// ─── Main API ─────────────────────────────────────────────────────────────────

export interface MissionLike {
  id: string;
  mission_type: string | null;
  difficulty: string | null;
  region_id: string | null;
  name: string;
}

export function getMissionEncounter(mission: MissionLike): MissionEncounterConfig {
  const mType      = mission.mission_type ?? 'PvE';
  const mDifficulty = mission.difficulty  ?? 'normal';
  const regionId   = mission.region_id;

  const { archetype, aiDifficulty } = selectArchetype(mType, mDifficulty);
  const archetypeData = ENEMY_ARCHETYPES[archetype];
  const regionModifier = getRegionalModifier(regionId);
  const phaseConfig    = getPhaseConfig(mType, mDifficulty);
  const narrative      = buildNarrative(mType, mission.name, regionId, mDifficulty);

  // Clone units with unique IDs to avoid shared references
  const enemies = archetypeData.units.map((u, i) => ({
    ...u,
    id: `${u.id}_${mission.id}_${i}`,
    idx: i,
    alive: true,
    hp: u.hp,
    max_hp: u.max_hp,
  }));

  return {
    enemies,
    opponentName:     archetypeData.opponentName,
    enemyDescription: archetypeData.description,
    archetype,
    difficulty:       aiDifficulty,
    regionModifier,
    phaseConfig,
    briefingNarrative: narrative,
    enemyKeywords:    archetypeData.keywords,
  };
}

/** Encounter config for phase 2 of a multi-phase mission */
export function getPhase2Encounter(phaseConfig: MissionPhaseConfig, missionId: string): {
  enemies: BattleUnit[];
  opponentName: string;
  difficulty: AIDifficulty;
} {
  const archetypeData = ENEMY_ARCHETYPES[phaseConfig.phase2EnemyType];
  const enemies = archetypeData.units.map((u, i) => ({
    ...u,
    id: `${u.id}_p2_${missionId}_${i}`,
    idx: i,
    alive: true,
    hp: u.hp,
    max_hp: u.max_hp,
  }));
  return {
    enemies,
    opponentName: phaseConfig.phase2OpponentName,
    difficulty:   phaseConfig.phase2Difficulty,
  };
}

/** Apply partial champion heal between phases */
export function applyInterphaseHeal(formation: FormationState, healPct: number): FormationState {
  if (healPct <= 0) return formation;
  const healChamp = (unit: BattleUnit): BattleUnit => {
    const missing = unit.max_hp - unit.hp;
    const healed  = Math.floor(missing * (healPct / 100));
    return { ...unit, hp: Math.min(unit.max_hp, unit.hp + healed) };
  };
  return {
    ...formation,
    champion: healChamp(formation.champion),
    // Support units do NOT heal between phases
  };
}
