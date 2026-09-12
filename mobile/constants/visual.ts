import { storageAsset } from '@/lib/supabase';

const HOME_HERO_ART = require('../assets/images/vexforge-home-hero.png');
const HOME_FEATURE_CARD_ART = require('../assets/images/vexforge-feature-card.png');
const HOME_SENTINEL_ART = require('../assets/images/vexforge-hero-sentinel.png');

/**
 * VEXFORGE visual registry.
 *
 * Route art is registered here so screens never invent an untracked substitute.
 * The Home's authored scene is bundled locally; live player/card data still
 * comes from Supabase and remote Storage remains the source for other routes.
 */
export const OFFICIAL_ASSETS = {
  logo: storageAsset('logo/IMG_20260606_040509_906.jpg'),
  factionGuerrero: storageAsset('factions/icon_guerrero.png'),
  factionMago: storageAsset('factions/icon_mago.png'),
  factionPaladin: storageAsset('factions/icon_paladin.png'),
  factionPicaro: storageAsset('factions/icon_picaro.png'),
  tutorialHero: storageAsset('tutorial/main.png'),
  homeNexusBurst: HOME_HERO_ART,
  homeHero: HOME_HERO_ART,
  homeSentinel: HOME_SENTINEL_ART,
  homeFeatureCard: HOME_FEATURE_CARD_ART,
} as const;

export const CANONICAL_BACKGROUNDS = {
  home: HOME_HERO_ART,
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
  world: storageAsset('backgrounds/bg_bosses.jpg'),
  tutorial: OFFICIAL_ASSETS.tutorialHero,
} as const;

export const FACTION_BACKGROUNDS = {
  Guerrero: storageAsset('factions/bg_guerrero.jpg'),
  Mago: storageAsset('factions/bg_mago.jpg'),
  Paladín: storageAsset('factions/bg_paladin.jpg'),
  Pícaro: storageAsset('factions/bg_picaro.jpg'),
} as const;

export type VisualSurface = keyof typeof CANONICAL_BACKGROUNDS;

export const FACTION_ICONS: Record<string, string> = {
  Guerrero: OFFICIAL_ASSETS.factionGuerrero,
  Mago: OFFICIAL_ASSETS.factionMago,
  Paladín: OFFICIAL_ASSETS.factionPaladin,
  Pícaro: OFFICIAL_ASSETS.factionPicaro,
};