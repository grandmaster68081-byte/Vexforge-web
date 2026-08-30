import { storageAsset } from '@/lib/supabase';

/**
 * VEXFORGE visual registry.
 *
 * Every entry points at a path that is part of the official Supabase Storage
 * manifest. Keep route art here so screens never invent a local substitute.
 */
export const OFFICIAL_ASSETS = {
  logo: storageAsset('logo/IMG_20260606_040509_906.jpg'),
  factionGuerrero: storageAsset('factions/icon_guerrero.png'),
  factionMago: storageAsset('factions/icon_mago.png'),
  factionPaladin: storageAsset('factions/icon_paladin.png'),
  factionPicaro: storageAsset('factions/icon_picaro.png'),
  tutorialHero: storageAsset('tutorial/main.png'),
} as const;

export const CANONICAL_BACKGROUNDS = {
  home: storageAsset('lobby/main.jpg'),
  auth: storageAsset('cover/main.jpg'),
  pvp: storageAsset('backgrounds/bg_pvp.jpg'),
  missions: storageAsset('backgrounds/bg_missions.jpg'),
  packs: storageAsset('backgrounds/bg_packs.jpg'),
  forge: storageAsset('heroes/hero_fusion.jpg'),
  collection: storageAsset('heroes/hero_assets.jpg'),
  economy: storageAsset('heroes/hero_economy.jpg'),
  profile: storageAsset('heroes/hero_profile.jpg'),
  clans: storageAsset('backgrounds/bg_clans.jpg'),
  leaderboard: storageAsset('backgrounds/bg_leaderboard.jpg'),
  achievements: storageAsset('backgrounds/bg_achievements.jpg'),
  raids: storageAsset('backgrounds/bg_bosses.jpg'),
  tutorial: OFFICIAL_ASSETS.tutorialHero,
} as const;

export type VisualSurface = keyof typeof CANONICAL_BACKGROUNDS;

export const FACTION_ICONS: Record<string, string> = {
  Guerrero: OFFICIAL_ASSETS.factionGuerrero,
  Mago: OFFICIAL_ASSETS.factionMago,
  Paladín: OFFICIAL_ASSETS.factionPaladin,
  Pícaro: OFFICIAL_ASSETS.factionPicaro,
};