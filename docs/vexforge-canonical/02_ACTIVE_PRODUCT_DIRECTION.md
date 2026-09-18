# 02 — ACTIVE PRODUCT DIRECTION

## Android como producto activo

`unity/**` es el cliente activo del producto. La navegación, presentación,
assets y runtime Android que deben recibir trabajo de producto pertenecen a
Unity.

## Web congelada

`src/**` es `FROZEN / NON-ACTIVE PRODUCT CLIENT`. Se conserva como evidencia, historial, contratos reutilizables y material de migración. No se debe reactivar por inferencia de documentos antiguos.

## Target direction

La dirección aprobada es un TCG digital premium con identidad propia VEXFORGE, fantasía medieval oscura, experiencia de juego y presentación de arena/forja/archivo. Es una dirección de producto, no una afirmación de que toda la implementación actual ya la cumpla.

## Separación obligatoria

- `CURRENT IMPLEMENTATION`: lo que existe en código y puede señalarse por ruta.
- `TARGET PRODUCT DIRECTION`: lo aprobado como dirección futura.
- `EVIDENCE_REQUIRED`: lo que necesita APK/dispositivo/release o consulta live antes de declararse verificado.

## Decisión de runtime

- Runtime Android activo: **Unity**.
- Plataforma activa: Android.
- Backend: Supabase existente, sin sustitución.
- Cliente canónico: Unity en `unity/**`.
- Web: congelada/no activa.
- Expo/React Native: legado/histórico preservado en `mobile/**`, sin trabajo
  nuevo ni equivalencia arquitectónica.

La Foundation actual agrega la frontera `GameRuntime` sin destruir los
componentes funcionales existentes. El APK standalone, artifact, metadatos y
QA física siguen siendo evidencia requerida; Foundation no se marca como
`VERIFIED` todavía.
