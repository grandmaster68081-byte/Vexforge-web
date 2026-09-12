# VE-VIS-3-EMPTY-STATE-ART — Estados de forja

**Fecha de implementación:** 2026-08-31  
**Unidad:** `VE-VIS-3-EMPTY-STATE-ART`  
**Criterio:** `loading_and_empty_states`  
**Estado:** `IMPLEMENTED_UNVERIFIED` para el contrato compartido; el criterio Tier 1 permanece `PARTIAL` hasta completar la matriz de las 39 rutas.

## Objetivo

Dar a los estados vacío, carga, error y acceso bloqueado un lenguaje visual VEXFORGE explícito, sin emojis, pictogramas Unicode, loaders genéricos ni sustitución de datos reales. El tratamiento es presentación: no modifica contratos, resultados, economía, Auth, Storage o datos de jugadores.

## Cambios

- `ForgeStateArt` centraliza cuatro variantes (`empty`, `loading`, `error`, `locked`) con el catálogo SVG de `ForgeIcon`.
- `EmptyState`, `ErrorState`, `BlockedAuthState` y `PageLoader` exponen la variante y el estado accesible en el DOM.
- Las rutas que aún usan la tarjeta heredada `.empty-state` reciben un sigilo CSS equivalente mientras se migran a la primitiva compartida.
- El fallback global de `prefers-reduced-motion` desactiva órbitas, pulsos y respiración sin ocultar el contenido ni el estado.
- `verify:state-art` comprueba variantes, consumidores, cobertura heredada y reduced-motion; queda encadenada en `verify:all`.

## Límites preservados

- No se crean assets ni rutas de Storage: el arte es CSS y los símbolos son SVG canónicos ya existentes.
- No se inventan estados, lore, resultados ni mensajes de backend.
- El texto visible y los encabezados siguen siendo la fuente accesible; el sigilo es decorativo (`aria-hidden`).
- No se afirma que todas las rutas estén cerradas: la matriz runtime de 39 rutas continúa pendiente.

## Evidencia y reapertura

La unidad puede pasar a `IMPLEMENTED_UNVERIFIED` con `npm run typecheck`, `npm run verify:state-art`, `npm run verify:build` y evidencia de deploy que corresponda al commit. Se reabre si una superficie introduce un loader sin estado explícito, vuelve a usar iconografía genérica, rompe reduced-motion o sustituye un dato canónico por arte decorativo.
