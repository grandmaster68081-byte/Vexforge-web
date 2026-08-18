# VE-15 — Cierre de consumidores del lenguaje de iconos

**Fecha:** 2026-08-18  
**Tipo:** Implementación + QA estática  
**Unidad:** `VE-15-ICON-LANGUAGE-CONSUMER-CLOSURE`  
**Fuente canónica:** `main`, `VEXFORGE_PROTOCOL_V2.md`, `CONTINUITY.md`, `ForgeIcon.tsx` y las guardas públicas de identidad.

## Objetivo

Cerrar dos consumidores visibles que recibían un `ForgeIconName` pero lo
renderizaban como texto interno en vez de usar el SVG oficial de VEXFORGE:

- accesos rápidos de `ProfileRoute`;
- iconos de movimientos de `EconomyRoute`.

El cambio conserva los nombres tipados, la información mostrada y la lógica de
datos. No cambia contratos, estadísticas, economía, RPCs, RLS, autenticación,
assets de Storage ni resultados autoritativos.

## Estado

- Estado inicial: `IMPLEMENTED_UNVERIFIED`.
- Estado actual: `OPERATIONAL` en el checkout local del repositorio.
- Nivel: `Q3` para este lote de identidad de interfaz.

## Cambios

- `ProfileRoute`: cada acceso rápido usa `<ForgeIcon name={icon} />`.
- `EconomyRoute`: cada movimiento usa `<ForgeIcon name={meta.icon} />`.
- No se promovió arte reservado. La auditoría del manifiesto mantiene:
  - 11 piezas de superficie en reserva;
  - 29 piezas residuales en reserva;
  - 0 consumidores adicionales válidos para marcos, recompensas,
    progresión o tutorial sin un contrato de superficie nuevo.

## Evidencia

Ejecutado desde la raíz de `Vexforge-web`:

- `npm run typecheck` — correcto.
- `npm run verify:build` — correcto; build desde `main` y manifiesto de build generado.
- `npm run verify:ui-identity` — 188 archivos, 0 violaciones.
- `npm run verify:surface-art` — 29 inscritos, 18 consumidos, 11 en reserva, correcto.
- `npm run verify:residual-art` — 51 filas, 32 objetos, 3 consumidos, 29 en reserva, correcto.
- `npm run verify:assets` — 21/21 assets disponibles en Storage. El primer
  intento posterior al barrido global recibió dos HTTP 429 temporales; el gate
  pasó al repetirlo tras la ventana de límite.

## Accesibilidad y rendimiento

- Los iconos continúan siendo SVG `aria-hidden`, sin añadir texto duplicado ni
  cambiar el foco de los controles.
- Se mantienen los tamaños y contenedores existentes.
- No se añaden imágenes, peticiones de Storage ni animaciones nuevas.

## Bloqueos y deuda

- El PAT de GitHub fue rechazado por el proveedor; el repositorio se pudo leer
  públicamente, pero el push de cierre no pudo completarse.
- No se ejecutó QA autenticada ni se fabricó una sesión de jugador.
- El deploy público no se modificó en esta unidad porque no hubo publicación de
  `main`.

## Reapertura

Reabrir si aparece un nuevo `ForgeIconName` renderizado como texto, si cambia el
contrato de `ForgeIcon`, o si una superficie nueva define un consumidor
canónico para arte actualmente reservado.

## Siguiente acción verificable

Reintentar la publicación del commit con una credencial GitHub con permiso de
escritura; después comparar `dist/build-manifest.json`, `index.html` y los
hashes públicos con el commit publicado.

## Cierre posterior

La publicación fue completada en la unidad `VE-16-CANONICAL-PUBLISH-RECONCILIATION`.
El repositorio oficial `main` y `https://vexforge-web.pages.dev/build-manifest.json`
ahora declaran el commit `2ab87ad9b598f296f0a835de5cb09781926d502d`, y la página
pública responde HTTP 200.

El bloqueo original no era el token: el primer intento configuró autenticación
`Bearer` para el protocolo Git sobre HTTPS. El mismo token funcionó con el
formato Git compatible `Basic`, usando `x-access-token` como usuario. El token
no se imprime ni se registra.