# 17 — CURRENT BLOCK (UNITY CANÓNICO)

## Bloque activo

Migración del cliente Android Expo heredado a Unity como runtime único. El
Hito 01 reconcilia autoridad operativa e inventaría capacidades; el siguiente
hito continúa sobre Unity con `mobile/**` solo como referencia de paridad.

## Estado del runtime

- Unity Foundation tiene bootstrap, auth/sesión, repositorio, estado, UI y
  presentación implementados en distinto grado; Editor y dispositivo no están
  verificados.
- El inventario de fuente y las decisiones por capacidad están en
  `27_UNITY_EXPO_MIGRATION_INVENTORY.json`.
- Replay, ceremonia de packs, UX completa, háptica, movimiento reducido y
  varias superficies requieren port/paridad.
- No se encontraron assets Epic/Fab importados; esa ruta se retiró.
- Supabase live no se modifica como parte del cliente. No se escribieron datos
  de Supabase.

## Siguiente unidad

1. El inventario y la reconciliación documental de Hito 01 deben quedar en
   `main` mediante commit y push antes de iniciar otro hito.
2. Antes del siguiente hito, hacer `git fetch --prune origin` y confirmar
   `main`, árbol limpio y `HEAD == origin/main`.
3. Portar solo capacidades verificables a Unity, reutilizando los contratos
   existentes y preservando la autoridad de Supabase.
4. Mantener `mobile/**` hasta superar todas las gates de paridad y eliminación.

No generar APK/AAB ni modificar datos live durante esta migración.
