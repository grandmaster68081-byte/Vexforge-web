# VEXFORGE — repositorio principal

## Alcance actual

- `src/**` y `public/**`: portal web oficial. Mantener sin cambios durante este
  trabajo.
- `unity/**`: runtime Android del juego; conservar el código intacto.
- `unity-bootstrap/**`: proyecto hermano, mínimo y aislado para builds Android incrementales; no contiene assets ni gameplay del juego oficial.
- `supabase/**` y `backend/**`: contratos y funciones existentes. Supabase live
  sigue siendo la autoridad; no aplicar migraciones ni cambiar datos/configuración
  en vivo.

El workflow manual de Unity está en
`.github/workflows/vexforge-unity-android-github.yml`. Usa 12 shards y limita cada
shard a 35.000 variantes. Los modos `normal` y `final` no aplican ese límite.
Restaurar el workflow no lo ejecuta ni genera APK/AAB.

El workflow manual `.github/workflows/vexforge-unity-bootstrap-android.yml`
compila únicamente `unity-bootstrap/**`. Su caché cubre solo la carpeta
`unity-bootstrap/Library/`; no reutiliza la instalación de Unity ni la licencia.
No sustituye, modifica ni ejecuta el workflow del juego oficial.
El proceso experimental completo y sus límites están descritos en
`docs/vexforge-canonical/UNITY_BOOTSTRAP_WORKFLOW.md`.

## Documentación

La autoridad operativa está en `replit.md`, `VEXFORGE_CONTEXT.md` y
`docs/vexforge-canonical/`. La documentación debe describir el estado actual y
no depender de rutas retiradas.
