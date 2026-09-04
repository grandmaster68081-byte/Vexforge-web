# VE-RELEASE-PLAY-OTA-01 — Plan oficial de compatibilidad y actualizaciones Android

Este documento resume la enmienda vigente del protocolo maestro para que cada agente clasifique y entregue correctamente las secciones Android.

## Regla principal

- APK: sólo QA interna y sideload.
- AAB: único artefacto de publicación en Google Play.
- OTA: sólo JavaScript/assets compatibles con el runtime nativo instalado.

## Estado actual auditado

- Package estable: `com.vexforge.android`.
- `versionCode` de la línea base era `2`; el candidato T0 usa `3` con política monotónica.
- Runtime declarado por la línea candidata: `1.0.0`.
- Target API declarado por la línea candidata: `35`.
- Workflow APK existente: continúa siendo el canal de QA/sideload.
- Nuevo workflow manual: `.github/workflows/vexforge-android-aab-candidate.yml`.
- Firma Play: el workflow exige una upload key separada; si faltan los secretos de GitHub, falla de forma explícita y no usa debug keystore.
- `expo-updates`: todavía no está activado porque Supabase no tiene un endpoint de manifiesto compatible. No se publica una OTA falsa ni se descarga código desde una URL arbitraria.
- Release 72: válido como baseline de QA, no como candidato de Play.

## Clasificación por sección

| Tipo | Cambios permitidos | Entrega |
|---|---|---|
| `OTA_UPDATE` | JS/TS, navegación, estilos, copy y assets compatibles | Manifiesto HTTPS, hash, canal, runtime, rollback; la app descarga sólo lo nuevo |
| `NATIVE_PLAY_RELEASE` | SDK, permisos, plugins, dependencias nativas, app config, runtime o firma | Nuevo AAB con `versionCode` mayor; APK adicional sólo para QA |

Nunca se distribuyen APK parciales propios. Si Play entrega una descarga diferencial, eso lo gestiona Google desde el AAB completo.

## Registro autoritativo en Supabase

La migración `backend/sql-migrations/AA-release-control-plane.sql` crea `public.vexforge_android_release_registry`, que conserva por sección:

- tipo de entrega (`OTA_UPDATE` o `NATIVE_PLAY_RELEASE`);
- runtime, versión mínima, canal y rollout;
- commit, hash SHA-256, manifiesto/artefacto y validaciones;
- estado `DRAFT`, `VALIDATED`, `PUBLISHED`, `ROLLED_BACK` o `BLOCKED`;
- objetivo de rollback, limitaciones y fecha de publicación.

Los clientes sólo pueden leer registros `PUBLISHED`. No existen políticas de escritura para `anon` o `authenticated`; las publicaciones deben pasar por un proceso controlado con `service_role`/servidor. Supabase no guarda claves privadas, contraseñas, tokens ni credenciales de Play.

## Gates

1. `PLAY_COMPATIBLE_CANDIDATE`: AAB verificable, target API vigente, package estable, `versionCode` monotónico, upload key válida, Play App Signing y track interno/cerrado.
2. `SECTION_UPDATE_READY`: clasificación correcta, runtime compatible, manifiesto/hash, fallback embebido, rollback y evidencia de compatibilidad.
3. `PLAY_STORE_READY`: gates anteriores más políticas, privacidad, Data Safety, contenido, QA humana, rendimiento, estabilidad, accesibilidad y primera sesión.

## Bloqueos reales actuales

- Falta registrar/probar la upload key y activar Play App Signing en la cuenta de Google Play.
- Falta ejecutar el primer AAB firmado en un track interno o cerrado.
- Falta un endpoint HTTPS compatible con el protocolo Expo Updates; por eso la descarga OTA por código aún no se anuncia como activa.
- Las claves privadas y credenciales sólo pueden configurarse en secretos de GitHub/Replit/Google, nunca en Supabase.
