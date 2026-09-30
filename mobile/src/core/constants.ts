import type { QualityTier } from '../types/game';
export const CANONICAL_FRAME = { width: 1080, height: 2340, ratio: 1080 / 2340 } as const;

export const COLORS = {
  void: '#040407',
  obsidian: '#0A090D',
  stone: '#1A171E',
  iron: '#46414A',
  steel: '#706873',
  gold: '#C9A35B',
  goldBright: '#F0D28B',
  goldDim: '#745E39',
  crimson: '#A9464D',
  crimsonDeep: '#42151A',
  arcane: '#385C9B',
  arcaneBright: '#8DBBFF',
  mint: '#71C4A8',
  parchment: '#D7CCB8',
  ash: '#89838F',
  white: '#F8F5EE',
  black: '#000000',
} as const;

export const NAV_ITEMS = [
  { route: '(tabs)', label: 'INICIO', glyph: '✦' },
  { route: 'arena', label: 'BATALLA', glyph: '⚔' },
  { route: 'archive', label: 'CARTAS', glyph: '◈' },
  { route: 'forge', label: 'MAZO', glyph: '⌘' },
  { route: 'legacy', label: 'PERFIL', glyph: '♜' },
] as const;

export type SceneVariant = 'nexus' | 'arena' | 'archive' | 'forge' | 'legacy' | 'missions' | 'store' | 'economy' | 'world' | 'social' | 'meta' | 'tutorial' | 'events';

export const SCENE_ART: Record<SceneVariant, number> = {
  nexus: require('../../assets/vexforge/scenes/nexus.jpg'),
  arena: require('../../assets/vexforge/scenes/arena.jpg'),
  archive: require('../../assets/vexforge/scenes/archive.jpg'),
  forge: require('../../assets/vexforge/scenes/forge.jpg'),
  legacy: require('../../assets/vexforge/scenes/founders.jpg'),
  missions: require('../../assets/vexforge/scenes/missions.jpg'),
  store: require('../../assets/vexforge/scenes/store.jpg'),
  economy: require('../../assets/vexforge/scenes/economy.jpg'),
  world: require('../../assets/vexforge/scenes/world.jpg'),
  social: require('../../assets/vexforge/scenes/social.jpg'),
  meta: require('../../assets/vexforge/scenes/meta.jpg'),
  tutorial: require('../../assets/vexforge/scenes/tutorial.jpg'),
  events: require('../../assets/vexforge/scenes/events.jpg'),
};

export const SCENE_ART_TIER: Record<QualityTier, Record<SceneVariant, number>> = {
  HIGH: {
    nexus: require('../../assets/content-packs/nexus/high.jpg'), arena: require('../../assets/content-packs/arena/high.jpg'), archive: require('../../assets/content-packs/archive/high.jpg'), forge: require('../../assets/content-packs/forge/high.jpg'), legacy: require('../../assets/content-packs/founders/high.jpg'), events: require('../../assets/content-packs/events/high.jpg'), missions: require('../../assets/content-packs/missions/high.jpg'), store: require('../../assets/content-packs/store/high.jpg'), economy: require('../../assets/content-packs/economy/high.jpg'), world: require('../../assets/content-packs/world/high.jpg'), social: require('../../assets/content-packs/social/high.jpg'), meta: require('../../assets/content-packs/meta/high.jpg'), tutorial: require('../../assets/content-packs/tutorial/high.jpg'),
  },
  MEDIUM: {
    nexus: require('../../assets/content-packs/nexus/medium.jpg'), arena: require('../../assets/content-packs/arena/medium.jpg'), archive: require('../../assets/content-packs/archive/medium.jpg'), forge: require('../../assets/content-packs/forge/medium.jpg'), legacy: require('../../assets/content-packs/founders/medium.jpg'), events: require('../../assets/content-packs/events/medium.jpg'), missions: require('../../assets/content-packs/missions/medium.jpg'), store: require('../../assets/content-packs/store/medium.jpg'), economy: require('../../assets/content-packs/economy/medium.jpg'), world: require('../../assets/content-packs/world/medium.jpg'), social: require('../../assets/content-packs/social/medium.jpg'), meta: require('../../assets/content-packs/meta/medium.jpg'), tutorial: require('../../assets/content-packs/tutorial/medium.jpg'),
  },
  LOW: {
    nexus: require('../../assets/content-packs/nexus/low.jpg'), arena: require('../../assets/content-packs/arena/low.jpg'), archive: require('../../assets/content-packs/archive/low.jpg'), forge: require('../../assets/content-packs/forge/low.jpg'), legacy: require('../../assets/content-packs/founders/low.jpg'), events: require('../../assets/content-packs/events/low.jpg'), missions: require('../../assets/content-packs/missions/low.jpg'), store: require('../../assets/content-packs/store/low.jpg'), economy: require('../../assets/content-packs/economy/low.jpg'), world: require('../../assets/content-packs/world/low.jpg'), social: require('../../assets/content-packs/social/low.jpg'), meta: require('../../assets/content-packs/meta/low.jpg'), tutorial: require('../../assets/content-packs/tutorial/low.jpg'),
  },
};

export const SCENE_ACCENT: Record<SceneVariant, string> = {
  nexus: COLORS.arcane,
  arena: COLORS.crimson,
  archive: COLORS.gold,
  forge: '#B86A35',
  legacy: '#8874B8',
  missions: '#7F9960',
  store: '#C2934D',
  economy: '#5E9FC3',
  world: '#6B8F9A',
  social: '#986F86',
  meta: '#9F875E',
  tutorial: COLORS.arcaneBright,
  events: '#B05A5E',
};

export const CINEMATIC_ART = {
  battle_intro: require('../../assets/vexforge/cinematics/battle_intro.jpg'),
  battle_victory: require('../../assets/vexforge/cinematics/battle_victory.jpg'),
  battle_defeat: require('../../assets/vexforge/cinematics/battle_defeat.jpg'),
  boss_phase: require('../../assets/vexforge/cinematics/boss_phase.jpg'),
  pack_reveal: require('../../assets/vexforge/cinematics/pack_reveal.jpg'),
  mission_complete: require('../../assets/vexforge/cinematics/mission_complete.jpg'),
  fusion: require('../../assets/vexforge/cinematics/fusion.jpg'),
  season_arrival: require('../../assets/vexforge/cinematics/season_arrival.jpg'),
} as const;

export const QUALITY_BUDGETS = {
  LOW: { maxConcurrentCardImages: 4, maxParticleLayers: 1, backgroundOpacity: 0.78, maxAnimatedUnits: 8 },
  MEDIUM: { maxConcurrentCardImages: 8, maxParticleLayers: 2, backgroundOpacity: 0.88, maxAnimatedUnits: 16 },
  HIGH: { maxConcurrentCardImages: 12, maxParticleLayers: 4, backgroundOpacity: 0.94, maxAnimatedUnits: 20 },
} as const;
