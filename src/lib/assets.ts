export const PORTAL_ART_BASE = "/art/portal";
export const FACTION_ART_BASE = "/art/factions";

/**
 * V5.6 VISUAL CONTRACT:
 * - Platform artwork is local/generated and versioned with the portal.
 * - Official VEXFORGE card artwork is the ONLY visual content consumed from Supabase Storage.
 */
export const ASSETS = {
  cover: `${PORTAL_ART_BASE}/01-home-citadel-dawn.jpg`,
  lobby: `${PORTAL_ART_BASE}/02-game-forge-cathedral.jpg`,
  nexus: `${PORTAL_ART_BASE}/04-world-atlas.jpg`,
  arenas: {
    battle: `${PORTAL_ART_BASE}/03-battle-arena.jpg`,
    mobile: `${PORTAL_ART_BASE}/14-mobile-chamber.jpg`,
  },
  factions: {
    Guerrero: { background: `${PORTAL_ART_BASE}/09-faction-warrior.jpg`, icon: `${FACTION_ART_BASE}/icon_guerrero.svg`, tone: "crimson" },
    Mago: { background: `${PORTAL_ART_BASE}/10-faction-mage.jpg`, icon: `${FACTION_ART_BASE}/icon_mago.svg`, tone: "sapphire" },
    Paladín: { background: `${PORTAL_ART_BASE}/11-faction-paladin.jpg`, icon: `${FACTION_ART_BASE}/icon_paladin.svg`, tone: "gold" },
    Pícaro: { background: `${PORTAL_ART_BASE}/12-faction-rogue.jpg`, icon: `${FACTION_ART_BASE}/icon_picaro.svg`, tone: "emerald" },
  },
  regions: {
    forgeCore: `${PORTAL_ART_BASE}/02-game-forge-cathedral.jpg`,
    ironVeins: `${PORTAL_ART_BASE}/07-download-forge.jpg`,
    shadowFracture: `${PORTAL_ART_BASE}/03-battle-arena.jpg`,
    cindersRealm: `${PORTAL_ART_BASE}/05-news-courtyard.jpg`,
    warboundZone: `${PORTAL_ART_BASE}/09-faction-warrior.jpg`,
  },
  content: {
    news: `${PORTAL_ART_BASE}/05-news-courtyard.jpg`,
    media: `${PORTAL_ART_BASE}/06-media-citadel.jpg`,
    support: `${PORTAL_ART_BASE}/08-support-sanctum.jpg`,
    download: `${PORTAL_ART_BASE}/07-download-forge.jpg`,
    footer: `${PORTAL_ART_BASE}/13-footer-great-gate.jpg`,
  },
} as const;

/** Intentionally empty until official distribution URLs exist. */
export const DOWNLOAD_TARGETS = {
  googlePlay: "",
  directAndroid: "",
} as const;

export const SOCIAL_TARGETS = {
  discord: "",
  youtube: "",
  x: "",
  instagram: "",
} as const;

export function readyLink(url: string): string | null {
  const value = url.trim();
  if (!value) return null;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" ? parsed.toString() : null;
  } catch {
    return null;
  }
}
