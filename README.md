# VEXFORGE — repositorio principal

## Alcance actual

- `src/**` y `public/**`: portal web oficial. Mantener sin cambios durante este
  trabajo.
- `unity/**`: runtime Android del juego; conservar el código intacto.
- `unity-bootstrap/**`: proyecto hermano, aislado y acumulativo para migrar el
  juego Android oficial en porciones pequeñas. El run #9 validó la escena
  canónica de inicio y el run #10 validó todo el audio Tier1. Aún no representa
  todo el contenido visual ni la paridad completa.
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
La APK #2 fue una prueba técnica del workflow con una escena vacía y no cuenta
como hito de migración. Los runs #9 y #10 validaron la escena bootstrap y los
recursos de audio canónicos. El builder actual se detiene si falta una escena
oficial; no genera escenas ni contenido de relleno. Ese guard solo comprueba la
presencia del archivo: el origen oficial y el cierre de dependencias deben
revisarse contra `unity/**` antes de aceptar una porción.

## Documentación

La autoridad operativa está en `replit.md`, `VEXFORGE_CONTEXT.md` y
`docs/vexforge-canonical/`. La documentación debe describir el estado actual y
no depender de rutas retiradas.
