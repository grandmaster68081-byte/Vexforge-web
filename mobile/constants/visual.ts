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
  // The official reference is a scene plate, not a screenshot. Runtime adds
  // live portal sockets, lighting, motion and Supabase-driven content inside
  // its authored frame rather than placing a generic dashboard above it.
  home: require('../assets/images/home-reference-scene.png'),
  // Auth consumes the approved vertical reference as a clipped scene viewport.
  // The reference's baked controls never become runtime UI; auth.tsx owns the
  // native gate, fields, states, OAuth actions and keyboard flow.
  auth: require('../assets/images/vexforge-auth-nexus-final.png'),
  // Battlefield uses approved scene art as a live viewport. The bitmap is
  // never treated as a screenshot: ForgeBattlefield owns the native HUD,
  // formations, event lane, states and replay presentation.
  pvp: require('../assets/images/battle-reference-scene.png'),
  missions: null,
  packs: null,
  // The approved deck plate is scene art only. Deck rebuilds the portal,
  // formation slots, labels, states and controls as live native elements.
  forge: require('../assets/images/decks-reference-scene.png'),
  // Archive consumes the approved vertical plate as scene art only. The
  // runtime rebuilds the portal, controls, card grid and data states natively.
  collection: require('../assets/images/collection-reference-scene.png'),
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
