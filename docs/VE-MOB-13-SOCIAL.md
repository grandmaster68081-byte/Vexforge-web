# VE-MOB-13 — SOCIAL

## Alcance

Portar a Android la superficie social agregadora de VEXFORGE:

- Friends: lista de amistades aceptadas, solicitudes recibidas, aceptación/rechazo, alta por UUID y desafíos directos.
- Clans: descubrimiento, creación, unión, salida, roster, contribución visible y declaración de guerras.
- Arena social: ranking PvP público, temporada activa, historial reciente y acceso a Battle Run para resolver combates.
- Estados explícitos de carga, vacío, error, sesión, refresh y feedback de acciones; controles accesibles y formularios compactos.

La ruta Android es una superficie no-tab accesible desde Perfil. Sus paneles no calculan MMR, victorias, daño, recompensas, roster ni resultados de guerra.

## Contratos vivos

- Tablas friendships, direct_challenges, clans, clan_members, clan_wars, pvp_seasons y pvp_matches.
- RPCs send_friend_request, accept_friend_request, decline_friend_request, send_challenge, respond_to_challenge, create_clan, join_clan, leave_clan, vexforge_start_guild_war, get_public_player_names y get_public_pvp_rankings.
- La resolución de combate permanece en vexforge_battle_resolve desde mobile/app/(tabs)/battle.tsx; Social sólo navega a Arena.

## Regla de integridad

- Las mutaciones se consideran exitosas únicamente cuando el RPC devuelve ok/success verdadero.
- Los nombres, niveles, ranking, historial y roster se consumen desde Supabase/RPC; no se fabrican datos para rellenar la interfaz.
- send_challenge usa el mazo opcional por defecto del RPC y no duplica la resolución de Battle Run.

## Assets y accesibilidad

- La ruta usa exclusivamente el fondo canónico backgrounds/bg_clans.jpg a través de CANONICAL_BACKGROUNDS.
- No incorpora imágenes externas ni iconos genéricos: usa el catálogo Feather de VEXFORGE.
- Cada acción tiene accessibilityRole, accessibilityLabel y testID; los estados de servidor se anuncian como alerta.
- Los formularios utilizan modal nativo; el resultado de guerra se presenta como estado registrado, nunca como victoria simulada.

## Gates técnicos

1. Typecheck móvil y verificación del bundle Expo sin errores.
2. Workflow Android oficial en success y release APK publicado.
3. La continuidad conserva IMPLEMENTED_UNVERIFIED hasta QA humana en un dispositivo Android real; no se declara OPERATIONAL, PASS ni TIER1_READY sólo por compilar.

## Estado y evidencia

Estado de implementación: IMPLEMENTED_UNVERIFIED.
