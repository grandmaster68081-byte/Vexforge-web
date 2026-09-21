export const STORAGE_BASE = "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets";

export const ASSETS = {
  logo: `${STORAGE_BASE}/logo/IMG_20260606_040509_906.jpg`,
  cover: `${STORAGE_BASE}/cover/main.jpg`,
  lobby: `${STORAGE_BASE}/lobby/main.jpg`,
  nexusAtmosphere: `${STORAGE_BASE}/misc/IMG_20260619_122314.jpg`,
  factions: {
    Guerrero: {
      background: `${STORAGE_BASE}/factions/bg_guerrero.jpg`,
      icon: `${STORAGE_BASE}/factions/icon_guerrero.png`,
      tone: "#e84040",
      discipline: "Fuerza y presión",
    },
    Mago: {
      background: `${STORAGE_BASE}/factions/bg_mago.jpg`,
      icon: `${STORAGE_BASE}/factions/icon_mago.png`,
      tone: "#5b8bf5",
      discipline: "Control y arcano",
    },
    Paladín: {
      background: `${STORAGE_BASE}/factions/bg_paladin.jpg`,
      icon: `${STORAGE_BASE}/factions/icon_paladin.png`,
      tone: "#e8b84b",
      discipline: "Disciplina y defensa",
    },
    Pícaro: {
      background: `${STORAGE_BASE}/factions/bg_picaro.jpg`,
      icon: `${STORAGE_BASE}/factions/icon_picaro.png`,
      tone: "#3dc96b",
      discipline: "Ritmo y oportunidad",
    },
  },
  regions: {
    forgeCore: `${STORAGE_BASE}/regions/region_forge_core.jpg`,
    ironVeins: `${STORAGE_BASE}/regions/region_iron_veins.jpg`,
    shadowFracture: `${STORAGE_BASE}/regions/region_shadow_fracture.jpg`,
    cindersRealm: `${STORAGE_BASE}/regions/region_cinders_realm.jpg`,
    warboundZone: `${STORAGE_BASE}/regions/region_warbound_zone.jpg`,
  },
};

export const DOWNLOAD_TARGETS = {
  googlePlay: "",
  directAndroid: "",
} as const;

export function readyLink(url: string): string | null {
  const value = url.trim();
  return value.length > 0 ? value : null;
}
