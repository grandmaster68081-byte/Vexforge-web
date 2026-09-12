# VE-VIS-4 — Dirección de escena de combate

**Fecha:** 2026-08-21  
**Tipo:** Implementación + verificación proporcional  
**Unidad:** `VE-VIS-4-COMBAT-SCENE-DIRECTION`  
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md` y `public.vexforge_visual_tier1_objective`.

## Objetivo

Cerrar la brecha bloqueante `combat_scene_direction`: cada turno resuelto debe comunicar
visualmente qué ocurrió, sin convertir la capa visual en autoridad sobre daño, victoria,
recompensas o settlement.

## Cambios

- `src/components/battle/InteractiveBattleBoard.tsx`: añade `CombatActionCue`, un cue
  semántico accesible durante la fase `ANIMATING`.
- El cue deriva exclusivamente de `BattleTurnData` y prioriza los eventos reales del turno:
  KO, bloqueo, veneno, doble golpe, drenaje, crítico e impacto normal.
- `src/styles.css`: añade la presentación y entrada del cue, con fallback explícito para
  `prefers-reduced-motion: reduce`.
- `scripts/verify-combat-scene.mjs`: guarda que cubre todas las ramas de eventos y labels,
  el rol accesible y el fallback de reduced motion.
- `package.json`: encadena `verify:combat-scene` en `verify:all`.
- `supabase/migrations/0037_ve_vis_4_combat_scene_direction.sql`: registra la evidencia
  y actualiza el criterio oficial sólo después de la verificación local.

## Límites preservados

No se modifican el motor autoritativo, daño, orden de turnos, settlement, recompensas,
economía, RPCs, RLS, autenticación, Storage, lore, estadísticas ni assets.

## Accesibilidad, responsive y rendimiento

- El cue usa `role="status"` y `aria-live="polite"` para comunicar el evento sin tomar el foco.
- Su ancho se limita al viewport en móvil; no crea scroll horizontal ni controles nuevos.
- La animación usa opacity/transform/filter y queda desactivada con reduced motion.
- Los textos se construyen con nombres y valores entregados por el turno real; no se inventan
  resultados ni nombres canónicos.

## Evidencia

- `npm run typecheck` — correcto.
- `npm run verify:combat-scene` — correcto: 7 ramas de eventos, 7 labels, estado accesible
  y reduced motion.
- `npm run verify:build` — correcto.
- `npm run verify:all` — la cadena llega a las guardas de Storage; los fallos observados son
  respuestas HTTP 429 reintentables del bucket, no fallos del contrato de escena.

## Estado y reapertura

- Estado inicial: `NOT_STARTED`.
- Estado objetivo: `OPERATIONAL`.
- Nivel Q: `Q3` actual / `Q3` objetivo.
- Reapertura: una nueva acción de combate sin cue dedicado, una rama de evento no cubierta,
  pérdida del anuncio accesible o regresión de reduced motion.
- Siguiente unidad: `VE-VIS-5-AUDIO-FLOW`, una vez confirmada la publicación de esta unidad.