import type { ForgeIconName } from "../shared/components/ForgeIcon";

/**
 * VEXFORGE — Lenguaje canónico de iconos de logros.
 *
 * Unidad VE-2-ACHIEVEMENTS-ICON-DATA:
 * el dato oficial `achievements.icon` de Supabase ya no contiene sustitutos
 * Unicode: guarda un nombre de glifo canónico de ForgeIcon (migración
 * `0007_ve2_achievements_icon_canonical.sql`, con respaldo del valor heredado
 * en `metadata.legacy_icon`).
 *
 * La presentación resuelve en este orden:
 *   1. `icon` del dato, sólo si es un glifo canónico conocido.
 *   2. mapa canónico por `code` del logro (identidad propia por logro).
 *   3. mapa canónico por `category`.
 *   4. fallback `achievements`.
 *
 * Nunca se renderiza un valor arbitrario del dato: un icono desconocido o
 * heredado degrada al mapa canónico en lugar de mostrar un símbolo genérico.
 */

/** Mapa canónico por logro. Fuente: `public.achievements.code` en Supabase. */
export const ACHIEVEMENT_CODE_ICON: Record<string, ForgeIconName> = {
  // bosses
  boss_slayer_1: "boss",
  boss_slayer_5: "skull",
  // collection
  first_rare: "gem",
  first_epic: "spark",
  first_legendary: "star",
  first_mythic: "eclipse",
  collector_25: "collection",
  collector_50: "cards",
  collector_127: "trophy",
  // daily
  daily_streak_7: "calendar",
  daily_streak_30: "flame",
  // economy
  merchant_5: "coin",
  merchant_25: "market",
  // fusion
  forger_5: "fusion",
  forger_25: "evolution",
  forger_100: "flux",
  // missions
  missions_10: "map",
  missions_50: "banner",
  // packs
  pack_opener_10: "packs",
  // pvp
  first_win: "attack",
  pvp_10: "shield",
  pvp_50: "crown",
  pvp_100: "rank-mythic",
  // social
  clan_founder: "clans",
  clan_veteran: "friends",
};

export const ACHIEVEMENT_CATEGORY_ICON: Record<string, ForgeIconName> = {
  all: "achievements",
  missions: "missions",
  collection: "collection",
  bosses: "boss",
  pvp: "arena",
  economy: "economy",
  fusion: "fusion",
  daily: "calendar",
  packs: "packs",
  progression: "progress",
  social: "friends",
  quests: "quests",
  clans: "clans",
};

export const ACHIEVEMENT_FALLBACK_ICON: ForgeIconName = "achievements";

/**
 * Conjunto de glifos aceptados desde el dato. Se deriva de los mapas
 * canónicos: si un día el dato trae otro glifo válido de ForgeIcon pero no
 * autorizado aquí, la UI degrada en vez de renderizar identidad no canónica.
 */
const ALLOWED_DATA_ICONS: ReadonlySet<string> = new Set<string>([
  ...Object.values(ACHIEVEMENT_CODE_ICON),
  ...Object.values(ACHIEVEMENT_CATEGORY_ICON),
  ACHIEVEMENT_FALLBACK_ICON,
]);

export function achievementIcon(category?: string | null): ForgeIconName {
  if (!category) return ACHIEVEMENT_FALLBACK_ICON;
  return ACHIEVEMENT_CATEGORY_ICON[category] ?? ACHIEVEMENT_FALLBACK_ICON;
}

/**
 * Resolución canónica por logro. `icon` es el dato oficial de Supabase.
 */
export function resolveAchievementIcon(ach: {
  code?: string | null;
  category?: string | null;
  icon?: string | null;
}): ForgeIconName {
  const dataIcon = (ach.icon ?? "").trim();
  if (dataIcon && ALLOWED_DATA_ICONS.has(dataIcon)) return dataIcon as ForgeIconName;
  if (ach.code && ACHIEVEMENT_CODE_ICON[ach.code]) return ACHIEVEMENT_CODE_ICON[ach.code];
  return achievementIcon(ach.category);
}
