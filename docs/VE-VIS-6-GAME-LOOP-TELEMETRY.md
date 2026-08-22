# VE-VIS-6 — Telemetría del bucle de juego (PLAN DE EJECUCIÓN)

**Fecha:** 2026-08-22
**Unidad:** `VE-VIS-6-GAME-LOOP-TELEMETRY`
**Criterio bloqueante:** `game_loop_telemetry` (fase 4 de
`public.vexforge_visual_tier1_objective`)
**Estado declarado:** `PLANNED` — **no hay ninguna línea de esta unidad en `main`**
**Nivel Q:** sin asignar (no existe implementación ni evidencia)
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md`,
`public.vexforge_visual_tier1_objective`, `public.vexforge_project_decisions`.

> Este documento es el trazado canónico y único de la unidad. Cualquier sesión
> que retome `VE-VIS-6-GAME-LOOP-TELEMETRY` ejecuta exactamente los pasos de la
> sección «Secuencia de ejecución», en ese orden, sin reinterpretarlos.

## 0. Hecho verificado del baseline (2026-08-22)

La sesión anterior escribió la implementación en un clon temporal y agotó
créditos antes de commitear. El clon fue destruido. Verificado contra `main`
(baseline `7fb7db0`):

| Artefacto esperado | Estado real en `main` |
| --- | --- |
| `supabase/migrations/0039_ve_vis_6_game_loop_telemetry.sql` | **AUSENTE** (la última migración es `0038`) |
| `src/lib/telemetry.ts` | **AUSENTE** |
| `scripts/verify-telemetry.mjs` | **AUSENTE** |
| Instrumentación en `App.tsx`, `FusionRoute.tsx`, `BattleResultScreen.tsx`, `QuestsRoute.tsx` | **AUSENTE** |
| `verify:telemetry` en `package.json` | **AUSENTE** |
| Migración `0039` aplicada en `rscuzqnfccqvltkdcdny` | **NO APLICADA** |
| Criterio `game_loop_telemetry` | **NO está `MET`** |

Conclusión canónica: la unidad **no está `IMPLEMENTED_UNVERIFIED`**. Su estado
real es `PLANNED / NOT_STARTED` y debe reconstruirse desde cero según este
plan. Ninguna sesión futura debe asumir código previo existente.

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
   eventos ⇒ la guarda falla y el criterio no puede declararse `MET`.

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
