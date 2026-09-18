VEXFORGE
CANONICAL PROJECT CONTEXT
READ THIS FIRST

## Identidad

VEXFORGE es un juego digital TCG en desarrollo. El único runtime activo de
producto Android es Unity bajo `unity/**`. La aplicación Unity Android (Expo/React Native is legacy)
ubicada en `mobile/**` se conserva intacta únicamente como legado/historial,
respaldo y referencia de contratos; no es un runtime activo. La web en
`src/**` se conserva como código histórico, evidencia y fuente reutilizable,
pero está congelada como cliente de producto.

## Estado de fuente

- Repositorio: `grandmaster68081-byte/Vexforge-web`
- Rama: `main`
- Commit auditado: `201ee0330529c8e085afd1143cf066e18de3bc8a`
- Snapshot: 2026-09-17
- Android package: `com.vexforge.android`
- App version: `1.0.1`
- Android versionCode: `4`
- Expo declarado: `~54.0.27`; lockfile observado: `54.0.37`
- React Native: `0.81.5`
- runtimeVersion: `1.0.0`
- Último release Android verificable en continuidad: `vexforge-android-build-249`, workflow `35238357900`, publicado desde el commit `ded78720d1d3f97280d5702166d44e18415beb8f`; el APK contiene `assets/index.android.bundle`.
- Esta persistencia documental no compila APK ni crea release.

## Backend

Supabase project reference: `rscuzqnfccqvltkdcdny`. Supabase live es la autoridad para datos, RLS, policies, RPCs, functions, triggers, storage, auth y contratos backend vivos. La consulta de catálogo realizada para esta capa observó 318 tablas/vistas públicas, 345 rutinas y 275 policies; esa amplitud no implica que todo sea consumido por Android.

## Arquitectura actual

El código de `mobile/**` conserva referencias históricas de sesión, contratos y
superficies anteriores. La ejecución activa, presentación y navegación del
producto pertenecen a `unity/**`; `mobile/**` no debe recibir trabajo nuevo.

## Producto y reglas activas

- Unity activo para desarrollo Android; Unity Android (Expo/React Native is legacy) congelado como legado
  histórico; web congelada.
- Supabase live > copia documental para backend.
- Código actual de `main` > documentación para implementación.
- No inventar cartas, nombres, balances, rewards, reglas, assets ni resultados.
- No duplicar lógica autoritativa de servidor en el cliente.
- No usar sustituciones genéricas silenciosas.
- No cambiar Supabase ni funcionalidad sin autorización específica.
- No compilar APK, Android Player, Gradle, GameCI ni workflows de compilación
  durante la reactivación Unity.

## Estado de trabajo

La capa canónica está documentada en `docs/vexforge-canonical/`. Unity ya tiene
un proyecto de desarrollo, bootstrap, conexión Supabase, sesión, shell,
Nexus/World y superficies iniciales para Archive, Forge, Arena, Missions,
Treasury y Legado. La primera compilación, la licencia, la QA física y la
reconciliación exhaustiva de todos los objetos live de Supabase siguen siendo
`EVIDENCE_REQUIRED` o `BLOCKED`.

## Siguiente bloque

El bloque activo es `UNITY_RUNTIME_REACTIVATION`: continuar la implementación
data-driven en Unity sin borrar `mobile/**`, sin duplicar autoridad del
backend y sin ejecutar builds. Consultar
`docs/vexforge-canonical/17_CURRENT_BLOCK.md` y
`docs/vexforge-canonical/26_UNITY_ENGINE_MIGRATION.md`.

## Mapa de lectura

1. `docs/vexforge-canonical/00_START_HERE.md`
2. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`
3. `docs/vexforge-canonical/17_CURRENT_BLOCK.md`
4. `docs/vexforge-canonical/19_BLOCKERS.md`
5. `docs/vexforge-canonical/20_KNOWN_UNKNOWNS.md`
6. `docs/vexforge-canonical/21_CONTRADICTIONS.md`
7. El documento de dominio enlazado antes de modificar cualquier área.

## Decisión de runtime registrada el 2026-09-18

Unity es el runtime Android principal de desarrollo y `unity/**` es la nueva
superficie de juego. Unity Android (Expo/React Native is legacy) permanece intacto en `mobile/**` como
legado histórico, respaldo, rollback y referencia de contratos. Unity no
depende de Expo.

Supabase mantiene toda autoridad de datos, reglas, autenticación y settlement.
La web queda congelada como código no-producto. Unity presenta datos y
resultados autorizados; no resuelve competitividad ni inventa economía,
cartas, rewards o progreso. El estado Unity de este bloque es
`IMPLEMENTED_UNVERIFIED`: no se declara APK ni QA física.
