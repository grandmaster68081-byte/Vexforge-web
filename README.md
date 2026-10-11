# VEXFORGE — repositorio principal

## Estado actual

- `unity/**` es el único proyecto Unity Android canónico. El proyecto Bootstrap
  acumulativo fue promovido aquí el 11 de octubre de 2026; el antiguo proyecto
  oficial se retiró de la rama actual.
- `src/**` y `public/**` contienen el portal web oficial; no forman parte del
  cambio de Unity.
- Supabase sigue siendo la autoridad de backend. Esta promoción no modificó
  datos, esquema, Auth, RLS, RPCs, funciones ni configuración live.
- El proyecto usa `com.vexforge.android` y Unity `6000.3.0f1`.

El workflow Android manual es
`.github/workflows/vexforge-unity-android-github.yml`. Usa el builder que antes
pertenecía al Bootstrap, ahora configurado para el proyecto oficial. Solo se
ejecuta manualmente y requiere los secretos de activación de Unity configurados
en GitHub Actions. La promoción no lanzó una compilación nueva ni un release.

`docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md` conserva el historial de
migración; no es el procedimiento operativo actual. Consulta `replit.md`,
`VEXFORGE_CONTEXT.md` y `docs/vexforge-canonical/UNITY_BUILD_OPERATIONS.md` para
el estado y los límites vigentes.
