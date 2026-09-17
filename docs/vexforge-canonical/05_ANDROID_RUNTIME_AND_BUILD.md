# 05 — ANDROID RUNTIME AND BUILD

## Cadena observada

```text
mobile/** → Expo SDK 54 → Metro → bundle JS → expo prebuild → Gradle Android → APK release → instalación → runtime → expo-updates
```

## Versiones

- Expo declarado `~54.0.27`; lockfile `54.0.37`.
- React `19.1.0`; React Native `0.81.5`.
- Expo Router `~6.0.17`; Reanimated `~4.1.1`; Gesture Handler `~2.28.0`.
- Package `com.vexforge.android`, app `1.0.1`, versionCode `4`, target SDK `35`.
- `newArchEnabled: true`, typed routes y React Compiler activos.

## Plugins y bundle

Plugins: `expo-router`, `expo-font`, `expo-web-browser`, `expo-updates` y `./plugins/withEmbeddedJsBundle`. El workflow APK ejecuta `npx expo prebuild --platform android --no-install --non-interactive` y verifica que el APK contenga `assets/index.android.bundle`.

## Updates

- URL: `https://rscuzqnfccqvltkdcdny.supabase.co/functions/v1/vexforge-updates`.
- `enabled: true`, `checkAutomatically: ON_LOAD`, `fallbackToCacheTimeout: 0`.
- Canal: `production`; runtimeVersion: `1.0.0`.

Una instalación puede ejecutar un update remoto compatible con el runtime, por lo que el APK embebido y el bundle OTA deben distinguirse en evidencia.

## Workflow y comando

Workflow: `.github/workflows/vexforge-android-apk.yml`; Node 22; Java Temurin 17; trigger manual o cambios en `mobile/**`.

```text
./gradlew assembleRelease --no-daemon --stacktrace --console=plain --max-workers=2 -x lintVitalAnalyzeRelease -x lintVitalReportRelease -x lintVitalRelease
```

Última evidencia en continuidad: release `vexforge-android-build-249`, run `35238357900`, status success, bundle embebido; el APK observado corresponde al commit `ded78720...`, no se presume equivalencia automática con cualquier commit posterior.

## Pipeline Unity objetivo

El pipeline Expo/Metro/Gradle anterior es el pipeline actual legado y no debe reutilizarse como si fuera Unity. La migración objetivo será `Unity 6.3 LTS → URP → C# player Android → CI reproducible → APK → instalación → QA → rollback`, con Unity Editor o CI Unity real procesando el proyecto. Replit puede preparar archivos y verificadores, pero no debe simular Unity Editor.

Estado: `PLANNED / NOT_IMPLEMENTED`. No hay proyecto Unity, APK Unity, runtime Unity ni hash de artefacto Unity en este commit.
