# 17 — CURRENT BLOCK

## CURRENT ACTIVE BLOCK

`EXPO_GAME_RUNTIME_FOUNDATION`

### Objetivo
Retirar Unity del runtime activo y estabilizar `mobile/**` como el único
cliente Android de producto sobre Expo / React Native. Añadir la Foundation del
Game Runtime sin reemplazar los componentes funcionales existentes.

### Estado

La Foundation del Game Runtime existe en `mobile/game/**`: runtime/context,
BootScene, superficie de render nativa y utilidades de movimiento. El shell
consume la sesión y el estado de sincronización reales del `GameContext`.
La versión de Expo/React Native instalada se conserva y no se instala Skia en
esta etapa.

### Siguiente bloque

Ejecutar los checks estáticos, la instalación limpia y la única ruta de build
Android Expo existente. Solo un APK real con package, versión, versionCode y
SHA-256 válidos permite cerrar Foundation.

| Gate | Estado | Evidencia / bloqueo |
|---|---|---|
| Runtime Foundation | IMPLEMENTED_UNVERIFIED | `mobile/game/**`; falta APK y QA física |
| Expo dependency baseline | PRESERVED | `mobile/package.json`, `mobile/package-lock.json` |
| Product Android build | CONFIGURED | `.github/workflows/vexforge-android-apk.yml` |
| Release APK | EVIDENCE_REQUIRED | debe comprobarse artifact, package, versión, versionCode y SHA-256 |

### No tocar

`supabase/**`, `contracts/**`, backend, assets oficiales, dependencias
existentes y contratos de datos. No instalar Skia, no actualizar Expo y no
iniciar World, Cards, Deck, Battle, Missions, Economy o Profile como nuevas
etapas.

### Criterios de cierre de Foundation

Expo Android reproducible; package/applicationId canónico; Supabase real; Auth
y sesión persistente; Game Runtime Shell; datos mínimos reales; CI
reproducible; APK standalone; trazabilidad commit → build → APK; instalación y
QA posterior del cliente.
