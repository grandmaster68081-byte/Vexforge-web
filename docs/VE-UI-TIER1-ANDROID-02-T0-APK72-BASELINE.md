# VE-UI-TIER1-ANDROID-02 — T0 baseline del APK 72

**Fecha de medición:** 2026-09-04  
**Estado:** `IMPLEMENTED_UNVERIFIED`  
**Alcance:** auditoría estática reproducible del APK Android publicado; no sustituye la QA humana ni la medición en dispositivo.

## 1. Artefacto y procedencia

| Campo | Evidencia |
|---|---|
| Release | `vexforge-android-build-72` |
| Asset | `app-release.apk` |
| Tamaño publicado/descargado | `91,802,119` bytes |
| SHA-256 del APK | `9ab761c736dd19d09799a654647639d8d4a4e827db16d709a0fc167401d7a524` |
| Workflow | run `33813451975`, número `72` |
| Resultado del workflow | `completed / success` |
| Commit de build | `a7ff094d0c42e13f9547c2529b5c457ccac8b2da` |
| Publicación del release | `2026-09-03T22:53:04Z` |
| Rama actual posterior | `main`, commit documental `b1d9431053d9aa8bfb416becb1d0e3a14b5c8515` |

La comprobación se realizó descargando el asset oficial desde la URL de release y calculando el digest localmente. No se usó un APK generado localmente.

## 2. Integridad estructural

| Comprobación | Resultado | Detalle |
|---|---|---|
| Tipo de archivo | `PASS` | reconocido como Android package (APK) |
| Firma ZIP | `PASS` | cabecera `PK` válida |
| CRC de entradas | `PASS` | `zipfile.testzip()` sin entradas corruptas |
| Entradas totales | `PASS` | 1,247 entradas |
| Bundle standalone | `PASS` | `assets/index.android.bundle` presente, 3,176,920 bytes |
| Configuración embebida | `PASS` | `assets/app.config` presente |
| Manifest y recursos | `PRESENT` | `AndroidManifest.xml` 9,640 bytes; `resources.arsc` 1,176,828 bytes |
| Arquitecturas | `PRESENT` | `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64` |

El tamaño del APK debe tratarse como dato de baseline, no como aprobación del presupuesto de rendimiento. La inclusión de cuatro ABIs y los binarios nativos explica parte del peso; aún falta medir el impacto real en instalación, arranque, memoria y FPS.

## 3. Señales estáticas del bundle

El bundle contiene señales de integración con Supabase y del loop de telemetría (`session_start`, `combat_resolved`, `reward_claimed`). Estas señales sólo prueban presencia de código empaquetado; no prueban ejecución correcta, emisión consultable ni settlement.

No se infiere desde strings minificados que el recorrido visual o funcional esté completo. La cobertura del vertical slice requiere ejecución sobre una cuenta de prueba y evidencia de cada transición.

## 4. Medición dinámica pendiente

En el entorno de auditoría no existe `adb`, emulador ni dispositivo Android conectado. Por tanto, quedan `UNVERIFIED` y no se convierten artificialmente en `MET`:

- cold start hasta primera interacción;
- frame pacing, objetivo de 60 FPS y frames bloqueados;
- memoria, ANR y OOM;
- compatibilidad de pantalla pequeña, media y menor capacidad;
- touch targets, orientación y navegación real;
- reduced-motion en dispositivo;
- carga, vacío, error/retry y reconnect en rutas autenticadas;
- recorrido completo del vertical slice;
- resultado autoritativo, claim y retorno al Home;
- QA visual humana y primera impresión.

La ausencia de herramientas de dispositivo es una limitación de evidencia del entorno, no una aprobación ni un fallo atribuido al APK.

## 5. Estado frente a los gates

- Integridad del artefacto: `PASS` estático.
- Workflow y release correlativos: `PASS`.
- Bundle JS autónomo: `PASS`.
- Performance, compatibilidad y estabilidad Android: `IMPLEMENTED_UNVERIFIED`.
- Vertical slice Android: `IMPLEMENTED_UNVERIFIED`; no demostrado end-to-end.
- `ANDROID_GAME_TIER1_CANDIDATE`: no alcanzado.
- `TIER1_READY`, `PASS` y `OPERATIONAL`: no declarados.

## 6. Próxima evidencia necesaria

1. Ejecutar el APK 72 en tres perfiles Android representativos.
2. Capturar cold start, primera interacción, frame pacing, memoria y ausencia de ANR/OOM.
3. Ejecutar el vertical slice con cuenta de prueba normal y registrar cada estado, reconnect, settlement, recompensa y retorno al Home.
4. Añadir capturas/grabación, logs y mediciones a la matriz T0 antes de ampliar el alcance visual.
