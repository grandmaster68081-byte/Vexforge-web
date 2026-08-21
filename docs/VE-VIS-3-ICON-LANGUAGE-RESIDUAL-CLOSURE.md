# VE-VIS-3 — Cierre residual del lenguaje de iconos

**Fecha:** 2026-08-21  
**Tipo:** Implementación + verificación estática  
**Unidad:** `VE-VIS-3-ICON-LANGUAGE-RESIDUAL`  
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md`, `ForgeIcon.tsx` y la guarda pública de identidad.

## Objetivo

Eliminar el último consumidor visual que representaba runas mediante caracteres
Unicode en la cinemática de ataque. El efecto conserva su intención de
partículas rúnicas, pero usa únicamente iconos SVG propios de VEXFORGE.

## Cambios

- `CardAttackCinematic`: reemplazo de `RUNE_CHARS` por una secuencia de
  `ForgeIconName` y render SVG accesible como decoración.
- `verify-ui-identity`: incorporación del rango Unicode rúnico `U+1600-U+16FF`
  a la guarda, después de eliminar comentarios.
- No se modifican contratos de batalla, resultados autoritativos, economía,
  RPCs, RLS, Storage, estadísticas, nombres canónicos ni assets.

## Evidencia

- `npm run typecheck` — correcto.
- `npm run verify:ui-identity` — 188 archivos, 0 violaciones.
- `npm run verify:build` — correcto; build generado desde la raíz.

## Accesibilidad y rendimiento

- Los iconos permanecen `aria-hidden` y `focusable=false` a través de
  `ForgeIcon`.
- No se agregan solicitudes de red ni assets nuevos.
- El número y duración de partículas permanecen sin cambios.
- La animación existente conserva el soporte de `prefers-reduced-motion`.

## Estado y reapertura

- Estado: `OPERATIONAL`.
- Nivel Q: Q3 actual; objetivo Q3 para este lote.
- Reabrir si aparece un nuevo icono visible renderizado como texto, si cambia
  el contrato de `ForgeIcon`, o si la guarda deja de cubrir el rango rúnico.

## Cierre público

- Migración aplicada en Supabase y criterio `icon_language` confirmado como
  `MET`.
- `main` publicado en el commit `a0239e9c1ac79aba05f6bb06c3ad6ed8fa8a986b`.
- `build-manifest.json` público declara el mismo commit.
- Las rutas `/` y `/pvp` responden HTTP 200.
- Los bundles raíz y PvP publicados coinciden bit a bit con `dist`.
