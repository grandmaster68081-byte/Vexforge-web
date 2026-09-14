# VE-MOB-7 — HONEST OPPONENT SIGNALS

## Target

Arena Android: `mobile/lib/supabase.ts` y `mobile/app/(tabs)/battle.tsx`.

## Bloque

La lista de rivales no debe transformar una identidad, MMR o récord no entregado por el RPC vivo en una entidad o métrica inventada.

## Implementación

- `findOpponents` conserva `null` para nombre, MMR, victorias y derrotas no reportados.
- El tamaño del mazo sólo habilita una fila cuando Supabase entrega un número finito y confirma un mazo real de al menos cinco cartas.
- La Arena comunica `IDENTIDAD NO RESUELTA`, `MMR NO REPORTADO`, `RÉCORD NO REPORTADO` y `DIFERENCIA NO REPORTADA` cuando corresponde.
- El orden por proximidad de MMR deja los MMR ausentes al final sin realizar aritmética sobre valores inexistentes.
- Se mantienen el RPC `get_pvp_opponents`, la selección de oponente, la confirmación, `vexforge_battle_resolve`, la idempotencia y la economía.

## Verificación

- `node scripts/verify-mobile-battle.mjs`
- `git diff --check`
- Supabase oficial, sesión QA de solo lectura: `get_pvp_opponents` devolvió 2 rivales elegibles, ambos con mazo de 5 y señales numéricas presentes.

## Estado honesto

`IMPLEMENTED_UNVERIFIED`. No se ejecuta APK, workflow Android ni release hasta autorización explícita del operador.
