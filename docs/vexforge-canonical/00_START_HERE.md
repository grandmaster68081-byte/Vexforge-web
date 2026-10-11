# 00 — START HERE (AUTORIDAD ACTUAL: UNITY)

## Estado actual (2026-10-11)

`unity/**` es el único proyecto Unity Android oficial. El Bootstrap acumulativo
fue promovido a esa ruta y el proyecto Unity oficial anterior fue retirado de la
rama actual por instrucción del usuario. No existe ya un proyecto separado
`unity-bootstrap/`. Los documentos específicos de aquella migración son
históricos.

El workflow manual vigente es
`.github/workflows/vexforge-unity-android-github.yml`; no se ejecutó una nueva
compilación durante la promoción. `replit.md` y `VEXFORGE_CONTEXT.md` describen
los límites actuales. El portal oficial sigue en `src/**` y `public/**`;
Supabase live conserva la autoridad de backend.

## Orden de lectura

1. `VEXFORGE_CONTEXT.md` — dirección, autoridad y límites actuales.
2. `replit.md` — alcance operativo y reglas de cada hito.
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md` y
   `17_CURRENT_BLOCK.md` — estado observado y bloque actual.
4. `docs/vexforge-canonical/05_ANDROID_RUNTIME_AND_BUILD.md` — control de
   compilación y estado del workflow.
5. `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` — build manual actual.

## Límites

- Mantener Supabase como autoridad para combate, propiedad, recompensas,
  progreso y economía.
- Mantener el portal web y Supabase sin cambios durante el trabajo de Unity.
- No copiar ni sustituir el arte oficial de cartas sin aprobación.
- No generar APK/AAB del juego oficial ni alterar Supabase live sin autorización
  explícita y vigente. `UNITY_BOOTSTRAP_WORKFLOW.md` es archivo histórico; no
  concede autorización actual de build.
- Antes de cada hito: confirmar `main`, árbol limpio y `HEAD == origin/main`;
  cerrar con commit y push antes de iniciar el siguiente.
