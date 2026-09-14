# VE-MOB-12 WORLD — HONEST MISSING SIGNALS

## Alcance

Corrección Android acotada sobre `mobile/app/world.tsx` para que la superficie
World no convierta datos ausentes del snapshot autoritativo en valores aparentes.
El arte oficial y el lore de los jefes también deben comunicar su ausencia sin
dejar un bloque vacío ni declarar una sincronización que no fue confirmada.

## Criterios

- El lore de un jefe sin metadata viva comunica `LORE NO REPORTADO`.
- El arte de un jefe sin `image_url` utilizable comunica `ARTE DEL JEFE NO REPORTADO`.
- Dificultad, límite de participantes y multiplicador de raid muestran estados no
  reportados cuando el metadata no los entrega.
- XP, tier y progreso de temporada sólo se muestran como números cuando llegan
  como valores finitos; no se dibuja una barra de progreso con `0` inventado.
- El ranking no fabrica nombres públicos ni porcentaje de victorias cuando no
  existe un historial de partidas.
- Los ceros confirmados siguen siendo ceros.

## Autoridad preservada

No se modifican RPCs, tablas, RLS, Auth, resolución de combate, recompensas,
assets ni la web congelada. El cliente continúa presentando únicamente datos del
snapshot de `mobile/lib/supabase.ts`.

## Gates

- `node scripts/verify-mobile-world.mjs`
- `git diff --check`
- Typecheck móvil y workflow APK quedan pendientes de una ventana autorizada.

Estado esperado: `IMPLEMENTED_UNVERIFIED` hasta QA visual/táctil en APK.