import type { ForgeIconName } from "../shared/components/ForgeIcon";

/**
 * VEXFORGE — Lenguaje canónico de iconos de notificaciones.
 *
 * Unidad VE-2-RANK-NOTIF-SHOP-ICON-DATA:
 * el dato oficial `player_notifications.icon` ya no contiene sustitutos
 * Unicode. Guarda un nombre de glifo canónico de ForgeIcon (migración
 * `0008_ve2_rank_notification_shop_icon_canonical.sql`, con respaldo del valor
 * heredado en `public.vexforge_icon_legacy`). El trigger
 * `fn_notify_mission_complete` inserta también un nombre canónico.
 *
 * La presentación resuelve en este orden:
 *   1. `icon` del dato, sólo si pertenece al conjunto canónico permitido.
 *   2. mapa canónico por `type` de la notificación.
 *   3. fallback `notification`.
 *
 * Nunca se renderiza un valor arbitrario del dato: un icono heredado o
 * desconocido degrada al mapa canónico en lugar de mostrarse tal cual.
 */
export const NOTIFICATION_TYPE_ICON: Record<string, ForgeIconName> = {
  system:            "notification",
  mission_reward:    "missions",
  achievement:       "achievements",
  achievement_unlock:"achievements",
  market:            "market",
  market_sale:       "market",
  pvp:               "attack",
  pvp_result:        "attack",
  raid:              "raid",
  pack:              "packs",
  reward:            "gift",
  economy:           "economy",
  withdrawal:        "withdrawal",
  deposit:           "deposit",
  friend:            "friends",
  clan:              "clans",
  admin:             "admin",
};

/** Conjunto blanco derivado del mapa canónico: sólo estos valores del dato se renderizan. */
export const ALLOWED_NOTIFICATION_DATA_ICONS = new Set<string>(
  Object.values(NOTIFICATION_TYPE_ICON)
);

export function resolveNotificationIcon(notif: { type?: string | null; icon?: string | null }): ForgeIconName {
  const fromData = notif.icon ?? "";
  if (ALLOWED_NOTIFICATION_DATA_ICONS.has(fromData)) return fromData as ForgeIconName;
  return NOTIFICATION_TYPE_ICON[notif.type ?? ""] ?? "notification";
}
