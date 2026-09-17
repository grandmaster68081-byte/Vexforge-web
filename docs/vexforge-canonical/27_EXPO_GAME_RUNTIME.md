# 27 — EXPO GAME RUNTIME

## Runtime activo

`mobile/**` es el producto Android canónico. El runtime activo es Expo SDK 54
con React Native existente. La versión instalada, Expo Router, New
Architecture, Reanimated, Worklets y Gesture Handler se conservan sin
actualización en esta etapa.

## Separación UI / render

React Native es la capa de aplicación y UI. `GameRenderSurface` es el límite
del renderer de escenas: su primera implementación usa vistas nativas y no
duplica datos ni reglas. Skia queda reservada para una futura implementación
2D/2.5D; no se instala todavía.

## Scene architecture

`GameRuntime` controla el estado de presentación `boot` → `shell`. `BootScene`
inicializa la experiencia visual, espera sesión y sincronización real, y
muestra el estado de conexión sin inventar contenido. El shell actual conserva
los componentes funcionales existentes y se monta dentro de
`GameRenderSurface`.

No se implementan en esta etapa World, Battle, Archive, Deck Builder, Economy
ni nuevas Missions.

## Animation architecture

`GameMotion` concentra transiciones de entrada y feedback visual mediante
Reanimated. Worklets y Gesture Handler siguen siendo dependencias de
interacción existentes. La animación no contiene reglas de negocio y respeta
reduced motion.

## Data authority

Supabase mantiene autoridad sobre autenticación, sesión, catálogo, ownership,
progreso, wallet, estadísticas, eventos, settlement y recompensas. El
`GameRuntimeContext` solo mantiene estado de presentación/runtime y nunca
duplica autoridad de Supabase.

## Asset policy

Solo se consumen assets oficiales existentes en el repositorio o assets
entregados por los loaders autorizados. No se crean placeholders que parezcan
datos reales, no se inventan cartas, estadísticas, recompensas ni escenas.

## Battle authority

La autoridad es:

```text
SUPABASE / SERVER
        ↓
EVENTS / RESULT
        ↓
ANDROID RENDERER
```

La UI no calcula settlement competitivo autoritativo. Las simulaciones locales,
si existen, permanecen claramente separadas de una partida competitiva.

## Build authority

La ruta Android de producto es `.github/workflows/vexforge-android-apk.yml`,
ejecutada sobre `mobile/**`. El build debe comprobar APK standalone,
`com.vexforge.android`, versión, versionCode, artifact y SHA-256. La
documentación de EAS es solo fallback futuro si el build actual deja de ser
viable; no se introducen tokens, project IDs ni credenciales inventadas.

## Reglas de no invención

- No cambiar Supabase ni contratos backend.
- No mover autoridad de servidor al cliente.
- No actualizar Expo por iniciativa propia.
- No instalar Skia en esta etapa.
- No activar Unity ni reutilizar su configuración.
- No avanzar a Etapa 2.
- No declarar Foundation como `VERIFIED` sin APK, artifact, metadatos y QA
  física.