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

/**
 * VE-VIS-5-AUDIO-FLOW — catálogo canónico de audio procedural.
 *
 * El proyecto adoptó Web Audio API como fuente oficial para audio: no hay
 * archivos externos que sustituir ni rutas de Storage que inventar. Estas
 * entradas son los identificadores estables de los generadores que consume
 * `audioEngine.ts`, con sus contextos y consumidores declarados.
 */
export const AUDIO_MANIFEST = [
  { id: "ambient:hub", source: "web-audio-procedural", contexts: ["hub"] },
  { id: "ambient:battle", source: "web-audio-procedural", contexts: ["battle"] },
  { id: "ambient:missions", source: "web-audio-procedural", contexts: ["missions"] },
  { id: "ambient:market", source: "web-audio-procedural", contexts: ["market"] },
  { id: "ambient:bosses", source: "web-audio-procedural", contexts: ["bosses"] },
  { id: "ambient:social", source: "web-audio-procedural", contexts: ["social"] },
  { id: "combat:intro", source: "web-audio-procedural", contexts: ["battle"] },
  { id: "combat:mid", source: "web-audio-procedural", contexts: ["battle"] },
  { id: "combat:last-stand", source: "web-audio-procedural", contexts: ["battle"] },
  { id: "sfx:ui", source: "web-audio-procedural", contexts: ["hub", "market", "social"] },
  { id: "sfx:combat", source: "web-audio-procedural", contexts: ["battle"] },
  { id: "sfx:rewards", source: "web-audio-procedural", contexts: ["missions", "market"] },
] as const;

export type AudioManifestEntry = (typeof AUDIO_MANIFEST)[number];

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


/**
 * VE-12-RESIDUAL-ART-PROVENANCE — arte residual del manifiesto oficial.
 *
 * Roles residuales (los que no cubren las guardas de jefes, cartas ni
 * superficie): boost_*, frame_*, icon_*, logo_variant_*, progression_*,
 * reward_*, chest_hero, cover_hero, lobby_hero, market_hero, tutorial_hero,
 * wallet_hero y las filas `*_collection`.
 *
 * Consumo canónico actual: `cover/main.jpg` (portada de cuenta),
 * `lobby/main.jpg` (portada de inicio) y `logo/IMG_20260606_040509_906.jpg`
 * (logotipo oficial), todos resueltos con `storageAsset()`.
 *
 * El resto queda como reserva declarada y reversible: arte oficial inscrito y
 * disponible en Storage que ninguna superficie consume todavía. No se elimina,
 * no se sustituye y sólo se promueve con una decisión nueva registrada.
 */
export const RESERVED_RESIDUAL_ART: ReadonlyArray<string> = [
  "boosts/IMG_20260606_040525_480.jpg",
  "boosts/IMG_20260606_040527_020.jpg",
  "boosts/IMG_20260606_040529_139.jpg",
  "boosts/IMG_20260606_040529_674.jpg",
  "chests/main.jpg",
  "frames/IMG_20260606_040532_520.jpg",
  "frames/IMG_20260606_040534_461.jpg",
  "frames/IMG_20260606_040535_955.jpg",
  "frames/IMG_20260606_040537_201.jpg",
  "frames/IMG_20260606_040538_151.jpg",
  "frames/IMG_20260606_040539_689.jpg",
  "icons/IMG_20260606_040505_192.jpg",
  "icons/IMG_20260606_040506_475.jpg",
  "icons/IMG_20260606_040508_371.jpg",
  "icons/IMG_20260619_114322.jpg",
  "icons/IMG_20260619_114717.jpg",
  "icons/IMG_20260619_114852.jpg",
  "icons/IMG_20260619_115309.jpg",
  "logo/IMG_20260606_040542_755.jpg",
  "logo/IMG_20260606_040543_962.jpg",
  "logo/IMG_20260606_040544_619.jpg",
  "logo/IMG_20260606_040546_258.jpg",
  "market/main.jpg",
  "progression/IMG_20260619_120425.jpg",
  "progression/IMG_20260619_120838.jpg",
  "progression/IMG_20260619_121047.jpg",
  "rewards/IMG_20260619_111433.jpg",
  "tutorial/main.png",
  "wallet/main.jpg",
];

/**
 * Filas `*_collection` del manifiesto: marcadores de prefijo del bucket, no
 * objetos servibles. Nunca se referencian como imagen desde el código.
 */
export const MANIFEST_BUNDLE_PREFIXES: ReadonlyArray<string> = [
  "backgrounds/",
  "boosts/",
  "chests/",
  "clans/",
  "cover/",
  "events/",
  "founders/",
  "frames/",
  "icons/",
  "lobby/",
  "logo/",
  "market/",
  "misc/",
  "progression/",
  "rewards/",
  "sessions/",
  "tutorial/",
  "ui sistema/",
  "wallet/",
];
