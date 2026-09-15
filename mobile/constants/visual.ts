/**
 * VEXFORGE visual asset policy.
 *
 * Card art remains the only visual asset consumed from Supabase Storage.
 * Approved scene artwork is versioned locally when it has an explicit
 * operator decision, provenance record and real Android consumer.
 */
export const OFFICIAL_ASSETS = {
  logo: null,
  factionGuerrero: null,
  factionMago: null,
  factionPaladin: null,
  factionPicaro: null,
  tutorialHero: null,
  homeNexusBurst: null,
  homeHero: null,
  homeSentinel: null,
  homeFeatureCard: null,
} as const;

export const CANONICAL_BACKGROUNDS = {
  home: require('../assets/images/home-reference-scene.png'),
  auth: null,
  pvp: null,
  missions: null,
  packs: null,
  forge: null,
  collection: null,
  economy: null,
  profile: null,
  clans: null,
  leaderboard: null,
  achievements: null,
  raids: null,
  world: null,
  tutorial: null,
} as const;

export type VisualSurface = keyof typeof CANONICAL_BACKGROUNDS;

export const FACTION_BACKGROUNDS: Record<string, string | null> = {
  Guerrero: null,
  Mago: null,
  Paladín: null,
  Pícaro: null,
};

export const FACTION_ICONS: Record<string, string | null> = {
  Guerrero: null,
  Mago: null,
  Paladín: null,
  Pícaro: null,
};
