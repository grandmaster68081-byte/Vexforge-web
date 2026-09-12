# VE-RELEASE-PLAY-OTA-01 — Plan oficial de compatibilidad y actualizaciones Android

Este documento resume la enmienda vigente del protocolo maestro para que cada agente clasifique y entregue correctamente las secciones Android.

## Regla principal

- APK: sólo QA interna y sideload.
- AAB: único artefacto de publicación en Google Play.
- OTA: sólo JavaScript/assets compatibles con el runtime nativo instalado.

## Estado de ejecución

- Package estable: `com.vexforge.android`.
- Runtime de la base nueva: `1.0.0`.
- Target API de la base nueva: `35`.
- `versionCode` inicial de la base nueva: `3`.
- Endpoint Expo Updates activo: `https://rscuzqnfccqvltkdcdny.supabase.co/functions/v1/vexforge-updates`.
- La APK 72 anterior no es compatible con este endpoint porque fue compilada sin `expo-updates`.

## Clasificación por sección

| Tipo | Cambios permitidos | Entrega |
|---|---|---|
| `OTA_UPDATE` | JS/TS, navegación, estilos, copy y assets compatibles | Workflow OTA, manifiesto HTTPS, hash, canal, runtime y rollback |
| `NATIVE_PLAY_RELEASE` | SDK, permisos, plugins, dependencias nativas, app config, runtime o firma | AAB firmado con `versionCode` mayor; APK adicional sólo para QA |

Nunca se distribuyen APK parciales propios. Si Play entrega una descarga diferencial, eso lo gestiona Google desde el AAB completo.

## Ciclo automático por sección

Después de completar y confirmar una sección, la IA debe ejecutar:

```bash
node mobile/scripts/dispatch-section-release.mjs \
  --section-id VE-MOB-X \
  --delivery-type OTA_UPDATE \
  --channel production \
  --app-version 1.0.0 \
  --runtime-version 1.0.0 \
  --message "Resumen de la sección"
```

Para cualquier cambio nativo debe usar `--delivery-type NATIVE_PLAY_RELEASE`; el workflow AAB se dispara por separado. El resumen del workflow devuelve la URL de actualización y el hash. El usuario no descarga la APK completa para una OTA.

## Registro autoritativo en Supabase

La migración `backend/sql-migrations/AA-release-control-plane.sql` crea `public.vexforge_android_release_registry`, que conserva por sección:

- tipo de entrega (`OTA_UPDATE` o `NATIVE_PLAY_RELEASE`);
- runtime, versión mínima, canal y rollout;
- commit, hash SHA-256, manifiesto/artefacto y validaciones;
- estado `DRAFT`, `VALIDATED`, `PUBLISHED`, `ROLLED_BACK` o `BLOCKED`;
- objetivo de rollback, limitaciones y fecha de publicación.

Los clientes sólo pueden leer registros `PUBLISHED`. No existen políticas de escritura para `anon` o `authenticated`; las publicaciones pasan por el workflow usando el secreto de GitHub. Supabase no guarda claves privadas, contraseñas, tokens ni credenciales de Play.

## Gates

1. `PLAY_COMPATIBLE_CANDIDATE`: AAB verificable, target API vigente, package estable, `versionCode` monotónico, upload key válida, Play App Signing y track interno/cerrado.
2. `SECTION_UPDATE_READY`: clasificación correcta, runtime compatible, manifiesto/hash, fallback embebido, rollback y evidencia de compatibilidad.
3. `PLAY_STORE_READY`: gates anteriores más políticas, privacidad, Data Safety, contenido, QA humana, rendimiento, estabilidad, accesibilidad y primera sesión.

## Bloqueos reales restantes

- La APK/AAB base nueva debe terminar su compilación y prueba antes de ser la aplicación oficial de Play.
- La upload key/Play App Signing y el primer track interno o cerrado siguen siendo requisitos de publicación de Google Play, no bloqueos de las OTA.
- La APK 72 no debe recibir OTA; se conserva como baseline de QA.
