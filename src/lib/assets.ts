export const STORAGE_BASE = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets";

export const ASSETS = {
  cover: `${STORAGE_BASE}/cover/main.jpg`,
  lobby: `${STORAGE_BASE}/lobby/main.jpg`,
  nexus: `${STORAGE_BASE}/misc/IMG_20260619_122314.jpg`,
  factions: {
    Guerrero: { background: `${STORAGE_BASE}/factions/bg_guerrero.jpg`, icon: `${STORAGE_BASE}/factions/icon_guerrero.png`, tone: "crimson" },
    Mago: { background: `${STORAGE_BASE}/factions/bg_mago.jpg`, icon: `${STORAGE_BASE}/factions/icon_mago.png`, tone: "sapphire" },
    Paladín: { background: `${STORAGE_BASE}/factions/bg_paladin.jpg`, icon: `${STORAGE_BASE}/factions/icon_paladin.png`, tone: "gold" },
    Pícaro: { background: `${STORAGE_BASE}/factions/bg_picaro.jpg`, icon: `${STORAGE_BASE}/factions/icon_picaro.png`, tone: "emerald" },
  },
  regions: {
    forgeCore: `${STORAGE_BASE}/regions/region_forge_core.jpg`,
    ironVeins: `${STORAGE_BASE}/regions/region_iron_veins.jpg`,
    shadowFracture: `${STORAGE_BASE}/regions/region_shadow_fracture.jpg`,
    cindersRealm: `${STORAGE_BASE}/regions/region_cinders_realm.jpg`,
    warboundZone: `${STORAGE_BASE}/regions/region_warbound_zone.jpg`,
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
  return value.length ? value : null;
}
