import { storageAsset } from '@/lib/supabase';

export const CANONICAL_BACKGROUNDS = {
  home: storageAsset('lobby/main.jpg'),
  auth: storageAsset('cover/main.jpg'),
  pvp: storageAsset('backgrounds/bg_pvp.jpg'),
  missions: storageAsset('backgrounds/bg_missions.jpg'),
  packs: storageAsset('backgrounds/bg_packs.jpg'),
  forge: storageAsset('heroes/hero_fusion.jpg'),
  economy: storageAsset('backgrounds/bg_packs.jpg'),
  profile: storageAsset('cover/main.jpg'),
  clans: storageAsset('backgrounds/bg_clans.jpg'),
  leaderboard: storageAsset('backgrounds/bg_leaderboard.jpg'),
  achievements: storageAsset('backgrounds/bg_achievements.jpg'),
  raids: storageAsset('backgrounds/bg_bosses.jpg'),
} as const;

export type VisualSurface = keyof typeof CANONICAL_BACKGROUNDS;