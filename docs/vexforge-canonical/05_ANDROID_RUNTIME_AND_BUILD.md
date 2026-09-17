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

## Estado del pipeline

El pipeline Expo/Metro/Gradle es la ruta Android de producto activa. Unity queda
`RETIRED / HISTORICAL`; no existe un pipeline Unity activo ni se reutiliza su
configuración.

El workflow APK debe verificar el bundle embebido, package
`com.vexforge.android`, versión `1.0.1`, versionCode `4`, artifact descargable
y SHA-256. EAS queda documentado solamente como fallback futuro si esta ruta
deja de ser viable.
