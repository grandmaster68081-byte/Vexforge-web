/**
 * VEXFORGE — Manifiesto canónico de assets de Storage.
 *
 * Fuente canónica: bucket público `vexforge-assets` del proyecto Supabase
 * oficial. Cada ruta declarada en `VERIFIED_ASSETS` fue comprobada contra
 * `storage.objects` vivo (auditoría VE-3-ASSET-REF-INTEGRITY, 2026-08-16;
 * ampliado en VE-4-CANONICAL-BACKGROUNDS con los 3 fondos propios pendientes,
 * cuya procedencia está registrada en `docs/VE-4-CANONICAL-BACKGROUNDS.md`).
 *
 * Regla de cero genéricos: si una superficie no tiene asset propio en Storage,
 * su entrada es `null` y queda registrada en `PENDING_SOURCE_BACKGROUNDS`.
 * Nunca se sustituye en silencio por arte de otra superficie ni por stock.
 */

export const STORAGE_BASE =
  "https://rscuzqnfccqvltkdcdny.supabase.co/storage/v1/object/public/vexforge-assets";

/** Rutas verificadas como existentes en el bucket oficial. */
export const VERIFIED_ASSETS = [
  "backgrounds/bg_achievements.jpg",
  "backgrounds/bg_bosses.jpg",
  "backgrounds/bg_clans.jpg",
  "backgrounds/bg_leaderboard.jpg",
  "backgrounds/bg_missions.jpg",
  "backgrounds/bg_packs.jpg",
  "backgrounds/bg_pvp.jpg",
  "cover/main.jpg",
  "factions/bg_guerrero.jpg",
  "factions/bg_mago.jpg",
  "factions/bg_paladin.jpg",
  "factions/bg_picaro.jpg",
  "factions/icon_guerrero.png",
  "factions/icon_mago.png",
  "factions/icon_paladin.png",
  "factions/icon_picaro.png",
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
  achievements: storageAsset("backgrounds/bg_achievements.jpg"),
  clans: storageAsset("backgrounds/bg_clans.jpg"),
  forge: storageAsset("heroes/hero_fusion.jpg"),
  leaderboard: storageAsset("backgrounds/bg_leaderboard.jpg"),
  missions: storageAsset("backgrounds/bg_missions.jpg"),
  packs: storageAsset("backgrounds/bg_packs.jpg"),
  pvp: storageAsset("backgrounds/bg_pvp.jpg"),
  raids: storageAsset("backgrounds/bg_bosses.jpg"),
  "world-bosses": storageAsset("backgrounds/bg_bosses.jpg"),
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
}> = [];

/**
 * VE-11-SURFACE-ART-PROVENANCE — emblema oficial de facción.
 *
 * Fuente canónica: filas `faction_icon` del manifiesto oficial
 * (`factions/icon_*.png`, official = true, enabled = true). Sustituyen a los
 * emblemas locales de `public/factions/`, que no estaban inscritos y por tanto
 * no eran arte oficial verificable.
 */
export const FACTION_ICON: Record<string, string> = {
  Guerrero: storageAsset("factions/icon_guerrero.png"),
  Mago: storageAsset("factions/icon_mago.png"),
  "Paladín": storageAsset("factions/icon_paladin.png"),
  "Pícaro": storageAsset("factions/icon_picaro.png"),
};

/** Fondo de arena por facción, resuelto siempre desde el manifiesto. */
export const FACTION_BACKGROUND: Record<string, string> = {
  Guerrero: storageAsset("factions/bg_guerrero.jpg"),
  Mago: storageAsset("factions/bg_mago.jpg"),
  "Paladín": storageAsset("factions/bg_paladin.jpg"),
  "Pícaro": storageAsset("factions/bg_picaro.jpg"),
};

/**
 * Arte de superficie inscrito y oficial que aún no consume ninguna superficie.
 * Queda como reserva declarada y reversible: no se elimina del bucket ni se
 * sustituye por otro arte, y sólo se promueve con una decisión registrada.
 */
export const RESERVED_SURFACE_ART: ReadonlyArray<string> = [
  "heroes/hero_profile.jpg",
  "heroes/hero_progress.jpg",
  "heroes/hero_economy.jpg",
  "heroes/hero_settings.jpg",
  "heroes/hero_inventory_locked.jpg",
  "regions/region_forge_core.jpg",
  "regions/region_iron_veins.jpg",
  "regions/region_shadow_fracture.jpg",
  "regions/region_cinders_realm.jpg",
  "regions/region_warbound_zone.jpg",
  "events/events_season_hero.jpg",
];
