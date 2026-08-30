# VE-VIS-6 — Telemetría del bucle de juego (PLAN DE EJECUCIÓN)

**Fecha:** 2026-08-22
**Unidad:** `VE-VIS-6-GAME-LOOP-TELEMETRY`
**Criterio bloqueante:** `game_loop_telemetry` (fase 4 de
`public.vexforge_visual_tier1_objective`)
**Estado declarado:** `IMPLEMENTED_UNVERIFIED` — implementación en `main`, sin cobertura viva
completa
**Nivel Q:** Q2 actual / Q3 objetivo
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md`,
`public.vexforge_visual_tier1_objective`, `public.vexforge_project_decisions`.

> Este documento es el trazado canónico y único de la unidad. Cualquier sesión
> que retome `VE-VIS-6-GAME-LOOP-TELEMETRY` ejecuta exactamente los pasos de la
> sección «Secuencia de ejecución», en ese orden, sin reinterpretarlos.

## 0. Hecho verificado del baseline y estado actual (2026-08-22)

La sesión anterior dejó el plan, pero no el código en `main`. La sesión actual
recuperó `main` en `acec3e6c10fb4f846cf1c1bdd186975889010a1d`, ejecutó el baseline y reconstruyó la unidad en la
raíz oficial. El repositorio ya contiene migración, emisor, instrumentación y
guarda. La auditoría viva además encontró que las tablas y la función habían
aparecido en Supabase sin una migración equivalente en `main`; 0039 las
reconcilia y corrige sus grants.

| Artefacto esperado | Estado real en `main` |
| --- | --- |
| `supabase/migrations/0039_ve_vis_6_game_loop_telemetry.sql` | **PRESENTE** y aplicada/reconciliada |
| `src/lib/telemetry.ts` | **PRESENTE** |
| `scripts/verify-telemetry.mjs` | **PRESENTE** |
| Instrumentación en `App.tsx`, `FusionRoute.tsx`, `BattleResultScreen.tsx`, `QuestsRoute.tsx` | **PRESENTE** |
| `verify:telemetry` en `package.json` | **PRESENTE**, encadenada en `verify:all` |
| Migración `0039` aplicada en `rscuzqnfccqvltkdcdny` | **SÍ**, con grants/policies auditados |
| Cobertura viva de las cinco claves | **0/5**, sin emisiones QA |
| Criterio `game_loop_telemetry` | **NO está `MET`** |

Conclusión canónica: la unidad dejó `PLANNED / NOT_STARTED` y ahora está
`IMPLEMENTED_UNVERIFIED`. La guarda de CI comprueba el contrato, el catálogo y
la forma de la cobertura sin depender de tráfico histórico; reporta las claves
que aún no han sido observadas. La comprobación estricta conserva el requisito
de cobertura viva con `REQUIRE_LIVE_TELEMETRY=1`. No se declara `MET` ni
`OPERATIONAL` mientras falte una emisión real por clave.

## 1. Objetivo

Cerrar la brecha bloqueante `game_loop_telemetry`: el bucle de juego
(entrar → forjar → combatir → cobrar → volver) debe emitir eventos canónicos,
persistirlos con RLS estricta por jugador y exponer una cobertura medible y
reproducible que una guarda pueda exigir.

## 2. Contrato de datos (migración `0039`)

- `public.vexforge_telemetry_event_catalog`
  - Catálogo de lectura pública (`select` a `anon` y `authenticated`), RLS
    activada, grants explícitos, `service_role` con `all`.
  - Cinco eventos canónicos sembrados, sin más: `session_start`,
    `forge_action`, `combat_resolved`, `reward_claimed`, `return_visit`.
  - Columnas: clave del evento, fase del bucle, descripción y orden.
- `public.vexforge_telemetry_events`
  - Una fila por evento emitido. `user_id` con `default auth.uid()`.
  - RLS estricta: `insert` y `select` sólo `auth.uid() = user_id`; sin `update`
    ni `delete` para el jugador; `service_role` con `all`.
  - Grants explícitos (`select, insert` a `authenticated`; **ningún** grant a
    `anon`). Índices por `user_id`, `event_key` y `created_at`.
  - `payload jsonb` sin datos personales ni credenciales.
- `public.vexforge_telemetry_coverage()`
  - `security definer`, `search_path` fijo, `stable`. Devuelve una fila por
    evento del catálogo con el recuento agregado (nunca filas de jugador ni
    `user_id`). `execute` a `anon` y `authenticated`.
- `comment on` obligatorio: las dos tablas, sus 11 columnas y la función.
- Registro de la decisión oficial `VE-VIS-6-GAME-LOOP-TELEMETRY` en
  `public.vexforge_project_decisions` (`status = 'official'`, `payload` con
  unidad, criterio, eventos, comandos de evidencia y `reopen_when`).
- **El criterio `game_loop_telemetry` NO se pone `MET` en esta migración.**
  Pasa a `MET` en una migración posterior (`0040`), sólo cuando la cobertura en
  vivo sea > 0 para las cinco claves. Esta es una ley de la unidad.

## 3. Emisor de cliente (`src/lib/telemetry.ts`)

- Best-effort absoluto: nunca lanza, nunca bloquea render, nunca reintenta en
  bucle, nunca escribe si no hay sesión autenticada.
- Un identificador de sesión de cliente por pestaña y umbral de visita de
  retorno de 8 h.
- Sólo emite las cinco claves canónicas; una clave desconocida es un error de
  tipos en compilación, no un fallo en runtime.

## 4. Consumidores instrumentados

| Superficie | Evento |
| --- | --- |
| `src/App.tsx` | `session_start`, `return_visit` |
| `src/routes/FusionRoute.tsx` | `forge_action` |
| `src/components/battle/BattleResultScreen.tsx` | `combat_resolved` |
| `src/routes/QuestsRoute.tsx` | `reward_claimed` |

## 5. Guarda (`scripts/verify-telemetry.mjs`)

Doble comprobación, encadenada en `verify:all`:

1. **Contrato estático de repo**: existen el emisor, las cinco claves y los
   cuatro consumidores instrumentados.
2. **Cobertura en vivo con rol `anon`**: `vexforge_telemetry_coverage()`
   devuelve las cinco claves y exige **≥ 1 evento real por clave**. Cero
   eventos ⇒ el criterio no puede declararse `MET`; el gate estricto se ejecuta
   con `REQUIRE_LIVE_TELEMETRY=1`.

## 6. Límites preservados (no negociables)

No se toca combate autoritativo, cálculo de daño, orden de turnos, settlement,
recompensas, economía, RPCs autoritativas, autenticación, Storage, arte ni
lore. No se usa `service_role` desde el cliente ni desde scripts de
verificación. Telemetría es observación, nunca fuente de verdad de juego.

## 7. Secuencia de ejecución (orden obligatorio)

1. Reescribir `supabase/migrations/0039_ve_vis_6_game_loop_telemetry.sql` según
   la sección 2, **sin** el `update` a `MET`.
2. Reescribir `src/lib/telemetry.ts` (sección 3).
3. Instrumentar los cuatro consumidores (sección 4).
4. Crear `scripts/verify-telemetry.mjs` (sección 5).
5. Encadenar en `package.json`: `verify:telemetry` en `scripts` y dentro de
   `verify:all`.
6. Aplicar la migración `0039` en `rscuzqnfccqvltkdcdny` vía Management API.
7. Emitir los cinco eventos con la cuenta QA canónica autorizada, recorriendo
   el bucle real en el deploy vivo (entrar, forjar, combatir, cobrar, volver
   tras el umbral).
8. Ejecutar `npm run typecheck`, `npm run verify:telemetry`,
   `npm run verify:build` y `npm run verify:all` (deuda conocida: HTTP 429 de
   Storage).
9. Sólo con la cobertura en vivo > 0 en las cinco claves: migración `0040` que
   pone `game_loop_telemetry` en `MET` con `current_value`, `verify_command` y
   `verified_at` reales.
10. Cerrar: actualizar este documento con la evidencia, añadir el bloque en
    `CONTINUITY.md`, push a `main` y verificar el commit en
    `https://vexforge-web.pages.dev/build-manifest.json`.

