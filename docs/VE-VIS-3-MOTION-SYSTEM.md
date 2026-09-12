# VE-VIS-3 — Sistema unificado de motion

**Fecha:** 2026-08-21  
**Tipo:** Implementación + verificación estática  
**Unidad:** `VE-VIS-3-MOTION-SYSTEM`  
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md` y `public.vexforge_visual_tier1_objective`.

## Objetivo

Cerrar la brecha bloqueante `motion_and_feedback` con un contrato pequeño, reutilizable y reconocible para que las entradas de pantalla, el feedback de interacción y las escenas de batalla compartan tiempos, easing y distancias, sin tocar resultados autoritativos.

## Cambios

- `src/styles.css`: 17 tokens (`dur`, `ease` y `dist`), ocho clases públicas (`motion-surface`, `motion-stagger`, `motion-press`, `motion-lift`, `motion-scene`, `motion-impact`, `motion-nudge`, `motion-reveal`), keyframes del contrato y fallback global de `prefers-reduced-motion`.
- `src/App.tsx`: la transición de ruta consume `motion-scene`.
- `src/routes/HomeRoute.tsx`: la superficie, CTAs, estadísticas y tarjetas de funciones consumen el contrato.
- `src/components/battle/BattleResultScreen.tsx`: escena, sigilo, halo, filas de estadísticas, racha y acciones consumen el contrato; se retiran keyframes locales duplicados.
- `scripts/verify-motion.mjs`: guarda encadenada que comprueba los 17 tokens, ocho clases, reduced motion y los tres consumidores.
- `package.json`: `verify:motion` queda dentro de `verify:all`.
- `supabase/migrations/0036_ve_vis_3_motion_system.sql`: actualiza el criterio y registra la decisión oficial sólo después de la evidencia local.

## Límites preservados

No se modifican combate autoritativo, daño, settlement, recompensas, economía, RPCs, RLS, autenticación, Storage, lore, nombres canónicos, estadísticas ni assets.

## Accesibilidad, responsive y rendimiento

- `prefers-reduced-motion: reduce` desactiva animaciones, transformaciones y transiciones no esenciales, y desactiva el smooth scrolling.
- Las clases no añaden foco ni contenido; los iconos y controles conservan sus contratos existentes.
- El contrato usa `transform`, `opacity` y `filter` para limitar el trabajo de layout.
- Las superficies existentes mantienen sus breakpoints; no se añaden dimensiones fijas ni overflow.

## Evidencia

- `npm run typecheck` — correcto.
- `npm run verify:motion` — 17 tokens, 8 clases, reduced motion y 3 consumidores — correcto.
- `npm run verify:build` — correcto; build generado desde la raíz y manifest enlazado a `HEAD`.
- `npm run verify:all` — debe permanecer verde tras encadenar la nueva guarda.

## Estado

- Inicial: `NOT_STARTED`.
- Objetivo: `OPERATIONAL`.
- Nivel: `Q3` actual / `Q3` objetivo para este lote.

## Deuda y reapertura

La unidad se reabre si una superficie crítica introduce motion fuera del contrato, la guarda pierde cobertura o falla el fallback de reduced motion. La dirección de escena de combate, audio y feedback económico siguen siendo unidades posteriores y no se declaran cerradas por este sistema base.
