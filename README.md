# VEXFORGE — repositorio principal

## Autoridad actual

El único runtime Android activo del videojuego es **Unity en `unity/**`**.
Expo / React Native en `mobile/**` se conserva como referencia de
comportamiento hasta superar las gates de paridad y retirada. La autoridad
operativa está en:

1. `VEXFORGE_CONTEXT.md`
2. `replit.md`
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md`
4. `docs/vexforge-canonical/17_CURRENT_BLOCK.md`
5. `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json`
6. `docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md`

La implementación Unity sigue sin verificación en Editor y dispositivo. No se
genera APK/AAB durante esta migración.

## Clasificación de los árboles

- `unity/**` — runtime Android activo de VEXFORGE, pendiente de verificación
  en Editor y dispositivo.
- `mobile/**` — referencia de comportamiento para paridad; no se elimina hasta
  cerrar todas las gates de retirada.
- `src/**` y `public/**` — portal web VEXFORGE histórico, fuera del runtime del
  juego.
- `faucet/**` — producto Kivora independiente, fuera del alcance de VEXFORGE.
  Mantén su código, assets y migraciones separados; no los ejecutes como parte
  de Expo ni los borres como parte de esta reorganización.
- `supabase/migrations/*kivora*` — historial de migraciones Kivora; no aplicarlo
  como migraciones VEXFORGE.

No se encontró contenido importado de Epic/Fab ni identificadores de listings.
La adquisición de Fab no forma parte de la ruta actual. La rareza de carta
`epic` es terminología del juego y no contenido de Epic Games/Fab.

## Referencia Expo

Desde `mobile/`, los siguientes comandos sólo verifican la referencia Expo; no
demuestran paridad Unity:

- `npm install`
- `npm run dev`
- `npm run verify`
- `npm run typecheck`
- `npm run doctor`

No generar APK/AAB ni iniciar despliegues durante esta migración.