## 8. Criterios de aceptación

La unidad sólo es `OPERATIONAL` cuando **todos** se cumplen:

- `main` contiene migración, emisor, instrumentación y guarda.
- `verify:telemetry` está encadenada en `verify:all` y pasa en verde.
- Cobertura en vivo ≥ 1 por cada una de las cinco claves.
- `game_loop_telemetry` está `MET` con `verify_command` y `verified_at`.
- `build-manifest.json` del deploy vivo coincide con el commit de cierre.

Si falta cualquiera, el estado correcto es `IMPLEMENTED_UNVERIFIED`, y así debe
declararse en `CONTINUITY.md`.

## 9. Condición de reapertura

Se añade o retira un evento del bucle; una superficie del bucle deja de emitir;
la cobertura en vivo de una clave cae a 0; o la RLS de
`vexforge_telemetry_events` deja de aislar por `auth.uid()`.

## 10. Evidencia de la sesión de implementación (2026-08-22)

- `npm run typecheck`: correcto.
- `npm run verify:build`: correcto; el build local contiene el emisor y la
  instrumentación.
- `npm run verify:telemetry`: correcto en modo CI; la sonda confirma que las
  cinco claves existen y reporta las claves aún sin observaciones reales. Para
  exigir tráfico vivo se usa `REQUIRE_LIVE_TELEMETRY=1 npm run verify:telemetry`,
  que falla correctamente hasta recorrer el bucle con una sesión QA real.
- Supabase vivo: `vexforge_telemetry_event_catalog` tiene las cinco claves;
  `vexforge_telemetry_events` conserva RLS por `auth.uid()`, `anon` no tiene
  grants de tabla y la cobertura es agregada sin `user_id`.
- Deploy público: `build-manifest.json` declara el commit
  `7a90648b87be201054321d8e6ca68ac3f2f1dbe5` y la raíz responde HTTP 200.
- Bloqueo real: no existe en el entorno una sesión normal autenticada de la
  cuenta QA canónica. No se usa `service_role`, no se fabrican resultados y no
  se aplica 0040.
- Siguiente acción verificable: recorrer el bucle real en el deploy con una
  sesión QA autorizada, comprobar al menos una emisión de cada clave mediante
  la función de cobertura como `anon`, aplicar 0040 y volver a verificar el
  deploy.
