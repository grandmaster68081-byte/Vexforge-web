# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. El
Hito 01 reconcilió autoridad operativa e inventarió capacidades. El Hito 02
extendió el estado Unity con estadísticas y rango del jugador mediante contratos
de lectura existentes. El siguiente es el Hito 03: paridad de autenticación y
sesión, manteniendo `mobile/**` solo como referencia de comportamiento.

## Estado del runtime

- Unity Foundation tiene bootstrap, auth/sesión, repositorio, estado, UI y
  presentación implementados en distinto grado; Editor y dispositivo no están
  verificados.
- El estado central de Unity ahora expone estadísticas y rango. Si esas lecturas
  opcionales fallan, el error queda indicado sin bloquear la carga principal.
- El inventario de fuente y las decisiones por capacidad están en
  `27_UNITY_EXPO_MIGRATION_INVENTORY.json`.
- Replay, ceremonia de packs, UX completa, háptica, movimiento reducido y
  varias superficies requieren port/paridad.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Supabase live no se modifica como parte del cliente. No se escribieron datos
  de Supabase.

## Siguiente unidad

1. Hitos 01 y 02 deben quedar en `main` mediante commit y push antes de iniciar
   otro hito.
2. Antes del Hito 03, hacer `git fetch --prune origin` y confirmar
   `main`, árbol limpio y `HEAD == origin/main`.
3. Verificar restore, sign-in, sign-out, sign-up y reset únicamente donde lo
   respalden el cliente de referencia y los contratos actuales.
4. Mantener `mobile/**` hasta superar todas las gates de paridad y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
