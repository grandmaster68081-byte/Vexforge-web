# 17 — CURRENT BLOCK

## CURRENT ACTIVE BLOCK

`UNITY_FOUNDATION_BUILD_ROUTES`

### Objetivo
Persistir la decisión de migrar el runtime final Android de Expo/React Native a Unity 6.3 LTS + URP + C#, manteniendo `mobile/**` intacto como cliente legado y rollback.

### Estado

El proyecto Unity Foundation existe en `unity/` con `6000.3.24f1`, `com.vexforge.android`, versión `1.0.2`, `versionCode 5`, ARM64 e IL2CPP. El APK aún no está verificado.

### Siguiente bloque

Ejecutar la matriz de rutas de build de Etapa 1 en orden. Cada ruta conserva su evidencia y solo una APK real con package, versión, versionCode y SHA-256 válidos permite cerrar Foundation.

| Ruta | Estado | Evidencia / bloqueo |
|---|---|---|
| 1 — Unity Build Automation | BLOCKED_EXTERNAL_DASHBOARD | requiere configuración en Unity Dashboard no disponible desde este repositorio |
| 2 — otro patch 6000.3 | BLOCKED_EXTERNAL_DASHBOARD | requiere consultar patches disponibles en Build Automation |
| 3 — Unity CLI experimental | READY_TO_RUN | workflow aislado `vexforge-unity-cli-experimental.yml` |
| 4 — GameCI + UNITY_LICENSE | BLOCKED_BY_PERSONAL_LICENSE | no existe `.ulf` válido disponible |
| 5 — GameCI direct Personal | READY_TO_RUN | workflow aislado sin `cliVersion` |
| 6 — activación automatizada de terceros | NOT_STARTED | solo si la Ruta 5 falla |

### No tocar

`mobile/**`, `src/**`, `supabase/**`, `contracts/**`, `scripts/**`, assets, dependencias, build Expo existente y releases previos. No eliminar React Native hasta un APK Unity validado y rollback disponible.

### Criterios de cierre de Foundation

Unity 6.3 LTS funcional; Android reproducible; package/applicationId canónico; Supabase real; Auth y sesión persistente; GameShell; datos mínimos reales; CI reproducible; APK standalone; trazabilidad commit → build → APK; instalación y rollback del cliente legado.
