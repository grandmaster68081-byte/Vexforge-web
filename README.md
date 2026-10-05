# VEXFORGE — repositorio principal

## Autoridad actual

El único runtime Android activo del videojuego es **Unity en `unity/**`**.
Expo/React Native bajo `mobile/**` fue retirado el 2026-10-05 en el hito 10
(`77d31b5d`) por instrucción explícita del usuario mientras seguían abiertas
las gates de paridad. La retirada no demuestra paridad ni validación de runtime.
La autoridad operativa está en:

1. `VEXFORGE_CONTEXT.md`
2. `replit.md`
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`
4. `docs/vexforge-canonical/17_CURRENT_BLOCK.md`
5. `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json`
6. `docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md`

La implementación Unity sigue sin verificación en Editor y dispositivo. No hay
un workflow Android de Unity configurado todavía; se abordará por separado. No
se genera APK/AAB durante esta migración.

## Clasificación de los árboles

- `unity/**` — runtime Android activo de VEXFORGE, pendiente de verificación
  en Editor y dispositivo.
- `mobile/**` — retirado; no existe runtime Expo activo. Los inventarios JSON y
  documentos Expo restantes son snapshots históricos, no una copia ejecutable.
- `src/**` y `public/**` — portal web VEXFORGE histórico, fuera del runtime del
  juego.
- `faucet/**` — producto Kivora independiente, fuera del alcance de VEXFORGE.
  Mantén su código, assets y migraciones separados; no los borres como parte de
  esta migración Unity.
- `supabase/migrations/*kivora*` — historial de migraciones Kivora; no aplicarlo
  como migraciones VEXFORGE.

No se encontró contenido importado de Epic/Fab ni identificadores de listings.
La adquisición de Fab no forma parte de la ruta actual. La rareza de carta
`epic` es terminología del juego y no contenido de Epic Games/Fab.

## Estado de la retirada

No se conserva el proyecto Expo ni sus comandos de ejecución. La evidencia de
paridad, Editor y dispositivo sigue pendiente; la retirada no cierra esos gates.
No generar APK/AAB ni iniciar despliegues durante esta migración.
