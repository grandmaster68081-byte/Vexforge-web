# 00 — START HERE (AUTORIDAD ACTUAL: UNITY)

> Esta dirección de runtime supersede las instrucciones Expo-only anteriores.
> La retirada de Epic/Fab sigue vigente; no adquirir ni importar esos assets.

## Dirección vigente

**Unity en `unity/**` es el único runtime Android activo de VEXFORGE.** Expo /
React Native en `mobile/**` queda como referencia de comportamiento hasta que
pasen todas las gates de paridad y retirada. Supabase mantiene la autoridad
backend. El portal web queda congelado y `faucet/**` es un producto separado.
La ruta Epic/Fab sigue retirada; la rareza de cartas `epic` no tiene relación
con ese proveedor.

## Orden de lectura

1. `VEXFORGE_CONTEXT.md` — dirección, autoridad y límites actuales.
2. `replit.md` — alcance operativo y reglas de cada hito.
3. `docs/vexforge-canonical/16_IMPLEMENTATION_STATUS.md` y
   `17_CURRENT_BLOCK.md` — estado observado y bloque actual.
4. `docs/vexforge-canonical/27_UNITY_EXPO_MIGRATION_INVENTORY.json` — archivos
   inventariados y clasificación por capacidad.
5. `docs/vexforge-canonical/28_UNITY_EXPO_MIGRATION_GATES.md` — criterios de
   paridad, verificación y retirada.
6. `CURRENT_SOURCE_OF_TRUTH.md` — autoridad visual V5.6 y fronteras.
7. `mobile/docs/**` — evidencia Expo histórica, no autoridad de runtime.

## Límites

- Mantener la autoridad de Supabase para combate, ownership, recompensas,
  progreso y economía; Unity no calcula settlement.
- Preservar el portal web congelado, Kivora y el historial de migraciones.
- No eliminar `mobile/**` hasta cerrar cada gate de paridad y retirada.
- No copiar el arte oficial de cartas al cliente ni sustituirlo sin aprobación.
- No generar APK/AAB ni alterar Supabase live durante esta migración.
- Antes de cada hito: confirmar `main`, árbol limpio y `HEAD == origin/main`;
  cerrar con commit y push antes de iniciar el siguiente.
