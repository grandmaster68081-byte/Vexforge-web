# VE-RELEASE-PLAY-OTA-01 — Plan oficial de compatibilidad y actualizaciones Android

Este documento resume la enmienda vigente del protocolo maestro para que cada agente clasifique y entregue correctamente las secciones Android.

## Regla principal

- APK: sólo QA interna y sideload.
- AAB: único artefacto de publicación en Google Play.
- OTA: sólo JavaScript/assets compatibles con el runtime nativo instalado.

## Estado actual auditado

- Package estable: `com.vexforge.android`.
- `versionCode` actual observado: `2`; debe pasar a una política monotónica antes del primer AAB de Play.
- Workflow actual: `assembleRelease` y publicación de APK.
- Firma actual del APK de QA: debug keystore según el workflow.
- `expo-updates`: ausente en la configuración actual.
- Release 72: válido como baseline de QA, no como candidato de Play.

## Clasificación por sección

| Tipo | Cambios permitidos | Entrega |
|---|---|---|
| `OTA_UPDATE` | JS/TS, navegación, estilos, copy y assets compatibles | Manifiesto HTTPS, hash, canal, runtime, rollback; la app descarga sólo lo nuevo |
| `NATIVE_PLAY_RELEASE` | SDK, permisos, plugins, dependencias nativas, app config, runtime o firma | Nuevo AAB con `versionCode` mayor; APK adicional sólo para QA |

Nunca se distribuyen APK parciales propios. Si Play entrega una descarga diferencial, eso lo gestiona Google desde el AAB completo.

## Gates

1. `PLAY_COMPATIBLE_CANDIDATE`: AAB verificable, target API vigente, package estable, versionCode monotónico, upload key válida, Play App Signing y track interno/cerrado.
2. `SECTION_UPDATE_READY`: clasificación correcta, runtime compatible, manifiesto/hash, fallback embebido, rechazo de incompatibles, rollback y evidencia.
3. `PLAY_STORE_READY`: gates anteriores más políticas, privacidad, Data Safety, contenido, QA humana, rendimiento, estabilidad, accesibilidad y primera sesión.

Las claves privadas y credenciales se guardan exclusivamente en gestores de secretos. Supabase almacena metadatos, hashes, canales, estados y rollback, nunca secretos.
