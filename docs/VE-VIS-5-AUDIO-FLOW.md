# VE-VIS-5 — Flujo de audio

**Fecha:** 2026-08-21  
**Tipo:** Implementación + verificación proporcional  
**Unidad:** `VE-VIS-5-AUDIO-FLOW`  
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md`,
`public.vexforge_visual_tier1_objective` y las decisiones oficiales de audio.

## Objetivo

Cerrar la brecha bloqueante `audio_flow`: el audio debe tener procedencia
declarada, identificadores estables, cobertura musical en cuatro contextos y
feedback sonoro para navegación, combate y recompensas.

## Implementación

- `src/lib/assetManifest.ts` declara `AUDIO_MANIFEST` como catálogo canónico de
  audio procedural. Cada entrada registra identificador, fuente y contextos;
  no se inventan archivos de Storage.
- `src/lib/audioEngine.ts` conserva Web Audio API como generador oficial:
  ambient por sección, tres fases de música de combate, SFX de UI, combate y
  recompensas.
- `src/providers/AudioProvider.tsx` conserva el desbloqueo por gesto, el
  crossfade de navegación y los seis contextos existentes.
- `scripts/verify-audio-flow.mjs` comprueba 12 entradas, cuatro contextos
  requeridos, marcadores de motor y desbloqueo por gesto.

## Límites preservados

No se modifican combate autoritativo, daño, orden de turnos, settlement,
recompensas, economía, RPCs, RLS, autenticación, Storage, lore ni estadísticas.
El audio sólo presenta feedback y ambiente.

## Accesibilidad, responsive y rendimiento

- El audio no toma el foco y requiere gesto del usuario para vencer la política
  de autoplay del navegador.
- Los controles existentes conservan mute, volumen de música y volumen de SFX.
- `prefers-reduced-motion` sigue gobernando la presentación visual asociada; el
  audio no introduce animaciones ni overflow.
- El manifiesto usa IDs ligeros y no descarga recursos externos.

## Evidencia

- `npm run typecheck`
- `npm run verify:audio-flow`
- `npm run verify:build`
- `npm run verify:all` hasta las guardas dependientes de Storage, con 429
  reintentables registrados separadamente si el bucket limita solicitudes.

## Estado y reapertura

- Estado inicial: `NOT_STARTED`.
- Estado objetivo: `OPERATIONAL`.
- Nivel Q: `Q3` actual / `Q3` objetivo.
- Reapertura: contexto sin música, acción crítica sin SFX, entrada sin
  procedencia, o regresión del desbloqueo/accesibilidad.
- Siguiente unidad: la siguiente prioridad de fase 2/3 que permanezca abierta
  según la tabla viva de Supabase.