# VE-MOB-9 — SEÑAL HONESTA DE RACHA

## Alcance

El Perfil Android ya no presenta una racha de `0` mientras la fuente social
todavía no ha sincronizado. La ausencia de `matches` se muestra como `—`;
cuando Supabase confirma una lista vacía, la racha real continúa siendo `0`.

## Límites

- No se altera el cálculo de victorias, derrotas ni historial.
- No se inventan partidas, resultados, ELO ni actividad social.
- No se modifican RPCs, Auth, economía, navegación ni la web congelada.

## Estado

`IMPLEMENTED_UNVERIFIED`. La guarda estática valida la separación entre señal
ausente y racha confirmada; la revisión visual queda pendiente de APK autorizada.