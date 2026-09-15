/**
 * VEXFORGE cards-only visual asset policy.
 *
 * Card art is the only visual asset currently consumed from Supabase Storage.
 * All other visual surfaces intentionally remain PENDING_SOURCE until a new
 * asset is generated, approved, provenance-recorded and released.
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
  home: null,
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
