import type { ForgeIconName } from "../shared/components/ForgeIcon";

/**
 * VEXFORGE — Lenguaje canónico de iconos de logros.
 *
 * El dato oficial `achievements.icon` de Supabase sigue conteniendo sustitutos
 * Unicode heredados. La capa de presentación NO los renderiza: traduce la
 * categoría canónica del logro a un glifo propio de ForgeIcon.
 * El dato autoritativo no se modifica.
 */
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

export function achievementIcon(category?: string | null): ForgeIconName {
  if (!category) return ACHIEVEMENT_FALLBACK_ICON;
  return ACHIEVEMENT_CATEGORY_ICON[category] ?? ACHIEVEMENT_FALLBACK_ICON;
}
