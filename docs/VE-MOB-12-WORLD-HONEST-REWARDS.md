# VE-MOB-12 WORLD — HONEST REWARD SIGNALS

## Alcance

Delta Android acotado sobre `mobile/app/world.tsx` para conservar la
fidelidad de las recompensas publicadas por Supabase en Bosses y Pase.

## Criterios

- Un cero numérico confirmado se muestra como cero.
- Un campo de recompensa presente pero nulo, no numérico o inválido se muestra
  como `NO REPORTADO`, no como cero ni como texto omitido.
- Los tipos de recompensa que no incluyen un campo opcional no reciben datos
  inventados; si no hay ninguna señal renderizable, se muestra
  `RECOMPENSA SIN DETALLE`.
- La misma función conserva el contrato de Bosses y de tiers de temporada.

## Autoridad preservada

No se modifican RPCs, tablas, RLS, Auth, economía, contratos de combate, assets
ni la web congelada. El cliente sólo presenta los valores recibidos dentro de
`reward_pool` y `reward_json`.

## Gates

- `node scripts/verify-mobile-world.mjs`
- `git diff --check`

Estado esperado: `IMPLEMENTED_UNVERIFIED`; la QA visual/táctil en APK continúa
pendiente de una compilación autorizada por el operador.