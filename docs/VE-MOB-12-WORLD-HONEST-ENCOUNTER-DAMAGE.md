# VE-MOB-12 WORLD — HONEST ENCOUNTER DAMAGE

## Alcance

Delta Android acotado sobre `mobile/app/world.tsx` para conservar la señal de
daño propio de los encuentros de Bosses.

## Criterios

- Sin encuentros propios no se muestra una métrica inventada.
- Un encuentro con daño `0` confirmado muestra `TÚ 0`.
- Un encuentro con daño ausente o inválido muestra `TÚ DAÑO NO REPORTADO`.
- La vista no calcula ni muta daño; sólo suma valores numéricos entregados por
  los encuentros autoritativos.

## Autoridad preservada

No se modifican RPCs, tablas, RLS, Auth, combate, recompensas, assets ni la web
congelada. Se mantiene el contrato de `MobileBossEncounter`.

## Gates

- `node scripts/verify-mobile-world.mjs`
- `git diff --check`

Estado esperado: `IMPLEMENTED_UNVERIFIED`; la QA visual/táctil en APK continúa
pendiente de una compilación autorizada por el operador.