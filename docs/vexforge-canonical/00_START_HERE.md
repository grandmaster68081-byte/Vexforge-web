# 00 — START HERE (AUTORIDAD ACTUAL: UNITY)

## Enrutamiento de alcance (2026-10-10)

El trabajo activo de migración incremental usa `unity-bootstrap/`, separado del
runtime oficial. Para esa tarea, leer primero `replit.md`,
`UNITY_BOOTSTRAP_WORKFLOW.md` y `unity-bootstrap/README.md`. El documento
`17_CURRENT_BLOCK.md` y `16_IMPLEMENTATION_STATUS.md` describen el runtime
oficial bajo `unity/**`; no son la cola de trabajo del Bootstrap. El protocolo
de IA y el bloque actual deben interpretarse según esta separación.

El run #2 del Bootstrap fue una prueba del workflow con una escena vacía, no un
hito de contenido. El builder actual bloquea la compilación si no existe una
escena. La comprobación solo valida que exista el archivo; no prueba que sea
oficial ni que tenga todas sus dependencias. La siguiente tarea es inspeccionar
la escena oficial de inicio y su cierre de dependencias para incorporar una
porción pequeña, auténtica y compilable.

## Dirección vigente

Unity en `unity/**` es el runtime Android del videojuego. El portal oficial está
en `src/**` y `public/**`. Supabase live conserva la autoridad de backend.

El workflow manual de Unity está en
`.github/workflows/vexforge-unity-android-github.yml`. Usa 12 shards y un límite
de 35.000 variantes por shard; no se ha despachado.

## Orden de lectura

1. `VEXFORGE_CONTEXT.md` — dirección, autoridad y límites actuales.
2. `replit.md` — alcance operativo y reglas de cada hito.
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md` y
   `17_CURRENT_BLOCK.md` — estado observado y bloque actual.
4. `docs/vexforge-canonical/05_ANDROID_RUNTIME_AND_BUILD.md` — control de
   compilación y estado del workflow.
5. `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` y
   `UNITY_INCREMENTAL_VARIANT_BATCHES.md` — operación manual por shards.

## Límites

- Mantener Supabase como autoridad para combate, propiedad, recompensas,
  progreso y economía.
- Mantener el portal web y el código Unity sin cambios durante la limpieza.
- No copiar ni sustituir el arte oficial de cartas sin aprobación.
- No generar APK/AAB del juego oficial ni alterar Supabase live sin autorización
  explícita. Para la autorización condicional ya concedida al Bootstrap, seguir
  exclusivamente `UNITY_BOOTSTRAP_WORKFLOW.md`; no extenderla al workflow
  oficial.
- Antes de cada hito: confirmar `main`, árbol limpio y `HEAD == origin/main`;
  cerrar con commit y push antes de iniciar el siguiente.
