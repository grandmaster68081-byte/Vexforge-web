# VE-MOB-7 — ESTADOS HONESTOS DEL BATTLEFIELD

## Alcance

Unidad Android acotada sobre `mobile/components/ForgeBattlefield.tsx` para que
la presentación de ForgeFormation no convierta HP o turno ausentes en una
señal visual aparentemente confirmada.

## Criterios

- La barra de HP sólo se dibuja cuando HP actual y máximo son números finitos y
  el máximo es mayor que cero.
- Cuando falta HP válido, la tarjeta conserva `HP ACTUAL NO REPORTADO` o
  `HP MÁXIMO NO REPORTADO` sin mostrar una barra vacía como si fuera cero.
- El indicador superior muestra `NO REPORTADO` cuando no existe un turno
  autoritativo utilizable; no usa `—`.
- HP y turnos confirmados conservan sus valores vivos sin transformación.

## Autoridad preservada

No se modifican `vexforge_battle_resolve`, el event log, daño, ganador,
formaciones, RPCs, Auth, RLS, economía ni la web congelada. El cliente sólo
presenta señales ya recibidas del contrato de batalla.

## Gates

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`

Estado esperado: `IMPLEMENTED_UNVERIFIED`; la QA visual/táctil en APK continúa
pendiente de una compilación autorizada por el operador.