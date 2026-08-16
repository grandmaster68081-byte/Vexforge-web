/**
 * VEXFORGE — Manifiesto canónico de assets de Storage.
 *
 * Fuente canónica: bucket público `vexforge-assets` del proyecto Supabase
 * oficial. Cada ruta declarada en `VERIFIED_ASSETS` fue comprobada contra
 * `storage.objects` vivo (auditoría VE-3-ASSET-REF-INTEGRITY, 2026-08-16).
 *
 * Regla de cero genéricos: si una superficie no tiene asset propio en Storage,
 * su entrada es `null` y queda registrada en `PENDING_SOURCE_BACKGROUNDS`.
 * Nunca se sustituye en silencio por arte de otra superficie ni por stock.
 */

export const STORAGE_BASE =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets";

/** Rutas verificadas como existentes en el bucket oficial. */
export const VERIFIED_ASSETS = [
  "backgrounds/bg_clans.jpg",
  "backgrounds/bg_missions.jpg",
  "backgrounds/bg_packs.jpg",
  "backgrounds/bg_pvp.jpg",
  "cover/main.jpg",
  "factions/bg_guerrero.jpg",
  "factions/bg_mago.jpg",
  "factions/bg_paladin.jpg",
  "factions/bg_picaro.jpg",
  "heroes/hero_assets.jpg",
  "heroes/hero_fusion.jpg",
  "heroes/hero_market.jpg",
  "lobby/main.jpg",
  "logo/IMG_20260606_040509_906.jpg",
] as const;

export type VerifiedAssetPath = (typeof VERIFIED_ASSETS)[number];

/** URL pública de un asset canónico verificado. */
export function storageAsset(path: VerifiedAssetPath): string {
  return `${STORAGE_BASE}/${path}`;
}

/**
 * Fondo canónico por superficie. `null` significa PENDING_SOURCE: la superficie
 * se renderiza con su tratamiento base de VEXFORGE, sin pedir una imagen
 * inexistente y sin sustituto genérico.
 */
export const SURFACE_BACKGROUND: Record<string, string | null> = {
  achievements: null,
  clans: storageAsset("backgrounds/bg_clans.jpg"),
  forge: storageAsset("heroes/hero_fusion.jpg"),
  leaderboard: null,
  missions: storageAsset("backgrounds/bg_missions.jpg"),
  packs: storageAsset("backgrounds/bg_packs.jpg"),
  pvp: storageAsset("backgrounds/bg_pvp.jpg"),
  raids: null,
  "world-bosses": null,
};

/** Fondo de una superficie, o `null` si su asset propio aún no existe. */
export function surfaceBackground(surface: keyof typeof SURFACE_BACKGROUND | string): string | null {
  return SURFACE_BACKGROUND[surface] ?? null;
}

/**
 * Deuda de assets registrada: ruta esperada en Storage y brief del recurso
 * propio que falta. No generar ni sustituir sin decisión canónica.
 */
export const PENDING_SOURCE_BACKGROUNDS: ReadonlyArray<{
  surface: string;
  expectedPath: string;
  brief: string;
}> = [
  {
    surface: "achievements",
    expectedPath: "backgrounds/bg_achievements.jpg",
    brief: "Salón de logros de la Forja: muros de placas grabadas, luz cenital fría.",
  },
  {
    surface: "leaderboard",
    expectedPath: "backgrounds/bg_leaderboard.jpg",
    brief: "Gradas de la arena de temporada con estandartes de rango.",
  },
  {
    surface: "raids",
    expectedPath: "backgrounds/bg_bosses.jpg",
    brief: "Umbral de incursión: fractura colosal sobre la Zona de Guerra.",
  },
  {
    surface: "world-bosses",
    expectedPath: "backgrounds/bg_bosses.jpg",
    brief: "Mismo fondo canónico de incursión, compartido con la superficie de raids.",
  },
];
