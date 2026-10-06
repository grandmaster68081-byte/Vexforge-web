# VEXFORGE — repositorio principal

## Alcance actual

- `src/**` y `public/**`: portal web oficial. Mantener sin cambios durante este
  trabajo.
- `unity/**`: runtime Android del juego; conservar el código intacto.
- `supabase/**` y `backend/**`: contratos y funciones existentes. Supabase live
  sigue siendo la autoridad; no aplicar migraciones ni cambiar datos/configuración
  en vivo.

El workflow manual de Unity está en
`.github/workflows/vexforge-unity-android-github.yml`. Usa 12 shards y limita cada
shard a 35.000 variantes. Los modos `normal` y `final` no aplican ese límite.
Restaurar el workflow no lo ejecuta ni genera APK/AAB.

## Documentación

La autoridad operativa está en `replit.md`, `VEXFORGE_CONTEXT.md` y
`docs/vexforge-canonical/`. La documentación debe describir el estado actual y
no depender de rutas retiradas.
